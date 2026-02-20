# CI/CD Configuration

This project includes CI/CD pipelines for running tests and building both frontend and backend projects.

## GitHub Actions

The workflow file `.github/workflows/ci.yml` runs on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches
- Manual trigger via `workflow_dispatch`

### Jobs

1. **backend-tests**: Runs pytest unit tests for the backend
2. **backend-build**: Verifies backend can be imported (build check)
3. **frontend-tests**: Runs Vitest unit tests for the frontend
4. **frontend-build**: Builds the frontend production bundle

### Viewing Results

Go to your GitHub repository → Actions tab to see workflow runs and results.

## GitLab CI

The `.gitlab-ci.yml` file provides the same functionality for GitLab CI/CD.

### Stages

1. **test**: Runs unit tests for both backend and frontend
2. **build**: Builds both projects after tests pass

## Running Locally

You can run the same commands locally:

### Backend
```bash
cd backend
pip install -r requirements.txt
pip install -r requirements-test.txt
pytest -v
```

### Frontend
```bash
cd frontend
npm ci
npm test -- run
npm run build
```

## Requirements

- Python 3.11+
- Node.js 20+
- Backend: All dependencies from `requirements.txt` and `requirements-test.txt`
- Frontend: All dependencies from `package.json`
