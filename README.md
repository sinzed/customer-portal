# Customer Portal - MVP

A minimal viable product (MVP) for Octopus Energy's customer portal, enabling customers to view documents, manage tickets, and interact with Salesforce-backed services.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
docker compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

See [README_DOCKER.md](./README_DOCKER.md) for detailed Docker instructions.

### Option 2: Local Development

#### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend API: http://localhost:8000  
API Docs: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## 📁 Project Structure

```
customer-portal/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── models/         # Pydantic models (DTOs)
│   │   ├── routes/         # API route handlers
│   │   └── services/       # Business logic layer
│   ├── mocks/
│   │   └── salesforce/     # Mock Salesforce data
│   └── requirements.txt
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   └── App.jsx
│   └── package.json
├── ARCHITECTURE.md          # Architecture documentation
└── DELIVERY_PLAN.md         # 6-week implementation plan
```

## ✨ Features

- **Document Management**: View and download customer documents from Salesforce
- **Case Management**: View existing tickets/cases with status tracking
- **Case Creation**: Create new support tickets through a simple form

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation including:
- High-level component diagram
- Data flow diagrams
- Security considerations
- Extensibility strategy

## 📋 Delivery Plan

See [DELIVERY_PLAN.md](./DELIVERY_PLAN.md) for the 6-week implementation plan including:
- Week-by-week breakdown
- Team structure
- Risk mitigation strategies
- Success metrics

## 🔧 Technology Stack

- **Backend**: Python 3.x + FastAPI
- **Frontend**: React 19 + Vite + React Router
- **Integration**: Salesforce (mocked for MVP)

## 📝 API Endpoints

- `GET /customer/{customer_id}/documents` - Get customer documents
- `GET /customer/{customer_id}/cases` - Get customer cases
- `POST /customer/{customer_id}/cases` - Create new case

## 🧪 Testing

For MVP, manual testing is sufficient. In production:
- Unit tests for service layer
- Integration tests for API endpoints
- E2E tests for critical flows

## 📚 Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Delivery Plan](./DELIVERY_PLAN.md)

## 🎯 MVP Scope

**Implemented**:
- ✅ Document list and download
- ✅ Case list view
- ✅ Create new case form
- ✅ Clean architecture with separation of concerns
- ✅ Mock Salesforce integration

**Deferred** (for production):
- Authentication/authorization
- Real file upload
- Appointment scheduling
- Dynamic forms
- Advanced UI features

## 🔐 Security Notes

For MVP, authentication is not implemented (hardcoded customer ID). In production:
- OAuth2 with Salesforce
- JWT tokens for session management
- Input validation and sanitization
- CORS restrictions
- Rate limiting

## 📄 License

Internal project for Octopus Energy.
