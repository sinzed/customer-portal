"""
Tests for cases routes
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
    """Automatically patch SalesforceService to use temp directory"""
    from app.services.salesforce_service import SalesforceService
    service = SalesforceService(mock_data_dir=str(mock_data_dir))
    monkeypatch.setattr('app.routes.cases.salesforce_service', service)


@pytest.fixture
def mock_cases_file(mock_data_dir, test_user):
    """Create a mock cases file"""
    cases_file = mock_data_dir / f"cases-{test_user.user_id}.json"
    cases_data = {
        "cases": [
            {
                "case_id": "5001234567890123",
                "customer_id": str(test_user.user_id),
                "subject": "Test Case 1",
                "description": "Test description",
                "type": "Support",
                "status": "New",
                "created_date": "2024-01-01T10:00:00"
            }
        ]
    }
    with open(cases_file, 'w') as f:
        json.dump(cases_data, f)
    return cases_file


@pytest.mark.asyncio
async def test_get_cases_success(client: AsyncClient, auth_headers, test_user, mock_cases_file):
    """Test getting cases for authenticated user"""
    response = await client.get(
        f"/customer/{test_user.user_id}/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "cases" in data
    assert len(data["cases"]) > 0
    assert data["cases"][0]["subject"] == "Test Case 1"


@pytest.mark.asyncio
async def test_get_cases_empty(client: AsyncClient, auth_headers, test_user, mock_data_dir):
    """Test getting cases when none exist"""
    response = await client.get(
        f"/customer/{test_user.user_id}/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "cases" in data
    assert len(data["cases"]) == 0


@pytest.mark.asyncio
async def test_get_cases_unauthorized(client: AsyncClient, test_user):
    """Test getting cases without authentication"""
    response = await client.get(f"/customer/{test_user.user_id}/cases")
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_cases_wrong_user(client: AsyncClient, auth_headers, test_user):
    """Test getting cases for different user (should fail)"""
    response = await client.get(
        "/customer/00000000-0000-0000-0000-000000000000/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 403
    assert "only access your own" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_case_success(client: AsyncClient, auth_headers, test_user, mock_data_dir):
    """Test creating a new case"""
    response = await client.post(
        f"/customer/{test_user.user_id}/cases",
        headers=auth_headers,
        json={
            "subject": "New Test Case",
            "description": "Test description"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "case_id" in data
    assert "message" in data
    assert "status" in data
    assert data["message"] == "Case created successfully"


@pytest.mark.asyncio
async def test_create_case_empty_subject(client: AsyncClient, auth_headers, test_user):
    """Test creating case with empty subject"""
    response = await client.post(
        f"/customer/{test_user.user_id}/cases",
        headers=auth_headers,
        json={
            "subject": "   ",
            "description": "Test description"
        }
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_case_missing_subject(client: AsyncClient, auth_headers, test_user):
    """Test creating case without subject"""
    response = await client.post(
        f"/customer/{test_user.user_id}/cases",
        headers=auth_headers,
        json={
            "description": "Test description"
        }
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_create_case_wrong_user(client: AsyncClient, auth_headers, test_user):
    """Test creating case for different user (should fail)"""
    response = await client.post(
        "/customer/00000000-0000-0000-0000-000000000000/cases",
        headers=auth_headers,
        json={
            "subject": "Test Case",
            "description": "Test description"
        }
    )
    
    assert response.status_code == 403
    assert "only create cases for yourself" in response.json()["detail"].lower()
