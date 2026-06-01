# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_instance = MongoDB()

async def connect_to_mongo(mongo_uri: str, db_name: str):
    """Initializes the MongoDB connection pool."""
    try:
        db_instance.client = AsyncIOMotorClient(mongo_uri)
        db_instance.db = db_instance.client[db_name]
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Closes the MongoDB connection pool cleanly during server shutdown."""
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    """Dependency helper to get the active database instance."""
    return db_instance.db