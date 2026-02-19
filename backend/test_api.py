#!/usr/bin/env python3
"""
Simple test script for Customer Portal API

This script demonstrates how to:
1. Register/Login to get authentication
2. Read documents for your user
3. Read cases/tickets for your user
4. Create new tickets

Usage:
    python test_api.py
"""

import requests
import json
import sys
from datetime import datetime

API_BASE = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_success(message):
    """Print success message"""
    print(f"✓ {message}")

def print_error(message):
    """Print error message"""
    print(f"✗ {message}")

def register_user(email="test@example.com", password="testpassword123"):
    """Register a new user and return token and user_id"""
    print_section("Step 1: Registering New User")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json={
                "email": email,
                "password": password,
                "role": "customer"
            },
            timeout=5
        )
        
        if response.status_code == 201:
            data = response.json()
            token = data["access_token"]
            user_id = str(data["user"]["user_id"])
            print_success(f"Registered successfully!")
            print(f"  User ID: {user_id}")
            print(f"  Email: {data['user']['email']}")
            return token, user_id
        elif response.status_code == 400 and "already registered" in response.text.lower():
            # User already exists, try to login instead
            print("User already exists, attempting login...")
            return login_user(email, password)
        else:
            print_error(f"Registration failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None, None
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to API. Is the server running?")
        print("  Start the server with: uvicorn app.main:app --reload --port 8000")
        return None, None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None, None

def login_user(email="test@example.com", password="testpassword123"):
    """Login and return token and user_id"""
    print_section("Step 1: Logging In")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={
                "email": email,
                "password": password
            },
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data["access_token"]
            user_id = str(data["user"]["user_id"])
            print_success(f"Logged in successfully!")
            print(f"  User ID: {user_id}")
            print(f"  Email: {data['user']['email']}")
            return token, user_id
        else:
            print_error(f"Login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None, None
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to API. Is the server running?")
        print("  Start the server with: uvicorn app.main:app --reload --port 8000")
        return None, None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None, None

def get_documents(token, user_id):
    """Get documents for the user"""
    print_section("Step 2: Getting Documents")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(
            f"{API_BASE}/customer/{user_id}/documents",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            documents = data.get("documents", [])
            print_success(f"Found {len(documents)} documents")
            
            if documents:
                for doc in documents:
                    print(f"  📄 {doc['name']}")
                    print(f"     Type: {doc['type']}")
                    print(f"     ID: {doc['document_id']}")
            else:
                print("  No documents found. Create mock data in:")
                print(f"    backend/mocks/salesforce/documents-{user_id}.json")
            
            return documents
        else:
            print_error(f"Failed to fetch documents: {response.status_code}")
            print(f"  Response: {response.text}")
            return []
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return []

def get_cases(token, user_id):
    """Get cases/tickets for the user"""
    print_section("Step 3: Getting Cases/Tickets")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(
            f"{API_BASE}/customer/{user_id}/cases",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            cases = data.get("cases", [])
            print_success(f"Found {len(cases)} cases")
            
            if cases:
                for case in cases:
                    print(f"  🎫 {case['subject']}")
                    print(f"     Status: {case['status']}")
                    print(f"     Type: {case.get('type', 'N/A')}")
                    print(f"     ID: {case['case_id']}")
            else:
                print("  No cases found. Create mock data in:")
                print(f"    backend/mocks/salesforce/cases-{user_id}.json")
            
            return cases
        else:
            print_error(f"Failed to fetch cases: {response.status_code}")
            print(f"  Response: {response.text}")
            return []
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return []

def create_case(token, user_id, subject, description=None):
    """Create a new case/ticket"""
    print_section("Step 4: Creating New Case/Ticket")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    case_data = {
        "subject": subject,
    }
    
    if description:
        case_data["description"] = description
    
    try:
        response = requests.post(
            f"{API_BASE}/customer/{user_id}/cases",
            headers=headers,
            json=case_data,
            timeout=5
        )
        
        if response.status_code == 201:
            data = response.json()
            print_success("Case created successfully!")
            print(f"  Case ID: {data['case_id']}")
            print(f"  Status: {data['status']}")
            print(f"  Message: {data['message']}")
            print("\n  📝 Note: Check the backend console to see the Salesforce mapping logic!")
            print("  📁 Files created/updated:")
            print(f"     - backend/mocks/salesforce/new-case.json")
            print(f"     - backend/mocks/salesforce/incoming-cases-{user_id}.json")
            print(f"     - backend/mocks/salesforce/cases-{user_id}.json")
            return data
        else:
            print_error(f"Failed to create case: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

def main():
    """Main test function"""
    print("\n" + "="*60)
    print(" Customer Portal API Test Script")
    print("="*60)
    
    # Step 1: Register/Login
    token, user_id = register_user()
    
    if not token or not user_id:
        print("\n❌ Cannot proceed without authentication")
        sys.exit(1)
    
    # Step 2: Get documents
    documents = get_documents(token, user_id)
    
    # Step 3: Get cases
    cases = get_cases(token, user_id)
    
    # Step 4: Create a new case
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_case = create_case(
        token,
        user_id,
        subject=f"Test Ticket - Created at {timestamp}",
        description="This is a test ticket created via the API test script."
    )
    
    # Summary
    print_section("Summary")
    print(f"✓ Authentication: Success (User ID: {user_id})")
    print(f"✓ Documents retrieved: {len(documents)}")
    print(f"✓ Cases retrieved: {len(cases)}")
    if new_case:
        print(f"✓ New case created: {new_case['case_id']}")
    else:
        print(f"✗ Failed to create new case")
    
    print("\n" + "="*60)
    print(" Test completed!")
    print("="*60)
    print("\n💡 Tips:")
    print("  - Use Swagger UI at http://localhost:8000/docs for interactive testing")
    print("  - Check backend/mocks/salesforce/ for generated files")
    print("  - Check backend console for Salesforce mapping output")
    print()

if __name__ == "__main__":
    main()
