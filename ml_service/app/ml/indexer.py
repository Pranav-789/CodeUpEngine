from app.db.mongoDB import get_database
from app.ml.knn_model import knn_container
import logging

logger = logging.getLogger(__name__)

async def rebuild_global_knn_index():
    """Fetches all user matrices from Mongo and hot-swaps the memory KNN tree."""
    db = get_database()
    if db is None:
        logger.error("Database unavailable; cannot build KNN index.")
        return False

    user_ids = []
    vectors = []

    try:
        # Pull only the fields we care about to minimize network overhead
        cursor = db.usermetrics.find({}, {"userId": 1, "topicEloVector": 1})
        
        async for doc in cursor:
            # Prevent malformed vectors from breaking scikit-learn
            if "topicEloVector" in doc and len(doc["topicEloVector"]) == 38:
                user_ids.append(str(doc["userId"]))
                vectors.append(doc["topicEloVector"])

        # Re-fit the global singleton index
        knn_container.fit(user_ids, vectors)
        return True

    except Exception as e:
        logger.error(f"Error during KNN matrix indexing: {e}")
        return False