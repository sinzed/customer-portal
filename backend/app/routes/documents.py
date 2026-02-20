from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from pathlib import Path
from app.models.document import DocumentListResponse, Document
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.salesforce_service import SalesforceService

router = APIRouter(prefix="/customer", tags=["documents"])
salesforce_service = SalesforceService()

# Path to documents directory in mocks/salesforce
DOCUMENTS_DIR = Path(__file__).parent.parent.parent / "mocks" / "salesforce"
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)


# IMPORTANT: More specific routes must be defined BEFORE more general ones
# This route must come before /{customer_id}/documents to avoid route conflicts
@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Download a document by document ID.
    
    Requires authentication. Users can only download their own documents.
    """
    try:
        # Get customer documents to verify ownership
        documents = salesforce_service.get_customer_documents(str(current_user.user_id))
        
        # Find the document
        document = next((doc for doc in documents if doc.document_id == document_id), None)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Verify user owns this document
        if document.customer_id != str(current_user.user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only download your own documents"
            )
        
        # Construct PDF filename from document_id
        pdf_filename = f"{document_id}.pdf"
        pdf_path = DOCUMENTS_DIR / pdf_filename
        
        if not pdf_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )
        
        # Return the PDF file
        return FileResponse(
            path=str(pdf_path),
            filename=document.name,
            media_type="application/pdf"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading document: {str(e)}"
        )


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


@router.post("/{customer_id}/documents", response_model=Document, status_code=status.HTTP_201_CREATED)
async def upload_document(
    customer_id: str,
    file: UploadFile = File(...),
    document_type: str = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document for a customer and sync it to Salesforce.
    
    Requires authentication. Users can only upload documents for their own account.
    The document will be synced to Salesforce via the SalesforceService.
    """
    # Ensure user can only upload to their own account
    if str(current_user.user_id) != customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload documents to your own account"
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required"
        )
    
    # Read file content
    try:
        file_content = await file.read()
        
        # Validate file size (e.g., max 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024 * 1024)}MB"
            )
        
        if len(file_content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
        
        # Use provided document type or default
        doc_type = document_type if document_type else "Document"
        
        # Upload to Salesforce via service
        document = salesforce_service.upload_document(
            customer_id=customer_id,
            file_content=file_content,
            filename=file.filename,
            document_type=doc_type
        )
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )
