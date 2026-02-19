"""
User database model
"""
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # Hashed password
    role = Column(String(50), nullable=False, default="user")  # e.g., "user", "admin", "customer"
    token = Column(Text, nullable=True)  # JWT token or refresh token
    reset_password_token = Column(String(255), nullable=True)  # Token for password reset
    reset_password_expires = Column(DateTime, nullable=True)  # Expiration for reset token
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User(user_id={self.user_id}, email={self.email}, role={self.role})>"
