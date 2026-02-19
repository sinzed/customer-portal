# Customer Portal - Architecture Documentation

## High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React/Vite)  │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend API   │
│   (FastAPI)     │
│                 │
│  ┌───────────┐  │
│  │ Routes    │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ Services  │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
┌────────▼────────┐
│   Salesforce    │
│   (Source of    │
│    Truth)       │
└─────────────────┘
```

## Component Overview

### Frontend (React)
- **Purpose**: User interface for customers
- **Technology**: React 19 + Vite + React Router
- **Key Components**:
  - Documents view
  - Cases list view
  - Create case form
  - Navigation

### Backend API (FastAPI)
- **Purpose**: Facade layer between frontend and Salesforce
- **Technology**: Python 3.x + FastAPI
- **Responsibilities**:
  - Request validation
  - Data transformation (DTOs)
  - Business logic orchestration
  - Error handling

### Salesforce Service Layer
- **Purpose**: Abstract Salesforce integration
- **Current**: Mock implementation (JSON files)
- **Future**: Real Salesforce REST API integration

## Data Flows

### 1. Read Documents Flow

```
Customer → Frontend → Backend API → SalesforceService → Mock JSON
                ↓
         Response DTO ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

**Steps**:
1. Frontend calls `GET /customer/{id}/documents`
2. Backend route handler receives request
3. SalesforceService retrieves data from mock
4. Data mapped to Document DTO
5. Response returned to frontend
6. Frontend displays documents

### 2. Read Cases Flow

```
Customer → Frontend → Backend API → SalesforceService → Mock JSON
                ↓
         Response DTO ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

**Steps**:
1. Frontend calls `GET /customer/{id}/cases`
2. Backend route handler receives request
3. SalesforceService retrieves cases from mock
4. Data mapped to Case DTO
5. Response returned to frontend
6. Frontend displays cases with status

### 3. Create Case Flow

```
Customer → Frontend → Backend API → Validation → SalesforceService
                ↓                                        ↓
         Success Response ← ← ← ← ← ← ← ← ← ← ← Mock File Write
```

**Steps**:
1. Customer fills form in frontend
2. Frontend validates (client-side)
3. Frontend POSTs to `POST /customer/{id}/cases`
4. Backend validates input (server-side)
5. SalesforceService creates case
6. Case written to mock file (simulating Salesforce API call)
7. Success response returned
8. Frontend shows success message

## Security Considerations

### Authentication & Authorization

**Current (MVP)**: Not implemented - hardcoded customer ID

**Production Approach**:
- **OAuth2 with Salesforce**: Customers authenticate via Salesforce OAuth2
- **JWT Tokens**: Backend issues JWT after Salesforce authentication
- **Session Management**: Secure HTTP-only cookies or token storage
- **Customer Context**: Extract customer ID from authenticated session

### Data Protection

- **HTTPS**: All communication encrypted in transit
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection**: Not applicable (no direct DB), but sanitize all inputs
- **XSS Prevention**: React escapes by default, but validate all user inputs
- **CORS**: Restricted to specific frontend domains in production

### Document Security

- **Access Control**: Verify customer owns document before serving
- **File Storage**: Documents stored in secure blob storage (S3/Azure Blob)
- **Download URLs**: Time-limited, signed URLs for document downloads
- **Audit Logging**: Log all document access

### Case Creation Security

- **Rate Limiting**: Prevent spam ticket creation
- **Input Sanitization**: Sanitize all text inputs
- **Validation**: Strict validation on subject, description fields
- **CSRF Protection**: CSRF tokens for form submissions

## Technical Requirements

### Scalability

- **Stateless Backend**: Enables horizontal scaling
- **Caching**: Redis cache for frequently accessed Salesforce data
- **CDN**: Static assets served via CDN
- **Load Balancing**: Multiple backend instances behind load balancer

### Reliability

- **Error Handling**: Graceful degradation on Salesforce API failures
- **Retry Logic**: Exponential backoff for transient Salesforce errors
- **Monitoring**: Health checks, logging, metrics
- **Circuit Breaker**: Prevent cascade failures

### Maintainability

- **Clear Separation**: Routes → Services → Adapters
- **DTOs**: Stable API contracts
- **Documentation**: OpenAPI/Swagger docs
- **Testing**: Unit tests for services, integration tests for API

## Extensibility Strategy

### Modular Feature Addition

The architecture supports adding new features without major refactoring:

#### 1. Appointment Scheduling

**New Components**:
- `routes/appointments.py` - Appointment endpoints
- `services/appointment_service.py` - Business logic
- `models/appointment.py` - Appointment DTOs

**Salesforce Integration**:
- Use Salesforce Calendar/Event objects
- Sync appointments bidirectionally

#### 2. Dynamic Forms

**New Components**:
- `routes/forms.py` - Form schema endpoints
- `services/form_service.py` - Form rendering logic
- `models/form.py` - Form schema DTOs

**Approach**:
- Store form schemas in Salesforce Custom Metadata
- Frontend renders forms dynamically from schema
- Submit form data to Salesforce

#### 3. Cross-Selling Features

**New Components**:
- `routes/products.py` - Product recommendations
- `services/recommendation_service.py` - Recommendation engine

**Integration**:
- Leverage Salesforce Product Catalog
- Use Salesforce AI/ML for recommendations

### Microservices Evolution

As the portal grows, consider splitting into microservices:

```
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────────┐
    │         │          │             │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌──────▼─────┐
│ Docs  │ │Cases │ │Appoints │ │ Forms      │
│Service│ │Service│ │Service  │ │ Service    │
└───┬───┘ └───┬──┘ └────┬────┘ └──────┬─────┘
    │         │          │             │
    └─────────┴──────────┴─────────────┘
                 │
         ┌───────▼───────┐
         │  Salesforce   │
         └───────────────┘
```

## Production Deployment Considerations

### Infrastructure

- **Containerization**: Docker containers for backend and frontend
- **Orchestration**: Kubernetes or Docker Compose for local dev
- **CI/CD**: Automated testing and deployment pipeline
- **Environment Management**: Separate dev/staging/prod environments

### Monitoring & Observability

- **Logging**: Structured logging (JSON format)
- **Metrics**: Prometheus metrics for API performance
- **Tracing**: Distributed tracing for request flows
- **Alerts**: Alert on errors, latency spikes, Salesforce API failures

### Salesforce Integration

**Production Implementation**:
1. OAuth2 authentication flow
2. API rate limit handling (24-hour rolling window)
3. Bulk API for large data operations
4. Change Data Capture (CDC) for real-time sync
5. Platform Events for async notifications

## Development Workflow

### Local Development

1. Backend: `uvicorn app.main:app --reload`
2. Frontend: `npm run dev`
3. Mock Salesforce data in `backend/mocks/salesforce/`

### Testing Strategy

- **Unit Tests**: Service layer logic
- **Integration Tests**: API endpoints with test fixtures
- **E2E Tests**: Critical user flows (optional for MVP)

### Code Quality

- **Linting**: ESLint (frontend), Flake8/Black (backend)
- **Type Checking**: TypeScript (future), Pydantic (backend)
- **Pre-commit Hooks**: Run linters before commit
