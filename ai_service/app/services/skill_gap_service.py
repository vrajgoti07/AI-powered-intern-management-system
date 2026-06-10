import logging
import json
from typing import Dict, Any, List
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Curated fallback learning resources for popular engineering/product topics
FALLBACK_RESOURCES = {
    "react": [
        {"title": "React Official Documentation - Tutorial", "url": "https://react.dev/learn", "platform": "Official Docs", "duration": "~4 hours"},
        {"title": "React JS Full Course for Beginners - freeCodeCamp", "url": "https://www.youtube.com/watch?v=bMknfKXIFA8", "platform": "YouTube", "duration": "~12 hours"}
    ],
    "node.js": [
        {"title": "Node.js Complete Guide - freeCodeCamp", "url": "https://www.youtube.com/watch?v=LaWp_Kq0cKs", "platform": "YouTube", "duration": "~8 hours"},
        {"title": "Node.js Official Getting Started Guide", "url": "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", "platform": "Official Docs", "duration": "~3 hours"}
    ],
    "javascript": [
        {"title": "MDN Web Docs - JavaScript Basics", "url": "https://developer.mozilla.org/en-US/docs/Learn/JavaScript", "platform": "MDN Docs", "duration": "~6 hours"},
        {"title": "JavaScript Programming Course - freeCodeCamp", "url": "https://www.youtube.com/watch?v=PkZNo7MFNFg", "platform": "YouTube", "duration": "~7 hours"}
    ],
    "sql": [
        {"title": "SQL Tutorial for Beginners - freeCodeCamp", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "platform": "YouTube", "duration": "~4 hours"},
        {"title": "W3Schools SQL Reference Guide", "url": "https://www.w3schools.com/sql/", "platform": "W3Schools", "duration": "~5 hours"}
    ],
    "python": [
        {"title": "Python for Beginners - freeCodeCamp Course", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "platform": "YouTube", "duration": "~4 hours"},
        {"title": "Official Python Documentation Tutorial", "url": "https://docs.python.org/3/tutorial/index.html", "platform": "Official Docs", "duration": "~8 hours"}
    ],
    "git": [
        {"title": "Git and GitHub for Beginners - freeCodeCamp", "url": "https://www.youtube.com/watch?v=RGOj5yH7evk", "platform": "YouTube", "duration": "~2 hours"},
        {"title": "Pro Git Book (Free Online)", "url": "https://git-scm.com/book/en/v2", "platform": "Official Docs", "duration": "~10 hours"}
    ],
    "css": [
        {"title": "MDN Web Docs - Learn CSS layout structures", "url": "https://developer.mozilla.org/en-US/docs/Learn/CSS", "platform": "MDN Docs", "duration": "~8 hours"},
        {"title": "CSS Grid & Flexbox Crash Course - freeCodeCamp", "url": "https://www.youtube.com/watch?v=u044iM9xsB8", "platform": "YouTube", "duration": "~3 hours"}
    ]
}

# Generic resources if topic isn't found
GENERIC_RESOURCES = [
    {"title": "Introductory Technical Roadmap - freeCodeCamp", "url": "https://www.freecodecamp.org/news/", "platform": "freeCodeCamp", "duration": "~5 hours"},
    {"title": "Web Standards Documentation - MDN Web Docs", "url": "https://developer.mozilla.org/en-US/", "platform": "MDN Docs", "duration": "~4 hours"}
]

class SkillGapService:
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
                logger.info("OpenAI client initialized in SkillGapService")
            except Exception as exc:
                logger.error("Failed to initialize OpenAI client: %s", exc)
                self._openai_client = None
        self._initialized = True

    def calculate_skill_scores(self, intern_skills: List[str], required_skills: List[Dict[str, Any]]) -> Tuple[float, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Compare skills, score them, calculate match percentage, and list gaps.
        Levels: BEGINNER=1, INTERMEDIATE=2, ADVANCED=3.
        """
        level_map = {"BEGINNER": 1, "INTERMEDIATE": 2, "ADVANCED": 3}
        
        intern_skills_lower = [s.lower().strip() for s in intern_skills]
        
        analysis_data = []
        gaps = []
        
        total_required_score = 0
        total_intern_score = 0

        for req in required_skills:
            name = req["skillName"]
            name_lower = name.lower().strip()
            req_level = req["requiredLevel"]
            req_score = level_map.get(req_level, 1)
            
            total_required_score += req_score
            
            # Simple substring matching or exact match to find if intern has it
            has_skill = False
            for iskill in intern_skills_lower:
                if iskill == name_lower or iskill in name_lower or name_lower in iskill:
                    has_skill = True
                    break

            if has_skill:
                # Intern has it, let's assume they meet the required level for simplicity,
                # or give them a random level or intermediate/advanced match
                intern_score = req_score
                total_intern_score += intern_score
            else:
                intern_score = 0
                gaps.append(req)

            analysis_data.append({
                "skill": name,
                "internScore": intern_score,
                "requiredScore": req_score
            })

        match_pct = 100.0
        if total_required_score > 0:
            match_pct = (total_intern_score / total_required_score) * 100.0
        
        return round(match_pct, 1), analysis_data, gaps

    def generate_recommendations(self, gaps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Recommend 2 links per gap skill.
        Calls OpenAI if available, otherwise maps to curated fallbacks.
        """
        if not gaps:
            return []

        self._init_openai()
        
        if self._openai_client:
            try:
                gaps_description = [f"{g['skillName']} ({g['requiredLevel']})" for g in gaps]
                prompt = (
                    f"Recommend learning resources for these missing/gap skills of an intern:\n"
                    f"{', '.join(gaps_description)}\n\n"
                    f"For each skill, generate EXACTLY 2 free, high-quality learning resources.\n"
                    f"Requirements:\n"
                    f"- Each resource MUST contain: 'title' (string), 'url' (string — valid free URL like YouTube, MDN, freeCodeCamp, W3schools, or official docs), 'platform' (string — e.g. 'YouTube', 'MDN Docs', 'Official Docs'), 'duration' (string — e.g. '~4 hours').\n"
                    f"- Respond ONLY with a valid JSON array of objects, where each object has:\n"
                    f"  'skill' (string matching the original skill name), 'level' (requiredLevel string), and 'resources' (array of the 2 resource objects).\n"
                    f"- Respond ONLY with JSON. Do not write extra commentary."
                )

                response = self._openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a professional educational curriculum planner returning JSON data only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1000
                )

                content = response.choices[0].message.content.strip()
                if content.startswith("```"):
                    lines = content.split("\n")
                    if lines[0].startswith("```json") or lines[0].startswith("```"):
                        content = "\n".join(lines[1:-1]).strip()

                recs = json.loads(content)
                if isinstance(recs, list) and len(recs) > 0:
                    return recs
            except Exception as exc:
                logger.error("Failed to generate skill gap learning recommendations via OpenAI: %s", exc)

        # Fallback local lookup
        logger.info("SkillGapService using local learning resources bank fallback")
        recommendations = []
        for g in gaps:
            name = g["skillName"]
            name_lower = name.lower().strip()
            level = g["requiredLevel"]

            matched_resources = None
            for key, resources in FALLBACK_RESOURCES.items():
                if key in name_lower or name_lower in key:
                    matched_resources = resources
                    break

            if not matched_resources:
                # Add customized generic resources replacing titles with the skill name
                matched_resources = [
                    {
                        "title": f"Complete {name} tutorial for beginners",
                        "url": "https://www.freecodecamp.org/news/",
                        "platform": "freeCodeCamp",
                        "duration": "~6 hours"
                    },
                    {
                        "title": f"Learn {name} documentation reference",
                        "url": "https://developer.mozilla.org/en-US/",
                        "platform": "MDN Docs",
                        "duration": "~4 hours"
                    }
                ]

            recommendations.append({
                "skill": name,
                "level": level,
                "resources": matched_resources
            })

        return recommendations

skill_gap_service = SkillGapService()
