import logging
import json
import random
from typing import Dict, Any, List, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Curated local question bank for fallback mode
LOCAL_QUESTIONS = {
    "software engineer": [
        {"questionText": "Explain the difference between synchronous and asynchronous programming, and how you handle it in JavaScript or Python.", "questionType": "TECHNICAL"},
        {"questionText": "What is a RESTful API? Describe the HTTP methods and status codes you typically use.", "questionType": "TECHNICAL"},
        {"questionText": "Describe a situation where you had to work with someone whose style or personality was very different from yours. How did you handle it?", "questionType": "BEHAVIORAL"},
        {"questionText": "Tell me about a time when you made a mistake on a project. What happened and what did you learn?", "questionType": "BEHAVIORAL"},
        {"questionText": "If you are given a task with a tight deadline, but you realize you don't have all the requirements to complete it, what actions would you take?", "questionType": "SITUATIONAL"}
    ],
    "frontend engineer": [
        {"questionText": "Describe the virtual DOM in React and explain how it improves rendering performance.", "questionType": "TECHNICAL"},
        {"questionText": "Explain the differences between CSS Grid and Flexbox, and when you would choose one over the other.", "questionType": "TECHNICAL"},
        {"questionText": "Tell me about a design feedback session where you had to make changes you initially disagreed with. How did you proceed?", "questionType": "BEHAVIORAL"},
        {"questionText": "Give an example of a complex UI component you built. What were the challenges and how did you resolve them?", "questionType": "BEHAVIORAL"},
        {"questionText": "A user reports that a critical page loads very slowly on mobile devices. What steps do you take to identify and fix the bottleneck?", "questionType": "SITUATIONAL"}
    ],
    "data analyst": [
        {"questionText": "Explain the differences between INNER JOIN, LEFT JOIN, and outer joins in SQL, and when to use each.", "questionType": "TECHNICAL"},
        {"questionText": "What is data normalization, and why is it important in database design?", "questionType": "TECHNICAL"},
        {"questionText": "Describe a time when your analysis led to an unexpected finding. How did you communicate this to your team?", "questionType": "BEHAVIORAL"},
        {"questionText": "Tell me about a data project where you had to clean a very messy dataset. What was your process?", "questionType": "BEHAVIORAL"},
        {"questionText": "If a department head requests a report immediately, but you notice discrepancies in the source data, how do you handle it?", "questionType": "SITUATIONAL"}
    ],
    "product manager": [
        {"questionText": "How do you prioritize features for a product roadmap when resources are limited? What frameworks do you use?", "questionType": "TECHNICAL"},
        {"questionText": "Explain what an MVP (Minimum Viable Product) is, and how you measure its success after launch.", "questionType": "TECHNICAL"},
        {"questionText": "Tell me about a time when a project you were leading fell behind schedule. What steps did you take to manage stakeholder expectations?", "questionType": "BEHAVIORAL"},
        {"questionText": "Describe a situation where you had to make a decision without having all the user data you wanted.", "questionType": "BEHAVIORAL"},
        {"questionText": "If engineering estimates for a critical feature are double what was expected, how do you negotiate scope?", "questionType": "SITUATIONAL"}
    ],
    "ui/ux designer": [
        {"questionText": "Explain the difference between wireframes, prototypes, and high-fidelity mockups, and what purpose each serves.", "questionType": "TECHNICAL"},
        {"questionText": "What is user-centered design, and how do you incorporate user feedback into design iterations?", "questionType": "TECHNICAL"},
        {"questionText": "Describe a time when a stakeholder strongly disliked one of your designs. How did you handle the critique?", "questionType": "BEHAVIORAL"},
        {"questionText": "Tell me about a design challenge where you had to prioritize accessibility (WCAG compliance).", "questionType": "BEHAVIORAL"},
        {"questionText": "If engineering tells you that your custom interactive element cannot be built due to technical limitations, how do you adjust your design?", "questionType": "SITUATIONAL"}
    ]
}

# Default generic fallback
DEFAULT_QUESTIONS = [
    {"questionText": "What are your professional goals for this internship, and how do you plan to achieve them?", "questionType": "BEHAVIORAL"},
    {"questionText": "Explain a technical challenge you encountered recently and the steps you took to overcome it.", "questionType": "TECHNICAL"},
    {"questionText": "How do you handle feedback or criticism from a supervisor or peer that you do not agree with?", "questionType": "BEHAVIORAL"},
    {"questionText": "Describe a project where you had to collaborate closely with a cross-functional team.", "questionType": "BEHAVIORAL"},
    {"questionText": "If you are working on a blocker and your mentor is unavailable, how do you keep moving forward?", "questionType": "SITUATIONAL"}
]

class MockInterviewService:
    def __init__(self) -> None:
        self._openai_client = None
        self._initialized = False

    def _init_openai(self) -> None:
        if self._initialized:
            return
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized in MockInterviewService")
            except Exception as exc:
                logger.error("Failed to initialize OpenAI client: %s", exc)
                self._openai_client = None
        self._initialized = True

    def generate_questions(self, job_role: str, intern_name: str, skills: List[str]) -> List[Dict[str, Any]]:
        """
        Generate 5 interview questions (2 technical, 2 behavioral, 1 situational).
        Uses OpenAI if configured, otherwise falls back to a curated local list.
        """
        self._init_openai()
        role_lower = job_role.lower().strip()

        if self._openai_client:
            try:
                prompt = (
                    f"You are an expert interviewer. Generate exactly 5 interview questions for an intern role of '{job_role}'.\n"
                    f"Intern Name: {intern_name}\n"
                    f"Intern's Skills: {', '.join(skills)}\n\n"
                    f"Requirements:\n"
                    f"- Generate exactly 5 questions: 2 TECHNICAL, 2 BEHAVIORAL, and 1 SITUATIONAL.\n"
                    f"- Tailor technical questions to the skills if relevant, or standard role concepts.\n"
                    f"- Respond ONLY with a valid JSON array of objects, where each object has:\n"
                    f"  'questionText' (string) and 'questionType' (enum string: 'TECHNICAL', 'BEHAVIORAL', 'SITUATIONAL').\n"
                    f"- Do not include markdown codeblocks or extra conversational text."
                )

                response = self._openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a senior technical interviewer returning JSON data only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=800
                )

                content = response.choices[0].message.content.strip()
                # Clean codeblock indicators if LLM outputs them
                if content.startswith("```"):
                    lines = content.split("\n")
                    if lines[0].startswith("```json") or lines[0].startswith("```"):
                        content = "\n".join(lines[1:-1]).strip()

                questions = json.loads(content)
                if isinstance(questions, list) and len(questions) == 5:
                    return questions
                logger.warning("AI did not return exactly 5 questions, using local fallback")
            except Exception as exc:
                logger.error("Failed to generate mock interview questions via AI: %s", exc)

        # Local Fallback
        logger.info("MockInterviewService using local question bank fallback")
        for key, q_list in LOCAL_QUESTIONS.items():
            if key in role_lower or role_lower in key:
                return q_list

        return DEFAULT_QUESTIONS

    def evaluate_answer(self, question_text: str, question_type: str, intern_answer: str) -> Dict[str, Any]:
        """
        Evaluate an answer, returning a score (0 to 20) and feedback.
        """
        self._init_openai()
        ans_clean = intern_answer.strip() if intern_answer else ""

        if not ans_clean:
            return {
                "score": 0,
                "aiFeedback": "No answer was provided. A complete response is required to evaluate your performance."
            }

        if self._openai_client:
            try:
                prompt = (
                    f"Question: '{question_text}' ({question_type})\n"
                    f"Intern's Answer: '{ans_clean}'\n\n"
                    f"Evaluate this response. Return a JSON object with two fields:\n"
                    f"1. 'score' (integer between 0 and 20 based on accuracy, structure, depth, and relevance).\n"
                    f"2. 'aiFeedback' (concise string with constructive coaching feedback: what was done well, and what to improve).\n"
                    f"Respond ONLY with the JSON object."
                )

                response = self._openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a professional hiring evaluator returning JSON data only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=500
                )

                content = response.choices[0].message.content.strip()
                if content.startswith("```"):
                    lines = content.split("\n")
                    if lines[0].startswith("```json") or lines[0].startswith("```"):
                        content = "\n".join(lines[1:-1]).strip()

                result = json.loads(content)
                score = int(result.get("score", 10))
                # Ensure score boundaries
                score = max(0, min(20, score))
                return {
                    "score": score,
                    "aiFeedback": result.get("aiFeedback", "Completed evaluation.")
                }
            except Exception as exc:
                logger.error("Failed to evaluate answer via AI: %s", exc)

        # Local Fallback
        logger.info("MockInterviewService using local evaluation heuristics")
        word_count = len(ans_clean.split())
        score = 10  # default passing grade

        if word_count < 10:
            score = 6
            feedback = "Your answer is very brief. Try to elaborate on your reasoning and give concrete examples or technical details to substantiate your answer."
        elif word_count < 25:
            score = 12
            feedback = "Good response, but could benefit from structured elaboration. Mention technical concepts or step-by-step methodologies to make it stronger."
        else:
            score = 16
            # Add bonus points for matching keywords
            keywords = ["rest", "api", "async", "await", "promise", "listen", "empathy", "learn", "priority", "communicate", "figma", "grid", "join", "index", "stakeholder"]
            matches = [w for w in keywords if w in ans_clean.lower()]
            score += min(4, len(matches))
            feedback = f"Strong and thorough answer! You demonstrated solid understanding and highlighted relevant concepts like: {', '.join(matches[:3]) if matches else 'practical coordination'}."

        return {
            "score": score,
            "aiFeedback": feedback
        }

    def generate_summary(self, job_role: str, questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate overall interview score, readiness level, and AI-written performance summary.
        """
        self._init_openai()
        total_score = sum(q.get("score", 0) for q in questions)
        # Convert total score (out of 100 max)
        
        # Determine readiness level
        if total_score >= 80:
            readiness = "READY"
        elif total_score >= 60:
            readiness = "NEARLY_READY"
        else:
            readiness = "NEEDS_PRACTICE"

        if self._openai_client:
            try:
                summary_data = []
                for q in questions:
                    summary_data.append({
                        "question": q.get("questionText"),
                        "type": q.get("questionType"),
                        "answer": q.get("internAnswer"),
                        "score": q.get("score"),
                        "feedback": q.get("aiFeedback")
                    })

                prompt = (
                    f"Target Role: {job_role}\n"
                    f"Overall Score: {total_score}/100\n"
                    f"Readiness: {readiness}\n"
                    f"Detail of Q&As: {json.dumps(summary_data)}\n\n"
                    f"Write a friendly, high-level summary (exactly 3 sentences) synthesizing this mock interview.\n"
                    f"Focus on key strengths shown, areas needing improvement, and overall readiness for active hiring loops.\n"
                    f"Respond ONLY with the 3 sentences."
                )

                response = self._openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a career development coach. Write a 3-sentence summary."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.5,
                    max_tokens=300
                )

                ai_summary = response.choices[0].message.content.strip()
                return {
                    "overallScore": float(total_score),
                    "readinessLevel": readiness,
                    "aiSummary": ai_summary
                }
            except Exception as exc:
                logger.error("Failed to generate overall summary via AI: %s", exc)

        # Local Fallback
        logger.info("MockInterviewService using local summary templates")
        if readiness == "READY":
            summary = (
                f"Outstanding performance across all categories for the {job_role} track. "
                "The candidate displayed excellent technical depth and structured, clear behavioral answers. "
                "Highly recommended for active developer recruitment cycles without further blockers."
            )
        elif readiness == "NEARLY_READY":
            summary = (
                f"Solid overall understanding shown for the {job_role} interview questions. "
                "Core technical concepts were well articulated, though some situational responses could have more detail. "
                "Minor practice on problem-solving workflows will make this candidate ready."
            )
        else:
            summary = (
                f"Good baseline effort, but further preparation is required for the {job_role} role. "
                "Technical responses were overly brief, and behavioral examples lacked details on impact. "
                "Focus on mock tests and fundamental review sessions to build interview confidence."
            )

        return {
            "overallScore": float(total_score),
            "readinessLevel": readiness,
            "aiSummary": summary
        }

# Singleton instance
mock_interview_service = MockInterviewService()
