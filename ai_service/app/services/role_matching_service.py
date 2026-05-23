from typing import List, Dict, Any
from app.schemas.ai import RoleMatchRequest, RoleMatchResponse

class RoleMatchingService:
    def match_role(self, data: RoleMatchRequest) -> RoleMatchResponse:
        skills_set = {s.strip().lower() for s in data.skills}
        interests_set = {i.strip().lower() for i in data.interests}
        education_lower = data.education.strip().lower()

        best_match_percentage = 0.0
        best_role = "General Intern"
        best_matched_skills: List[str] = []
        best_missing_skills: List[str] = []
        best_rationale = ""

        # Default fallback if no departments are supplied
        if not data.department_requirements:
            return RoleMatchResponse(
                match_percentage=0.0,
                recommended_role="General Support",
                matched_skills=[],
                missing_skills=list(data.skills),
                rationale="No department profiles were provided to run matching logic against."
            )

        for dept in data.department_requirements:
            dept_name = dept.get("name", "Unnamed Department")
            role_name = dept.get("role", f"Intern in {dept_name}")
            req_skills = [s.strip() for s in dept.get("required_skills", [])]
            req_skills_lower = {s.lower() for s in req_skills}
            
            req_interests = [i.strip() for i in dept.get("preferred_interests", [])]
            req_interests_lower = {i.lower() for i in req_interests}

            # 1. Calculate skill match overlap
            matched_skills_set = skills_set.intersection(req_skills_lower)
            missing_skills_set = req_skills_lower.difference(skills_set)

            # 2. Calculate interest match overlap
            matched_interests_set = interests_set.intersection(req_interests_lower)

            # 3. Formulate weighted matching score
            # Skills count for 70% weight, Interests count for 30% weight
            skills_score = 0.0
            if req_skills_lower:
                skills_score = len(matched_skills_set) / len(req_skills_lower)
            
            interests_score = 0.0
            if req_interests_lower:
                interests_score = len(matched_interests_set) / len(req_interests_lower)

            # Boost score slightly if education matches department keywords
            education_boost = 0.0
            dept_keywords = dept_name.lower().split() + role_name.lower().split()
            for word in dept_keywords:
                if len(word) > 3 and word in education_lower:
                    education_boost = 0.1
                    break

            match_pct = ((skills_score * 0.7) + (interests_score * 0.3) + education_boost) * 100
            match_pct = min(100.0, max(0.0, round(match_pct, 1)))

            # Select the best matching role profile
            if match_pct > best_match_percentage or (match_pct == best_match_percentage and best_role == "General Intern"):
                best_match_percentage = match_pct
                best_role = role_name
                
                # Restore original casing for matched and missing skills lists
                best_matched_skills = [
                    s for s in req_skills if s.lower() in matched_skills_set
                ]
                # Include any intern skills that fit the role description generally
                best_missing_skills = [
                    s for s in req_skills if s.lower() in missing_skills_set
                ]
                
                skill_alignment = f"matched {len(best_matched_skills)} out of {len(req_skills)} required skills"
                interest_alignment = f"aligned with {len(matched_interests_set)} preferred interests"
                
                if best_match_percentage >= 75.0:
                    strength = "excellent fit"
                    recommendation = "highly recommended for direct onboarding"
                elif best_match_percentage >= 50.0:
                    strength = "strong fit"
                    recommendation = "recommended with slight introductory mentorship"
                else:
                    strength = "partial fit"
                    recommendation = "assigned with focus on foundational training"

                best_rationale = (
                    f"Your background represents a {strength} ({best_match_percentage}%) for the "
                    f"'{role_name}' position in the {dept_name} department. You successfully "
                    f"{skill_alignment} and your interests {interest_alignment}. "
                    f"Accordingly, this role is {recommendation}."
                )

        return RoleMatchResponse(
            match_percentage=best_match_percentage,
            recommended_role=best_role,
            matched_skills=best_matched_skills,
            missing_skills=best_missing_skills,
            rationale=best_rationale
        )
