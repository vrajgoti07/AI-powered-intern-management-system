import { config } from '../config/env';
import { logger } from '../utils/logger';

// --- Integration Types ---
export interface RoleMatchPayload {
  skills: string[];
  interests: string[];
  education: string;
  departmentRequirements: Array<{
    name: string;
    role: string;
    required_skills: string[];
    preferred_interests: string[];
  }>;
}

export interface PerformancePredictPayload {
  attendanceRate: number;
  taskCompletionRate: number;
  feedbackSentimentScore: number;
  productivityScore: number;
}

export interface SentimentAnalysisPayload {
  feedbackText: string;
}

export interface ChatbotPayload {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: Record<string, any>;
}

export class AIService {
  private serviceUrl: string;

  constructor() {
    this.serviceUrl = config.ai.serviceUrl;
  }

  /**
   * Match intern profile to departmental requirements
   */
  async matchRole(payload: RoleMatchPayload) {
    try {
      const response = await fetch(`${this.serviceUrl}/api/ai/match-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: payload.skills,
          interests: payload.interests,
          education: payload.education,
          technologies: [], // Added for new schema
        }),
      });

      if (!response.ok) {
        throw new Error(`FastAPI match-role response error: ${response.statusText}`);
      }

      const responseJson = await response.json() as any;
      if (!responseJson.success) {
        throw new Error(`FastAPI match-role logic error: ${responseJson.error}`);
      }
      
      const data = responseJson.data;
      return {
        matchPercentage: data.match_percentage,
        bestDepartment: data.best_department,
        recommendedRole: data.recommended_role,
        suggestedTechnologies: data.suggested_technologies,
        matchedSkills: data.matched_skills,
        missingSkills: data.missing_skills,
        rationale: data.rationale,
      };
    } catch (error) {
      logger.warn('AI Microservice offline. Triggering fallback Role Matching heuristics...');
      
      // Fallback Jaccard-like algorithm in TS
      let bestMatch = 0;
      let bestRole = 'General Support Intern';
      let bestMatchedSkills: string[] = [];
      let bestMissingSkills: string[] = [];

      const internSkills = new Set(payload.skills.map(s => s.toLowerCase().trim()));

      for (const dept of payload.departmentRequirements) {
        const reqSkills = dept.required_skills;
        const matched = reqSkills.filter(s => internSkills.has(s.toLowerCase().trim()));
        const missing = reqSkills.filter(s => !internSkills.has(s.toLowerCase().trim()));
        
        const score = reqSkills.length > 0 ? (matched.length / reqSkills.length) * 100 : 50;
        if (score > bestMatch) {
          bestMatch = Math.round(score);
          bestRole = dept.role;
          bestMatchedSkills = matched;
          bestMissingSkills = missing;
        }
      }

      return {
        matchPercentage: bestMatch,
        recommendedRole: bestRole,
        matchedSkills: bestMatchedSkills,
        missingSkills: bestMissingSkills,
        rationale: `[Fallback Heuristic] Based on keyword overlap calculations, you matched ${bestMatchedSkills.length} skills with the '${bestRole}' role. Note: The FastAPI AI microservice is currently offline.`,
      };
    }
  }

  /**
   * Predict performance parameters and drivers
   */
  async predictPerformance(payload: PerformancePredictPayload) {
    try {
      const response = await fetch(`${this.serviceUrl}/api/ai/predict-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_rate: payload.attendanceRate,
          task_completion_rate: payload.taskCompletionRate,
          feedback_score: payload.feedbackSentimentScore, // Mapped to new schema
          productivity_score: payload.productivityScore,
          submission_rate: payload.taskCompletionRate, // Using completion as a proxy
        }),
      });

      if (!response.ok) {
        throw new Error(`FastAPI predict-performance response error: ${response.statusText}`);
      }

      const responseJson = await response.json() as any;
      if (!responseJson.success) {
        throw new Error(`FastAPI predict-performance logic error: ${responseJson.error}`);
      }
      
      const data = responseJson.data;
      return {
        predictedPerformanceScore: data.predicted_performance_score,
        productivityLevel: data.productivity_level,
        riskLevel: data.risk_level,
        internshipSuccessProbability: data.internship_success_probability,
        keyDrivers: data.key_drivers,
        recommendations: data.recommendations,
      };
    } catch (error) {
      logger.warn('AI Microservice offline. Triggering fallback Performance scoring formulas...');

      // Fallback weighted scoring formula in TS
      const weightedScore = Math.round(
        (payload.attendanceRate * 25) +
        (payload.taskCompletionRate * 35) +
        ((payload.feedbackSentimentScore + 1) / 2 * 20) +
        (payload.productivityScore * 20)
      );

      let grade = 'F';
      if (weightedScore >= 90) grade = 'A';
      else if (weightedScore >= 80) grade = 'B';
      else if (weightedScore >= 70) grade = 'C';
      else if (weightedScore >= 60) grade = 'D';

      const risk = payload.attendanceRate < 0.8 || payload.taskCompletionRate < 0.7 ? 'HIGH' : 'LOW';

      return {
        predictedPerformanceGrade: grade,
        predictedScore: weightedScore,
        riskLevel: risk,
        keyDrivers: ['[Fallback] Performance parameters assessed using central weighted averages.'],
        reconciliationSuggestions: [
          'Enable the AI microservice to receive advanced regression key drivers and comprehensive improvement suggestions.',
        ],
      };
    }
  }

  /**
   * Analyze feedback sentiment polarity
   */
  async analyzeSentiment(payload: SentimentAnalysisPayload) {
    try {
      const response = await fetch(`${this.serviceUrl}/api/ai/sentiment-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_text: payload.feedbackText,
        }),
      });

      if (!response.ok) {
        throw new Error(`FastAPI sentiment-analysis response error: ${response.statusText}`);
      }

      const responseJson = await response.json() as any;
      if (!responseJson.success) {
        throw new Error(`FastAPI sentiment-analysis logic error: ${responseJson.error}`);
      }

      const data = responseJson.data;
      return {
        sentiment: data.sentiment,
        confidenceScore: data.confidence_score,
        keywords: data.keywords,
        weakAreas: data.weak_areas,
        strongSkills: data.strong_skills,
        improvementSuggestions: data.improvement_suggestions,
      };
    } catch (error) {
      logger.warn('AI Microservice offline. Triggering fallback Sentiment parser...');

      const text = payload.feedbackText.toLowerCase();
      let label = 'NEUTRAL';
      let score = 0.0;

      // Basic keyword search fallback
      const positiveWords = ['good', 'excellent', 'great', 'amazing', 'happy', 'proactive'];
      const negativeWords = ['poor', 'slow', 'bad', 'difficult', 'unhappy', 'delayed'];

      let posCount = positiveWords.filter(w => text.includes(w)).length;
      let negCount = negativeWords.filter(w => text.includes(w)).length;

      if (posCount > negCount) {
        label = 'POSITIVE';
        score = 0.5;
      } else if (negCount > posCount) {
        label = 'NEGATIVE';
        score = -0.5;
      }

      const positivePercentage = score >= 0 ? 75 : 25;
      const negativePercentage = 100 - positivePercentage;

      return {
        sentimentScore: score,
        label,
        positivePercentage,
        negativePercentage,
        extractedSuggestions: ['[Fallback] Sentiment analyzed using keyword fallbacks. Enable AI service for NLP phrase checks.'],
      };
    }
  }

  /**
   * Request chatbot response
   */
  async chatbot(payload: ChatbotPayload) {
    try {
      const response = await fetch(`${this.serviceUrl}/api/ai/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: payload.message,
          session_id: "default",
          history: payload.history,
          context: payload.context || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`FastAPI chatbot response error: ${response.statusText}`);
      }

      const responseJson = await response.json() as any;
      if (!responseJson.success) {
        throw new Error(`FastAPI chatbot logic error: ${responseJson.error}`);
      }

      const data = responseJson.data;
      return {
        reply: data.reply,
        suggestedPrompts: data.suggested_prompts,
        intent: data.intent,
        confidence: data.confidence,
      };
    } catch (error) {
      logger.warn('AI Microservice offline. Triggering fallback FAQ Dialog replies...');

      return {
        response: `[Fallback Mode] Hello! The AI microservice is currently offline, so my smart capabilities are limited. I am configured with this default notice. Let me know if you would like me to assist with anything else!`,
        suggestedActions: ['Try re-connecting AI microservice', 'View active tasks'],
        matchedFaq: null,
      };
    }
  }
}

export default new AIService();
