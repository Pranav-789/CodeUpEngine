from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SubmissionState(BaseModel):
    problem_id: str
    problem_rating: int
    tags: List[str]
    correctSubmissions: int
    wrongSubmissions: int

class RecommendRequest(BaseModel):
    user_id: str
    topic_elo_vector: List[float] = Field(..., min_length=38, max_length=38)
    recent_submissions: List[SubmissionState]
    user_rating: Optional[int] = None