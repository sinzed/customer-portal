from fastapi import APIRouter, HTTPException
from app.models.document import DocumentListResponse
from app.services.salesforce_service import SalesforceService

router = APIRouter(prefix="/customer", tags=["documents"])
salesforce_service = SalesforceService()


@router.get("/{customer_id}/documents", response_model=DocumentListResponse)
async def get_customer_documents(customer_id: str):
    """
    Retrieve all documents for a customer.
    
    Returns documents from Salesforce (mocked for MVP).
    """
    try:
        documents = salesforce_service.get_customer_documents(customer_id)
        return DocumentListResponse(documents=documents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")
