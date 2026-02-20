"""
Tests for documents routes
"""
import pytest
from httpx import AsyncClient
from pathlib import Path
import json


@pytest.fixture
def mock_data_dir(tmp_path):
    """Create a temporary directory for mock data"""
    mock_dir = tmp_path / "mocks" / "salesforce"
    mock_dir.mkdir(parents=True, exist_ok=True)
    return mock_dir


@pytest.fixture(autouse=True)
def patch_salesforce_service(mock_data_dir, monkeypatch):
    """Automatically patch SalesforceService and DOCUMENTS_DIR to use temp directory"""
    from app.services.salesforce_service import SalesforceService
    service = SalesforceService(mock_data_dir=str(mock_data_dir))
    monkeypatch.setattr('app.routes.documents.salesforce_service', service)
    monkeypatch.setattr('app.routes.documents.DOCUMENTS_DIR', mock_data_dir)


@pytest.fixture
def mock_documents_file(mock_data_dir, test_user):
    """Create a mock documents file"""
    documents_file = mock_data_dir / f"documents-{test_user.user_id}.json"
    documents_data = {
        "documents": [
            {
                "document_id": "0691234567890123",
                "customer_id": str(test_user.user_id),
                "name": "test-document.pdf",
                "type": "PDF",
                "download_url": f"/customer/documents/0691234567890123/download",
                "created_date": "2024-01-01T10:00:00"
            }
        ]
    }
    with open(documents_file, 'w') as f:
        json.dump(documents_data, f)
    return documents_file


@pytest.mark.asyncio
async def test_get_documents_success(client: AsyncClient, auth_headers, test_user, mock_documents_file):
    """Test getting documents for authenticated user"""
    response = await client.get(
        f"/customer/{test_user.user_id}/documents",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert len(data["documents"]) > 0
    assert data["documents"][0]["name"] == "test-document.pdf"


@pytest.mark.asyncio
async def test_get_documents_empty(client: AsyncClient, auth_headers, test_user, mock_data_dir):
    """Test getting documents when none exist"""
    response = await client.get(
        f"/customer/{test_user.user_id}/documents",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert len(data["documents"]) == 0


@pytest.mark.asyncio
async def test_get_documents_unauthorized(client: AsyncClient, test_user):
    """Test getting documents without authentication"""
    response = await client.get(f"/customer/{test_user.user_id}/documents")
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_documents_wrong_user(client: AsyncClient, auth_headers, test_user):
    """Test getting documents for different user (should fail)"""
    response = await client.get(
        "/customer/00000000-0000-0000-0000-000000000000/documents",
        headers=auth_headers
    )
    
    assert response.status_code == 403
    assert "only access your own" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_document_success(client: AsyncClient, auth_headers, test_user, mock_data_dir):
    """Test uploading a document"""
    # Create a test file
    test_file_content = b"Test PDF content"
    
    response = await client.post(
        f"/customer/{test_user.user_id}/documents",
        headers=auth_headers,
        files={"file": ("test.pdf", test_file_content, "application/pdf")},
        data={"document_type": "PDF"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "document_id" in data
    assert "name" in data
    assert data["name"] == "test.pdf"


@pytest.mark.asyncio
async def test_upload_document_empty_file(client: AsyncClient, auth_headers, test_user):
    """Test uploading an empty file"""
    response = await client.post(
        f"/customer/{test_user.user_id}/documents",
        headers=auth_headers,
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_document_wrong_user(client: AsyncClient, auth_headers, test_user):
    """Test uploading document for different user (should fail)"""
    test_file_content = b"Test PDF content"
    
    response = await client.post(
        "/customer/00000000-0000-0000-0000-000000000000/documents",
        headers=auth_headers,
        files={"file": ("test.pdf", test_file_content, "application/pdf")}
    )
    
    assert response.status_code == 403
    assert "only upload documents to your own account" in response.json()["detail"].lower()
