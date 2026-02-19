"""
Customer Portal Backend API

A minimal FastAPI backend that serves as a facade between the frontend
and Salesforce. In production, this would handle authentication, rate limiting,
and complex Salesforce API interactions.
"""

# Load environment variables from .env file FIRST, before any other imports
from dotenv import load_dotenv
import os

# Load .env file from the backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import documents, cases, auth
from app.database import engine, Base

app = FastAPI(
    title="Customer Portal API",
    description="Backend API for Octopus Energy Customer Portal",
    version="1.0.0"
)

# CORS configuration for frontend access
# In production, restrict origins to specific domains
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,https://panel.powerme.space"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(cases.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Customer Portal API",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
