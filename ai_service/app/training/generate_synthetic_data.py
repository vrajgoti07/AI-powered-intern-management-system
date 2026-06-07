import os
import numpy as np
import pandas as pd

def generate_data(num_records=1000):
    np.random.seed(42)
    
    records = []
    
    # Generate 350 at-risk records (Class 0)
    for _ in range(350):
        attendance = np.random.uniform(0.40, 0.59)
        completion = np.random.uniform(0.30, 0.49)
        rating = np.random.uniform(1.0, 3.5)
        days = np.random.randint(4, 15)
        communication = np.random.uniform(1.0, 3.5)
        skill_match = np.random.uniform(0.0, 0.5)
        week = np.random.randint(1, 13)
        records.append({
            "attendance_rate": attendance,
            "task_completion_rate": completion,
            "avg_task_rating": rating,
            "days_since_last_task": days,
            "communication_score": communication,
            "skill_match_score": skill_match,
            "week_number": week
        })
        
    # Generate 300 high-performer records (Class 2)
    for _ in range(300):
        attendance = np.random.uniform(0.86, 1.0)
        completion = np.random.uniform(0.85, 1.0)
        rating = np.random.uniform(4.1, 5.0)
        days = np.random.randint(0, 3)
        communication = np.random.uniform(4.0, 5.0)
        skill_match = np.random.uniform(0.7, 1.0)
        week = np.random.randint(1, 13)
        records.append({
            "attendance_rate": attendance,
            "task_completion_rate": completion,
            "avg_task_rating": rating,
            "days_since_last_task": days,
            "communication_score": communication,
            "skill_match_score": skill_match,
            "week_number": week
        })
        
    # Generate 350 average records (Class 1)
    for _ in range(350):
        attendance = np.random.uniform(0.65, 0.84)
        completion = np.random.uniform(0.55, 0.84)
        rating = np.random.uniform(3.0, 4.0)
        days = np.random.randint(1, 5)
        communication = np.random.uniform(3.0, 4.0)
        skill_match = np.random.uniform(0.4, 0.79)
        week = np.random.randint(1, 13)
        records.append({
            "attendance_rate": attendance,
            "task_completion_rate": completion,
            "avg_task_rating": rating,
            "days_since_last_task": days,
            "communication_score": communication,
            "skill_match_score": skill_match,
            "week_number": week
        })
        
    df = pd.DataFrame(records)
    
    # Shuffle the dataset
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Apply ground-truth labels using the business logic rules
    def get_label(row):
        if row["attendance_rate"] < 0.60 and row["task_completion_rate"] < 0.50:
            return 0  # at-risk
        elif row["attendance_rate"] > 0.85 and row["avg_task_rating"] > 4.0:
            return 2  # high-performer
        else:
            return 1  # average
            
    df["performance_label"] = df.apply(get_label, axis=1)
    
    # Print label distribution
    print("Label distributions:")
    print(df["performance_label"].value_counts())
    
    return df

if __name__ == "__main__":
    df = generate_data()
    # Save to data directory
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    csv_path = os.path.join(data_dir, "synthetic_intern_data.csv")
    df.to_csv(csv_path, index=False)
    print(f"Saved synthetic dataset of {len(df)} rows to {csv_path}")
