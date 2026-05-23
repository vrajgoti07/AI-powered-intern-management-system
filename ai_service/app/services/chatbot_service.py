"""
AI Chatbot Service — Intent classification with TF-IDF + LogisticRegression.

Trains an intent classifier on FAQ pairs at init time, then
classifies user messages, selects a response template, and optionally
personalises the reply using user context data (attendance, score, tasks, etc.).
"""

import json
import logging
import random
from typing import Dict, Any, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from app.utils.helpers import clean_text

logger = logging.getLogger(__name__)


# ── Intent training data ─────────────────────────────────────────────
# Each intent has multiple example phrases and response templates.
# Templates may contain {placeholders} that are filled from user context.

INTENT_DATA = {
    "my_attendance": {
        "examples": [
            "what is my attendance",
            "my attendance ratio",
            "how many days present",
            "show my attendance",
            "attendance percentage",
            "what is my attendance rate",
            "current attendance",
            "am i attending regularly",
            "how is my attendance",
            "tell me my attendance",
            "attendance report",
            "my attendance status",
            "how many days did i attend",
            "attendance so far",
            "check my attendance",
            "what is my attendance ratio",
        ],
        "responses": [
            "Your current attendance rate is **{attendance}%**. {attendance_feedback}",
            "Based on the records, your attendance stands at **{attendance}%**. {attendance_feedback}",
            "You have an attendance of **{attendance}%** so far. {attendance_feedback}",
        ],
    },
    "my_score": {
        "examples": [
            "what is my score",
            "show my performance grade",
            "current performance",
            "my performance score",
            "how am i performing",
            "show my current performance grade",
            "what is my performance rating",
            "performance evaluation",
            "my score right now",
            "tell me my score",
            "how is my performance",
            "grade me",
            "current score",
            "what grade do i have",
            "my internship score",
            "show performance",
        ],
        "responses": [
            "Your current performance score is **{score}/100**. {score_feedback}",
            "Based on your work so far, your score stands at **{score}/100**. {score_feedback}",
            "You currently have a performance score of **{score}/100**. {score_feedback}",
        ],
    },
    "my_tasks": {
        "examples": [
            "when is my next task due",
            "pending tasks",
            "task deadlines",
            "what tasks do i have",
            "show my tasks",
            "upcoming deadlines",
            "my assigned tasks",
            "list my tasks",
            "how many tasks are pending",
            "do i have any tasks",
            "tasks assigned to me",
            "what work is pending",
            "show my pending work",
            "next deadline",
            "task list",
            "incomplete tasks",
        ],
        "responses": [
            "{task_info}",
        ],
    },
    "certificate": {
        "examples": [
            "internship certificate criteria",
            "how to get certificate",
            "completion requirements",
            "when will i get my certificate",
            "certificate eligibility",
            "internship completion certificate",
            "do i qualify for certificate",
            "how to earn certificate",
            "requirements for certificate",
            "what do i need for a certificate",
            "certificate of completion",
            "when do i receive my certificate",
            "certificate policy",
            "am i eligible for certificate",
            "completion criteria",
            "how to complete internship",
        ],
        "responses": [
            "To earn your internship certificate, you generally need: **1)** Maintain attendance above 75%, **2)** Complete at least 80% of assigned tasks, **3)** Achieve a performance score of 60+ out of 100. {certificate_status}",
            "Certificate eligibility requires: attendance ≥ 75%, task completion ≥ 80%, and a score ≥ 60/100. {certificate_status}",
            "Internship certificates are awarded upon meeting these criteria: **75%+ attendance**, **80%+ task completion**, and **60+ performance score**. {certificate_status}",
        ],
    },
    "mentor_info": {
        "examples": [
            "who is my mentor",
            "mentor details",
            "contact mentor",
            "my mentor name",
            "who is assigned as my mentor",
            "tell me about my mentor",
            "mentor information",
            "how to reach my mentor",
            "my supervisor",
            "who guides me",
            "who is my guide",
            "assigned mentor",
            "mentor contact",
            "who is mentoring me",
            "my mentor",
            "supervisor details",
        ],
        "responses": [
            "Your assigned mentor is **{mentor_name}**. You can reach out to them through the Group Channels chat or via email for guidance on your tasks and projects.",
            "You are being mentored by **{mentor_name}**. Feel free to contact them through the messaging system for any questions about your work.",
            "**{mentor_name}** is your assigned mentor. They can help you with task guidance, performance feedback, and career advice during your internship.",
        ],
    },
    "attendance": {
        "examples": [
            "how do I check in",
            "check in attendance",
            "daily attendance",
            "how to mark attendance",
            "check out for the day",
            "attendance tracking",
            "clock in clock out",
            "register my attendance",
            "attendance history",
            "view my attendance log",
            "how does attendance work",
            "attendance system",
            "punch in",
            "mark my presence",
            "i want to check in",
        ],
        "responses": [
            "You can check in by visiting the **Attendance** page and clicking 'Check In'. Your time, notes, and coordinates will be recorded automatically. Click 'Check Out' when you finish for the day.",
            "Head to the **Attendance** tab to register your daily check-in. The system will auto-calculate your working hours once you check out.",
            "To view your attendance history, go to the **Attendance** page and select the calendar view. You'll see all your past check-ins and durations.",
            "Your attendance is tracked through the Check In / Check Out system on the Attendance page. Make sure to check in at the start of each work day.",
            "If you forgot to check in, contact your mentor or HR to manually update your attendance record for the day.",
        ],
    },
    "task_help": {
        "examples": [
            "how to submit a task",
            "submit my assignment",
            "upload task file",
            "task submission",
            "where to find my tasks",
            "view pending tasks",
            "task deadline",
            "how to complete a task",
            "task status update",
            "mark task as done",
            "how do tasks work",
            "task submission process",
            "upload my work",
            "submit assignment",
            "how to turn in my task",
        ],
        "responses": [
            "To submit a task, go to the **Task details** page, click 'Submit Task', add your notes, and upload any required files (up to 10MB). Your mentor will be notified for review.",
            "You can find all your assigned tasks on the **Tasks** page. Pending tasks are highlighted and sorted by deadline.",
            "To update your task status, open the task and change its status to 'In Progress' or 'Completed'. Add any relevant submission notes.",
            "Make sure to submit your task before the deadline shown on the task card. Late submissions may affect your performance score.",
            "If you're stuck on a task, reach out to your mentor through the Chat feature. They can provide guidance and extend deadlines if needed.",
        ],
    },
    "hr_support": {
        "examples": [
            "leave application",
            "apply for leave",
            "leave policy",
            "sick leave request",
            "vacation days",
            "who approves my leave",
            "leave balance",
            "casual leave",
            "leave status",
            "time off request",
            "how to apply for leave",
            "leave of absence",
            "request time off",
            "days off",
            "leave request process",
        ],
        "responses": [
            "To apply for leave, go to the **Leave Management** tab, select your leave type (Sick, Casual, or Vacation), specify the dates, and submit with a reason. Your mentor or HR will review it.",
            "Leave requests are reviewed by your assigned mentor. If no mentor is assigned, HR or Admin users will handle the approval.",
            "You can check your leave balance and application status on the **Leave Management** page. You'll receive notifications when your leave is approved or rejected.",
            "For emergency sick leave, submit your application as soon as possible with a brief explanation. You can add documentation later.",
            "Company leave policy allows Sick Leave, Casual Leave, and Vacation Leave. Each type has specific allowances outlined in the HR handbook.",
        ],
    },
    "policy": {
        "examples": [
            "company policy",
            "intern rules",
            "working hours",
            "code of conduct",
            "dress code",
            "remote work policy",
            "internship guidelines",
            "what are the rules",
            "compliance requirements",
            "data security policy",
            "office timings",
            "work schedule",
            "intern handbook",
            "company rules",
            "office policy",
        ],
        "responses": [
            "Internship guidelines and company policies are available in the **HR Resources** section. This includes working hours, code of conduct, and data security protocols.",
            "Standard working hours are **9 AM to 6 PM**, Monday through Friday. Flexible arrangements may be available with mentor approval.",
            "The intern code of conduct covers professional behaviour, communication standards, and data handling. Please review it in the Policy section.",
            "For remote work arrangements, discuss with your mentor and submit a request through HR. Remote work policies vary by department.",
            "Data security is a priority. Never share login credentials, use approved tools only, and report any security concerns immediately to IT support.",
        ],
    },
    "general": {
        "examples": [
            "hello",
            "hi there",
            "good morning",
            "help me",
            "what can you do",
            "who are you",
            "thank you",
            "thanks",
            "goodbye",
            "bye",
            "hey",
            "hi",
            "good afternoon",
            "good evening",
            "thanks a lot",
        ],
        "responses": [
            "Hello{name_greeting}! I'm your AI assistant for the Intern Management System. I can help with attendance, tasks, leaves, performance scores, and more. What would you like to know?",
            "Hi{name_greeting}! I'm here to help you navigate the platform. Ask me about your attendance, tasks, scores, leave applications, or any other questions!",
            "I'm the AI-powered assistant designed to help interns, mentors, and HR. I can answer questions about attendance, tasks, leaves, and platform features. How can I assist you?",
            "You're welcome! Let me know if there's anything else I can help you with.",
            "Goodbye! Feel free to come back anytime you need assistance. Have a great day!",
        ],
    },
}


class ChatbotService:
    """Intent-based FAQ chatbot with TF-IDF classification, context-aware
    response generation, and Redis session caching."""

    def __init__(self) -> None:
        self._vectorizer: Optional[TfidfVectorizer] = None
        self._classifier: Optional[LogisticRegression] = None
        self._intent_names: List[str] = []
        self._build_classifier()

    def _build_classifier(self) -> None:
        """Train the TF-IDF + LogisticRegression intent classifier."""
        texts: List[str] = []
        labels: List[int] = []
        self._intent_names = list(INTENT_DATA.keys())

        for idx, (intent, data) in enumerate(INTENT_DATA.items()):
            for example in data["examples"]:
                texts.append(clean_text(example))
                labels.append(idx)

        self._vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=800,
            ngram_range=(1, 2),
        )
        X = self._vectorizer.fit_transform(texts)

        self._classifier = LogisticRegression(
            max_iter=1000,
            random_state=42,
            C=10.0,
        )
        self._classifier.fit(X, labels)

        logger.info(
            "Chatbot classifier trained: %d intents, %d examples",
            len(self._intent_names),
            len(texts),
        )

    def get_reply(
        self,
        message: str,
        session_id: str = "default",
        history: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None,
        redis_client=None,
    ) -> Dict[str, Any]:
        """Classify intent, select response, personalise with context, and cache session.

        Args:
            message: User's current message.
            session_id: Unique session identifier for Redis caching.
            history: Prior conversation exchanges.
            context: Optional user context metadata (user_name, attendance, score, tasks, etc.).
            redis_client: Optional async Redis client for session caching.

        Returns:
            Dict with reply, suggested_prompts, intent, and confidence.
        """
        ctx = context or {}

        cleaned = clean_text(message)
        if not cleaned:
            return {
                "reply": "Please enter a valid message so I can help you.",
                "suggested_prompts": ["How do I check in?", "Help me with tasks"],
                "intent": "general",
                "confidence": 0.0,
            }

        # ── Classify intent ──────────────────────────────────────────
        intent = "general"
        confidence = 0.0

        if self._vectorizer and self._classifier:
            X = self._vectorizer.transform([cleaned])
            probas = self._classifier.predict_proba(X)[0]
            best_idx = int(probas.argmax())
            confidence = float(probas[best_idx])
            intent = self._intent_names[best_idx]

            # Fall back to general if confidence is too low
            if confidence < 0.25:
                intent = "general"

        # ── Select and personalise response ──────────────────────────
        responses = INTENT_DATA.get(intent, INTENT_DATA["general"])["responses"]
        reply_template = random.choice(responses)

        # Build context-aware substitution values
        replacements = self._build_replacements(intent, ctx)
        reply = reply_template.format_map(SafeDict(replacements))

        # ── Suggested prompts ────────────────────────────────────────
        suggested = self._get_suggested_prompts(intent)

        # ── Cache session in Redis ───────────────────────────────────
        self._cache_session(redis_client, session_id, message, reply, intent)

        logger.info(
            "Chatbot reply: intent=%s (conf=%.3f) session=%s",
            intent, confidence, session_id,
        )

        return {
            "reply": reply,
            "suggested_prompts": suggested,
            "intent": intent,
            "confidence": round(confidence, 4),
        }

    @staticmethod
    def _build_replacements(intent: str, ctx: Dict[str, Any]) -> Dict[str, str]:
        """Build template replacement values from user context."""
        user_name = ctx.get("user_name") or ""
        attendance = ctx.get("attendance")
        score = ctx.get("score")
        mentor_name = ctx.get("mentor_name") or "your assigned mentor"
        tasks = ctx.get("tasks") or []

        replacements: Dict[str, str] = {
            "name_greeting": f", {user_name}" if user_name else "",
            "mentor_name": mentor_name,
        }

        # Attendance context
        if attendance is not None:
            replacements["attendance"] = str(round(float(attendance), 1))
            att_val = float(attendance)
            if att_val >= 90:
                replacements["attendance_feedback"] = "Excellent! You're maintaining outstanding attendance. Keep it up! 🌟"
            elif att_val >= 75:
                replacements["attendance_feedback"] = "Good job! Your attendance is above the minimum requirement. Stay consistent."
            elif att_val >= 50:
                replacements["attendance_feedback"] = "⚠️ Your attendance needs improvement. Aim for at least 75% to remain eligible for your certificate."
            else:
                replacements["attendance_feedback"] = "🚨 Your attendance is critically low. Please attend regularly to avoid being flagged. Contact your mentor or HR if you're facing issues."
        else:
            replacements["attendance"] = "N/A"
            replacements["attendance_feedback"] = "I don't have your attendance data at the moment. Please check the Attendance page for your latest records."

        # Score context
        if score is not None:
            replacements["score"] = str(round(float(score), 1))
            sc_val = float(score)
            if sc_val >= 90:
                replacements["score_feedback"] = "Outstanding performance! You're among the top performers. 🏆"
            elif sc_val >= 75:
                replacements["score_feedback"] = "Great work! You're performing well above average. Keep pushing!"
            elif sc_val >= 60:
                replacements["score_feedback"] = "Decent performance. Focus on completing more tasks on time to boost your score."
            else:
                replacements["score_feedback"] = "⚠️ Your score needs improvement. Talk to your mentor for guidance on how to improve."
        else:
            replacements["score"] = "N/A"
            replacements["score_feedback"] = "I don't have your score data right now. Check the Dashboard for your latest performance metrics."

        # Task context
        if tasks and isinstance(tasks, list) and len(tasks) > 0:
            pending = [t for t in tasks if t.get("status") in ("Todo", "In Progress", "TODO", "IN_PROGRESS")]
            if pending:
                task_lines = []
                for i, t in enumerate(pending[:5], 1):
                    title = t.get("title", "Untitled")
                    due = t.get("dueDate", "No deadline")
                    status = t.get("status", "Unknown")
                    task_lines.append(f"**{i}.** {title} — Due: {due} ({status})")
                task_info = f"You have **{len(pending)}** pending task(s):\n\n" + "\n".join(task_lines)
                if len(pending) > 5:
                    task_info += f"\n\n...and {len(pending) - 5} more. Visit the Tasks page to see all."
            else:
                task_info = "🎉 Great news! You have no pending tasks right now. All your assigned tasks are completed or under review."
            replacements["task_info"] = task_info
        else:
            replacements["task_info"] = "I don't have your task data at the moment. Visit the **Tasks** page to see your assigned work and deadlines."

        # Certificate status
        if attendance is not None and score is not None:
            att_ok = float(attendance) >= 75
            score_ok = float(score) >= 60
            if att_ok and score_ok:
                replacements["certificate_status"] = f"✅ Based on your current stats (attendance: {replacements['attendance']}%, score: {replacements['score']}/100), **you are on track** to earn your certificate!"
            else:
                issues = []
                if not att_ok:
                    issues.append(f"attendance is {replacements['attendance']}% (need 75%+)")
                if not score_ok:
                    issues.append(f"score is {replacements['score']}/100 (need 60+)")
                replacements["certificate_status"] = f"⚠️ Currently, your {' and '.join(issues)}. Focus on improving these areas to qualify."
        else:
            replacements["certificate_status"] = "I don't have enough data to assess your eligibility right now. Check your Dashboard for the latest metrics."

        return replacements

    @staticmethod
    def _get_suggested_prompts(current_intent: str) -> List[str]:
        """Return contextual follow-up prompts based on the detected intent."""
        prompts = {
            "my_attendance": ["What is my score?", "How do I check in?", "Am I eligible for certificate?"],
            "my_score": ["What is my attendance?", "Show my pending tasks", "Certificate criteria"],
            "my_tasks": ["What is my score?", "When is my next deadline?", "How to submit a task?"],
            "certificate": ["What is my attendance?", "What is my score?", "Show my pending tasks"],
            "mentor_info": ["Show my tasks", "What is my score?", "How to apply for leave?"],
            "attendance": ["What is my attendance?", "How to check out?", "What if I forgot to check in?"],
            "task_help": ["Show my pending tasks", "How to upload files?", "Check task deadlines"],
            "hr_support": ["Check leave balance", "Apply for sick leave", "Who approves my leave?"],
            "policy": ["Working hours", "Remote work policy", "Code of conduct"],
            "general": ["What is my attendance?", "Show my score", "Pending tasks", "Certificate criteria"],
        }
        return prompts.get(current_intent, prompts["general"])

    @staticmethod
    def _cache_session(redis_client, session_id: str, message: str, reply: str, intent: str) -> None:
        """Store session data in Redis with a 1-hour TTL."""
        if redis_client is None:
            return

        try:
            cache_key = f"session:{session_id}"
            session_data = json.dumps({
                "last_message": message,
                "last_reply": reply,
                "last_intent": intent,
            })
            # Use sync set if available, otherwise skip
            redis_client.set(cache_key, session_data, ex=3600)
        except Exception as exc:
            logger.warning("Redis session cache failed (non-critical): %s", exc)


class SafeDict(dict):
    """Dict subclass that returns the key wrapped in braces for missing keys,
    preventing KeyError in str.format_map() calls."""
    def __missing__(self, key: str) -> str:
        return f"{{{key}}}"
