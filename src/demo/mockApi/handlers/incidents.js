/**
 * Incidents Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

const expandIncident = (incident, store) => {
  const pet = incident.petId ? store.getById('pets', incident.petId) : null;
  const booking = incident.bookingId ? store.getById('bookings', incident.bookingId) : null;
  const reportedBy = incident.reportedBy ? store.getById('staff', incident.reportedBy) : null;
  const resolvedBy = incident.resolvedBy ? store.getById('staff', incident.resolvedBy) : null;

  // Get owner through pet
  let owner = null;
  if (pet) {
    const petOwners = store.getCollection('petOwners')
      .filter(po => po.petId === pet.id || po.petId === pet.recordId);
    const primaryOwnerLink = petOwners.find(po => po.isPrimary) || petOwners[0];
    owner = primaryOwnerLink ? store.getById('owners', primaryOwnerLink.ownerId) : null;
  }

  return {
    ...incident,
    pet,
    owner,
    booking,
    reportedByStaff: reportedBy,
    resolvedByStaff: resolvedBy,
  };
};

export const list = ({ searchParams, store }) => {
  let incidents = store.getCollection('incidents');

  // Apply filters
  incidents = filterItems(incidents, searchParams, {
    petId: (i, val) => i.petId === val,
    ownerId: (i, val) => {
      if (!i.petId) return false;
      const petOwners = store.getCollection('petOwners');
      return petOwners.some(po => po.petId === i.petId && po.ownerId === val);
    },
    severity: (i, val) => i.severity?.toUpperCase() === val.toUpperCase(),
    type: (i, val) => i.incidentType?.toLowerCase().includes(val.toLowerCase()),
  });

  // Status filter
  if (searchParams.status) {
    const statuses = searchParams.status.split(',').map(s => s.toUpperCase());
    incidents = incidents.filter(i => statuses.includes(i.status?.toUpperCase()));
  }

  // Expand with relations
  incidents = incidents.map(i => expandIncident(i, store));

  // Sort by date descending
  incidents.sort((a, b) => new Date(b.incidentDate || b.createdAt) - new Date(a.incidentDate || a.createdAt));

  // Return nested format that UI expects: { data: { data: [...] } }
  return {
    data: { data: incidents },
    status: 200,
  };
};

export const detail = ({ id, store }) => {
  const incident = store.getById('incidents', id);
  if (!incident) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandIncident(incident, store));
};

export const create = ({ body, store }) => {
  const newIncident = store.insert('incidents', {
    ...body,
    status: body.status || 'OPEN',
    severity: body.severity || 'LOW',
    incidentDate: body.incidentDate || new Date().toISOString(),
    reportedBy: body.reportedBy || 'demo-user-001',
  });

  return buildCreateResponse(expandIncident(newIncident, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('incidents', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }
  return buildUpdateResponse(expandIncident(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('incidents', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

// Resolve incident
export const resolve = ({ id, body, store }) => {
  const now = new Date().toISOString();
  const updated = store.update('incidents', id, {
    status: 'RESOLVED',
    resolvedAt: now,
    resolvedBy: body?.staffId || 'demo-user-001',
    resolutionNotes: body?.resolutionNotes || body?.notes,
  });

  if (!updated) {
    return { data: { error: 'Incident not found' }, status: 404 };
  }

  return { data: expandIncident(updated, store), status: 200 };
};

export default { list, detail, create, update, patch, delete: remove, resolve };
