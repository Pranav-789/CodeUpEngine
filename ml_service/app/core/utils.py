import os
import sys
import dill

from app.core.exception import CustomException

def save_object(file_path: str, obj):
    """Save the object to the file"""
    try:
        dir_name = os.path.dirname(file_path)
        os.makedirs(dir_name, exist_ok=True)
        
        with open(file_path, "wb") as f:
            dill.dump(obj, f)

    except Exception as e:
        raise CustomException(e, sys)


def load_object(file_path: str):
    """Load the object from the file"""
    try:
        with open(file_path, "rb") as f:
            return dill.load(f)
    except Exception as e:
        raise CustomException(e, sys)   