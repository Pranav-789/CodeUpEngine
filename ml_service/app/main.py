from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

import app.core.logger  # Ensure logger config is initialized early
from app.db.mongoDB import connect_to_mongo, close_mongo_connection
from app.api.routes import router as api_router

import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Mongo
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGO_DB_NAME", "CodeUpEngine")
    await connect_to_mongo(mongo_uri, db_name)
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