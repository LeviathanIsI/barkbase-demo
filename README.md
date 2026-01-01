# BarkBase Demo

A comprehensive pet care facility management platform demo. This interactive demonstration showcases the full capabilities of BarkBase - a multi-tenant SaaS application designed for kennels, daycares, groomers, and veterinary facilities.

> **Note:** This is a standalone demo that runs entirely in-browser with mock data. No backend connection required.

## Live Demo

Visit the live demo: [Coming Soon]

## Features

### Core Management
- **Pet Profiles** - Complete pet records with medical history, vaccinations, dietary needs, and behavioral notes
- **Owner Management** - Customer profiles with contact info, billing, and pet associations
- **Booking System** - Reservations for boarding, daycare, grooming, and other services
- **Check-in/Check-out** - Streamlined arrival and departure workflows

### Operations
- **Facility Management** - Kennels, runs, and room assignments with real-time availability
- **Calendar Views** - Daily, weekly, and monthly scheduling with drag-and-drop
- **Staff Management** - Team scheduling, roles, and task assignments
- **Mobile Tasks** - Staff task lists optimized for mobile devices

### Financial
- **Invoicing** - Automated invoice generation and management
- **Payments** - Payment processing and tracking
- **Packages** - Service bundles and prepaid packages
- **Reports** - Revenue, occupancy, and business analytics

### Automation & Communication
- **Workflow Builder** - Visual drag-and-drop automation builder with:
  - Event triggers (bookings, vaccinations, birthdays)
  - Conditional branching logic
  - Email, SMS, and notification actions
  - Wait steps and delays
- **Messaging** - Two-way communication with pet owners
- **Segments** - Customer segmentation for targeted communications

### Administration
- **Multi-Property Support** - Manage multiple locations from one account
- **Role-Based Access** - Granular permissions and custom roles
- **Custom Fields** - Extend data models with custom attributes
- **Audit Logging** - Track all system changes
- **Branding** - White-label customization options

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Server State | TanStack React Query |
| Routing | React Router 7 |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Charts | Recharts |
| Workflow Canvas | ReactFlow |
| Icons | Lucide React |
| Testing | Vitest + Playwright |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/LeviathanIsI/barkbase-demo.git

# Navigate to directory
cd barkbase-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Demo Mode

This demo runs in standalone mode with:
- **Mock API** - All API calls are intercepted and handled locally
- **IndexedDB Persistence** - Data persists across browser sessions
- **Seed Data** - Pre-populated with realistic sample data

To reset the demo data, clear your browser's local storage and IndexedDB.

## Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
npm run test:e2e:ui  # Playwright with UI

# Linting
npm run lint         # ESLint check
```

## Project Structure

```
src/
├── app/              # App shell, routing, providers
├── components/       # Shared UI components
│   └── ui/           # Base component library
├── features/         # Feature modules
│   ├── auth/         # Authentication
│   ├── bookings/     # Reservation management
│   ├── customers/    # Customer management
│   ├── dashboard/    # Main dashboard
│   ├── facilities/   # Kennel/room management
│   ├── invoices/     # Billing & invoices
│   ├── messaging/    # Owner communication
│   ├── owners/       # Pet owner profiles
│   ├── payments/     # Payment processing
│   ├── pets/         # Pet profiles
│   ├── reports/      # Analytics & reports
│   ├── settings/     # App configuration
│   ├── staff/        # Team management
│   ├── workflows/    # Automation builder
│   └── ...
├── demo/             # Demo mode infrastructure
│   ├── mockApi/      # Mock API handlers
│   ├── persistence/  # IndexedDB storage
│   └── seedData/     # Sample data
├── hooks/            # Shared React hooks
├── lib/              # Utilities & helpers
└── stores/           # Zustand state stores
```

## Screenshots

### Dashboard
Modern dashboard with key metrics, today's schedule, and quick actions.

### Workflow Builder
Visual automation builder with drag-and-drop nodes, branching logic, and real-time preview.

### Messaging
Real-time messaging interface for owner communication.

### Booking Calendar
Interactive calendar with drag-and-drop scheduling.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

**Proprietary Software** - All Rights Reserved

This software is provided for demonstration purposes only. See [LICENSE](LICENSE) for details.

You may NOT copy, modify, distribute, or use this code without express written permission.

## Contact

For licensing inquiries or questions, please open an issue or contact the repository owner.

---

Built with React and Tailwind CSS
