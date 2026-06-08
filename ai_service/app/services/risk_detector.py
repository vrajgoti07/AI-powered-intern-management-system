from typing import List, Dict, Any

class RiskDetectorService:
    @staticmethod
    def detect_risks(interns_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detects risks for a list of interns based on heuristics.
        """
        risks = []
        
        for intern in interns_data:
            intern_risks = []
            risk_level = "low"
            urgency = "monitor"
            recommended_action = "Continue regular check-ins."
            
            # Extract metrics
            attendance = intern.get("attendance", 100) # percentage
            days_since_last_task = intern.get("days_since_last_task", 0)
            overdue_high_priority_tasks = intern.get("overdue_high_priority_tasks", 0)
            workload_score = intern.get("workload_score", 0) # 0-100
            days_since_mentor_interaction = intern.get("days_since_mentor_interaction", 0)
            
            # 1. Attendance risk
            if attendance < 70:
                intern_risks.append("Attendance Risk")
                
            # 2. Disengagement
            if days_since_last_task >= 3:
                intern_risks.append("Disengagement")
                
            # 3. Burnout risk
            if overdue_high_priority_tasks >= 5 and workload_score > 80:
                intern_risks.append("Burnout Risk")
                
            # 4. Dropout risk
            is_dropout_risk = (
                attendance < 70 and 
                days_since_last_task >= 3 and 
                days_since_mentor_interaction >= 7
            )
            if is_dropout_risk:
                intern_risks.append("Dropout Risk")
                
            if "Dropout Risk" in intern_risks:
                risk_level = "high"
                urgency = "immediate"
                recommended_action = "Schedule an immediate 1-on-1 meeting to address attendance and engagement."
            elif "Burnout Risk" in intern_risks:
                risk_level = "high"
                urgency = "immediate"
                recommended_action = "Review task load, reassign tasks if necessary, and check on well-being."
            elif len(intern_risks) > 1:
                risk_level = "medium"
                urgency = "this-week"
                recommended_action = "Reach out to the intern to discuss current roadblocks and re-engage."
            elif len(intern_risks) == 1:
                risk_level = "medium"
                urgency = "monitor"
                recommended_action = "Monitor closely and address in the next weekly sync."
                
            if intern_risks:
                risks.append({
                    "internId": intern.get("internId"),
                    "name": intern.get("name"),
                    "riskLevel": risk_level,
                    "riskType": intern_risks,
                    "recommendedAction": recommended_action,
                    "urgency": urgency
                })
                
        # Sort risks: high first, then medium, then low
        risk_priority = {"high": 1, "medium": 2, "low": 3}
        risks.sort(key=lambda x: risk_priority.get(x["riskLevel"], 3))
        
        return risks

import os
import threading

_scheduler = None
_scheduler_lock = threading.Lock()

def run_daily_risk_detection():
    """
    Function to be called by APScheduler.
    In a real app, this would fetch interns from DB, detect risks,
    and save them back to DB or send notifications.
    """
    print("Running scheduled daily risk detection at 8 PM...")
    # Fetch from db
    # risks = RiskDetectorService.detect_risks(interns_data)
    # Save to db
    print("Risk detection completed.")

def init_scheduler():
    global _scheduler
    enable_scheduler = os.getenv("ENABLE_SCHEDULER", "false").lower() == "true"
    if not enable_scheduler:
        return
    if _scheduler is not None:
        return
    with _scheduler_lock:
        if _scheduler is not None:
            return
        try:
            from apscheduler.schedulers.background import BackgroundScheduler
            _scheduler = BackgroundScheduler()
            _scheduler.add_job(run_daily_risk_detection, 'cron', hour=20, minute=0)
            _scheduler.start()
            print("[INFO] APScheduler started for daily risk detection at 8 PM.")
        except Exception as e:
            print(f"[ERROR] Failed to start APScheduler: {e}")

def shutdown_scheduler():
    global _scheduler
    if _scheduler is not None:
        with _scheduler_lock:
            if _scheduler is not None:
                try:
                    _scheduler.shutdown()
                    print("[INFO] APScheduler shut down successfully.")
                except Exception:
                    pass
                _scheduler = None
