from sklearn.neighbors import NearestNeighbors
import numpy as np
from typing import List
import logging

logger = logging.getLogger(__name__)

class KNNModelContainer:
    def __init__(self):
        self.model: NearestNeighbors = None
        self.user_ids: List[str] = []
        self.matrix: np.ndarray = None

    def fit(self, user_ids: List[str], vectors: List[List[float]]):
        """Builds a new KD-Tree index using the 38D vectors of all system users."""
        if not vectors or len(vectors) == 0:
            logger.warning("Attempted to fit KNN model with an empty dataset.")
            return

        self.user_ids = user_ids
        self.matrix = np.array(vectors, dtype=float)
        
        # Using brute force or kd_tree; cosine or metric='minkowski' (p=2 is standard Euclidean)
        self.model = NearestNeighbors(n_neighbors=5, algorithm='auto', metric='euclidean')
        self.model.fit(self.matrix)
        logger.info(f"KNN index rebuilt successfully with {len(user_ids)} users.")

    def find_neighbors(self, target_vector: List[float], k: int = 5) -> List[str]:
        """Queries the trained tree for the user IDs of the closest matching peers."""
        if self.model is None:
            logger.error("KNN model query attempted before tree index was built.")
            return []

        # Reshape vector to 2D array matching scikit-learn requirements
        query_arr = np.array(target_vector).reshape(1, -1)
        distances, indices = self.model.kneighbors(query_arr, n_neighbors=k)
        
        # Map the structural matrix indices back to actual string Mongo user IDs
        peer_ids = [self.user_ids[idx] for idx in indices[0]]
        return peer_ids

# Global singleton instance to be imported across endpoints
knn_container = KNNModelContainer()