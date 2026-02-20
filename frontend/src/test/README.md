# Frontend Tests

This directory contains tests for the Customer Portal frontend.

## Setup

Install test dependencies (included in package.json):

```bash
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Test Structure

- `setup.ts` - Test setup and global mocks
- `test-utils.tsx` - Custom render function with providers
- `services/__tests__/` - API service tests
- `components/__tests__/` - Component tests

## Testing Library

Tests use:
- **Vitest** - Test runner
- **React Testing Library** - Component testing utilities
- **jsdom** - DOM environment for tests
