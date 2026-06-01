import numpy as np
from typing import List

def create_aspirational_vector(actual_vector: List[float]) -> List[float]:
    vector = np.array(actual_vector)
    
    aspirational = vector + 100 
    
    return aspirational.tolist()