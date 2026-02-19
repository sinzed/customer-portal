# Quick Reference - API Endpoints

## Base URL
```
http://localhost:8000
```

## Authentication

### Register
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Save the `access_token` and `user_id` from the response!**

## Documents

### Get Documents
```bash
curl -X GET "http://localhost:8000/customer/{user_id}/documents" \
  -H "Authorization: Bearer {token}"
```

## Cases/Tickets

### Get Cases
```bash
curl -X GET "http://localhost:8000/customer/{user_id}/cases" \
  -H "Authorization: Bearer {token}"
```

### Create Case
```bash
curl -X POST "http://localhost:8000/customer/{user_id}/cases" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "My issue",
    "description": "Optional description"
  }'
```

## Example Workflow

```bash
# 1. Register
TOKEN=$(curl -s -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}' \
  | jq -r '.access_token')

USER_ID=$(curl -s -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}' \
  | jq -r '.user.user_id')

# 2. Get Documents
curl -X GET "http://localhost:8000/customer/$USER_ID/documents" \
  -H "Authorization: Bearer $TOKEN"

# 3. Get Cases
curl -X GET "http://localhost:8000/customer/$USER_ID/cases" \
  -H "Authorization: Bearer $TOKEN"

# 4. Create Case
curl -X POST "http://localhost:8000/customer/$USER_ID/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject": "New ticket", "description": "My issue description"}'
```

## Interactive Testing

Open Swagger UI in your browser:
```
http://localhost:8000/docs
```

1. Click "Authorize" (top right)
2. Enter: `Bearer YOUR_TOKEN`
3. Try endpoints directly from the browser!
