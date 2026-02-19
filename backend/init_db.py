"""
Database initialization script.
Run this script to create all database tables.
"""
import asyncio
from app.database import engine, Base
from app.models.user import User  # Import all models to register them


async def init_db():
    """Create all database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
