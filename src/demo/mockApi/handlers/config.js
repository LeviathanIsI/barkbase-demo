/**
 * Config Handler - Tenant and settings endpoints
 */

import { DEMO_TENANT, DEMO_USER } from '../../config';

// In-memory storage for configurable settings
let _kennelTypes = ['Standard', 'Suite', 'Luxury', 'Cat', 'Isolation'];
let _privacySettings = { dataRetentionDays: 365, anonymizeAfterDays: 730 };
let _brandingSettings = { primaryColor: '#f59e0b', logoUrl: null };
let _accountDefaults = { timezone: 'America/New_York', currency: 'USD', dateFormat: 'MM/DD/YYYY' };

export const list = ({ store }) => {
  const tenant = store.getTenant() || DEMO_TENANT;

  return {
    data: {
      ...tenant,
      features: {
        vaccinations: true,
        incidents: true,
        invoicing: true,
        payments: true,
        packages: true,
        reports: true,
        workflows: true,
        customFields: true,
        onlineBooking: true,
        sms: true,
        email: true,
      },
    },
    status: 200,
  };
};

export const detail = list;

export const update = ({ body }) => {
  // Generic update for tenant config
  return { data: { ...DEMO_TENANT, ...body }, status: 200 };
};

export const me = () => {
  return {
    data: {
      user: DEMO_USER,
      tenant: DEMO_TENANT,
      memberships: [{
        tenantId: DEMO_TENANT.id,
        role: 'ADMIN',
        isOwner: true,
      }],
    },
    status: 200,
  };
};

export const kennelTypes = ({ body, searchParams }, method) => {
  // GET - return kennel types
  if (!body) {
    return { data: { kennelTypes: _kennelTypes }, status: 200 };
  }
  // PUT - update kennel types
  if (body.kennelTypes) {
    _kennelTypes = body.kennelTypes;
  }
  return { data: { kennelTypes: _kennelTypes }, status: 200 };
};

export const privacy = ({ body }) => {
  if (!body) {
    return { data: _privacySettings, status: 200 };
  }
  _privacySettings = { ..._privacySettings, ...body };
  return { data: _privacySettings, status: 200 };
};

export const branding = ({ body }) => {
  if (!body) {
    return { data: _brandingSettings, status: 200 };
  }
  _brandingSettings = { ..._brandingSettings, ...body };
  return { data: _brandingSettings, status: 200 };
};

export const accountDefaults = ({ body }) => {
  if (!body) {
    return { data: _accountDefaults, status: 200 };
  }
  Object.assign(_accountDefaults, body);
  return { data: _accountDefaults, status: 200 };
};

export const mfa = ({ body }) => {
  // GET - MFA status
  if (!body) {
    return { data: { enabled: false, method: null }, status: 200 };
  }
  // POST - setup/verify MFA (demo always succeeds)
  return { data: { success: true, enabled: true }, status: 200 };
};

export const connectedEmail = ({ body }) => {
  // GET - connected email status
  if (!body) {
    return { data: { connected: false, email: null }, status: 200 };
  }
  return { data: { success: true }, status: 200 };
};

export const settings = ({ body, pathname }) => {
  // Generic settings endpoint - return success
  if (!body) {
    return { data: {}, status: 200 };
  }
  return { data: body, status: 200 };
};

// Communications
export const communications = ({ body, searchParams }) => {
  if (!body) {
    return { data: [], status: 200 };
  }
  return { data: { id: 'comm-new', ...body, sentAt: new Date().toISOString() }, status: 201 };
};

// Notes
let _demoNotes = [];
let _noteCategories = ['General', 'Medical', 'Behavioral', 'Billing'];

export const notes = ({ body, id, pathname }) => {
  if (!body) {
    return { data: _demoNotes, status: 200 };
  }
  if (id) {
    // Update
    const idx = _demoNotes.findIndex(n => n.id === id);
    if (idx >= 0) {
      _demoNotes[idx] = { ..._demoNotes[idx], ...body };
      return { data: _demoNotes[idx], status: 200 };
    }
  }
  // Create
  const newNote = { id: `note-${Date.now()}`, ...body, createdAt: new Date().toISOString() };
  _demoNotes.push(newNote);
  return { data: newNote, status: 201 };
};

export const noteCategories = ({ body }) => {
  if (!body) {
    return { data: { categories: _noteCategories }, status: 200 };
  }
  if (body.categories) {
    _noteCategories = body.categories;
  }
  return { data: { categories: _noteCategories }, status: 200 };
};

export const pinNote = ({ id }) => {
  return { data: { id, pinned: true }, status: 200 };
};

// Documents
let demoDocuments = [
  { id: 'doc-1', name: 'Boarding Agreement', type: 'contract', status: 'active', createdAt: new Date().toISOString() },
  { id: 'doc-2', name: 'Vaccination Policy', type: 'policy', status: 'active', createdAt: new Date().toISOString() },
];

export const documents = ({ body, id }) => {
  if (!body) {
    return { data: demoDocuments, status: 200 };
  }
  return { data: { id: id || `doc-${Date.now()}`, ...body }, status: body ? 201 : 200 };
};

export const documentStats = () => {
  return { data: { total: demoDocuments.length, active: demoDocuments.length, drafts: 0 }, status: 200 };
};

// File templates
let _fileTemplates = [
  { id: 'tpl-1', name: 'Boarding Contract', type: 'contract', autoAttach: true, status: 'active' },
  { id: 'tpl-2', name: 'Vaccination Record', type: 'medical', autoAttach: false, status: 'active' },
];

export const fileTemplates = ({ body, id, pathname }) => {
  if (!body) {
    return { data: _fileTemplates, status: 200 };
  }
  if (id) {
    const idx = _fileTemplates.findIndex(t => t.id === id);
    if (idx >= 0) {
      _fileTemplates[idx] = { ..._fileTemplates[idx], ...body };
      return { data: _fileTemplates[idx], status: 200 };
    }
  }
  const newTemplate = { id: `tpl-${Date.now()}`, ...body };
  _fileTemplates.push(newTemplate);
  return { data: newTemplate, status: 201 };
};

export const customFiles = ({ body }) => {
  if (!body) {
    return { data: [], status: 200 };
  }
  return { data: { id: `file-${Date.now()}`, ...body }, status: 201 };
};

// Forms
let _demoForms = [
  { id: 'form-1', name: 'New Client Intake', type: 'intake', status: 'active', responseCount: 42 },
  { id: 'form-2', name: 'Pet Information', type: 'pet', status: 'active', responseCount: 156 },
];
let _formSettings = { requireSignature: true, sendConfirmation: true };

export const forms = ({ body, id }) => {
  if (!body) {
    return { data: _demoForms, status: 200 };
  }
  return { data: { id: id || `form-${Date.now()}`, ...body }, status: 201 };
};

export const formSettings = ({ body }) => {
  if (!body) {
    return { data: _formSettings, status: 200 };
  }
  Object.assign(_formSettings, body);
  return { data: _formSettings, status: 200 };
};

export const formTemplates = () => {
  return { data: [
    { id: 'ftpl-1', name: 'Basic Intake Form', category: 'intake' },
    { id: 'ftpl-2', name: 'Pet Health Questionnaire', category: 'health' },
  ], status: 200 };
};

export const duplicateForm = ({ id }) => {
  const form = _demoForms.find(f => f.id === id);
  const newForm = { ...form, id: `form-${Date.now()}`, name: `Copy of ${form?.name || 'Form'}` };
  _demoForms.push(newForm);
  return { data: newForm, status: 201 };
};

// Policies
let demoPolicies = [
  { id: 'policy-1', name: 'Cancellation Policy', type: 'cancellation', content: 'Cancel 24 hours before...', isActive: true },
  { id: 'policy-2', name: 'Vaccination Requirements', type: 'vaccination', content: 'All pets must be current...', isActive: true },
];

export const policies = ({ body, id }) => {
  if (!body) {
    return { data: demoPolicies, status: 200 };
  }
  if (id) {
    const idx = demoPolicies.findIndex(p => p.id === id);
    if (idx >= 0) {
      demoPolicies[idx] = { ...demoPolicies[idx], ...body };
      return { data: demoPolicies[idx], status: 200 };
    }
  }
  const newPolicy = { id: `policy-${Date.now()}`, ...body };
  demoPolicies.push(newPolicy);
  return { data: newPolicy, status: 201 };
};

// Imports
let demoImports = [];

export const imports = ({ body, id, searchParams }) => {
  if (!body && id) {
    const imp = demoImports.find(i => i.id === id);
    return { data: imp || { id, status: 'completed', rows: 0 }, status: 200 };
  }
  if (!body) {
    return { data: demoImports, status: 200 };
  }
  const newImport = { id: `import-${Date.now()}`, status: 'processing', ...body };
  demoImports.push(newImport);
  return { data: newImport, status: 201 };
};

// Properties (v2)
export const properties = ({ body, id, searchParams }) => {
  const objectType = searchParams?.objectType || 'pet';
  const demoProperties = [
    { id: 'prop-1', objectType, name: 'Custom Field 1', type: 'text', isRequired: false },
    { id: 'prop-2', objectType, name: 'Custom Field 2', type: 'select', isRequired: false, options: ['A', 'B', 'C'] },
  ];

  if (!body) {
    return { data: demoProperties, status: 200 };
  }
  if (id) {
    return { data: { id, ...body }, status: 200 };
  }
  return { data: { id: `prop-${Date.now()}`, ...body }, status: 201 };
};

// Audit logs
export const auditLogs = ({ searchParams }) => {
  return { data: [
    { id: 'log-1', action: 'booking.created', userId: 'demo-user-001', timestamp: new Date().toISOString() },
    { id: 'log-2', action: 'pet.updated', userId: 'demo-user-001', timestamp: new Date().toISOString() },
  ], status: 200 };
};

export const auditLogsSummary = () => {
  return { data: { total: 100, today: 12, thisWeek: 45 }, status: 200 };
};

// Upload URL
export const uploadUrl = ({ body }) => {
  return { data: {
    uploadUrl: 'https://demo-bucket.s3.amazonaws.com/upload?presigned=true',
    key: `uploads/${Date.now()}-${body?.fileName || 'file'}`,
    publicUrl: `https://demo-bucket.s3.amazonaws.com/uploads/${Date.now()}-${body?.fileName || 'file'}`,
  }, status: 200 };
};

export default {
  list, detail, update, me, kennelTypes, privacy, branding, accountDefaults, mfa, connectedEmail, settings,
  communications, notes, noteCategories, pinNote,
  documents, documentStats, fileTemplates, customFiles,
  forms, formSettings, formTemplates, duplicateForm,
  policies, imports, properties, auditLogs, auditLogsSummary, uploadUrl,
};
