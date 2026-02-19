# Customer Portal Frontend

React frontend for the Octopus Energy Customer Portal.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Documents.jsx
│   │   ├── Cases.jsx
│   │   ├── CreateCase.jsx
│   │   └── Navigation.jsx
│   ├── services/            # API client
│   │   └── api.js
│   ├── App.jsx              # Main app component with routing
│   └── main.jsx             # Entry point
└── package.json
```

## Environment Variables

Create a `.env` file (optional):
```
VITE_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`

## Features

- **Documents View**: List and download customer documents
- **Cases View**: View existing tickets/cases with status
- **Create Case**: Form to create new tickets
