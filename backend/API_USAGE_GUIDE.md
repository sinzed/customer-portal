# API Usage Guide - How to Create Tickets and Read Data

This guide shows you how to interact with the Customer Portal API to:
- Register/Login to get authentication tokens
- Read documents for your user
- Read cases/tickets for your user
- Create new tickets/cases

## Prerequisites

1. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

2. The API will be available at `http://localhost:8000`
3. API documentation (Swagger UI) is available at `http://localhost:8000/docs`

## Step 1: Register a New User

First, you need to create a user account. The `user_id` from registration will be your `customer_id`.

### Using curl:

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "securepassword123",
    "role": "customer"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "customer@example.com",
    "role": "customer",
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

**Important:** Save the `access_token` and `user_id` - you'll need them for subsequent requests!

### Using Python:

```python
import requests

response = requests.post(
    "http://localhost:8000/auth/register",
    json={
        "email": "customer@example.com",
        "password": "securepassword123",
        "role": "customer"
    }
)

data = response.json()
token = data["access_token"]
user_id = data["user"]["user_id"]

print(f"Token: {token}")
print(f"User ID: {user_id}")
```

## Step 2: Login (Alternative to Registration)

If you already have an account:

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "securepassword123"
  }'
```

## Step 3: Get Documents for Your User

Use the `user_id` from registration/login as the `customer_id` in the URL.

### Using curl:

```bash
# Replace YOUR_TOKEN and YOUR_USER_ID with actual values
curl -X GET "http://localhost:8000/customer/YOUR_USER_ID/documents" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example:**
```bash
curl -X GET "http://localhost:8000/customer/123e4567-e89b-12d3-a456-426614174000/documents" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "documents": [
    {
      "document_id": "069000000000001AAA",
      "customer_id": "123",
      "name": "Angebot_2024_01_15.pdf",
      "type": "Angebot",
      "download_url": "/api/documents/069000000000001AAA/download",
      "created_date": "2024-01-15T10:30:00"
    }
  ]
}
```

**Note:** If you don't have mock data for your user_id, you'll get an empty array. The mock files are named like `documents-{customer_id}.json`. For testing, you can use customer_id "123" which has sample data.

### Using Python:

```python
import requests

token = "YOUR_TOKEN"
user_id = "YOUR_USER_ID"

headers = {
    "Authorization": f"Bearer {token}"
}

response = requests.get(
    f"http://localhost:8000/customer/{user_id}/documents",
    headers=headers
)

documents = response.json()
print(f"Found {len(documents['documents'])} documents")
for doc in documents['documents']:
    print(f"- {doc['name']} ({doc['type']})")
```

## Step 4: Get Cases/Tickets for Your User

### Using curl:

```bash
curl -X GET "http://localhost:8000/customer/YOUR_USER_ID/cases" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "cases": [
    {
      "case_id": "500000000000001AAA",
      "customer_id": "123",
      "subject": "Frage zur Installation",
      "description": "Wann kann der Termin für die Installation vereinbart werden?",
      "type": "Installation",
      "status": "In Progress",
      "created_date": "2024-01-10T08:00:00"
    }
  ]
}
```

### Using Python:

```python
response = requests.get(
    f"http://localhost:8000/customer/{user_id}/cases",
    headers=headers
)

cases = response.json()
print(f"Found {len(cases['cases'])} cases")
for case in cases['cases']:
    print(f"- {case['subject']} (Status: {case['status']})")
```

## Step 5: Create a New Ticket/Case

### Using curl:

```bash
curl -X POST "http://localhost:8000/customer/YOUR_USER_ID/cases" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Neue Frage zur Installation",
    "description": "Ich habe eine Frage bezüglich des Installationsprozesses."
  }'
```

**Response:**
```json
{
  "case_id": "500123456789012AAA",
  "message": "Case created successfully",
  "status": "New"
}
```

**What happens:**
1. The case is validated (subject is required, description is optional)
2. The case is saved temporarily as "eingehend" (incoming) in `incoming-cases-{user_id}.json`
3. The case is sent to Salesforce mock endpoint (saved in `new-case.json`)
4. The mapping logic is printed to console (showing transformation to Salesforce format)
5. The case is added to `cases-{user_id}.json` for future retrieval

### Using Python:

```python
case_data = {
    "subject": "Neue Frage zur Installation",
    "description": "Ich habe eine Frage bezüglich des Installationsprozesses."
}

response = requests.post(
    f"http://localhost:8000/customer/{user_id}/cases",
    headers=headers,
    json=case_data
)

result = response.json()
print(f"Case created! ID: {result['case_id']}, Status: {result['status']}")
```

## Complete Python Example Script

Here's a complete script that demonstrates all operations:

```python
#!/usr/bin/env python3
"""
Complete example of using the Customer Portal API
"""
import requests
import json

API_BASE = "http://localhost:8000"

# Step 1: Register a new user
print("1. Registering new user...")
register_response = requests.post(
    f"{API_BASE}/auth/register",
    json={
        "email": "test@example.com",
        "password": "testpassword123",
        "role": "customer"
    }
)

if register_response.status_code == 201:
    data = register_response.json()
    token = data["access_token"]
    user_id = str(data["user"]["user_id"])
    print(f"✓ Registered! User ID: {user_id}")
else:
    print(f"✗ Registration failed: {register_response.text}")
    exit(1)

# Prepare headers with authentication
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Get documents
print("\n2. Fetching documents...")
doc_response = requests.get(
    f"{API_BASE}/customer/{user_id}/documents",
    headers=headers
)

if doc_response.status_code == 200:
    documents = doc_response.json()
    print(f"✓ Found {len(documents['documents'])} documents")
    for doc in documents['documents']:
        print(f"  - {doc['name']} ({doc['type']})")
else:
    print(f"✗ Failed to fetch documents: {doc_response.text}")

# Step 3: Get cases
print("\n3. Fetching cases...")
cases_response = requests.get(
    f"{API_BASE}/customer/{user_id}/cases",
    headers=headers
)

if cases_response.status_code == 200:
    cases = cases_response.json()
    print(f"✓ Found {len(cases['cases'])} cases")
    for case in cases['cases']:
        print(f"  - {case['subject']} (Status: {case['status']})")
else:
    print(f"✗ Failed to fetch cases: {cases_response.text}")

# Step 4: Create a new case
print("\n4. Creating new case...")
new_case = {
    "subject": "Test Ticket - API Example",
    "description": "This is a test ticket created via the API"
}

create_response = requests.post(
    f"{API_BASE}/customer/{user_id}/cases",
    headers=headers,
    json=new_case
)

if create_response.status_code == 201:
    result = create_response.json()
    print(f"✓ Case created! ID: {result['case_id']}, Status: {result['status']}")
    print("  Check the backend console to see the Salesforce mapping logic!")
    print("  Check backend/mocks/salesforce/new-case.json for the mapped data")
else:
    print(f"✗ Failed to create case: {create_response.text}")

print("\n✓ All operations completed!")
```

## Testing with Mock Data

The mock Salesforce data files are located in `backend/mocks/salesforce/`:
- `documents-123.json` - Sample documents for customer ID "123"
- `cases-123.json` - Sample cases for customer ID "123"

**To test with existing mock data:**
1. Register a user and note the `user_id`
2. Create mock files named `documents-{user_id}.json` and `cases-{user_id}.json` with the same structure
3. Or use customer_id "123" if you want to test with existing data (you'll need to create a user with that specific UUID)

## Using Swagger UI (Interactive API Documentation)

The easiest way to test the API is using Swagger UI:

1. Open `http://localhost:8000/docs` in your browser
2. Click "Authorize" button (top right)
3. Enter your token: `Bearer YOUR_TOKEN`
4. Try the endpoints directly from the browser!

## Error Handling

### 401 Unauthorized
- Your token is missing, invalid, or expired
- Solution: Login again to get a new token

### 403 Forbidden
- You're trying to access another user's data
- Solution: Use your own `user_id` from the token

### 400 Bad Request
- Validation error (e.g., missing subject when creating a case)
- Solution: Check the error message and fix your request

### 500 Internal Server Error
- Server-side error
- Check the backend console for details

## File Locations

When you create a new case, the following files are created/updated:

1. **`backend/mocks/salesforce/new-case.json`**
   - Contains the Salesforce-mapped case data
   - This simulates the Salesforce API response

2. **`backend/mocks/salesforce/incoming-cases-{user_id}.json`**
   - Contains cases saved temporarily as "eingehend" (incoming)
   - Includes both internal format and Salesforce mapping

3. **`backend/mocks/salesforce/cases-{user_id}.json`**
   - Main cases file for the user
   - Updated with the new case (status changed from "eingehend" to "New")

4. **Backend Console Output**
   - Shows the mapping logic transformation
   - Displays how internal DTO maps to Salesforce format
