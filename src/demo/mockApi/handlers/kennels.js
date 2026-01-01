/**
 * Kennels (Facilities) Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

const expandKennel = (kennel, store) => {
  // Get current bookings for this kennel (CHECKED_IN status)
  const bookings = store.getCollection('bookings')
    .filter(b =>
      (b.kennelId === kennel.id || b.kennelId === kennel.recordId) &&
      b.status === 'CHECKED_IN'
    );

  // Calculate current occupancy
  const occupied = bookings.length;
  const capacity = kennel.maxOccupancy || kennel.capacity || 1;

  // Get pet details for current guests
  const currentPets = bookings.map(booking => {
    // Get pets from bookingPets junction table
    const bookingPets = store.getCollection('bookingPets')
      .filter(bp => bp.bookingId === booking.id || bp.bookingId === booking.recordId);

    const petIds = bookingPets.map(bp => bp.petId);
    const pets = petIds.map(petId => store.getById('pets', petId)).filter(Boolean);

    // Get owner
    const owner = booking.ownerId ? store.getById('owners', booking.ownerId) : null;

    return pets.map(pet => ({
      name: pet.name,
      breed: pet.breed,
      ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : null,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      serviceType: booking.serviceType || 'Boarding',
    }));
  }).flat();

  // Check for future reservations (CONFIRMED bookings)
  const futureBookings = store.getCollection('bookings')
    .filter(b =>
      (b.kennelId === kennel.id || b.kennelId === kennel.recordId) &&
      b.status === 'CONFIRMED'
    );
  const hasReservation = futureBookings.length > 0;

  return {
    ...kennel,
    // Use field names the frontend expects
    occupied,
    capacity,
    currentOccupancy: occupied,
    maxOccupancy: capacity,
    availableSlots: Math.max(0, capacity - occupied),
    isAvailable: occupied < capacity,
    currentBookings: bookings,
    currentPets,
    hasReservation,
    reservations: futureBookings,
  };
};

export const list = ({ searchParams, store }) => {
  let kennels = store.getCollection('kennels');

  // Apply filters
  // Note: UI passes type=kennel as a category marker, not as a filter for the kennel type field
  kennels = filterItems(kennels, searchParams, {
    size: (k, val) => k.size?.toUpperCase() === val.toUpperCase(),
    type: (k, val) => {
      // Ignore 'kennel' as it's just a category marker from the UI
      if (val.toLowerCase() === 'kennel') return true;
      return k.type?.toLowerCase().includes(val.toLowerCase());
    },
    location: (k, val) => k.location?.toLowerCase().includes(val.toLowerCase()),
  });

  // Filter active only by default
  if (searchParams.isActive !== 'false') {
    kennels = kennels.filter(k => k.isActive !== false);
  }

  // Always expand kennels with occupancy data
  kennels = kennels.map(k => expandKennel(k, store));

  // Filter to available only if requested
  if (searchParams.available === 'true') {
    kennels = kennels.filter(k => k.isAvailable);
  }

  // Sort by name
  kennels.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return buildListResponse(kennels, searchParams);
};

export const detail = ({ id, store }) => {
  const kennel = store.getById('kennels', id);
  if (!kennel) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandKennel(kennel, store));
};

export const create = ({ body, store }) => {
  const newKennel = store.insert('kennels', {
    ...body,
    isActive: true,
    maxOccupancy: body.maxOccupancy || body.capacity || 1,
  });

  return buildCreateResponse(expandKennel(newKennel, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('kennels', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }
  return buildUpdateResponse(expandKennel(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('kennels', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

export default { list, detail, create, update, patch, delete: remove };
