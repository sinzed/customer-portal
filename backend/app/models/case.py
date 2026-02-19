from pydantic import BaseModel
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
    subject: str
    description: Optional[str] = None


class CaseListResponse(BaseModel):
    cases: list[Case]


class CaseCreateResponse(BaseModel):
    case_id: str
    message: str
    status: str
