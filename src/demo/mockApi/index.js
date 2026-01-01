/**
 * Mock API Layer
 *
 * Intercepts API calls in demo mode and returns data from the seed database.
 */

import { getDemoStore } from '../persistence/DemoStore';
import * as bookingsHandler from './handlers/bookings';
import * as ownersHandler from './handlers/owners';
import * as petsHandler from './handlers/pets';
import * as kennelsHandler from './handlers/kennels';
import * as vaccinationsHandler from './handlers/vaccinations';
import * as invoicesHandler from './handlers/invoices';
import * as paymentsHandler from './handlers/payments';
import * as incidentsHandler from './handlers/incidents';
import * as staffHandler from './handlers/staff';
import * as servicesHandler from './handlers/services';
import * as packagesHandler from './handlers/packages';
import * as tasksHandler from './handlers/tasks';
import * as configHandler from './handlers/config';
import * as dashboardHandler from './handlers/dashboard';
import * as calendarHandler from './handlers/calendar';
import * as workflowsHandler from './handlers/workflows';
import * as segmentsHandler from './handlers/segments';
import * as messagesHandler from './handlers/messages';
import * as runsHandler from './handlers/runs';
import * as runTemplatesHandler from './handlers/runTemplates';

/**
 * Check if demo mode is enabled
 */
export const isDemoMode = () => {
  return import.meta.env.VITE_DEMO_MODE === 'true';
};

/**
 * Route definitions mapping URL patterns to handlers
 */
const routes = [
  // Config & Tenant
  { pattern: /^\/api\/v1\/config\/tenant$/, handler: configHandler },
  { pattern: /^\/api\/v1\/config\/settings/, handler: configHandler },
  { pattern: /^\/api\/v1\/config\/kennel-types$/, handler: configHandler, method: 'kennelTypes' },
  { pattern: /^\/api\/v1\/config\/privacy$/, handler: configHandler, method: 'privacy' },
  { pattern: /^\/api\/v1\/config\/branding$/, handler: configHandler, method: 'branding' },
  { pattern: /^\/api\/v1\/auth\/me$/, handler: configHandler, method: 'me' },
  { pattern: /^\/api\/v1\/auth\/mfa/, handler: configHandler, method: 'mfa' },
  { pattern: /^\/api\/v1\/auth\/connected-email/, handler: configHandler, method: 'connectedEmail' },
  { pattern: /^\/api\/v1\/account-defaults$/, handler: configHandler, method: 'accountDefaults' },
  { pattern: /^\/api\/v1\/settings\//, handler: configHandler, method: 'settings' },

  // Dashboard & Analytics
  { pattern: /^\/api\/v1\/analytics\/occupancy\/current$/, handler: dashboardHandler, method: 'occupancy' },
  { pattern: /^\/api\/v1\/analytics\/reports\/saved/, handler: dashboardHandler, method: 'savedReports' },
  { pattern: /^\/api\/v1\/analytics\/dashboard/, handler: dashboardHandler },
  { pattern: /^\/api\/v1\/analytics/, handler: dashboardHandler },
  { pattern: /^\/api\/v1\/reports/, handler: dashboardHandler },

  // Calendar
  { pattern: /^\/api\/v1\/calendar/, handler: calendarHandler },

  // Bookings - check-in/checkout actions first (more specific)
  { pattern: /^\/api\/v1\/bookings\/([^/]+)\/check-in$/, handler: bookingsHandler, method: 'checkin' },
  { pattern: /^\/api\/v1\/bookings\/([^/]+)\/check-out$/, handler: bookingsHandler, method: 'checkout' },
  { pattern: /^\/api\/v1\/bookings/, handler: bookingsHandler },
  { pattern: /^\/api\/v1\/operations\/bookings/, handler: bookingsHandler },

  // Pets & Vaccinations
  { pattern: /^\/api\/v1\/entity\/pets\/vaccinations/, handler: vaccinationsHandler },
  { pattern: /^\/api\/v1\/entity\/pets\/([^/]+)\/vaccinations/, handler: vaccinationsHandler },
  { pattern: /^\/api\/v1\/entity\/pets\/([^/]+)\/owners$/, handler: petsHandler, method: 'owners' },
  { pattern: /^\/api\/v1\/entity\/pets/, handler: petsHandler },

  // Owners
  { pattern: /^\/api\/v1\/entity\/owners/, handler: ownersHandler },

  // Kennels/Facilities
  { pattern: /^\/api\/v1\/entity\/facilities/, handler: kennelsHandler },

  // Staff
  { pattern: /^\/api\/v1\/entity\/staff/, handler: staffHandler },

  // Financial
  { pattern: /^\/api\/v1\/financial\/invoices/, handler: invoicesHandler },
  { pattern: /^\/api\/v1\/financial\/payments/, handler: paymentsHandler },

  // Incidents
  { pattern: /^\/api\/v1\/incidents/, handler: incidentsHandler },

  // Tasks
  { pattern: /^\/api\/v1\/tasks/, handler: tasksHandler },
  { pattern: /^\/api\/v1\/operations\/tasks/, handler: tasksHandler },

  // Services & Packages
  { pattern: /^\/api\/v1\/services/, handler: servicesHandler },
  { pattern: /^\/api\/v1\/financial\/packages/, handler: packagesHandler },
  { pattern: /^\/api\/v1\/package-templates/, handler: packagesHandler },
  { pattern: /^\/api\/v1\/addon-services/, handler: servicesHandler, method: 'addons' },

  // Roles (for settings)
  { pattern: /^\/api\/v1\/roles/, handler: staffHandler, method: 'roles' },

  // Workflows
  { pattern: /^\/api\/v1\/workflows\/stats$/, handler: workflowsHandler, method: 'stats' },
  { pattern: /^\/api\/v1\/workflows\/templates/, handler: workflowsHandler, method: 'templates' },
  { pattern: /^\/api\/v1\/workflows\/([^/]+)\/steps$/, handler: workflowsHandler, method: 'steps' },
  { pattern: /^\/api\/v1\/workflows\/([^/]+)\/activate$/, handler: workflowsHandler, method: 'activate' },
  { pattern: /^\/api\/v1\/workflows\/([^/]+)\/pause$/, handler: workflowsHandler, method: 'pause' },
  { pattern: /^\/api\/v1\/workflows/, handler: workflowsHandler },

  // Segments
  { pattern: /^\/api\/v1\/segments\/preview$/, handler: segmentsHandler, method: 'preview' },
  { pattern: /^\/api\/v1\/segments\/refresh$/, handler: segmentsHandler, method: 'refresh' },
  { pattern: /^\/api\/v1\/segments\/([^/]+)\/members/, handler: segmentsHandler, method: 'members' },
  { pattern: /^\/api\/v1\/segments\/([^/]+)\/clone$/, handler: segmentsHandler, method: 'clone' },
  { pattern: /^\/api\/v1\/segments\/([^/]+)\/refresh$/, handler: segmentsHandler, method: 'refresh' },
  { pattern: /^\/api\/v1\/segments\/([^/]+)\/activity/, handler: segmentsHandler, method: 'activity' },
  { pattern: /^\/api\/v1\/segments/, handler: segmentsHandler },

  // Messages/Conversations
  { pattern: /^\/api\/v1\/messages\/conversations$/, handler: messagesHandler },
  { pattern: /^\/api\/v1\/messages\/unread\/count$/, handler: messagesHandler, method: 'unreadCount' },
  { pattern: /^\/api\/v1\/messages\/([^/]+)\/read$/, handler: messagesHandler, method: 'markRead' },
  { pattern: /^\/api\/v1\/messages/, handler: messagesHandler },

  // Runs (play areas) & Run Templates
  { pattern: /^\/api\/v1\/runs\/assignments/, handler: runsHandler, method: 'assignments' },
  { pattern: /^\/api\/v1\/runs/, handler: runsHandler },
  { pattern: /^\/api\/v1\/run-templates/, handler: runTemplatesHandler },

  // Direct pet/owner routes (in addition to entity routes)
  { pattern: /^\/api\/v1\/pets\/([^/]+)\/vaccinations/, handler: vaccinationsHandler },
  { pattern: /^\/api\/v1\/pets/, handler: petsHandler },
  { pattern: /^\/api\/v1\/owners\/([^/]+)\/export$/, handler: ownersHandler, method: 'export' },
  { pattern: /^\/api\/v1\/owners\/([^/]+)\/data$/, handler: ownersHandler, method: 'deleteData' },
  { pattern: /^\/api\/v1\/owners/, handler: ownersHandler },

  // Communications & Notes
  { pattern: /^\/api\/v1\/entity\/communications/, handler: configHandler, method: 'communications' },
  { pattern: /^\/api\/v1\/communications/, handler: configHandler, method: 'communications' },
  { pattern: /^\/api\/v1\/notes\/categories$/, handler: configHandler, method: 'noteCategories' },
  { pattern: /^\/api\/v1\/notes\/([^/]+)\/pin$/, handler: configHandler, method: 'pinNote' },
  { pattern: /^\/api\/v1\/notes/, handler: configHandler, method: 'notes' },

  // Documents, Files, Forms
  { pattern: /^\/api\/v1\/documents\/stats$/, handler: configHandler, method: 'documentStats' },
  { pattern: /^\/api\/v1\/documents/, handler: configHandler, method: 'documents' },
  { pattern: /^\/api\/v1\/files\/templates/, handler: configHandler, method: 'fileTemplates' },
  { pattern: /^\/api\/v1\/files\/custom/, handler: configHandler, method: 'customFiles' },
  { pattern: /^\/api\/v1\/forms\/settings$/, handler: configHandler, method: 'formSettings' },
  { pattern: /^\/api\/v1\/forms\/templates/, handler: configHandler, method: 'formTemplates' },
  { pattern: /^\/api\/v1\/forms\/([^/]+)\/duplicate$/, handler: configHandler, method: 'duplicateForm' },
  { pattern: /^\/api\/v1\/forms/, handler: configHandler, method: 'forms' },

  // Policies
  { pattern: /^\/api\/v1\/policies/, handler: configHandler, method: 'policies' },

  // Imports
  { pattern: /^\/api\/v1\/imports/, handler: configHandler, method: 'imports' },

  // Memberships (team)
  { pattern: /^\/api\/v1\/memberships\/([^/]+)\/resend-invite$/, handler: staffHandler, method: 'resendInvite' },
  { pattern: /^\/api\/v1\/memberships/, handler: staffHandler, method: 'memberships' },

  // Properties (v2)
  { pattern: /^\/api\/v2\/properties/, handler: configHandler, method: 'properties' },

  // Audit logs
  { pattern: /^\/api\/v1\/audit-logs\/summary$/, handler: configHandler, method: 'auditLogsSummary' },
  { pattern: /^\/api\/v1\/audit-logs/, handler: configHandler, method: 'auditLogs' },

  // Upload URL
  { pattern: /^\/api\/v1\/upload-url$/, handler: configHandler, method: 'uploadUrl' },
];

/**
 * Find matching route handler
 */
const findHandler = (pathname) => {
  for (const route of routes) {
    if (route.pattern.test(pathname)) {
      return route;
    }
  }
  return null;
};

/**
 * Parse the request and extract relevant info
 */
const parseRequest = (url, options = {}) => {
  const urlObj = new URL(url, window.location.origin);
  const pathname = urlObj.pathname;
  const searchParams = Object.fromEntries(urlObj.searchParams.entries());
  const method = (options.method || 'GET').toUpperCase();

  let body = null;
  if (options.body) {
    try {
      body = JSON.parse(options.body);
    } catch (e) {
      body = options.body;
    }
  }

  // Extract ID from path (e.g., /api/v1/entity/pets/123 -> 123)
  const pathParts = pathname.split('/').filter(Boolean);
  const id = pathParts[pathParts.length - 1];

  // Check if this is a detail request (ends with an ID) or a sub-resource
  // Collection names and special endpoints that should NOT be treated as IDs
  const reservedNames = [
    // Collections
    'pets', 'owners', 'bookings', 'facilities', 'staff', 'invoices', 'payments',
    'incidents', 'services', 'vaccinations', 'tasks', 'packages', 'kennels', 'workflows',
    'segments', 'messages', 'conversations', 'runs', 'run-templates',
    // Special endpoints
    'calendar', 'dashboard', 'tenant', 'settings', 'expiring', 'count', 'stats',
    'summary', 'export', 'import', 'search', 'profile', 'me', 'current', 'templates',
    'preview', 'refresh', 'clone', 'activity', 'members', 'read', 'unread', 'assignments'
  ];
  const isDetailRequest = /^[a-zA-Z0-9-]+$/.test(id) && !reservedNames.includes(id);

  return {
    pathname,
    searchParams,
    method,
    body,
    id: isDetailRequest ? id : null,
    pathParts,
  };
};

/**
 * Build response in the format apiClient expects: { data: ... }
 *
 * The apiClient.get() in demo mode returns handleDemoRequest() directly,
 * and callers expect { data: ... } format.
 */
const buildResponse = (data, status = 200) => {
  // Return the format apiClient expects
  return { data };
};

/**
 * Handle a demo API request
 *
 * @param {string} url - Full URL
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>} Mock response
 */
export const handleDemoRequest = async (url, options = {}) => {
  const request = parseRequest(url, options);
  const { pathname, method, body, id, searchParams } = request;

  console.log(`[MockAPI] ${method} ${pathname}`, { id, searchParams, body });

  // Find matching handler
  const route = findHandler(pathname);

  if (!route) {
    console.warn(`[MockAPI] No handler for: ${pathname}`);
    // Return empty success for unhandled routes
    return buildResponse({ data: [], message: 'Demo mode - endpoint not implemented' }, 200);
  }

  const handler = route.handler;
  const store = getDemoStore();

  try {
    let result;

    // Check for special method override on route (e.g., 'assignments', 'stats')
    if (route.method && handler[route.method]) {
      result = await handler[route.method]({ id, searchParams, body, store, pathname });
      return buildResponse(result.data, result.status || 200);
    }

    // Determine which handler method to call based on HTTP method and path
    switch (method) {
      case 'GET':
        if (id && handler.detail) {
          result = await handler.detail({ id, searchParams, store, pathname });
        } else if (handler.list) {
          result = await handler.list({ searchParams, store, pathname });
        } else {
          result = { data: [], status: 200 };
        }
        break;

      case 'POST':
        // Check for special actions in the path
        if (pathname.includes('/checkin') && handler.checkin) {
          result = await handler.checkin({ id: id || pathname.split('/').slice(-2)[0], body, store });
        } else if (pathname.includes('/checkout') && handler.checkout) {
          result = await handler.checkout({ id: id || pathname.split('/').slice(-2)[0], body, store });
        } else if (pathname.includes('/send') && handler.send) {
          result = await handler.send({ id: pathname.split('/').slice(-2)[0], body, store });
        } else if (pathname.includes('/void') && handler.void) {
          result = await handler.void({ id: pathname.split('/').slice(-2)[0], body, store });
        } else if (pathname.includes('/refund') && handler.refund) {
          result = await handler.refund({ id: pathname.split('/').slice(-2)[0], body, store });
        } else if (handler.create) {
          result = await handler.create({ body, store, pathname });
        } else {
          result = { data: body, status: 201 };
        }
        break;

      case 'PUT':
        if (handler.update) {
          result = await handler.update({ id, body, store, pathname });
        } else {
          result = { data: { ...body, id }, status: 200 };
        }
        break;

      case 'PATCH':
        if (handler.patch) {
          result = await handler.patch({ id, body, store, pathname });
        } else if (handler.update) {
          result = await handler.update({ id, body, store, pathname });
        } else {
          result = { data: { ...body, id }, status: 200 };
        }
        break;

      case 'DELETE':
        if (handler.delete) {
          result = await handler.delete({ id, store, pathname });
        } else {
          result = { data: null, status: 204 };
        }
        break;

      default:
        result = { data: null, status: 405 };
    }

    return buildResponse(result.data, result.status || 200);

  } catch (error) {
    console.error('[MockAPI] Handler error:', error);
    return buildResponse({ error: error.message }, 500);
  }
};

export default {
  isDemoMode,
  handleDemoRequest,
};
