import numpy as np
from typing import List
from app.models.request import SubmissionState

TAG_INDEX_MAP = {
    "*special": 0,
    "2-sat": 1,
    "binary search": 2,
    "bitmasks": 3,
    "brute force": 4,
    "chinese remainder theorem": 5,
    "combinatorics": 6,
    "communication": 7,
    "constructive algorithms": 8,
    "data structures": 9,
    "dfs and similar": 10,
    "divide and conquer": 11,
    "dp": 12,
    "dsu": 13,
    "expression parsing": 14,
    "fft": 15,
    "flows": 16,
    "games": 17,
    "geometry": 18,
    "graph matchings": 19,
    "graphs": 20,
    "greedy": 21,
    "hashing": 22,
    "implementation": 23,
    "interactive": 24,
    "math": 25,
    "matrices": 26,
    "meet-in-the-middle": 27,
    "number theory": 28,
    "probabilities": 29,
    "schedules": 30,
    "shortest paths": 31,
    "sortings": 32,
    "string suffix structures": 33,
    "strings": 34,
    "ternary search": 35,
    "trees": 36,
    "two pointers": 37
}

def calculate_expected_score(user_rating: float, problem_rating: float) -> float:
    return 1 / (1 + 10 ** ((problem_rating - user_rating) / 400))

def process_submissions(current_vector: List[float], submissions: List[SubmissionState]) -> List[float]:
    vector = np.array(current_vector, dtype=float)
    K_FACTOR = 32

    for sub in submissions:
        # Determine actual score (1 for win, 0 for loss)
        if sub.correctSubmissions > 0:
            actual_score = 1.0
        elif sub.wrongSubmissions > 0:
            actual_score = 0.0
        else:
            continue # Skip if no attempts

        for tag in sub.tags:
            tag_idx = TAG_INDEX_MAP.get(tag.lower())
            if tag_idx is not None:
                user_elo = vector[tag_idx]
                expected_score = calculate_expected_score(user_elo, sub.problem_rating)
                
                # Apply Elo formula
                vector[tag_idx] = user_elo + K_FACTOR * (actual_score - expected_score)

    return vector.tolist()