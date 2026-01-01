/**
 * Demo Configuration
 *
 * Route classifications and demo settings
 */

// Routes where users can create, edit, and delete records
export const INTERACTIVE_ROUTES = [
  '/today',
  '/bookings',
  '/pets',
  '/owners',
  '/vaccinations',
  '/run-schedules',
  '/schedule',
  '/calendar',
  '/kennels',
  '/incidents',
  '/payments',
  '/invoices',
  '/packages',
];

// Routes that are view-only in the demo
export const VIEW_ONLY_ROUTES = [
  '/segments',
  '/tasks',
  '/workflows',
  '/messages',
  '/team',
  '/reports',
  '/settings',
];

// Check if a path is an interactive route
export const isInteractiveRoute = (pathname) => {
  return INTERACTIVE_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
};

// Check if a path is a view-only route
export const isViewOnlyRoute = (pathname) => {
  return VIEW_ONLY_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
};

// Demo tenant configuration
export const DEMO_TENANT = {
  id: 'demo-tenant',
  recordId: 'demo-tenant',
  slug: 'demo',
  name: 'Happy Paws Pet Resort',
  accountCode: 'BK-DEMO01',
  plan: 'ENTERPRISE',
  features: {
    vaccinations: true,
    incidents: true,
    invoicing: true,
    payments: true,
    packages: true,
    reports: true,
    workflows: true,
    customFields: true,
    multiLocation: false,
  },
  settings: {
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
  terminology: {
    pet: 'Pet',
    pets: 'Pets',
    owner: 'Owner',
    owners: 'Owners',
    kennel: 'Kennel',
    kennels: 'Kennels',
    booking: 'Booking',
    bookings: 'Bookings',
  },
};

// Demo user configuration
export const DEMO_USER = {
  id: 'demo-user-001',
  recordId: 'demo-user-001',
  email: 'demo@happypawsresort.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'ADMIN',
  avatarUrl: null,
};

export default {
  INTERACTIVE_ROUTES,
  VIEW_ONLY_ROUTES,
  isInteractiveRoute,
  isViewOnlyRoute,
  DEMO_TENANT,
  DEMO_USER,
};
