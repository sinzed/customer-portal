"""
Customer Portal Backend API

A minimal FastAPI backend that serves as a facade between the frontend
and Salesforce. In production, this would handle authentication, rate limiting,
and complex Salesforce API interactions.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import documents, cases

app = FastAPI(
    title="Customer Portal API",
    description="Backend API for Octopus Energy Customer Portal",
    version="1.0.0"
)

# CORS configuration for frontend access
# In production, restrict origins to specific domains
import os

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
