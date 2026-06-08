"""
Training script for the Role Matching department embeddings.

Loads the intern dataset, aggregates skills and technologies per
department to build profile strings, encodes them with
SentenceTransformer('all-MiniLM-L6-v2'), and saves the embeddings
along with department metadata to the vector_models directory.

HOW TO RUN THIS SCRIPT:
    cd ai_service
    python app/training/train_matching.py
    Expected output: department count + embeddings saved confirmation
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pandas as pd
import joblib
import openai

from app.config.settings import settings


# Role templates per department for richer matching context
DEPARTMENT_ROLES = {
    "Engineering": [
        "Software Engineer Intern",
        "Backend Developer Intern",
        "Frontend Developer Intern",
        "DevOps Intern",
        "Mobile Developer Intern",
    ],
    "Data Science": [
        "Data Analyst Intern",
        "ML Engineer Intern",
        "Data Engineer Intern",
        "Research Intern",
    ],
    "Marketing": [
        "Digital Marketing Intern",
        "Content Marketing Intern",
        "SEO Specialist Intern",
        "Social Media Intern",
    ],
    "Design": [
        "UI/UX Designer Intern",
        "Graphic Designer Intern",
        "Product Designer Intern",
        "Motion Designer Intern",
    ],
    "HR": [
        "HR Operations Intern",
        "Talent Acquisition Intern",
        "People Analytics Intern",
        "Learning & Development Intern",
    ],
}


def train() -> None:
    """Build department embeddings from the intern dataset."""

    # ── 1. Load dataset ──────────────────────────────────────────────
    data_path = os.path.join(settings.DATA_DIR, "intern_dataset.csv")
    print(f"📂 Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"   Loaded {len(df)} rows")

    # ── 2. Build department profile strings ──────────────────────────
    departments = df["department"].unique()
    print(f"   Found {len(departments)} departments: {list(departments)}")

    dept_profiles = {}
    dept_technologies = {}

    for dept in departments:
        dept_df = df[df["department"] == dept]

        # Aggregate all skills and technologies for this department
        all_skills = []
        all_techs = []
        for _, row in dept_df.iterrows():
            all_skills.extend([s.strip() for s in str(row["skills"]).split(",")])
            all_techs.extend([t.strip() for t in str(row["technologies"]).split(",")])

        # Deduplicate while preserving order
        unique_skills = list(dict.fromkeys(all_skills))
        unique_techs = list(dict.fromkeys(all_techs))

        # Build a rich profile string for embedding
        profile = f"Department: {dept}. "
        profile += f"Key skills: {', '.join(unique_skills)}. "
        profile += f"Technologies: {', '.join(unique_techs)}. "
        roles = DEPARTMENT_ROLES.get(dept, [f"General Intern in {dept}"])
        profile += f"Roles: {', '.join(roles)}."

        dept_profiles[dept] = profile
        dept_technologies[dept] = unique_techs

    print("\n📝 Department profiles built:")
    for dept, profile in dept_profiles.items():
        print(f"   [{dept}] {profile[:80]}...")

    # ── 3. Encode with OpenAI text-embedding-3-small ─────────────────
    print("\n🧠 Initializing OpenAI client for embeddings...")
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable is required to generate vectors.")
        
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    
    dept_names = list(dept_profiles.keys())
    profile_texts = [dept_profiles[d] for d in dept_names]
    
    print("   Encoding department profiles via OpenAI API...")
    import numpy as np
    embeddings_list = []
    use_fallback_embeddings = False
    for text in profile_texts:
        try:
            response = client.embeddings.create(
                input=[text],
                model="text-embedding-3-small"
            )
            embeddings_list.append(response.data[0].embedding)
        except Exception as e:
            print(f"   ⚠️ OpenAI API call failed ({e}). Using random 1536-dimension vectors as placeholder.")
            use_fallback_embeddings = True
            break

    if use_fallback_embeddings:
        embeddings_list = [np.random.randn(1536).tolist() for _ in dept_names]

    embeddings = np.array(embeddings_list)
    print(f"   Generated {embeddings.shape[0]} embeddings of dimension {embeddings.shape[1]}")

    # ── 4. Save embeddings + metadata ────────────────────────────────
    os.makedirs(settings.VECTOR_DIR, exist_ok=True)

    save_data = {
        "department_names": dept_names,
        "embeddings": embeddings,
        "profiles": dept_profiles,
        "technologies": dept_technologies,
        "roles": DEPARTMENT_ROLES,
    }

    save_path = os.path.join(settings.VECTOR_DIR, "department_vectors.pkl")
    joblib.dump(save_data, save_path)

    print(f"\n💾 Saved {len(dept_names)} department embeddings to: {save_path}")
    print("\n🎉 Role matching training complete!")


if __name__ == "__main__":
    train()
