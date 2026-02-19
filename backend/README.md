# Customer Portal Backend

FastAPI backend serving as a facade between the frontend and Salesforce.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the development server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI) is available at `http://localhost:8000/docs`

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── models/              # Pydantic models (DTOs)
│   │   ├── document.py
│   │   └── case.py
│   ├── routes/              # API route handlers
│   │   ├── documents.py
│   │   └── cases.py
│   └── services/            # Business logic layer
│       └── salesforce_service.py
├── mocks/
│   └── salesforce/          # Mock Salesforce data
│       ├── documents-123.json
│       └── cases-123.json
└── requirements.txt
```

## API Endpoints

- `GET /customer/{customer_id}/documents` - Get customer documents
- `GET /customer/{customer_id}/cases` - Get customer cases
- `POST /customer/{customer_id}/cases` - Create new case

## Architecture Notes

The `SalesforceService` abstracts Salesforce API interactions. Even though we're using mocks, this demonstrates:
- Clear separation of concerns
- Future-proof integration pattern
- Mapping logic isolation

In production, this service would handle:
- OAuth2 authentication
- API rate limiting
- Retry logic
- Salesforce-specific error handling
