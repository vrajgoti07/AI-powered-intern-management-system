import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';
import { 
  sendFeedbackSubmittedEmail, 
  sendActionItemCreatedEmail, 
  sendActionItemCompletedEmail 
} from '../lib/emails/feedbackEmails';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class FeedbackService {
  /**
   * Intern self-evaluation log submission
   */
  async createFeedback(data: { internUserId: string; rating: number; comment: string; category?: string }) {
    const intern = await prisma.intern.findUnique({
      where: { userId: data.internUserId },
      include: { user: true }
    });

    if (!intern) {
      throw new Error('Intern profile not found for the logged-in user');
    }

    if (!intern.mentorId) {
      throw new Error('You are not assigned to a mentor yet');
    }

    // Run AI sentiment analysis on self reflection text
    let sentimentLabel = 'NEUTRAL';
    let sentimentScore = 0.0;
    let confidenceScore = 0.8;
    let keywords: string[] = [];

    try {
      const aiResult = await aiService.analyzeSentiment({ feedbackText: data.comment });
      sentimentLabel = aiResult.sentiment || aiResult.label || 'NEUTRAL';
      sentimentScore = aiResult.sentimentScore !== undefined ? aiResult.sentimentScore : (sentimentLabel === 'POSITIVE' ? 0.8 : sentimentLabel === 'NEGATIVE' ? -0.8 : 0.0);
      confidenceScore = aiResult.confidenceScore || 0.85;
      keywords = aiResult.keywords || [];
    } catch (err) {
      logger.error('Intern self-evaluation AI sentiment analysis failed, using fallback', err);
    }

    const feedback = await prisma.feedback.create({
      data: {
        internId: intern.id,
        mentorId: intern.mentorId,
        rating: Number(data.rating),
        comment: data.comment,
        category: data.category || 'SELF_EVALUATION',
        sentiment: sentimentLabel,
        sentimentScore,
        confidenceScore,
        keywords,
      },
    });

    return feedback;
  }

  /**
   * Mentor feedback submission for an Intern (triggers AI analysis, action items, and emails)
   */
  async createMentorFeedback(data: { mentorUserId: string; internId: string; rating: number; comment: string; category?: string }) {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: data.mentorUserId },
      include: { user: true }
    });

    if (!mentor) {
      throw new Error('Mentor profile not found for the logged-in user');
    }

    const intern = await prisma.intern.findUnique({
      where: { id: data.internId },
      include: { user: true }
    });

    if (!intern) {
      throw new Error('Target intern not found');
    }

    // 1. Run AI Sentiment Analysis
    let sentiment = 'NEUTRAL';
    let sentimentScore = 0.0;
    let confidenceScore = 0.8;
    let keywords: string[] = [];
    let weakAreas: string[] = [];
    let improvementSuggestions: string[] = [];
    let executiveInsight = '';

    try {
      const aiResult = await aiService.analyzeSentiment({ feedbackText: data.comment });
      sentiment = aiResult.sentiment || aiResult.label || 'NEUTRAL';
      sentimentScore = aiResult.sentimentScore !== undefined ? aiResult.sentimentScore : (sentiment === 'POSITIVE' ? 0.85 : sentiment === 'NEGATIVE' ? -0.85 : 0.0);
      confidenceScore = aiResult.confidenceScore || 0.88;
      keywords = aiResult.keywords || [];
      weakAreas = aiResult.weakAreas || [];
      improvementSuggestions = aiResult.improvementSuggestions || aiResult.extractedSuggestions || [];
      executiveInsight = aiResult.improvementSuggestions ? `Intern exhibits strength in key parameters but requires attention to: ${weakAreas.join(', ') || 'general communication'}.` : 'Guidance recommended.';
    } catch (err) {
      logger.warn('AI sentiment analysis fell back during mentor feedback creation', err);
    }

    // 2. Save Feedback
    const feedback = await prisma.feedback.create({
      data: {
        internId: intern.id,
        mentorId: mentor.id,
        rating: Number(data.rating),
        comment: data.comment,
        category: data.category || 'PERFORMANCE_REVIEW',
        sentiment,
        sentimentScore,
        confidenceScore,
        keywords,
        executiveInsight: executiveInsight || 'No insight generated.',
      },
    });

    // 3. Extract and create Action Items based on AI suggestions
    const suggestions = improvementSuggestions.length > 0 
      ? improvementSuggestions 
      : (sentiment === 'NEGATIVE' || sentiment === 'CONSTRUCTIVE' || data.rating <= 3) 
      ? ['Schedule a review session with your mentor to address technical gaps', 'Review code styling standard documentation'] 
      : ['Continue maintaining high performance standards', 'Consider peer-mentoring junior cohort members'];

    const actionItems = [];
    for (const taskText of suggestions) {
      // Clean fallback headers from suggestions
      if (taskText.includes('[Fallback]')) continue;
      
      const item = await prisma.actionItem.create({
        data: {
          feedbackId: feedback.id,
          internId: intern.id,
          mentorId: mentor.id,
          task: taskText,
          status: 'TODO'
        }
      });
      actionItems.push(item);

      // Notify intern of new action items
      if (intern.user?.email) {
        await sendActionItemCreatedEmail(intern.user.email, intern.user.name, taskText);
      }
    }

    // 4. Send encouraging feedback email to intern
    if (intern.user?.email) {
      await sendFeedbackSubmittedEmail(
        intern.user.email,
        intern.user.name,
        mentor.user.name,
        data.comment,
        Number(data.rating),
        sentiment
      );
    }

    return {
      feedback,
      actionItems
    };
  }

  /**
   * Get all feedbacks for HR View
   */
  async getHRFeedbacks() {
    return prisma.feedback.findMany({
      include: {
        intern: {
          include: {
            user: { select: { name: true, email: true, avatarUrl: true } },
            department: { select: { name: true } }
          }
        },
        mentor: {
          include: {
            user: { select: { name: true, email: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get feedback history (filtered dynamically by role)
   */
  async getFeedbackHistory(params: { userId: string; role: string; internId?: string }) {
    const { userId, role, internId } = params;

    if (role === 'INTERN') {
      const intern = await prisma.intern.findUnique({
        where: { userId }
      });
      if (!intern) throw new Error('Intern not found');
      return prisma.feedback.findMany({
        where: { internId: intern.id },
        include: {
          mentor: { include: { user: { select: { name: true, avatarUrl: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (role === 'MENTOR') {
      const mentor = await prisma.mentor.findUnique({
        where: { userId }
      });
      if (!mentor) throw new Error('Mentor not found');

      if (internId) {
        return prisma.feedback.findMany({
          where: { internId, mentorId: mentor.id },
          include: {
            intern: { include: { user: { select: { name: true, avatarUrl: true } } } }
          },
          orderBy: { createdAt: 'desc' }
        });
      }

      return prisma.feedback.findMany({
        where: { mentorId: mentor.id },
        include: {
          intern: { include: { user: { select: { name: true, avatarUrl: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // HR / Admin
    if (internId) {
      return prisma.feedback.findMany({
        where: { internId },
        include: {
          mentor: { include: { user: { select: { name: true } } } },
          intern: { include: { user: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return this.getHRFeedbacks();
  }

  /**
   * Get active and completed Action Items
   */
  async getActionItems(params: { userId: string; role: string; internId?: string }) {
    const { userId, role, internId } = params;

    if (role === 'INTERN') {
      const intern = await prisma.intern.findUnique({ where: { userId } });
      if (!intern) throw new Error('Intern not found');
      return prisma.actionItem.findMany({
        where: { internId: intern.id },
        orderBy: { updatedAt: 'desc' }
      });
    }

    if (role === 'MENTOR') {
      const mentor = await prisma.mentor.findUnique({ where: { userId } });
      if (!mentor) throw new Error('Mentor not found');
      
      const filterId = internId || undefined;
      return prisma.actionItem.findMany({
        where: { mentorId: mentor.id, internId: filterId },
        include: {
          intern: { include: { user: { select: { name: true } } } }
        },
        orderBy: { updatedAt: 'desc' }
      });
    }

    // HR sees everything
    const filterId = internId || undefined;
    return prisma.actionItem.findMany({
      where: { internId: filterId },
      include: {
        intern: { include: { user: { select: { name: true } } } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Get Consolidated HR Dashboard Data
   */
  async getHRDashboardData(params: { departmentId?: string; internId?: string; cycle?: string }) {
    const insights = await this.getHRInsights(params);
    const actionItems = await prisma.actionItem.findMany({
      where: params.internId 
        ? { internId: params.internId } 
        : (params.departmentId ? { intern: { departmentId: params.departmentId } } : {}),
      include: {
        intern: { include: { user: { select: { name: true } } } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return { insights, actionItems };
  }

  /**
   * Get Consolidated Mentor Dashboard Data
   */
  async getMentorDashboardData(params: { mentorUserId: string; internId?: string }) {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: params.mentorUserId }
    });
    if (!mentor) throw new Error('Mentor profile not found');

    const filterInternId = params.internId || undefined;

    // 1. Fetch insights
    const insights = await this.getHRInsights({
      internId: filterInternId
    });

    // 2. Fetch feedback history
    const feedbackHistory = await prisma.feedback.findMany({
      where: {
        mentorId: mentor.id,
        internId: filterInternId
      },
      include: {
        intern: { include: { user: { select: { name: true, avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch action items
    const actionItems = await prisma.actionItem.findMany({
      where: {
        mentorId: mentor.id,
        internId: filterInternId
      },
      include: {
        intern: { include: { user: { select: { name: true } } } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return { insights, feedbackHistory, actionItems };
  }

  /**
   * Get Consolidated Intern Dashboard Data
   */
  async getInternDashboardData(params: { internUserId: string }) {
    const intern = await prisma.intern.findUnique({
      where: { userId: params.internUserId }
    });
    if (!intern) throw new Error('Intern profile not found');

    // 1. Fetch insights
    const insights = await this.getHRInsights({
      internId: intern.id
    });

    // 2. Fetch feedback history
    const feedbackHistory = await prisma.feedback.findMany({
      where: { internId: intern.id },
      include: {
        mentor: { include: { user: { select: { name: true, avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch action items
    const actionItems = await prisma.actionItem.findMany({
      where: { internId: intern.id },
      orderBy: { updatedAt: 'desc' }
    });

    return { insights, feedbackHistory, actionItems };
  }

  /**
   * Update an Action Item Status
   */
  async updateActionItem(id: string, status: string, userId: string, role: string) {
    const item = await prisma.actionItem.findUnique({
      where: { id },
      include: {
        intern: { include: { user: { select: { name: true, email: true } } } },
        mentor: { include: { user: { select: { name: true, email: true } } } }
      }
    });

    if (!item) {
      throw new Error('Action item not found');
    }

    // Check authorization: Interns can check their own, Mentors/HR can check any
    if (role === 'INTERN') {
      const intern = await prisma.intern.findUnique({ where: { userId } });
      if (!intern || item.internId !== intern.id) {
        throw new Error('Unauthorized to modify this action item');
      }
    } else if (role === 'MENTOR') {
      const mentor = await prisma.mentor.findUnique({ where: { userId } });
      if (!mentor || item.mentorId !== mentor.id) {
        throw new Error('Unauthorized to modify this action item');
      }
    }

    const updatedItem = await prisma.actionItem.update({
      where: { id },
      data: { status }
    });

    // If marked completed, trigger notification emails
    if (status === 'COMPLETED') {
      const mentorEmail = item.mentor?.user?.email || 'hr.internflow@gmail.com';
      const mentorName = item.mentor?.user?.name || 'HR Team';
      
      await sendActionItemCompletedEmail(
        mentorEmail,
        item.intern.user.name,
        mentorName,
        item.task
      );
    }

    return updatedItem;
  }

  /**
   * HR Analytics & AI Insights aggregator
   */
  async getHRInsights(params: { departmentId?: string; internId?: string; cycle?: string }) {
    const { departmentId, internId, cycle } = params;
    logger.info(`Computing insights for cycle: ${cycle || 'All'}`);

    // Filters setup
    const where: any = {};
    if (internId) {
      where.internId = internId;
    } else if (departmentId) {
      where.intern = { departmentId };
    }

    // Retrieve feedbacks matching filters
    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        intern: { include: { user: { select: { name: true } }, department: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (feedbacks.length === 0) {
      return {
        averageRating: 0.0,
        sentimentDistribution: { positive: 0, neutral: 0, constructive: 0 },
        executiveInsight: 'No feedback evaluations submitted for the current filters.',
        keywords: [],
        trends: [],
        internSummaries: []
      };
    }

    // Calculate Average Rating
    const totalRating = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const averageRating = parseFloat((totalRating / feedbacks.length).toFixed(2));

    // Calculate Tone Distribution
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    const keywordsSet = new Set<string>();

    feedbacks.forEach(f => {
      const sent = (f.sentiment || 'NEUTRAL').toUpperCase();
      if (sent === 'POSITIVE') positive++;
      else if (sent === 'NEGATIVE') negative++;
      else neutral++;

      f.keywords.forEach(k => keywordsSet.add(k));
    });

    const total = feedbacks.length;
    const sentimentDistribution = {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      constructive: Math.round((negative / total) * 100)
    };

    // Executive summary themes
    const keywordsArr = Array.from(keywordsSet).slice(0, 8);
    let executiveInsight = `Across the current cohort, AI evaluated feedback shows a predominantly ${
      sentimentDistribution.positive > 60 ? 'Positive' : 'Balanced'
    } performance tone. Key technical parameters focalized around: ${keywordsArr.join(', ') || 'standard deliverables'}.`;

    if (sentimentDistribution.constructive > 20) {
      executiveInsight += ' Minor workload stress indicators and technical blockers are noted for certain individuals.';
    }

    // Generate Weekly Trend data (Past 8 weeks)
    const trendsMap = new Map<string, { ratingSum: number; count: number; positiveCount: number }>();
    
    // Seed past 8 weeks
    const today = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - (i * 7));
      const weekLabel = `Wk ${8 - i}`;
      trendsMap.set(weekLabel, { ratingSum: 0, count: 0, positiveCount: 0 });
    }

    feedbacks.forEach(f => {
      const date = new Date(f.createdAt);
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = 7 - Math.floor(diffDays / 7);
      
      if (weekIndex >= 0 && weekIndex <= 7) {
        const weekLabel = `Wk ${weekIndex + 1}`;
        const current = trendsMap.get(weekLabel);
        if (current) {
          current.ratingSum += f.rating;
          current.count++;
          if ((f.sentiment || '').toUpperCase() === 'POSITIVE') {
            current.positiveCount++;
          }
          trendsMap.set(weekLabel, current);
        }
      }
    });

    const trends = Array.from(trendsMap.entries()).map(([week, info]) => {
      const avg = info.count > 0 ? parseFloat((info.ratingSum / info.count).toFixed(2)) : 4.0;
      const positivePercent = info.count > 0 ? Math.round((info.positiveCount / info.count) * 100) : 80;
      return {
        week,
        rating: avg,
        sentimentScore: positivePercent
      };
    });

    // Summarize active status for individual interns
    const interns = await prisma.intern.findMany({
      where: internId ? { id: internId } : (departmentId ? { departmentId } : {}),
      include: {
        user: { select: { name: true } },
        department: { select: { name: true } },
        feedbacks: { orderBy: { createdAt: 'desc' } },
        actionItems: true
      }
    });

    const internSummaries = interns.map(i => {
      const activeActions = i.actionItems.filter(a => a.status !== 'COMPLETED').length;
      const latestFeedback = i.feedbacks[0];
      
      // Determine risk level based on latest sentiments & rating
      let riskLevel = 'LOW';
      if (latestFeedback) {
        if (latestFeedback.rating <= 2 || latestFeedback.sentiment === 'NEGATIVE') {
          riskLevel = 'HIGH';
        } else if (latestFeedback.rating === 3 || latestFeedback.sentiment === 'NEUTRAL') {
          riskLevel = 'MEDIUM';
        }
      }

      return {
        internId: i.id,
        name: i.user.name,
        department: i.department.name,
        averageRating: i.feedbacks.length > 0 
          ? parseFloat((i.feedbacks.reduce((acc, f) => acc + f.rating, 0) / i.feedbacks.length).toFixed(1)) 
          : 5.0,
        riskLevel,
        activeActionItems: activeActions,
        lastEvaluationDate: latestFeedback ? latestFeedback.createdAt.toLocaleDateString() : 'N/A'
      };
    });

    return {
      averageRating,
      sentimentDistribution,
      executiveInsight,
      keywords: keywordsArr,
      trends,
      internSummaries
    };
  }

  /**
   * Seed database with rich realistic data
   * 
   * SAFETY: This method is blocked in production to prevent data loss.
   * In development, it clears feedback/action items before re-seeding.
   */
  async seedDemoFeedbackData() {
    // --- Production Guard ---
    if (process.env.NODE_ENV === 'production') {
      throw new Error('🚫 seedDemoFeedbackData is blocked in production to prevent data loss.');
    }

    if (process.env.DATABASE_URL?.includes('neon.tech') && process.env.FORCE_SEED !== 'true') {
      throw new Error(
        '🚫 seedDemoFeedbackData is blocked against Neon cloud database. ' +
        'Set FORCE_SEED=true to override.'
      );
    }

    logger.info('Seeding realistic demo feedback and action item data...');
    logger.warn('⚠️  This will clear existing feedback and action items (dev mode only)');

    // 1. Get Engineering and Design departments
    const departments = await prisma.department.findMany();
    if (departments.length === 0) {
      throw new Error('Please run primary database seed script first.');
    }

    const engDept = departments.find(d => d.code === 'ENG') || departments[0];
    const dsnDept = departments.find(d => d.code === 'DSN') || departments[0];
    const mktDept = departments.find(d => d.code === 'MKT') || departments[0];

    // 2. Fetch or create a default mentor
    let mentor = await prisma.mentor.findFirst({ include: { user: true } });
    if (!mentor) {
      throw new Error('Default mentor not found. Make sure base seed is run.');
    }

    // 3. Clear existing feedbacks/action items (ONLY in dev/test)
    await prisma.actionItem.deleteMany({});
    await prisma.feedback.deleteMany({});

    // 4. Create 6 distinct interns across departments
    const internDetails = [
      { email: 'intern@internmanagement.com', name: 'Default Intern', dept: engDept, college: 'Delhi Technological University' },
      { email: 'vrajg072@gmail.com', name: 'Vraj Goti', dept: engDept, college: 'BITS Pilani' },
      { email: 'aarav.sharma@internflow.com', name: 'Aarav Sharma', dept: engDept, college: 'IIT Bombay' },
      { email: 'ananya.iyer@internflow.com', name: 'Ananya Iyer', dept: dsnDept, college: 'NID Ahmedabad' },
      { email: 'kabir.mehta@internflow.com', name: 'Kabir Mehta', dept: dsnDept, college: 'Srishti School of Design' },
      { email: 'riya.sen@internflow.com', name: 'Riya Sen', dept: mktDept, college: 'FMS Delhi' }
    ];

    const interns = [];
    for (const detail of internDetails) {
      let user = await prisma.user.findUnique({ where: { email: detail.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: detail.email,
            password: 'hashedpassword_seed', // Dummy password
            name: detail.name,
            role: 'INTERN',
            isActive: true,
            isEmailVerified: true
          }
        });
      }

      let internProfile = await prisma.intern.findUnique({ where: { userId: user.id } });
      if (!internProfile) {
        internProfile = await prisma.intern.create({
          data: {
            userId: user.id,
            mentorId: mentor.id,
            departmentId: detail.dept.id,
            college: detail.college,
            status: 'ACTIVE',
            score: 82,
            attendance: 90
          }
        });
      } else {
        // Update mentor link
        internProfile = await prisma.intern.update({
          where: { id: internProfile.id },
          data: { mentorId: mentor.id }
        });
      }
      interns.push({ profile: internProfile, user, detail });
    }

    // 5. Generate 8 weeks of historical feedback & action items
    const today = new Date();
    
    // Seed evaluations map
    const feedbackSeeds = [
      {
        rating: 5,
        comment: 'Demonstrates exceptional understanding of React Hooks. Code submissions are fast, clean, and conform fully to responsive standards. Proactive communicator.',
        sentiment: 'POSITIVE',
        keywords: ['React Hooks', 'Responsive design', 'Proactive communication'],
        suggestions: ['Maintain high performance', 'Take lead on new layout system redesign']
      },
      {
        rating: 4,
        comment: 'Agile frontend UI implementer. Successfully delivered critical component libraries. Needs moderate focus on database schema structures and normalization principles.',
        sentiment: 'POSITIVE',
        keywords: ['Agile UI', 'Component libraries', 'Database normalization'],
        suggestions: ['Complete database schema learning modules', 'Participate in SQL queries peer review']
      },
      {
        rating: 3,
        comment: 'Average performance on recent tasks. Attendance has been slightly delayed. Code reviews require multiple styling iterations. Needs to be more proactive in communication.',
        sentiment: 'NEUTRAL',
        keywords: ['Delayed tasks', 'Code styling iterations', 'Delayed attendance'],
        suggestions: ['Review team style guides for syntax verification', 'Schedule daily checkins with mentor']
      },
      {
        rating: 2,
        comment: 'Struggles with task deadlines. Missed two standups last week. Output shows poor attention to error handling and backend edge cases. Urgent performance review meeting required.',
        sentiment: 'NEGATIVE',
        keywords: ['Missed standups', 'Deadline delays', 'Error handling'],
        suggestions: ['Schedule one-on-one recovery session with HR', 'Resolve pending bug backlogs before new feature requests']
      }
    ];

    for (let week = 7; week >= 0; week--) {
      const evalDate = new Date();
      evalDate.setDate(today.getDate() - (week * 7));

      for (let i = 0; i < interns.length; i++) {
        const intern = interns[i];
        
        // Vary the feedback index based on week & intern to create differences
        let seedIndex = (week + i) % 4;
        
        // Ensure 2 interns (e.g. Kabir and Riya) have poor evaluations recently to flag them as Medium/High Risk
        if (week === 0 && (intern.detail.name === 'Kabir Mehta' || intern.detail.name === 'Riya Sen')) {
          seedIndex = 3; // Negative sentiment, low rating -> risk alert
        }

        const seed = feedbackSeeds[seedIndex];
        const category = seedIndex === 2 ? 'MONTHLY_REVIEW' : 'WEEKLY_CHECKIN';

        const fb = await prisma.feedback.create({
          data: {
            internId: intern.profile.id,
            mentorId: mentor.id,
            rating: seed.rating,
            comment: seed.comment,
            category,
            sentiment: seed.sentiment,
            sentimentScore: seed.sentiment === 'POSITIVE' ? 0.9 : seed.sentiment === 'NEGATIVE' ? -0.85 : 0.1,
            confidenceScore: 0.92,
            keywords: seed.keywords,
            executiveInsight: seedIndex === 3 ? 'Urgent attention required. Missed milestones detected.' : 'Satisfactory trajectory.',
            createdAt: evalDate
          }
        });

        // Add action items for this feedback (only for newer weeks to avoid flooding)
        if (week <= 2) {
          for (let sIdx = 0; sIdx < seed.suggestions.length; sIdx++) {
            const status = (week === 2) ? 'COMPLETED' : (week === 1 && sIdx === 0) ? 'IN_PROGRESS' : 'TODO';
            await prisma.actionItem.create({
              data: {
                feedbackId: fb.id,
                internId: intern.profile.id,
                mentorId: mentor.id,
                task: seed.suggestions[sIdx],
                status,
                createdAt: evalDate
              }
            });
          }
        }
      }
    }

    logger.info('Demo database seeding for AI feedback finished successfully!');
    return { success: true, count: interns.length };
  }
}

export default new FeedbackService();
