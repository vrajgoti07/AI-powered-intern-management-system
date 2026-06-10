import aiService from './ai.service';
import { logger } from '../utils/logger';

export interface ParsedGoalTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  daysFromNow: number; // deadline offset from today
}

export interface GoalEvaluation {
  status: 'ACHIEVED' | 'PARTIALLY_ACHIEVED' | 'NOT_ACHIEVED';
  completionRate: number;
  evaluation: string;
}

class GoalAIService {

  /**
   * Use AI to break a high-level goal into 3-5 actionable tasks.
   * Falls back to a local heuristic splitter if AI is unavailable.
   */
  async parseGoalIntoTasks(goalTitle: string, internName: string, skills: string[]): Promise<ParsedGoalTask[]> {
    const systemPrompt = `You are an expert career coach and project planner for software engineering interns.
Given a high-level goal from an intern, break it into 3-5 concrete, actionable tasks.
Each task should be achievable within a week.

Respond ONLY with a valid JSON array. No markdown, no explanation.
Each item must have:
- "title": Short task title (max 80 chars)
- "description": 1-2 sentence description of what to do
- "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT"
- "daysFromNow": Number of days from today for the deadline (1-7)

Order tasks by logical dependency (prerequisites first).`;

    const userPrompt = `Intern name: ${internName}
Skills: ${skills.length > 0 ? skills.join(', ') : 'Not specified'}
Goal: "${goalTitle}"

Break this goal into 3-5 concrete tasks as a JSON array.`;

    try {
      const rawResponse = await aiService.generateText(systemPrompt, userPrompt);
      
      // Extract JSON from response (handle potential markdown wrapping)
      let jsonStr = rawResponse.trim();
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed: ParsedGoalTask[] = JSON.parse(jsonStr);
      
      // Validate and sanitize
      const validTasks = parsed
        .filter(t => t.title && t.description && t.daysFromNow)
        .slice(0, 5)
        .map(t => ({
          title: String(t.title).slice(0, 80),
          description: String(t.description).slice(0, 500),
          priority: (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(t.priority) ? t.priority : 'MEDIUM') as ParsedGoalTask['priority'],
          daysFromNow: Math.min(Math.max(Math.round(Number(t.daysFromNow)), 1), 7)
        }));
      
      if (validTasks.length >= 2) {
        return validTasks;
      }
      
      // If AI returned fewer than 2 valid tasks, use fallback
      logger.warn('AI returned fewer than 2 valid tasks, using local fallback.');
      return this.generateLocalFallbackTasks(goalTitle);
    } catch (error: any) {
      logger.warn(`AI goal parsing failed, using local fallback: ${error.message}`);
      return this.generateLocalFallbackTasks(goalTitle);
    }
  }

  /**
   * Use AI to evaluate a goal's progress based on task completion data.
   * Falls back to a deterministic formula if AI is unavailable.
   */
  async evaluateGoalProgress(
    goalTitle: string,
    internName: string,
    tasksSummary: { title: string; status: string; isCompleted: boolean }[]
  ): Promise<GoalEvaluation> {
    const totalTasks = tasksSummary.length;
    const completedTasks = tasksSummary.filter(t => t.isCompleted).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Determine status from completion rate
    let status: GoalEvaluation['status'];
    if (completionRate >= 80) {
      status = 'ACHIEVED';
    } else if (completionRate >= 40) {
      status = 'PARTIALLY_ACHIEVED';
    } else {
      status = 'NOT_ACHIEVED';
    }

    const systemPrompt = `You are a supportive career coach for software engineering interns.
Evaluate the intern's weekly goal progress. Be encouraging but honest.
Write 2-3 sentences maximum. Be specific about what was done well and what could improve.
Do NOT use markdown formatting. Just plain text.`;

    const taskList = tasksSummary
      .map(t => `- "${t.title}" → ${t.isCompleted ? '✅ Completed' : `❌ ${t.status}`}`)
      .join('\n');

    const userPrompt = `Intern: ${internName}
Goal: "${goalTitle}"
Tasks completed: ${completedTasks}/${totalTasks} (${completionRate}%)

${taskList}

Write a brief evaluation (2-3 sentences).`;

    try {
      const aiEvaluation = await aiService.generateText(systemPrompt, userPrompt);
      return { status, completionRate, evaluation: aiEvaluation.trim() };
    } catch (error: any) {
      logger.warn(`AI goal evaluation failed, using local fallback: ${error.message}`);
      return {
        status,
        completionRate,
        evaluation: this.generateLocalFallbackEvaluation(internName, goalTitle, completedTasks, totalTasks, completionRate)
      };
    }
  }

  /**
   * Local fallback: break a goal into generic tasks based on keywords.
   */
  private generateLocalFallbackTasks(goalTitle: string): ParsedGoalTask[] {
    const lowerGoal = goalTitle.toLowerCase();
    
    // Pattern: learning/studying something
    if (lowerGoal.includes('learn') || lowerGoal.includes('study') || lowerGoal.includes('understand')) {
      return [
        { title: 'Research and gather resources', description: `Find relevant tutorials, docs, and articles about: ${goalTitle}`, priority: 'MEDIUM', daysFromNow: 1 },
        { title: 'Complete beginner exercises', description: 'Work through introductory tutorials and practice basic concepts.', priority: 'HIGH', daysFromNow: 3 },
        { title: 'Build a mini project', description: 'Apply what you learned by building a small hands-on project or demo.', priority: 'HIGH', daysFromNow: 5 },
        { title: 'Document learnings and write notes', description: 'Summarize key takeaways and create a reference document for future use.', priority: 'MEDIUM', daysFromNow: 7 },
      ];
    }

    // Pattern: building/creating something
    if (lowerGoal.includes('build') || lowerGoal.includes('create') || lowerGoal.includes('develop') || lowerGoal.includes('implement')) {
      return [
        { title: 'Plan and define requirements', description: `Draft a plan outlining what needs to be built and the key deliverables for: ${goalTitle}`, priority: 'HIGH', daysFromNow: 1 },
        { title: 'Set up project structure', description: 'Initialize the project, set up the environment, and install dependencies.', priority: 'HIGH', daysFromNow: 2 },
        { title: 'Implement core functionality', description: 'Build the main features and logic of the project.', priority: 'URGENT', daysFromNow: 5 },
        { title: 'Test and refine', description: 'Test edge cases, fix bugs, and polish the implementation.', priority: 'MEDIUM', daysFromNow: 6 },
        { title: 'Review and document', description: 'Write documentation, clean up code, and prepare for review.', priority: 'MEDIUM', daysFromNow: 7 },
      ];
    }

    // Pattern: improving/fixing something
    if (lowerGoal.includes('improve') || lowerGoal.includes('fix') || lowerGoal.includes('optimize') || lowerGoal.includes('refactor')) {
      return [
        { title: 'Audit current state', description: `Analyze the current status and identify key areas for improvement regarding: ${goalTitle}`, priority: 'HIGH', daysFromNow: 1 },
        { title: 'Prioritize improvement items', description: 'Create a prioritized list of changes ranked by impact.', priority: 'MEDIUM', daysFromNow: 2 },
        { title: 'Implement changes', description: 'Execute the top-priority improvements and optimizations.', priority: 'HIGH', daysFromNow: 5 },
        { title: 'Validate results', description: 'Measure the impact of changes and verify improvements.', priority: 'MEDIUM', daysFromNow: 7 },
      ];
    }

    // Default generic breakdown
    return [
      { title: 'Research and plan', description: `Break down the goal into clear steps: ${goalTitle}`, priority: 'HIGH', daysFromNow: 1 },
      { title: 'Execute phase 1', description: 'Start working on the first set of deliverables.', priority: 'HIGH', daysFromNow: 3 },
      { title: 'Execute phase 2', description: 'Continue with the remaining deliverables and refine previous work.', priority: 'HIGH', daysFromNow: 5 },
      { title: 'Review and wrap up', description: 'Finalize all deliverables and prepare documentation or summary.', priority: 'MEDIUM', daysFromNow: 7 },
    ];
  }

  /**
   * Local fallback evaluation text.
   */
  private generateLocalFallbackEvaluation(
    internName: string,
    goalTitle: string,
    completed: number,
    total: number,
    rate: number
  ): string {
    if (rate >= 80) {
      return `Great work, ${internName}! You completed ${completed} out of ${total} tasks for your goal "${goalTitle}". Your dedication this week shows strong progress — keep building on this momentum!`;
    } else if (rate >= 40) {
      return `${internName}, you completed ${completed} out of ${total} tasks for "${goalTitle}" (${rate}%). You've made meaningful progress, but there's room to push further. Consider setting more specific daily targets next week.`;
    } else {
      return `${internName}, only ${completed} of ${total} tasks were completed for "${goalTitle}" (${rate}%). It's okay — some weeks are tougher. Try breaking your goals into smaller, more achievable steps next week and reach out to your mentor for guidance.`;
    }
  }
}

export default new GoalAIService();
