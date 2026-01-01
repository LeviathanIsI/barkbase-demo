/**
 * Owners Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

const expandOwner = (owner, store) => {
  // Get pets through petOwners junction table
  const petOwners = store.getCollection('petOwners')
    .filter(po => po.ownerId === owner.id || po.ownerId === owner.recordId);
  const petIds = petOwners.map(po => po.petId);
  const pets = petIds.map(id => store.getById('pets', id)).filter(Boolean);

  // Get recent bookings
  const bookings = store.getCollection('bookings')
    .filter(b => b.ownerId === owner.id || b.ownerId === owner.recordId)
    .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
    .slice(0, 5);

  return {
    ...owner,
    pets,
    recentBookings: bookings,
    petCount: pets.length,
  };
};

export const list = ({ searchParams, store }) => {
  let owners = store.getCollection('owners');

  // Apply filters
  owners = filterItems(owners, searchParams, {
    email: (o, val) => o.email?.toLowerCase().includes(val.toLowerCase()),
    phone: (o, val) => o.phone?.includes(val),
  });

  // Search by name
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    owners = owners.filter(o =>
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(search) ||
      o.email?.toLowerCase().includes(search) ||
      o.phone?.includes(search)
    );
  }

  // Filter active only by default
  if (searchParams.isActive !== 'false') {
    owners = owners.filter(o => o.isActive !== false);
  }

  // Expand with pets if requested
  if (searchParams.include?.includes('pets') || searchParams.expand?.includes('pets')) {
    owners = owners.map(o => expandOwner(o, store));
  }

  // Sort by name
  owners.sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  return buildListResponse(owners, searchParams);
};

export const detail = ({ id, store }) => {
  const owner = store.getById('owners', id);
  if (!owner) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandOwner(owner, store));
};

export const create = ({ body, store }) => {
  const newOwner = store.insert('owners', {
    ...body,
    isActive: true,
    tags: body.tags || [],
  });

  // If petIds provided, create petOwner entries
  if (body.petIds && body.petIds.length > 0) {
    body.petIds.forEach(petId => {
      store.insert('petOwners', {
        ownerId: newOwner.id,
        petId,
        isPrimary: true,
      });
    });
  }

  return buildCreateResponse(expandOwner(newOwner, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('owners', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }
  return buildUpdateResponse(expandOwner(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  // Also remove petOwner entries
  const petOwners = store.getCollection('petOwners');
  const entries = petOwners.filter(po => po.ownerId === id);
  entries.forEach(entry => store.delete('petOwners', entry.id));

  const success = store.delete('owners', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

/**
 * Export owner data (GDPR/data export)
 */
export const exportData = ({ id, store }) => {
  const owner = store.getById('owners', id);
  if (!owner) {
    return { data: { error: 'Owner not found' }, status: 404 };
  }

  const expanded = expandOwner(owner, store);

  // Get all bookings
  const allBookings = store.getCollection('bookings')
    .filter(b => b.ownerId === id);

  // Get all invoices
  const invoices = store.getCollection('invoices')
    .filter(i => i.ownerId === id);

  return {
    data: {
      owner: expanded,
      bookings: allBookings,
      invoices,
      exportedAt: new Date().toISOString(),
    },
    status: 200,
  };
};

// Alias for route matching
export { exportData as export };

/**
 * Delete owner data (GDPR right to erasure)
 */
export const deleteData = ({ id, store }) => {
  const owner = store.getById('owners', id);
  if (!owner) {
    return { data: { error: 'Owner not found' }, status: 404 };
  }

  // In demo mode, just return success without actually deleting
  return {
    data: { success: true, message: 'Owner data deletion initiated' },
    status: 200,
  };
};

export default { list, detail, create, update, patch, delete: remove, export: exportData, deleteData };
