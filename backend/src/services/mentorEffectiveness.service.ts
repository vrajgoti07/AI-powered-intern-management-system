import { config } from '../config/env';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import axios from 'axios';
import { EffectivenessGrade } from '@prisma/client';

export class MentorEffectivenessService {
  private serviceUrl: string;

  constructor() {
    this.serviceUrl = config.ai.serviceUrl;
  }

  /**
   * Calculate effectiveness score and grade for a single mentor
   */
  async calculateMentorEffectiveness(mentorId: string) {
    logger.info(`Calculating effectiveness score for mentor ${mentorId}...`);

    try {
      // 1. Calculate Average Intern Rating
      const feedbackAvg = await prisma.feedback.aggregate({
        where: { mentorId },
        _avg: { rating: true },
      });
      const avgRating = feedbackAvg._avg.rating || 4.0; // Default to 4.0 if no ratings yet

      // 2. Calculate Intern Improvement Rate (Average score of assigned interns)
      const interns = await prisma.intern.findMany({
        where: { mentorId },
        select: { score: true, attendance: true },
      });

      const totalInterns = interns.length;
      let sumScore = 0;
      let atRiskCount = 0;
      let recoveredCount = 0;

      interns.forEach(intern => {
        sumScore += intern.score;
        const isAtRisk = intern.attendance < 75 || intern.score < 50;
        if (isAtRisk) {
          atRiskCount++;
        } else {
          recoveredCount++;
        }
      });

      const avgInternScore = totalInterns > 0 ? sumScore / totalInterns : 75.0; // Default to 75%
      const recoveryRate = totalInterns > 0 ? (recoveredCount / totalInterns) * 100 : 80.0; // Default to 80%

      // 3. Calculate Task Success Rate
      const totalTasks = await prisma.task.count({ where: { mentorId } });
      const completedTasks = await prisma.task.count({
        where: { mentorId, status: 'COMPLETED' },
      });
      const taskSuccessRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 85.0; // Default to 85%

      // 4. Call AI Microservice
      let score = 0;
      let grade = 'AVERAGE';
      let aiInsight = '';

      try {
        const response = await axios.post(`${this.serviceUrl}/api/ai/mentor-effectiveness/calculate`, {
          mentor_id: mentorId,
          intern_improvement_rate: avgInternScore,
          task_success_rate: taskSuccessRate,
          at_risk_recovery_rate: recoveryRate,
          avg_rating: avgRating,
        }, {
          timeout: 15000,
        });

        const result = response.data;
        if (result.success) {
          score = result.effectivenessScore;
          grade = result.effectivenessGrade;
          aiInsight = result.aiInsight;
        } else {
          throw new Error(result.error || 'Failed status returned from AI microservice');
        }
      } catch (microErr: any) {
        logger.error(`AI Microservice calculation failed/offline, using Node fallback: ${microErr.message}`);
        
        // Node Heuristic Fallback
        score = (0.30 * avgInternScore) + (0.30 * taskSuccessRate) + (0.20 * recoveryRate) + (0.20 * (avgRating * 20.0));
        score = Math.round(score * 10) / 10;

        if (score >= 90.0) {
          grade = 'EXCELLENT';
          aiInsight = `Outstanding performance! With a stellar score of ${score}/100, you are providing top-tier guidance to your interns.`;
        } else if (score >= 75.0) {
          grade = 'GOOD';
          aiInsight = `Great mentoring. Your score of ${score}/100 indicates strong, consistent support. Focus on raising at-risk recovery rates to reach EXCELLENT.`;
        } else if (score >= 50.0) {
          grade = 'AVERAGE';
          aiInsight = `Moderate effectiveness shown (Score: ${score}/100). Focus on improving task submission feedback and weekly check-in frequency.`;
        } else {
          grade = 'NEEDS_IMPROVEMENT';
          aiInsight = `Performance review indicates critical need for coaching alignment (Score: ${score}/100). Please schedule a review sync.`;
        }
      }

      // 5. Upsert MentorAnalytics record
      // Check if MentorAnalytics record exists
      const existingAnalytics = await prisma.mentorAnalytics.findFirst({
        where: { mentorId },
      });

      let analytics;
      if (existingAnalytics) {
        analytics = await prisma.mentorAnalytics.update({
          where: { id: existingAnalytics.id },
          data: {
            avgRating,
            totalInterns,
            effectivenessScore: score,
            effectivenessGrade: grade as EffectivenessGrade,
            internImprovementRate: avgInternScore,
            taskSuccessRate,
            atRiskRecoveryRate: recoveryRate,
            lastCalculatedAt: new Date(),
          },
        });
      } else {
        analytics = await prisma.mentorAnalytics.create({
          data: {
            mentorId,
            avgRating,
            totalInterns,
            effectivenessScore: score,
            effectivenessGrade: grade as EffectivenessGrade,
            internImprovementRate: avgInternScore,
            taskSuccessRate,
            atRiskRecoveryRate: recoveryRate,
            lastCalculatedAt: new Date(),
          },
        });
      }

      // 6. Record in Effectiveness History log
      const historyRecord = await prisma.mentorEffectivenessHistory.create({
        data: {
          mentorId,
          organizationId: analytics.mentorId ? (await prisma.mentor.findUnique({ where: { id: mentorId } }))?.organizationId : null,
          score,
          grade: grade as EffectivenessGrade,
          snapshot: {
            avgRating,
            totalInterns,
            internImprovementRate: avgInternScore,
            taskSuccessRate,
            atRiskRecoveryRate: recoveryRate,
            aiInsight,
          },
        },
      });

      return {
        analytics,
        historyRecord,
        aiInsight,
      };

    } catch (err: any) {
      logger.error(`Failed to calculate effectiveness for mentor ${mentorId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Run calculations weekly for all active mentors
   */
  async runWeeklyCalculationsForAllMentors() {
    logger.info('Running weekly mentor effectiveness scoring for all active mentors...');
    try {
      const activeMentors = await prisma.mentor.findMany({
        where: { mentorStatus: 'ACTIVE' },
        select: { id: true },
      });

      logger.info(`Found ${activeMentors.length} active mentors to evaluate.`);

      for (const mentor of activeMentors) {
        await this.calculateMentorEffectiveness(mentor.id);
      }

      logger.info('Weekly mentor effectiveness scoring completed successfully.');
    } catch (err: any) {
      logger.error(`Weekly mentor effectiveness job failed: ${err.message}`);
    }
  }
}

export default new MentorEffectivenessService();
