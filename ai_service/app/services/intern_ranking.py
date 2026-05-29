from typing import List, Dict, Any

class InternRankingService:
    @staticmethod
    def calculate_ranking(interns_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculates and ranks interns based on the scoring formula:
        - Attendance weight: 30%
        - Task completion weight: 25%
        - Task quality (avg rating) weight: 20%
        - Communication score: 15%
        - Skill growth: 10%
        """
        ranked_interns = []
        
        for intern in interns_data:
            # Assuming input metrics are unnormalized or partially normalized
            # Normalize them to 0-100 before weighting
            
            # Attendance (assume input is 0-1 or 0-100)
            attendance_raw = intern.get('attendance', 0)
            attendance_score = attendance_raw * 100 if attendance_raw <= 1 else attendance_raw
            
            # Task completion (assume input is 0-1 or 0-100)
            tasks_raw = intern.get('task_completion', 0)
            tasks_score = tasks_raw * 100 if tasks_raw <= 1 else tasks_raw
            
            # Task quality (assume input is 1-5 rating)
            quality_raw = intern.get('task_quality', 0)
            quality_score = (quality_raw / 5.0) * 100 if quality_raw <= 5 else quality_raw
            
            # Communication (assume input is 1-5 rating)
            comm_raw = intern.get('communication', 0)
            comm_score = (comm_raw / 5.0) * 100 if comm_raw <= 5 else comm_raw
            
            # Skill growth (assume count of new skills, maxing out around 5)
            growth_raw = intern.get('skill_growth', 0)
            growth_score = min(100, (growth_raw / 5.0) * 100)
            
            # Apply weights
            total_score = (
                (attendance_score * 0.30) +
                (tasks_score * 0.25) +
                (quality_score * 0.20) +
                (comm_score * 0.15) +
                (growth_score * 0.10)
            )
            
            ranked_interns.append({
                "internId": intern.get("internId"),
                "name": intern.get("name"),
                "totalScore": round(total_score, 2),
                "breakdown": {
                    "attendance": round(attendance_score, 1),
                    "tasks": round(tasks_score, 1),
                    "quality": round(quality_score, 1),
                    "communication": round(comm_score, 1),
                    "growth": round(growth_score, 1)
                },
                "change": intern.get("previous_change", 0) # e.g. +2, -1, 0
            })
            
        # Sort by totalScore descending
        ranked_interns.sort(key=lambda x: x["totalScore"], reverse=True)
        
        # Assign ranks
        for i, intern in enumerate(ranked_interns):
            intern["rank"] = i + 1
            
        return ranked_interns
