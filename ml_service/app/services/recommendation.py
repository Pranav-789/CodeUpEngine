from app.models.request import RecommendRequest as RecommendationRequest
from app.services.elo_service import process_submissions
from app.ml.vector_math import create_aspirational_vector
from app.ml.knn_model import knn_container
from app.db.mongoDB import get_database
import logging

logger = logging.getLogger(__name__)

async def extract_unsolved_problems(peer_ids: list[str], user_seen_problems: set[str]) -> list[str]:
    """Fetches peers' solved problems, filters out what the user knows, and ranks the best."""
    db = get_database()
    if not db:
        logger.error("Database not connected.")
        return []

    # Fetch the recent submissions of all 5 peers
    cursor = db.usermetrics.find({"userId": {"$in": peer_ids}}, {"recentSubmissions": 1})
    
    peer_problem_counts = {}
    
    async for peer in cursor:
        if "recentSubmissions" in peer:
            for sub in peer["recentSubmissions"]:
                prob_id = sub["problemId"]
                # Filter 1: Did the peer actually solve it?
                # Filter 2: Has our user already seen/attempted it?
                if sub.get("correctSubmissions", 0) > 0 and prob_id not in user_seen_problems:
                    # Tally how many peers solved this exact problem
                    peer_problem_counts[prob_id] = peer_problem_counts.get(prob_id, 0) + 1

    # Sort problems by how many peers solved them (Descending)
    sorted_problems = sorted(peer_problem_counts.keys(), key=lambda k: peer_problem_counts[k], reverse=True)
    
    # Return the top 10
    return sorted_problems[:10]


async def generate_recommendations(req: RecommendationRequest) -> dict:
    # 1. Update the actual vector based on the 75 recent submissions
    updated_vector = process_submissions(req.topic_elo_vector, req.recent_submissions)
    
    # 2. Mutate to find the aspirational target
    aspirational_vector = create_aspirational_vector(updated_vector)
    
    # 3. Query the KNN tree for 5 peers (Using the singleton container)
    peer_ids = knn_container.find_neighbors(aspirational_vector, k=5)
    
    # 4. Extract and filter the problems
    user_seen_set = {sub.problem_id for sub in req.recent_submissions}
    recommended_ids = await extract_unsolved_problems(peer_ids, user_seen_set)
    
    # Fallback mechanism: If peers didn't provide 5 unique problems, 
    # you would ideally query a generic pool of highly-rated problems here.
    
    return {
        "user_id": req.user_id,
        "updated_vector": updated_vector,
        "recommended_problem_ids": recommended_ids
    }