from fastapi import APIRouter, HTTPException
from app.models.request import RecommendRequest as RecommendationRequest
from app.models.response import RecommendationResponse
from app.services.recommendation import generate_recommendations
from app.ml.indexer import rebuild_global_knn_index

router = APIRouter()

@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_endpoint(request: RecommendationRequest):
    try:
        result = await generate_recommendations(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/build-index")
async def build_index_endpoint():
    """
    Triggered globally (e.g., Monday 12:00 AM) to pull all user vectors from Mongo
    and rebuild the KNN KD-Tree in server memory.
    """
    success = await rebuild_global_knn_index()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to rebuild KNN index. Check server logs.")
    
    return {"message": "KNN Index rebuilt successfully."}