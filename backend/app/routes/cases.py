from fastapi import APIRouter, HTTPException, status
from app.models.case import CaseListResponse, CaseCreateRequest, CaseCreateResponse
from app.services.salesforce_service import SalesforceService

router = APIRouter(prefix="/customer", tags=["cases"])
salesforce_service = SalesforceService()


@router.get("/{customer_id}/cases", response_model=CaseListResponse)
async def get_customer_cases(customer_id: str):
    """
    Retrieve all cases/tickets for a customer.
    
    Returns cases from Salesforce (mocked for MVP).
    """
    try:
        cases = salesforce_service.get_customer_cases(customer_id)
        return CaseListResponse(cases=cases)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving cases: {str(e)}")


@router.post("/{customer_id}/cases", response_model=CaseCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_customer_case(customer_id: str, case_request: CaseCreateRequest):
    """
    Create a new case/ticket for a customer.
    
    Validates input and creates case in Salesforce (mocked for MVP).
    
    - **subject**: Required. Brief description of the issue/request
    - **description**: Optional. Detailed description
    """
    # Validation is handled by Pydantic model
    # Additional business logic validation could go here
    
    if not case_request.subject or not case_request.subject.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject is required and cannot be empty"
        )
    
    try:
        created_case = salesforce_service.create_case(customer_id, case_request)
        
        return CaseCreateResponse(
            case_id=created_case.case_id,
            message="Case created successfully",
            status=created_case.status
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating case: {str(e)}"
        )
