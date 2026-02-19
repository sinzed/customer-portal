from fastapi import APIRouter, HTTPException, Depends, status
from app.models.document import DocumentListResponse
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.salesforce_service import SalesforceService

router = APIRouter(prefix="/customer", tags=["documents"])
salesforce_service = SalesforceService()


@router.get("/{customer_id}/documents", response_model=DocumentListResponse)
async def get_customer_documents(
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all documents for a customer.
    
    Returns documents from Salesforce (mocked for MVP).
    Requires authentication. Users can only access their own documents.
    """
    # Ensure user can only access their own data
    if str(current_user.user_id) != customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own documents"
        )
    
    try:
        documents = salesforce_service.get_customer_documents(customer_id)
        return DocumentListResponse(documents=documents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")
