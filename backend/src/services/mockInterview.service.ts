import prisma from '../config/database';
import { logger } from '../utils/logger';
import axios from 'axios';
import { config } from '../config/env';

class MockInterviewService {
  private serviceUrl: string;

  constructor() {
    this.serviceUrl = config.ai.serviceUrl || 'http://localhost:8000';
  }

  /**
   * Start a new mock interview session:
   * 1. Marks previous IN_PROGRESS interviews as ABANDONED.
   * 2. Calls FastAPI to generate 5 tailored questions.
   * 3. Creates the interview and questions in database in a transaction.
   */
  async startInterview(internId: string, jobRole: string) {
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      include: { user: { select: { name: true } } }
    });

    if (!intern) {
      throw new Error('Intern profile not found');
    }

    // Mark active ones as ABANDONED
    await prisma.mockInterview.updateMany({
      where: { internId, status: 'IN_PROGRESS' },
      data: { status: 'ABANDONED' }
    });

    // Call FastAPI to generate questions
    let generatedQuestions: Array<{ questionText: string; questionType: 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' }> = [];
    try {
      const response = await axios.post(`${this.serviceUrl}/api/ai/mock-interview/start`, {
        job_role: jobRole,
        intern_name: intern.user.name,
        skills: intern.skills || []
      }, { timeout: 15000 });

      if (response.data.success && Array.isArray(response.data.questions)) {
        generatedQuestions = response.data.questions;
      }
    } catch (err: any) {
      logger.warn(`FastAPI start-interview failed, using local fallback questions: ${err.message}`);
    }

    // Local fallback if API failed or returned empty
    if (generatedQuestions.length === 0) {
      // Import the fallback questions list or hardcode default
      const defaultList: Array<{ questionText: string; questionType: 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' }> = [
        { questionText: "Explain the difference between synchronous and asynchronous programming, and how you handle it in JavaScript or Python.", questionType: "TECHNICAL" },
        { questionText: "What is a RESTful API? Describe the HTTP methods and status codes you typically use.", questionType: "TECHNICAL" },
        { questionText: "Describe a situation where you had to work with someone whose style or personality was very different from yours. How did you handle it?", questionType: "BEHAVIORAL" },
        { questionText: "Tell me about a time when you made a mistake on a project. What happened and what did you learn?", questionType: "BEHAVIORAL" },
        { questionText: "If you are given a task with a tight deadline, but you realize you don't have all the requirements to complete it, what actions would you take?", questionType: "SITUATIONAL" }
      ];
      generatedQuestions = defaultList;
    }

    // Save in transaction
    const result = await prisma.$transaction(async (tx) => {
      const interview = await tx.mockInterview.create({
        data: {
          internId,
          organizationId: intern.organizationId,
          jobRole,
          status: 'IN_PROGRESS'
        }
      });

      const questionData = generatedQuestions.map((q, idx) => ({
        interviewId: interview.id,
        questionNumber: idx + 1,
        questionText: q.questionText,
        questionType: q.questionType
      }));

      await tx.mockInterviewQuestion.createMany({
        data: questionData
      });

      const fullInterview = await tx.mockInterview.findUnique({
        where: { id: interview.id },
        include: { questions: { orderBy: { questionNumber: 'asc' } } }
      });

      return fullInterview;
    });

    return result;
  }

  /**
   * Submit response for a single question:
   * 1. Evaluates response via FastAPI (or fallback).
   * 2. Updates answer, score, feedback, timestamp in database.
   */
  async submitAnswer(internId: string, interviewId: string, questionNumber: number, answer: string) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: interviewId }
    });

    if (!interview || interview.internId !== internId) {
      throw new Error('Interview session not found or unauthorized');
    }

    if (interview.status !== 'IN_PROGRESS') {
      throw new Error('This interview is no longer in progress');
    }

    const question = await prisma.mockInterviewQuestion.findFirst({
      where: { interviewId, questionNumber }
    });

    if (!question) {
      throw new Error(`Question #${questionNumber} not found in session`);
    }

    let evaluation = { score: 10, aiFeedback: "Completed evaluation." };
    try {
      const response = await axios.post(`${this.serviceUrl}/api/ai/mock-interview/evaluate-answer`, {
        question_text: question.questionText,
        question_type: question.questionType,
        intern_answer: answer
      }, { timeout: 15000 });

      if (response.data.success) {
        evaluation = {
          score: response.data.score,
          aiFeedback: response.data.aiFeedback
        };
      }
    } catch (err: any) {
      logger.warn(`FastAPI evaluate-answer failed, using local heuristics fallback: ${err.message}`);
      // Simple word length heuristic fallback
      const wordCount = answer.trim().split(/\s+/).length;
      if (wordCount < 10) {
        evaluation = { score: 6, aiFeedback: "Your answer is very brief. Try to elaborate on your reasoning and give concrete examples to substantiate your answer." };
      } else if (wordCount < 25) {
        evaluation = { score: 12, aiFeedback: "Good response, but could benefit from structured elaboration. Mention technical concepts or step-by-step methodologies to make it stronger." };
      } else {
        evaluation = { score: 16, aiFeedback: "Thorough answer! You demonstrated solid understanding and highlighted relevant concepts in your feedback." };
      }
    }

    const updatedQuestion = await prisma.mockInterviewQuestion.update({
      where: { id: question.id },
      data: {
        internAnswer: answer,
        score: evaluation.score,
        aiFeedback: evaluation.aiFeedback,
        answeredAt: new Date()
      }
    });

    return updatedQuestion;
  }

  /**
   * Complete mock interview:
   * 1. Summarizes progress via FastAPI (or fallback).
   * 2. Updates status to COMPLETED, saves scores and summary text.
   * 3. Awards 100 XP to the intern.
   */
  async completeInterview(internId: string, interviewId: string) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: interviewId },
      include: { questions: { orderBy: { questionNumber: 'asc' } } }
    });

    if (!interview || interview.internId !== internId) {
      throw new Error('Interview session not found or unauthorized');
    }

    if (interview.status !== 'IN_PROGRESS') {
      throw new Error('This interview is no longer in progress');
    }

    // Verify all questions are answered
    const unanswered = interview.questions.filter(q => !q.internAnswer);
    if (unanswered.length > 0) {
      throw new Error(`Cannot complete interview. Question(s) [${unanswered.map(u => u.questionNumber).join(', ')}] are unanswered.`);
    }

    // Map questions to payload format
    const questionsPayload = interview.questions.map(q => ({
      questionText: q.questionText,
      questionType: q.questionType as 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL',
      internAnswer: q.internAnswer,
      score: q.score,
      aiFeedback: q.aiFeedback
    }));

    let summary = {
      overallScore: 50.0,
      readinessLevel: 'NEARLY_READY' as 'READY' | 'NEARLY_READY' | 'NEEDS_PRACTICE',
      aiSummary: 'Mock interview completed successfully.'
    };

    try {
      const response = await axios.post(`${this.serviceUrl}/api/ai/mock-interview/generate-summary`, {
        job_role: interview.jobRole,
        questions: questionsPayload
      }, { timeout: 15000 });

      if (response.data.success) {
        summary = {
          overallScore: response.data.overallScore,
          readinessLevel: response.data.readinessLevel,
          aiSummary: response.data.aiSummary
        };
      }
    } catch (err: any) {
      logger.warn(`FastAPI generate-summary failed, using local templates fallback: ${err.message}`);
      const totalScore = interview.questions.reduce((sum, q) => sum + (q.score || 0), 0);
      let readiness: 'READY' | 'NEARLY_READY' | 'NEEDS_PRACTICE' = 'NEARLY_READY';
      let aiSummary = '';

      if (totalScore >= 80) {
        readiness = 'READY';
        aiSummary = `Outstanding performance across all categories for the ${interview.jobRole} track. The candidate displayed excellent technical depth and structured, clear behavioral answers. Highly recommended for active developer recruitment cycles without further blockers.`;
      } else if (totalScore >= 60) {
        readiness = 'NEARLY_READY';
        aiSummary = `Solid overall understanding shown for the ${interview.jobRole} interview questions. Core technical concepts were well articulated, though some situational responses could have more detail. Minor practice on problem-solving workflows will make this candidate ready.`;
      } else {
        readiness = 'NEEDS_PRACTICE';
        aiSummary = `Good baseline effort, but further preparation is required for the ${interview.jobRole} role. Technical responses were overly brief, and behavioral examples lacked details on impact. Focus on mock tests and fundamental review sessions to build interview confidence.`;
      }

      summary = {
        overallScore: totalScore,
        readinessLevel: readiness,
        aiSummary
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedInterview = await tx.mockInterview.update({
        where: { id: interviewId },
        data: {
          status: 'COMPLETED',
          overallScore: summary.overallScore,
          readinessLevel: summary.readinessLevel,
          aiSummary: summary.aiSummary,
          completedAt: new Date()
        },
        include: { questions: { orderBy: { questionNumber: 'asc' } } }
      });

      // Award 100 XP to the intern
      try {
        const { awardXP } = await import('./gamification.service');
        await awardXP(
          internId,
          100, // XP points
          'BONUS', // sourceType
          `Completed AI Mock Interview: ${interview.jobRole}`, // reason
          interviewId // sourceId
        );
      } catch (gamifyError: any) {
        logger.error(`Gamification XP award failed inside completeInterview: ${gamifyError.message}`);
      }

      return updatedInterview;
    });

    return result;
  }

  /**
   * Get all interviews of logged-in intern
   */
  async getMyInterviews(internId: string) {
    const list = await prisma.mockInterview.findMany({
      where: { internId },
      include: { questions: { orderBy: { questionNumber: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return list;
  }

  /**
   * Get aggregate interview analytics for HR/Mentors
   */
  async getOrganizationAnalytics(organizationId: string) {
    const interviews = await prisma.mockInterview.findMany({
      where: { organizationId, status: 'COMPLETED' },
      include: {
        intern: {
          select: {
            id: true,
            user: { select: { name: true } },
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    const totalInterviews = interviews.length;
    const readyCount = interviews.filter(i => i.readinessLevel === 'READY').length;
    const nearlyReadyCount = interviews.filter(i => i.readinessLevel === 'NEARLY_READY').length;
    const needsPracticeCount = interviews.filter(i => i.readinessLevel === 'NEEDS_PRACTICE').length;

    // Group by department
    const deptStats: Record<string, { total: number; ready: number; averageScore: number; sumScore: number }> = {};
    
    interviews.forEach(i => {
      const deptName = i.intern?.department?.name || 'Unassigned';
      if (!deptStats[deptName]) {
        deptStats[deptName] = { total: 0, ready: 0, averageScore: 0, sumScore: 0 };
      }
      deptStats[deptName].total++;
      deptStats[deptName].sumScore += i.overallScore || 0;
      if (i.readinessLevel === 'READY') {
        deptStats[deptName].ready++;
      }
    });

    Object.keys(deptStats).forEach(key => {
      deptStats[key].averageScore = Math.round(deptStats[key].sumScore / deptStats[key].total);
    });

    return {
      totalInterviews,
      readinessBreakdown: {
        READY: readyCount,
        NEARLY_READY: nearlyReadyCount,
        NEEDS_PRACTICE: needsPracticeCount
      },
      departmentAnalytics: Object.keys(deptStats).map(name => ({
        departmentName: name,
        total: deptStats[name].total,
        ready: deptStats[name].ready,
        averageScore: deptStats[name].averageScore
      })),
      recentInterviews: interviews.slice(0, 10).map(i => ({
        id: i.id,
        internName: i.intern?.user?.name || 'Unknown',
        department: i.intern?.department?.name || 'Unassigned',
        jobRole: i.jobRole,
        score: i.overallScore,
        readinessLevel: i.readinessLevel,
        completedAt: i.completedAt
      }))
    };
  }
}

export default new MockInterviewService();
