from pydantic import BaseModel
from typing import List

class RecommendationResponse(BaseModel):
    user_id: str
    updated_vector: List[float]
    recommended_problem_ids: List[str]