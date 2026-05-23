"""
Shared utility functions used across all AI service modules.

Provides text preprocessing, similarity computation, keyword extraction,
and confidence score normalization so individual services stay focused
on their domain logic.
"""

import re
import string
import logging
from typing import List, Dict

import numpy as np

logger = logging.getLogger(__name__)


def clean_text(text: str) -> str:
    """Lowercase, strip punctuation, and collapse whitespace.

    Used as a preprocessing step before TF-IDF vectorization,
    keyword extraction, and intent classification.
    """
    text = text.lower().strip()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text)
    return text


def cosine_similarity_score(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Compute cosine similarity between two 1-D vectors.

    Returns a float in [-1.0, 1.0]. Returns 0.0 if either vector
    has zero magnitude to avoid division-by-zero.
    """
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))


def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """Extract the most frequent meaningful words from text using NLTK.

    Filters out English stopwords and single-character tokens, then
    returns the *top_n* most common words ordered by frequency.
    """
    try:
        from nltk.corpus import stopwords
        from nltk.tokenize import word_tokenize

        stop_words = set(stopwords.words("english"))
        tokens = word_tokenize(clean_text(text))
        filtered = [t for t in tokens if t not in stop_words and len(t) > 1]

        # Frequency distribution
        freq: Dict[str, int] = {}
        for token in filtered:
            freq[token] = freq.get(token, 0) + 1

        sorted_tokens = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, _ in sorted_tokens[:top_n]]

    except Exception as exc:
        logger.warning("Keyword extraction failed, returning empty list: %s", exc)
        return []


def normalize_confidence(score: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Clamp and normalize a confidence score to [min_val, max_val].

    Useful for ensuring model output probabilities stay within a
    presentable range before returning to the API consumer.
    """
    return round(max(min_val, min(max_val, score)), 4)
