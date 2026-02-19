# Frontend API Integration Guide

This document explains how the frontend integrates with the backend API to create tickets, read cases, and access documents.

## Overview

The frontend uses a centralized API service layer (`src/services/api.ts`) that handles all communication with the backend. Authentication is managed through `AuthContext` and stored in localStorage.

## Architecture

```
Components (Documents, Cases, CreateCase)
    ↓
API Service (api.ts)
    ↓
Backend API (FastAPI)
    ↓
Salesforce Service (Mock)
```

## Authentication Flow

1. **Registration/Login**: User registers or logs in via `Login.tsx` or `Register.tsx`
2. **Token Storage**: JWT token and user data stored in localStorage
3. **API Calls**: All subsequent API calls include the token in the `Authorization` header
4. **Auto-Refresh**: Components automatically refresh data when needed

## Key Components

### 1. Documents Component (`Documents.tsx`)

**Purpose**: Display customer documents from Salesforce

**API Integration**:
```typescript
const data = await api.getDocuments();
// Calls: GET /customer/{user_id}/documents
```

**Features**:
- Automatically loads documents on mount
- Error handling with retry button
- Download functionality (simulated for MVP)

### 2. Cases Component (`Cases.tsx`)

**Purpose**: Display customer cases/tickets

**API Integration**:
```typescript
const data = await api.getCases();
// Calls: GET /customer/{user_id}/cases
```

**Features**:
- Displays cases with status badges
- Refresh button to reload cases
- "Create New Ticket" button
- Auto-refreshes when navigating back from create-case
- Empty state with call-to-action

**Status Colors**:
- `New`: Blue (#2196F3)
- `In Progress`: Orange (#FF9800)
- `Closed`: Green (#4CAF50)
- `Escalated`: Red (#F44336)
- `eingehend`: Purple (#9C27B0)

### 3. CreateCase Component (`CreateCase.tsx`)

**Purpose**: Create new tickets/cases

**API Integration**:
```typescript
const result = await api.createCase({
  subject: "My issue",
  description: "Optional description"
});
// Calls: POST /customer/{user_id}/cases
```

**Features**:
- Client-side validation (subject required)
- Loading states during submission
- Success message with auto-redirect to cases list
- Error handling with specific error messages
- Form reset after successful submission

**Flow**:
1. User fills form (subject required, description optional)
2. Form validates input
3. API call to create case
4. Success message displayed
5. Auto-redirect to cases list after 2 seconds
6. Cases list automatically refreshes

## API Service (`api.ts`)

The API service provides:

### Methods

1. **`getDocuments(customerId?)`**
   - Fetches documents for authenticated user
   - Returns `DocumentListResponse`

2. **`getCases(customerId?)`**
   - Fetches cases for authenticated user
   - Returns `CaseListResponse`

3. **`createCase(caseData, customerId?)`**
   - Creates a new case
   - Validates input (subject required)
   - Returns `CaseCreateResponse`

### Authentication

All API methods automatically:
- Include JWT token from localStorage in `Authorization` header
- Use authenticated user's ID if `customerId` not provided
- Handle 401 errors by clearing auth state

### Error Handling

```typescript
try {
  const data = await api.getCases();
} catch (err) {
  if (err instanceof ApiError) {
    // Handle specific API error
    console.error(err.message, err.status);
  }
}
```

## Authentication Service (`auth.ts`)

Handles login and registration:

```typescript
// Login
await authApi.login({ email, password });

// Register
await authApi.register({ email, password, role: 'customer' });
```

## User Flow Examples

### Creating a New Ticket

1. User navigates to `/create-case`
2. Fills in subject (required) and description (optional)
3. Clicks "Ticket erstellen"
4. Form validates input
5. API call: `POST /customer/{user_id}/cases`
6. Backend:
   - Validates input
   - Creates case with status "eingehend"
   - Saves to mock Salesforce endpoint
   - Returns case ID and status
7. Frontend shows success message
8. After 2 seconds, redirects to `/cases`
9. Cases list automatically refreshes and shows new case

### Viewing Documents

1. User navigates to `/documents`
2. Component mounts and calls `api.getDocuments()`
3. API call: `GET /customer/{user_id}/documents`
4. Backend reads from `mocks/salesforce/documents-{user_id}.json`
5. Frontend displays documents in table
6. User can click "Herunterladen" to download (simulated)

### Viewing Cases

1. User navigates to `/cases`
2. Component mounts and calls `api.getCases()`
3. API call: `GET /customer/{user_id}/cases`
4. Backend reads from `mocks/salesforce/cases-{user_id}.json`
5. Frontend displays cases with status badges
6. User can click "Aktualisieren" to refresh
7. User can click "Neues Ticket erstellen" to create a case

## Error States

All components handle errors gracefully:

- **401 Unauthorized**: User redirected to login
- **403 Forbidden**: Error message displayed
- **400 Bad Request**: Validation error shown
- **500 Server Error**: Generic error message with retry option

## Loading States

All components show loading indicators:
- Documents: "Lade Dokumente..."
- Cases: "Lade Tickets..."
- CreateCase: "Wird gesendet..." button state

## Environment Variables

Set in `.env` file:
```
VITE_API_URL=http://localhost:8000
```

Defaults to `http://localhost:8000` if not set.

## Testing the Integration

1. **Start Backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow**:
   - Register/Login at `http://localhost:5173/login`
   - View documents at `/documents`
   - View cases at `/cases`
   - Create new case at `/create-case`
   - Verify case appears in cases list

## Mock Data Setup

For testing, create mock data files:
- `backend/mocks/salesforce/documents-{user_id}.json`
- `backend/mocks/salesforce/cases-{user_id}.json`

The `user_id` comes from the registered user's UUID.

## Future Enhancements

- Real-time updates (WebSockets)
- Optimistic UI updates
- Request caching
- Retry logic with exponential backoff
- Request cancellation
- File upload for case attachments
- Document preview
- Case detail view
- Case status filtering
