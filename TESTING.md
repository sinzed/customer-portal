# Testing Guide

This document provides an overview of the testing setup for both frontend and backend.

## Backend Tests

### Setup

1. Install test dependencies:
```bash
cd backend
pip install -r requirements-test.txt
```

2. Run tests:
```bash
pytest
```

3. Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

### Test Files

- `tests/test_auth.py` - Authentication endpoints (register, login, password reset)
- `tests/test_cases.py` - Cases/tickets endpoints (get, create)
- `tests/test_documents.py` - Documents endpoints (get, upload, download)
- `tests/test_salesforce_service.py` - Salesforce service unit tests

### Test Features

- Uses in-memory SQLite database for isolation
- Tests authentication and authorization
- Tests input validation
- Tests error handling
- Tests service layer functionality

## Frontend Tests

### Setup

1. Install dependencies (if not already done):
```bash
cd frontend
npm install
```

2. Run tests:
```bash
npm test
```

3. Run with UI:
```bash
npm run test:ui
```

4. Run with coverage:
```bash
npm run test:coverage
```

### Test Files

- `src/services/__tests__/api.test.ts` - API service tests
- `src/components/__tests__/Cases.test.tsx` - Cases component tests
- `src/components/__tests__/Login.test.tsx` - Login component tests

### Test Features

- Component rendering tests
- User interaction tests
- API service mocking
- Error handling tests
- Loading state tests

## Running All Tests

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## Continuous Integration

These tests are designed to be run in CI/CD pipelines. Both test suites:
- Run in isolation
- Don't require external services
- Use mocking for external dependencies
- Provide clear error messages

## Writing New Tests

### Backend

1. Create test file in `backend/tests/`
2. Use fixtures from `conftest.py`
3. Follow naming convention: `test_*.py`
4. Use `@pytest.mark.asyncio` for async tests

### Frontend

1. Create test file next to component/service
2. Use `test-utils.tsx` for rendering with providers
3. Mock external dependencies
4. Test user interactions and edge cases
