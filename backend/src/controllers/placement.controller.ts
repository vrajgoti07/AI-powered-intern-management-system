import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { emailQueue } from '../queues/queue.config';
import { logger } from '../utils/logger';
import axios from 'axios';
import { sendAdminEmail } from '../lib/emails/placementEmails';

/**
 * Helper to call OpenAI or Anthropic directly based on available environment key.
 */
async function callLLM(systemPrompt: string, userPrompt: string, forceJson: boolean = false): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        },
        {
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );
      return response.data.content[0]?.text || '';
    } catch (error: any) {
      logger.error('Anthropic API call failed:', error.response?.data || error.message);
      throw error;
    }
  } else if (openaiKey) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: forceJson ? { type: 'json_object' } : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'content-type': 'application/json'
          }
        }
      );
      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('OpenAI API call failed:', error.response?.data || error.message);
      throw error;
    }
  } else {
    logger.warn('No LLM API keys configured. Running fallback mode.');
    throw new Error('NO_LLM_KEY');
  }
}

export class PlacementController {
  
  /**
   * GET /api/mentors/:mentorId/availability
   */
  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mentorId = req.params.mentorId as string;
      
      let availability = await prisma.mentorAvailability.findUnique({
        where: { mentorId }
      });
      
      if (!availability) {
        // Initialize availability record if not found
        const mentor = await prisma.mentor.findUnique({
          where: { id: mentorId },
          include: { interns: true }
        });
        
        if (!mentor) {
          res.status(404).json({ success: false, message: 'Mentor not found' });
          return;
        }

        const count = mentor.interns.length;
        const maxCapacity = 3; // Default capacity as per Step 1
        
        let status = 'Available';
        if (count >= maxCapacity) {
          status = 'At Capacity';
        } else if (count === maxCapacity - 1) {
          status = 'Busy';
        }

        availability = await prisma.mentorAvailability.create({
          data: {
            mentorId,
            currentInternCount: count,
            maxCapacity,
            status
          }
        });
      }
      
      res.json({
        mentorId: availability.mentorId,
        status: availability.status,
        currentCount: availability.currentInternCount,
        maxCapacity: availability.maxCapacity
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/placements
   */
  async createPlacement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internId, mentorId, matchScore, confidence, department, appliedBy } = req.body;

      if (!internId || !mentorId || !department || !appliedBy) {
        res.status(400).json({ success: false, message: 'Missing required parameters' });
        return;
      }

      const internIdStr = internId as string;
      const mentorIdStr = mentorId as string;
      const departmentStr = department as string;
      const appliedByStr = appliedBy as string;

      // Fetch Intern details
      const intern = await prisma.intern.findUnique({
        where: { id: internIdStr },
        include: { user: true }
      });

      // Fetch Mentor details
      const mentor = await prisma.mentor.findUnique({
        where: { id: mentorIdStr },
        include: { user: true, interns: true }
      });

      if (!intern || !mentor) {
        res.status(404).json({ success: false, message: 'Intern or Mentor not found' });
        return;
      }

      // Check mentor availability
      let availability = await prisma.mentorAvailability.findUnique({
        where: { mentorId: mentorIdStr }
      });

      if (!availability) {
        const count = mentor.interns?.length || 0;
        const maxCapacity = 3;
        let status = 'Available';
        if (count >= maxCapacity) status = 'At Capacity';
        else if (count === maxCapacity - 1) status = 'Busy';

        availability = await prisma.mentorAvailability.create({
          data: {
            mentorId: mentorIdStr,
            currentInternCount: count,
            maxCapacity,
            status
          }
        });
      }

      if (availability.currentInternCount >= availability.maxCapacity || availability.status === 'At Capacity') {
        res.status(400).json({ success: false, message: 'Mentor is at capacity' });
        return;
      }

      const internName = intern.user?.name || 'Unknown Intern';
      const mentorName = mentor.user?.name || 'Unknown Mentor';
      const score = Number(matchScore) || 50;
      const confLevel = confidence || 'Medium';

      const now = new Date();
      const undoDeadline = new Date(now.getTime() + 30 * 1000); // 30 seconds

      // Create placement record
      const placement = await prisma.placement.create({
        data: {
          internId: internIdStr,
          internName,
          mentorId: mentorIdStr,
          mentorName,
          department: departmentStr,
          matchScore: score,
          confidenceLevel: confLevel,
          appliedBy: appliedByStr,
          appliedAt: now,
          status: 'Pending',
          undoDeadline,
          emailSent: false
        }
      });

      // Schedule email sending after 35 seconds
      await emailQueue.add(
        'PLACEMENT_CONFIRMED_EMAIL',
        {
          placementId: placement.id,
          internEmail: intern.user?.email || '',
          mentorEmail: mentor.user?.email || '',
          internName,
          mentorName,
          department: departmentStr,
          matchScore: score,
          appliedAt: now.toISOString()
        },
        {
          delay: 35000,
          jobId: placement.id // Set jobId to placement.id for cancellation
        }
      );

      // Update mentor availability count + 1
      const newCount = availability.currentInternCount + 1;
      let newStatus = 'Available';
      if (newCount >= availability.maxCapacity) {
        newStatus = 'At Capacity';
      } else if (newCount === availability.maxCapacity - 1) {
        newStatus = 'Busy';
      }

      await prisma.mentorAvailability.update({
        where: { mentorId: mentorIdStr },
        data: {
          currentInternCount: newCount,
          status: newStatus
        }
      });

      // Send immediate HR Admin email
      try {
        await sendAdminEmail(
          appliedByStr,
          internName,
          mentorName,
          departmentStr,
          score,
          confLevel,
          now.toISOString(),
          'Pending'
        );
      } catch (emailErr) {
        logger.error('Failed to send immediate HR Admin email:', emailErr);
      }

      // Perform Risk Flag Detection (AI Feature 3)
      let riskResult = { riskLevel: 'Low', flags: [] as string[], recommendation: 'No immediate risks detected.' };
      try {
        const systemPrompt = "You are an HR risk assessment AI.";
        const userPrompt = `Analyze this mentor-intern placement: Intern ${internName}, skills [${(intern.skills || []).join(', ')}], Mentor ${mentorName}, current workload ${newCount}/${availability.maxCapacity} interns, department ${departmentStr}. Identify any potential risks. Return JSON: { riskLevel: Low|Medium|High, flags: string[], recommendation: string }`;
        
        const llmResponse = await callLLM(systemPrompt, userPrompt, true);
        const parsed = JSON.parse(llmResponse.substring(llmResponse.indexOf('{'), llmResponse.lastIndexOf('}') + 1));
        if (parsed.riskLevel) {
          riskResult = {
            riskLevel: parsed.riskLevel,
            flags: parsed.flags || [],
            recommendation: parsed.recommendation || ''
          };
        }
      } catch (aiErr) {
        logger.warn('AI Risk Assessment failed, using fallback:', aiErr);
        // Fallback checks
        const flags = [];
        if (newCount >= availability.maxCapacity) {
          flags.push('Mentor has reached max intern capacity.');
        }
        if (intern.skills && intern.skills.length === 0) {
          flags.push('Intern has no documented skills in database.');
        }
        if (flags.length > 0) {
          riskResult = {
            riskLevel: 'Medium',
            flags,
            recommendation: 'Monitor pairing closely and verify skill alignment.'
          };
        }
      }

      res.status(201).json({
        success: true,
        placementId: placement.id,
        undoDeadline: undoDeadline.toISOString(),
        risk: riskResult
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/placements/:id/undo
   */
  async undoPlacement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idStr = req.params.id as string;

      const placement = await prisma.placement.findUnique({
        where: { id: idStr }
      });

      if (!placement) {
        res.status(404).json({ success: false, message: 'Placement record not found' });
        return;
      }

      const now = new Date();
      if (now > new Date(placement.undoDeadline)) {
        res.status(400).json({ success: false, message: 'Undo window has expired' });
        return;
      }

      // Check if already revoked
      if (placement.status === 'Revoked') {
        res.status(400).json({ success: false, message: 'Placement is already revoked' });
        return;
      }

      // Update placement status to Revoked
      await prisma.placement.update({
        where: { id: idStr },
        data: { status: 'Revoked' }
      });

      // Cancel scheduled email
      try {
        const job = await emailQueue.getJob(idStr);
        if (job) {
          await job.remove();
          logger.info(`Successfully cancelled scheduled email job: ${idStr}`);
        }
      } catch (queueErr) {
        logger.error('Failed to cancel BullMQ delayed email job:', queueErr);
      }

      // Update mentor availability count -1
      const availability = await prisma.mentorAvailability.findUnique({
        where: { mentorId: placement.mentorId }
      });

      if (availability) {
        const newCount = Math.max(0, availability.currentInternCount - 1);
        let newStatus = 'Available';
        if (newCount >= availability.maxCapacity) {
          newStatus = 'At Capacity';
        } else if (newCount === availability.maxCapacity - 1) {
          newStatus = 'Busy';
        }

        await prisma.mentorAvailability.update({
          where: { mentorId: placement.mentorId },
          data: {
            currentInternCount: newCount,
            status: newStatus
          }
        });
      }

      // Send immediate Revoked email to HR Admin
      try {
        await sendAdminEmail(
          placement.appliedBy,
          placement.internName,
          placement.mentorName,
          placement.department,
          placement.matchScore,
          placement.confidenceLevel,
          placement.appliedAt.toISOString(),
          'Revoked'
        );
      } catch (emailErr) {
        logger.error('Failed to send placement revoked email to HR Admin:', emailErr);
      }

      res.json({ success: true, message: 'Placement undone' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/placements/history
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const placements = await prisma.placement.findMany({
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit
      });

      res.json({
        success: true,
        data: placements
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/placements/bulk
   */
  async bulkPlacements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const placementsArray = req.body;

      if (!Array.isArray(placementsArray)) {
        res.status(400).json({ success: false, message: 'Body must be an array of placements' });
        return;
      }

      let applied = 0;
      let failed = 0;
      const results: any[] = [];

      for (const item of placementsArray) {
        try {
          const { internId, mentorId, matchScore, confidence, department, appliedBy } = item;

          if (!internId || !mentorId || !department || !appliedBy) {
            results.push({ success: false, error: 'Missing parameters', item });
            failed++;
            continue;
          }

          const internIdStr = internId as string;
          const mentorIdStr = mentorId as string;
          const departmentStr = department as string;
          const appliedByStr = appliedBy as string;

          // Check mentor availability
          let availability = await prisma.mentorAvailability.findUnique({
            where: { mentorId: mentorIdStr }
          });

          if (!availability) {
            const mentor = await prisma.mentor.findUnique({
              where: { id: mentorIdStr },
              include: { interns: true }
            });
            if (!mentor) {
              results.push({ success: false, error: 'Mentor not found', item });
              failed++;
              continue;
            }
            const count = mentor.interns?.length || 0;
            const maxCapacity = 3;
            let status = 'Available';
            if (count >= maxCapacity) status = 'At Capacity';
            else if (count === maxCapacity - 1) status = 'Busy';

            availability = await prisma.mentorAvailability.create({
              data: {
                mentorId: mentorIdStr,
                currentInternCount: count,
                maxCapacity,
                status
              }
            });
          }

          if (availability.currentInternCount >= availability.maxCapacity || availability.status === 'At Capacity') {
            results.push({ success: false, error: 'Mentor is at capacity', item });
            failed++;
            continue;
          }

          // Fetch Intern details
          const intern = await prisma.intern.findUnique({
            where: { id: internIdStr },
            include: { user: true }
          });

          // Fetch Mentor details
          const mentor = await prisma.mentor.findUnique({
            where: { id: mentorIdStr },
            include: { user: true }
          });

          if (!intern || !mentor) {
            results.push({ success: false, error: 'Intern or Mentor not found', item });
            failed++;
            continue;
          }

          const internName = intern.user?.name || 'Unknown Intern';
          const mentorName = mentor.user?.name || 'Unknown Mentor';
          const score = Number(matchScore) || 50;
          const confLevel = confidence || 'Medium';
          const now = new Date();
          const undoDeadline = new Date(now.getTime() + 30 * 1000);

          // Create placement record
          const placement = await prisma.placement.create({
            data: {
              internId: internIdStr,
              internName,
              mentorId: mentorIdStr,
              mentorName,
              department: departmentStr,
              matchScore: score,
              confidenceLevel: confLevel,
              appliedBy: appliedByStr,
              appliedAt: now,
              status: 'Pending',
              undoDeadline,
              emailSent: false
            }
          });

          // Schedule email sending after 35 seconds
          await emailQueue.add(
            'PLACEMENT_CONFIRMED_EMAIL',
            {
              placementId: placement.id,
              internEmail: intern.user?.email || '',
              mentorEmail: mentor.user?.email || '',
              internName,
              mentorName,
              department: departmentStr,
              matchScore: score,
              appliedAt: now.toISOString()
            },
            {
              delay: 35000,
              jobId: placement.id
            }
          );

          // Update mentor availability
          const newCount = availability.currentInternCount + 1;
          let newStatus = 'Available';
          if (newCount >= availability.maxCapacity) {
            newStatus = 'At Capacity';
          } else if (newCount === availability.maxCapacity - 1) {
            newStatus = 'Busy';
          }

          await prisma.mentorAvailability.update({
            where: { mentorId: mentorIdStr },
            data: {
              currentInternCount: newCount,
              status: newStatus
            }
          });

          // Send immediate HR Admin email
          try {
            await sendAdminEmail(
              appliedByStr,
              internName,
              mentorName,
              departmentStr,
              score,
              confLevel,
              now.toISOString(),
              'Pending'
            );
          } catch (emailErr) {
            logger.error('Failed to send immediate HR Admin email in bulk:', emailErr);
          }

          results.push({ success: true, placementId: placement.id, internName, mentorName });
          applied++;
        } catch (itemErr: any) {
          logger.error('Bulk placement item failure:', itemErr);
          results.push({ success: false, error: itemErr.message || 'Unknown item error' });
          failed++;
        }
      }

      res.json({
        success: true,
        applied,
        failed,
        results
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/placements/export/csv
   */
  async exportCSV(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const placements = await prisma.placement.findMany({
        orderBy: { appliedAt: 'desc' }
      });

      // CSV Generation
      const headers = 'intern_name,mentor_name,department,match_score,applied_by,applied_at,status\n';
      const rows = placements.map(p => {
        const esc = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
        return [
          esc(p.internName),
          esc(p.mentorName),
          esc(p.department),
          p.matchScore,
          esc(p.appliedBy),
          esc(p.appliedAt.toISOString()),
          esc(p.status)
        ].join(',');
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=placements_history.csv');
      res.status(200).send(headers + rows);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/placements/match-score (AI Feature 1)
   */
  async getAIMatchScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internSkills, mentorExpertise, department, preferences } = req.body;

      const systemPrompt = "You are an HR AI assistant for InternFlow. Analyze intern-mentor compatibility and return a JSON match score.";
      const userPrompt = `Given intern skills: [${(internSkills || []).join(', ')}], mentor expertise: [${(mentorExpertise || []).join(', ')}], department: ${department}, and learning style preferences: ${preferences || 'collaborative'}, calculate a compatibility score from 0-100 and confidence level (High/Medium/Low). Return ONLY JSON: { score: number, confidence: string, reasons: string[] }`;

      try {
        const responseText = await callLLM(systemPrompt, userPrompt, true);
        const cleanedJson = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
        const parsed = JSON.parse(cleanedJson);
        res.json({
          success: true,
          score: parsed.score || 50,
          confidence: parsed.confidence || 'Medium',
          reasons: parsed.reasons || []
        });
      } catch (llmErr) {
        logger.warn('AI Match Calculation failed, calling fallback:', llmErr);
        // Fallback calculations based on skills overlap
        const iSkills = (internSkills || []).map((s: string) => s.toLowerCase().trim());
        const mSkills = (mentorExpertise || []).map((s: string) => s.toLowerCase().trim());
        const overlap = iSkills.filter((s: string) => mSkills.includes(s));
        
        const score = Math.min(100, Math.max(30, 40 + (overlap.length * 15)));
        let confidence = 'Medium';
        if (score >= 80) confidence = 'High';
        else if (score < 50) confidence = 'Low';

        const reasons = [
          `Matched skills overlap: ${overlap.slice(0, 3).join(', ') || 'General tech skills'}.`,
          `Analyzed department: ${department}.`,
          `Learning styles compatible.`
        ];

        res.json({
          success: true,
          score,
          confidence,
          reasons
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/placements/insights (AI Feature 2)
   */
  async getAIInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internName, skills, mentorName, expertise } = req.body;

      const systemPrompt = "You are an expert HR mentor placement advisor.";
      const userPrompt = `Explain in 2-3 sentences why ${internName} with skills [${(skills || []).join(', ')}] would benefit from being mentored by ${mentorName} who specializes in [${(expertise || []).join(', ')}]. Be specific and professional.`;

      try {
        const responseText = await callLLM(systemPrompt, userPrompt, false);
        res.json({
          success: true,
          insight: responseText.trim()
        });
      } catch (llmErr) {
        logger.warn('AI Insights generation failed, calling fallback:', llmErr);
        const skillsList = (skills || []).slice(0, 3).join(', ');
        const expList = (expertise || []).slice(0, 3).join(', ');
        const insight = `${internName} possesses strong skills in ${skillsList || 'various programming domains'}, which aligns exceptionally well with ${mentorName}'s deep expertise in ${expList || 'software engineering leadership'}. This mentorship will help accelerate the intern's learning curve and provide direct exposure to industry best practices in their desired field of technical growth.`;
        res.json({
          success: true,
          insight
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/placements/recommendations
   */
  async getRecommendations(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let dbRecs = await prisma.aIRecommendation.findMany();
      
      if (dbRecs.length === 0) {
        const interns = await prisma.intern.findMany({
          include: { user: { select: { name: true } } },
        });
        const mentors = await prisma.mentor.findMany({
          include: { user: { select: { name: true } } },
        });

        for (const intern of interns) {
          for (const mentor of mentors) {
            const internSkills = intern.skills || [];
            const mentorSkills = mentor.expertise || mentor.skills || [];
            
            const internSkillsSet = new Set(internSkills.map((s: string) => s.toLowerCase().trim()));
            const overlap = mentorSkills.filter((s: string) => internSkillsSet.has(s.toLowerCase().trim()));

            const deptMatch = intern.departmentId === mentor.departmentId;
            const matchScore = Math.min(
              Math.round(
                (deptMatch ? 50 : 20) + 
                (internSkills.length > 0 ? (overlap.length / Math.max(internSkills.length, 1)) * 50 : 30)
              ),
              100
            );

            let confidence = 'Medium';
            if (matchScore >= 80) confidence = 'High';
            else if (matchScore < 50) confidence = 'Low';

            const reasons: string[] = [];
            if (deptMatch) {
              reasons.push('Assigned in the same department.');
            }
            if (overlap.length > 0) {
              reasons.push(`Overlapping expertise on: ${overlap.slice(0, 3).join(', ')}.`);
            } else {
              reasons.push('Expressed compatible technical skills and interests.');
            }
            reasons.push('AI prediction suggests highly compatible learning and coaching styles.');

            await prisma.aIRecommendation.create({
              data: {
                internId: intern.id,
                mentorId: mentor.id,
                matchScore,
                confidence,
                reasons,
                status: 'pending',
              },
            });
          }
        }
        dbRecs = await prisma.aIRecommendation.findMany();
      }

      const populated = await Promise.all(
        dbRecs.map(async (rec: any) => {
          const intern = await prisma.intern.findUnique({
            where: { id: rec.internId },
            include: { 
              user: { select: { name: true, email: true } },
              department: { select: { name: true } }
            },
          });
          const mentor = await prisma.mentor.findUnique({
            where: { id: rec.mentorId },
            include: { 
              user: { select: { name: true, email: true } }
            },
          });
          return {
            id: rec.id,
            internId: rec.internId,
            mentorId: rec.mentorId,
            internName: intern?.user?.name || 'Unknown Intern',
            internEmail: intern?.user?.email || '',
            mentorName: mentor?.user?.name || 'Unknown Mentor',
            mentorEmail: mentor?.user?.email || '',
            internSkills: intern?.skills || [],
            mentorExpertise: mentor?.expertise || [],
            matchScore: rec.matchScore,
            confidenceLevel: rec.confidence,
            reasons: rec.reasons,
            status: rec.status,
            department: intern?.department?.name || 'Engineering',
            createdAt: rec.createdAt,
            updatedAt: rec.updatedAt,
          };
        })
      );
      res.json({ success: true, data: populated });
    } catch (error) {
      next(error);
    }
  }
}

export default new PlacementController();
