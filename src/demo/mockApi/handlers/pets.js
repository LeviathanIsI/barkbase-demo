/**
 * Pets Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

const expandPet = (pet, store) => {
  // Get owners through petOwners junction table
  const petOwners = store.getCollection('petOwners')
    .filter(po => po.petId === pet.id || po.petId === pet.recordId);
  const ownerData = petOwners.map(po => {
    const owner = store.getById('owners', po.ownerId);
    return owner ? { ...owner, isPrimary: po.isPrimary } : null;
  }).filter(Boolean);

  // Get primary owner
  const primaryOwnerLink = petOwners.find(po => po.isPrimary);
  const primaryOwner = primaryOwnerLink ? store.getById('owners', primaryOwnerLink.ownerId) : ownerData[0];

  // Get vaccinations
  const vaccinations = store.getCollection('vaccinations')
    .filter(v => v.petId === pet.id || v.petId === pet.recordId)
    .sort((a, b) => new Date(b.administeredAt) - new Date(a.administeredAt));

  // Get recent bookings
  const bookingPets = store.getCollection('bookingPets')
    .filter(bp => bp.petId === pet.id || bp.petId === pet.recordId);
  const bookingIds = bookingPets.map(bp => bp.bookingId);
  const bookings = store.getCollection('bookings')
    .filter(b => bookingIds.includes(b.id) || bookingIds.includes(b.recordId))
    .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
    .slice(0, 5);

  return {
    ...pet,
    owners: ownerData,
    owner: primaryOwner,
    vaccinations,
    recentBookings: bookings,
  };
};

export const list = ({ searchParams, store }) => {
  let pets = store.getCollection('pets');

  // Apply filters
  pets = filterItems(pets, searchParams, {
    species: (p, val) => p.species?.toLowerCase() === val.toLowerCase(),
    breed: (p, val) => p.breed?.toLowerCase().includes(val.toLowerCase()),
    ownerId: (p, val) => {
      const petOwners = store.getCollection('petOwners');
      return petOwners.some(po =>
        (po.petId === p.id || po.petId === p.recordId) &&
        (po.ownerId === val)
      );
    },
  });

  // Search by name
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    pets = pets.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.breed?.toLowerCase().includes(search)
    );
  }

  // Filter active only by default
  if (searchParams.isActive !== 'false' && searchParams.status !== 'all') {
    pets = pets.filter(p => p.isActive !== false && p.status !== 'INACTIVE' && p.status !== 'DECEASED');
  }

  // Always expand with owner info - UI expects flat fields
  pets = pets.map(p => {
    const petOwners = store.getCollection('petOwners')
      .filter(po => po.petId === p.id || po.petId === p.recordId);
    const primaryOwnerLink = petOwners.find(po => po.isPrimary) || petOwners[0];
    const owner = primaryOwnerLink ? store.getById('owners', primaryOwnerLink.ownerId) : null;

    // Build owners array with expanded owner data
    const owners = petOwners.map(po => {
      const ownerData = store.getById('owners', po.ownerId);
      return ownerData ? { ...ownerData, isPrimary: po.isPrimary } : null;
    }).filter(Boolean);

    return {
      ...p,
      owner,
      owners,
      // Normalize status to lowercase for UI (expects 'active' not 'ACTIVE')
      status: (p.status || 'ACTIVE').toLowerCase(),
      // Flat fields for UI compatibility
      ownerFirstName: owner?.firstName || '',
      ownerLastName: owner?.lastName || '',
      ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'No owner',
      ownerEmail: owner?.email || '',
      ownerPhone: owner?.phone || '',
      ownerId: owner?.id || owner?.recordId || null,
    };
  });

  // Sort by name
  pets.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return buildListResponse(pets, searchParams);
};

export const detail = ({ id, store }) => {
  const pet = store.getById('pets', id);
  if (!pet) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandPet(pet, store));
};

export const create = ({ body, store }) => {
  const newPet = store.insert('pets', {
    ...body,
    isActive: true,
    status: 'ACTIVE',
  });

  // If ownerIds provided, create petOwner entries
  const ownerIds = body.ownerIds || (body.ownerId ? [body.ownerId] : []);
  ownerIds.forEach((ownerId, index) => {
    store.insert('petOwners', {
      petId: newPet.id,
      ownerId,
      isPrimary: index === 0,
    });
  });

  return buildCreateResponse(expandPet(newPet, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('pets', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }

  // Update petOwners if ownerIds changed
  if (body.ownerIds) {
    // Remove old entries
    const petOwners = store.getCollection('petOwners');
    const oldEntries = petOwners.filter(po => po.petId === id);
    oldEntries.forEach(entry => store.delete('petOwners', entry.id));

    // Add new entries
    body.ownerIds.forEach((ownerId, index) => {
      store.insert('petOwners', {
        petId: id,
        ownerId,
        isPrimary: index === 0,
      });
    });
  }

  return buildUpdateResponse(expandPet(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  // Also remove petOwner and bookingPet entries
  const petOwners = store.getCollection('petOwners');
  petOwners.filter(po => po.petId === id).forEach(entry => store.delete('petOwners', entry.id));

  const bookingPets = store.getCollection('bookingPets');
  bookingPets.filter(bp => bp.petId === id).forEach(entry => store.delete('bookingPets', entry.id));

  const success = store.delete('pets', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

/**
 * Get owners for a specific pet
 * Handles: GET /api/v1/entity/pets/{petId}/owners
 */
export const owners = ({ id, pathname, store }) => {
  // Extract petId from pathname: /api/v1/entity/pets/{petId}/owners
  const pathParts = pathname.split('/').filter(Boolean);
  const ownersIndex = pathParts.indexOf('owners');
  const petId = ownersIndex > 0 ? pathParts[ownersIndex - 1] : id;

  if (!petId) {
    return buildListResponse([]);
  }

  // Get owners through petOwners junction table
  const petOwners = store.getCollection('petOwners')
    .filter(po => po.petId === petId);

  const ownerData = petOwners.map(po => {
    const owner = store.getById('owners', po.ownerId);
    if (!owner) return null;
    return {
      ...owner,
      isPrimary: po.isPrimary,
      is_primary: po.isPrimary, // Include both formats for compatibility
      relationship: po.relationship || 'owner',
    };
  }).filter(Boolean);

  return buildListResponse(ownerData);
};

export default { list, detail, create, update, patch, delete: remove, owners };
