from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

import app.core.logger  # Ensure logger config is initialized early
from app.db.mongoDB import connect_to_mongo, close_mongo_connection
from app.api.routes import router as api_router

from app.ml.indexer import rebuild_global_knn_index
import os
import asyncio
import urllib.request

async def keep_alive():
    url = os.environ.get("RENDER_EXTERNAL_URL", "https://codeupengine-ml-service.onrender.com")
    while True:
        await asyncio.sleep(5 * 60) # 5 minutes
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            def _ping():
                with urllib.request.urlopen(req) as response:
                    return response.getcode()
            status_code = await asyncio.to_thread(_ping)
            print(f"[Keep-Alive] Pinged ML service successfully. Status: {status_code}")
        except Exception as e:
            print(f"[Keep-Alive] Ping failed. Error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Mongo
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGO_DB_NAME", "CodeUpEngine")
    await connect_to_mongo(mongo_uri, db_name)
    
    # Pre-build KNN index so recommendations don't fail immediately
    await rebuild_global_knn_index()
    
    # Start keep-alive background task
    asyncio.create_task(keep_alive())
    
    yield
    # Shutdown: Clean up connections
    await close_mongo_connection()

load_dotenv()

app = FastAPI(
    title="ML service for problem recommendation",
    description="ML service for problem recommendation",
    version="0.0.1",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "Welcome to the ML service for problem recommendation"}