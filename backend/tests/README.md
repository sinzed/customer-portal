# Backend Tests

This directory contains tests for the Customer Portal backend API.

## Setup

Install test dependencies:

```bash
pip install -r requirements-test.txt
```

## Running Tests

Run all tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

Run specific test file:
```bash
pytest tests/test_auth.py
```

Run specific test:
```bash
pytest tests/test_auth.py::test_login_success
```

## Test Structure

- `conftest.py` - Shared fixtures and test configuration
- `test_auth.py` - Authentication route tests
- `test_cases.py` - Cases/tickets route tests
- `test_documents.py` - Documents route tests
- `test_salesforce_service.py` - Salesforce service unit tests

## Test Database

Tests use an in-memory SQLite database that is created and destroyed for each test, ensuring test isolation.
