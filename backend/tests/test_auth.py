"""
Tests for authentication routes
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_register_new_user(client: AsyncClient):
    """Test registering a new user"""
    response = await client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "password123",
            "role": "customer"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "customer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user):
    """Test registering with duplicate email"""
    response = await client.post(
        "/auth/register",
        json={
            "email": test_user.email,
            "password": "password123",
            "role": "customer"
        }
    )
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    """Test successful login"""
    response = await client.post(
        "/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword123"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == test_user.email


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, test_user):
    """Test login with invalid credentials"""
    response = await client.post(
        "/auth/login",
        json={
            "email": test_user.email,
            "password": "wrongpassword"
        }
    )
    
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with non-existent user"""
    response = await client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "password123"
        }
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, auth_headers):
    """Test getting current user info"""
    response = await client.get("/auth/me", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "user_id" in data
    assert "role" in data


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    """Test getting current user without auth"""
    response = await client.get("/auth/me")
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient, test_user):
    """Test forgot password endpoint"""
    response = await client.post(
        "/auth/forgot-password",
        json={"email": test_user.email}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    # In test environment, reset token is returned
    assert "reset_token" in data


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_email(client: AsyncClient):
    """Test forgot password with non-existent email"""
    response = await client.post(
        "/auth/forgot-password",
        json={"email": "nonexistent@example.com"}
    )
    
    # Should return success to avoid revealing if email exists
    assert response.status_code == 200
