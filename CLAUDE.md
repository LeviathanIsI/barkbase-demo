# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarkBase is a multi-tenant SaaS application for pet care facility management (kennels, daycares, groomers). It's a React 19 frontend that connects to a backend API.

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm run test             # Run all unit tests (Vitest, watch mode)
npm run test:fast        # Quick smoke tests (lib, stores, hooks only)
npm run test:components  # Test component library
npm run test:features    # Test feature modules

# E2E Testing (Playwright)
npm run test:e2e         # Run all e2e tests
npm run test:e2e:ui      # Open Playwright UI
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:debug   # Debug mode
npm run test:e2e:chromium # Chromium only

# Visual/Accessibility
npm run test:visual      # Visual regression tests
npm run test:a11y        # Accessibility tests

# Linting
npm run lint             # ESLint check
```

## Architecture

### Feature-Based Organization

Each feature in `src/features/` is self-contained:
```
src/features/{feature}/
├── api.js           # React Query hooks for API calls
├── components/      # Feature-specific UI components
├── hooks/           # Feature-specific custom hooks
├── routes/          # Page components
└── __tests__/       # Feature tests
```

Key features: `auth`, `bookings`, `pets`, `owners`, `kennels`, `dashboard`, `calendar`, `payments`, `staff`, `settings`

### State Management (Three Layers)

1. **Global State (Zustand)** - `src/stores/`
   - `auth.js` - User, role, tenantId, accessToken
   - `tenant.js` - Tenant config, plan, features, branding
   - `ui.js` - UI preferences (sidebar, theme)

2. **Server State (React Query)** - Each feature's `api.js`
   - Query keys scoped by tenant: `[tenantSlug, 'bookings', filters]`
   - Standard patterns via `src/lib/createApiHooks.js`

3. **Component State** - React hooks (useState, useReducer)

### API Client

`src/lib/apiClient.js` - Centralized HTTP client:
- Auto-attaches Bearer token from auth store
- Adds `X-Tenant-Id` header for multi-tenancy
- 401 responses trigger automatic logout
- Converts snake_case responses to camelCase

```javascript
import apiClient from '@/lib/apiClient';
await apiClient.get('/api/v1/pets');
await apiClient.post('/api/v1/bookings', data);
```

### Routing

React Router v7 with lazy code-splitting in `src/app/router.jsx`. Routes wrapped in `<ProtectedRoute>` require authentication.

### Path Alias

`@` maps to `./src` (e.g., `import X from '@/lib/utils'`)

## Key Technologies

- **React 19** with Vite
- **Zustand** for global state
- **React Query (TanStack)** for server state
- **Tailwind CSS** with custom design tokens
- **React Hook Form + Zod** for forms/validation
- **Framer Motion** for animations
- **Recharts** for charts
- **FullCalendar** for scheduling
- **MSW** for API mocking in tests
- **Playwright** for E2E, **Vitest** for unit tests

## Multi-Tenancy

- Tenant ID stored in auth store, auto-added to API requests
- Query keys include tenant slug for cache isolation
- Feature flags vary by tenant plan (FREE/PRO/ENTERPRISE)

## Demo Mode

Set `VITE_DEMO_MODE=true` to run standalone without backend. Uses IndexedDB for persistence and mock API handlers in `src/demo/`.

## Testing

- Unit tests: `src/**/*.test.js` or `src/**/__tests__/`
- E2E tests: `e2e/` directory
- Test utilities: `src/test/test-utils.jsx` (custom render with providers)
- Mock handlers: `src/test/mocks/handlers.js`
- Coverage thresholds: 80% lines/functions/statements, 75% branches

## Environment Variables

Configure in `.env`:
```
VITE_API_BASE_URL=http://localhost:4000
VITE_DEMO_MODE=false
VITE_REALTIME_URL=ws://localhost:8080
```

## Code Patterns

- Components use Tailwind classes (avoid inline styles)
- Forms use React Hook Form with Zod schemas
- API mutations invalidate related queries automatically
- Shared UI components in `src/components/ui/`
- Feature components in `src/features/{feature}/components/`
