import { config } from '../config/env';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import axios from 'axios';
import { SkillLevel } from '@prisma/client';

export class SkillGapService {
  private serviceUrl: string;

  constructor() {
    this.serviceUrl = config.ai.serviceUrl;
  }

  /**
   * Run skill gap analysis for a single intern
   */
  async analyzeInternSkillGap(internId: string) {
    logger.info(`Analyzing skill gap for intern ${internId}...`);

    try {
      const intern = await prisma.intern.findUnique({
        where: { id: internId },
        select: {
          id: true,
          skills: true,
          departmentId: true,
          organizationId: true,
        },
      });

      if (!intern) {
        throw new Error(`Intern ${internId} not found`);
      }

      // 1. Fetch department skill requirements
      let requiredSkills = await prisma.departmentSkillRequirement.findMany({
        where: { departmentId: intern.departmentId },
      });

      // Seed default requirements if department is currently empty
      if (requiredSkills.length === 0) {
        logger.info(`No skill requirements found for department ${intern.departmentId}. Seeding defaults...`);
        const defaultReqs = [
          { skillName: 'React', requiredLevel: SkillLevel.INTERMEDIATE, category: 'Technical' },
          { skillName: 'Node.js', requiredLevel: SkillLevel.INTERMEDIATE, category: 'Technical' },
          { skillName: 'JavaScript', requiredLevel: SkillLevel.INTERMEDIATE, category: 'Technical' },
          { skillName: 'SQL', requiredLevel: SkillLevel.BEGINNER, category: 'Technical' },
          { skillName: 'Git', requiredLevel: SkillLevel.BEGINNER, category: 'Tools' },
        ];

        requiredSkills = await Promise.all(
          defaultReqs.map(req =>
            prisma.departmentSkillRequirement.create({
              data: {
                departmentId: intern.departmentId,
                skillName: req.skillName,
                requiredLevel: req.requiredLevel,
                category: req.category,
              },
            })
          )
        );
      }

      // 2. Call AI Microservice
      const response = await axios.post(`${this.serviceUrl}/api/ai/skill-gap/analyze`, {
        intern_id: intern.id,
        department_id: intern.departmentId,
        intern_skills: intern.skills || [],
        required_skills: requiredSkills.map(s => ({
          skillName: s.skillName,
          requiredLevel: s.requiredLevel,
          category: s.category,
        })),
      }, {
        timeout: 20000,
      });

      const result = response.data;

      if (result.success) {
        // 3. Upsert SkillGapAnalysis record
        const analysis = await prisma.skillGapAnalysis.upsert({
          where: { internId: intern.id },
          create: {
            internId: intern.id,
            organizationId: intern.organizationId,
            matchPercentage: result.matchPercentage,
            analysisData: result.analysisData,
            recommendations: result.recommendations,
          },
          update: {
            matchPercentage: result.matchPercentage,
            analysisData: result.analysisData,
            recommendations: result.recommendations,
            updatedAt: new Date(),
          },
        });
        
        return analysis;
      } else {
        throw new Error(result.error || 'AI service failed to perform skill gap analysis');
      }

    } catch (err: any) {
      logger.error(`Failed to perform skill gap analysis for intern ${internId}: ${err.message}`);
      
      // Local Heuristic Fallback: if offline, compute basic intersection and fall back to local recommendations
      try {
        const intern = await prisma.intern.findUnique({
          where: { id: internId },
          select: { id: true, skills: true, departmentId: true, organizationId: true },
        });

        if (!intern) return null;

        const reqSkills = await prisma.departmentSkillRequirement.findMany({
          where: { departmentId: intern.departmentId },
        });

        const levelScoreMap: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
        let matchedScore = 0;
        let totalScore = 0;
        
        const analysisData: any[] = [];
        const gaps: any[] = [];

        const internSkillsLower = (intern.skills || []).map(s => s.toLowerCase().trim());

        for (const req of reqSkills) {
          const reqLevelScore = levelScoreMap[req.requiredLevel] || 1;
          totalScore += reqLevelScore;

          const hasSkill = internSkillsLower.some(
            iskill => iskill === req.skillName.toLowerCase() || iskill.includes(req.skillName.toLowerCase()) || req.skillName.toLowerCase().includes(iskill)
          );

          if (hasSkill) {
            matchedScore += reqLevelScore;
            analysisData.push({
              skill: req.skillName,
              internScore: reqLevelScore,
              requiredScore: reqLevelScore,
            });
          } else {
            gaps.push(req);
            analysisData.push({
              skill: req.skillName,
              internScore: 0,
              requiredScore: reqLevelScore,
            });
          }
        }

        const matchPercentage = totalScore > 0 ? Math.round((matchedScore / totalScore) * 100) : 100;
        
        // Static learning recommendations
        const recommendations = gaps.map(g => {
          return {
            skill: g.skillName,
            level: g.requiredLevel,
            resources: [
              {
                title: `Complete ${g.skillName} tutorial for beginners`,
                url: 'https://www.freecodecamp.org/news/',
                platform: 'freeCodeCamp',
                duration: '~6 hours',
              },
              {
                title: `Learn ${g.skillName} reference guide`,
                url: 'https://developer.mozilla.org/en-US/',
                platform: 'MDN Docs',
                duration: '~4 hours',
              }
            ],
          };
        });

        const analysis = await prisma.skillGapAnalysis.upsert({
          where: { internId: intern.id },
          create: {
            internId: intern.id,
            organizationId: intern.organizationId,
            matchPercentage,
            analysisData,
            recommendations,
          },
          update: {
            matchPercentage,
            analysisData,
            recommendations,
            updatedAt: new Date(),
          },
        });

        return analysis;
      } catch (fallbackErr: any) {
        logger.error(`Critical skill gap calculation fallback failure: ${fallbackErr.message}`);
        return null;
      }
    }
  }

  /**
   * Run skill gap analysis for all active interns weekly
   */
  async runWeeklyAnalysisForAllInterns() {
    logger.info('Running scheduled weekly skill gap analysis for all active interns...');
    try {
      const activeInterns = await prisma.intern.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      logger.info(`Found ${activeInterns.length} active interns to analyze.`);

      for (const intern of activeInterns) {
        await this.analyzeInternSkillGap(intern.id);
      }
      
      logger.info('Completed weekly skill gap analysis successfully.');
    } catch (err: any) {
      logger.error(`Failed weekly skill gap analysis: ${err.message}`);
    }
  }
}

export default new SkillGapService();
