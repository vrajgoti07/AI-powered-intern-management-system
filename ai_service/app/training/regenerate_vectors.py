"""
Utility script to regenerate department vectors using OpenAI text-embedding-3-small embeddings.

HOW TO RUN THIS SCRIPT:
    cd ai_service
    python app/training/regenerate_vectors.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pandas as pd
import joblib
import numpy as np
from openai import OpenAI

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
    """Build department embeddings from the intern dataset using OpenAI."""
    # ── 1. Load dataset ──────────────────────────────────────────────
    data_path = os.path.join(settings.DATA_DIR, "intern_dataset.csv")
    print(f"[DATA] Loading dataset from: {data_path}")
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

    print("\n[PROFILES] Department profiles built:")
    for dept, profile in dept_profiles.items():
        print(f"   [{dept}] {profile[:80]}...")

    # ── 3. Encode with OpenAI ───────────────────────────
    print("\n[OPENAI] Initializing OpenAI Client...")
    if not settings.OPENAI_API_KEY:
        print("[ERROR] OPENAI_API_KEY is not set in environment or settings.")
        sys.exit(1)

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    dept_names = list(dept_profiles.keys())
    profile_texts = [dept_profiles[d] for d in dept_names]

    print("   Encoding department profiles via OpenAI text-embedding-3-small...")
    try:
        response = client.embeddings.create(
            input=profile_texts,
            model="text-embedding-3-small"
        )
        embeddings_list = [r.embedding for r in response.data]
        embeddings = np.array(embeddings_list)
        print(f"   Generated {embeddings.shape[0]} embeddings of dimension {embeddings.shape[1]}")
    except Exception as e:
        print(f"[ERROR] Error during OpenAI embedding generation: {e}")
        sys.exit(1)

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

    print(f"\n[SAVE] Saved {len(dept_names)} department embeddings to: {save_path}")
    print("\n[SUCCESS] OpenAI Role matching vector regeneration complete!")


if __name__ == "__main__":
    train()
