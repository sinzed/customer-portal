from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Document(BaseModel):
    document_id: str
    customer_id: str
    name: str
    type: str
    download_url: str
    created_date: Optional[datetime] = None


class DocumentListResponse(BaseModel):
    documents: list[Document]
