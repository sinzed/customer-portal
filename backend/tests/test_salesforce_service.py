"""
Tests for SalesforceService
"""
import pytest
from pathlib import Path
import json
import tempfile
import shutil
from datetime import datetime

from app.services.salesforce_service import SalesforceService
from app.models.case import CaseCreateRequest


@pytest.fixture
def temp_mock_dir(tmp_path):
    """Create a temporary directory for mock data"""
    mock_dir = tmp_path / "mocks" / "salesforce"
    mock_dir.mkdir(parents=True, exist_ok=True)
    return mock_dir


@pytest.fixture
def salesforce_service(temp_mock_dir):
    """Create a SalesforceService instance with temp directory"""
    return SalesforceService(mock_data_dir=str(temp_mock_dir))


def test_get_customer_documents_empty(salesforce_service, temp_mock_dir):
    """Test getting documents when none exist"""
    customer_id = "123"
    documents = salesforce_service.get_customer_documents(customer_id)
    
    assert documents == []


def test_get_customer_documents_success(salesforce_service, temp_mock_dir):
    """Test getting documents successfully"""
    customer_id = "123"
    mock_file = temp_mock_dir / f"documents-{customer_id}.json"
    
    documents_data = {
        "documents": [
            {
                "document_id": "0691234567890123",
                "customer_id": customer_id,
                "name": "test.pdf",
                "type": "PDF",
                "download_url": "/customer/documents/0691234567890123/download",
                "created_date": "2024-01-01T10:00:00"
            }
        ]
    }
    
    with open(mock_file, 'w') as f:
        json.dump(documents_data, f)
    
    documents = salesforce_service.get_customer_documents(customer_id)
    
    assert len(documents) == 1
    assert documents[0].document_id == "0691234567890123"
    assert documents[0].name == "test.pdf"
    assert documents[0].type == "PDF"


def test_get_customer_cases_empty(salesforce_service, temp_mock_dir):
    """Test getting cases when none exist"""
    customer_id = "123"
    cases = salesforce_service.get_customer_cases(customer_id)
    
    assert cases == []


def test_get_customer_cases_success(salesforce_service, temp_mock_dir):
    """Test getting cases successfully"""
    customer_id = "123"
    mock_file = temp_mock_dir / f"cases-{customer_id}.json"
    
    cases_data = {
        "cases": [
            {
                "case_id": "5001234567890123",
                "customer_id": customer_id,
                "subject": "Test Case",
                "description": "Test description",
                "type": "Support",
                "status": "New",
                "created_date": "2024-01-01T10:00:00"
            }
        ]
    }
    
    with open(mock_file, 'w') as f:
        json.dump(cases_data, f)
    
    cases = salesforce_service.get_customer_cases(customer_id)
    
    assert len(cases) == 1
    assert cases[0].case_id == "5001234567890123"
    assert cases[0].subject == "Test Case"
    assert cases[0].status == "New"


def test_create_case_success(salesforce_service, temp_mock_dir):
    """Test creating a case successfully"""
    customer_id = "123"
    case_request = CaseCreateRequest(
        subject="New Test Case",
        description="Test description"
    )
    
    created_case = salesforce_service.create_case(customer_id, case_request)
    
    assert created_case.case_id is not None
    assert created_case.subject == "New Test Case"
    assert created_case.description == "Test description"
    assert created_case.customer_id == customer_id
    
    # Verify files were created
    new_case_file = temp_mock_dir / "new-case.json"
    assert new_case_file.exists()
    
    incoming_file = temp_mock_dir / f"incoming-cases-{customer_id}.json"
    assert incoming_file.exists()
    
    cases_file = temp_mock_dir / f"cases-{customer_id}.json"
    assert cases_file.exists()
    
    # Verify case was added to cases file
    with open(cases_file, 'r') as f:
        data = json.load(f)
        assert len(data["cases"]) == 1
        assert data["cases"][0]["subject"] == "New Test Case"


def test_upload_document_success(salesforce_service, temp_mock_dir):
    """Test uploading a document successfully"""
    customer_id = "123"
    file_content = b"Test PDF content"
    filename = "test.pdf"
    document_type = "PDF"
    
    document = salesforce_service.upload_document(
        customer_id=customer_id,
        file_content=file_content,
        filename=filename,
        document_type=document_type
    )
    
    assert document.document_id is not None
    assert document.name == filename
    assert document.type == document_type
    assert document.customer_id == customer_id
    
    # Verify file was saved
    pdf_file = temp_mock_dir / f"{document.document_id}.pdf"
    assert pdf_file.exists()
    
    # Verify document was added to documents file
    documents_file = temp_mock_dir / f"documents-{customer_id}.json"
    assert documents_file.exists()
    
    with open(documents_file, 'r') as f:
        data = json.load(f)
        assert len(data["documents"]) == 1
        assert data["documents"][0]["name"] == filename
