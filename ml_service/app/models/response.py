from pydantic import BaseModel
from typing import List

class RecommendedProblem(BaseModel):
    problem_id: str
    target_topic: str

class RecommendationResponse(BaseModel):
    user_id: str
    updated_vector: List[float]
    recommendations: List[RecommendedProblem]