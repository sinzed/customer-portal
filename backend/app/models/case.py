from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class Case(BaseModel):
    case_id: str
    customer_id: str
    subject: str
    description: Optional[str] = None
    type: Optional[str] = None
    status: str
    created_date: datetime


class CaseCreateRequest(BaseModel):
    """
    Request model for creating a new case.
    
    - subject: Required. Brief description of the issue/request
    - description: Optional. Detailed description
    """
    subject: str = Field(..., min_length=1, description="Subject of the case (required)")
    description: Optional[str] = Field(None, description="Detailed description (optional)")
    
    @field_validator('subject')
    @classmethod
    def validate_subject(cls, v: str) -> str:
        """Validate that subject is not empty or only whitespace"""
        if not v or not v.strip():
            raise ValueError('Subject is required and cannot be empty')
        return v.strip()


class CaseListResponse(BaseModel):
    cases: list[Case]


class CaseCreateResponse(BaseModel):
    case_id: str
    message: str
    status: str
