/**
 * Vaccinations Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

const expandVaccination = (vaccination, store) => {
  const pet = store.getById('pets', vaccination.petId);

  // Get owner through petOwners junction table
  let owner = null;
  if (pet) {
    const petOwners = store.getCollection('petOwners');
    const petOwner = petOwners.find(po =>
      po.petId === pet.id ||
      po.petId === pet.recordId ||
      po.petId === vaccination.petId
    );
    if (petOwner) {
      owner = store.getById('owners', petOwner.ownerId);
    }
  }

  return {
    ...vaccination,
    pet: pet || { name: 'Unknown', id: vaccination.petId },
    owner: owner || { firstName: 'Unknown', lastName: '', id: null },
    petName: pet?.name || 'Unknown',
    petSpecies: pet?.species || 'Dog',
    petBreed: pet?.breed || '',
    ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Unknown',
    ownerFirstName: owner?.firstName || '',
    ownerLastName: owner?.lastName || '',
    ownerEmail: owner?.email || '',
    ownerPhone: owner?.phone || '',
  };
};

export const list = ({ searchParams, store, pathname }) => {
  let vaccinations = store.getCollection('vaccinations');

  // Check if this is for a specific pet
  const petIdMatch = pathname.match(/\/pets\/([^/]+)\/vaccinations/);
  if (petIdMatch) {
    const petId = petIdMatch[1];
    vaccinations = vaccinations.filter(v => v.petId === petId);
  }

  // Check for expiring filter
  if (pathname.includes('/expiring') || searchParams.expiring) {
    const now = new Date();
    // Support both 'days' and 'daysAhead' param names
    const daysAhead = parseInt(searchParams.daysAhead, 10) || parseInt(searchParams.days, 10) || 30;
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    vaccinations = vaccinations.filter(v => {
      const expiresAt = new Date(v.expiresAt);
      return expiresAt >= now && expiresAt <= futureDate;
    });
  }

  // Apply other filters
  vaccinations = filterItems(vaccinations, searchParams, {
    petId: (v, val) => v.petId === val,
    type: (v, val) => v.type?.toLowerCase().includes(val.toLowerCase()),
  });

  // Filter by status
  if (searchParams.status) {
    const now = new Date();
    switch (searchParams.status.toUpperCase()) {
      case 'EXPIRED':
        vaccinations = vaccinations.filter(v => new Date(v.expiresAt) < now);
        break;
      case 'EXPIRING':
        const thirtyDays = new Date(now);
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        vaccinations = vaccinations.filter(v => {
          const exp = new Date(v.expiresAt);
          return exp >= now && exp <= thirtyDays;
        });
        break;
      case 'CURRENT':
        vaccinations = vaccinations.filter(v => new Date(v.expiresAt) > now);
        break;
    }
  }

  // Expand with pet info
  vaccinations = vaccinations.map(v => expandVaccination(v, store));

  // Sort by expiration date
  vaccinations.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));

  return buildListResponse(vaccinations, searchParams);
};

export const detail = ({ id, store }) => {
  const vaccination = store.getById('vaccinations', id);
  if (!vaccination) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandVaccination(vaccination, store));
};

export const create = ({ body, store, pathname }) => {
  // Extract petId from path if present
  const petIdMatch = pathname.match(/\/pets\/([^/]+)\/vaccinations/);
  const petId = body.petId || (petIdMatch ? petIdMatch[1] : null);

  const newVaccination = store.insert('vaccinations', {
    ...body,
    petId,
    status: 'CURRENT',
  });

  return buildCreateResponse(expandVaccination(newVaccination, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('vaccinations', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }
  return buildUpdateResponse(expandVaccination(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('vaccinations', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

// Renew a vaccination (create new one from existing)
export const renew = ({ id, body, store }) => {
  const existing = store.getById('vaccinations', id);
  if (!existing) {
    return { data: { error: 'Vaccination not found' }, status: 404 };
  }

  const newVaccination = store.insert('vaccinations', {
    petId: existing.petId,
    type: existing.type,
    provider: body.provider || existing.provider,
    administeredAt: body.administeredAt || new Date().toISOString(),
    expiresAt: body.expiresAt,
    lotNumber: body.lotNumber,
    notes: body.notes,
    status: 'CURRENT',
    renewedFromId: existing.id,
  });

  // Mark old one as renewed
  store.update('vaccinations', id, { status: 'RENEWED' });

  return buildCreateResponse(expandVaccination(newVaccination, store));
};

export default { list, detail, create, update, patch, delete: remove, renew };
