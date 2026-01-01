/**
 * Bookings Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
  expandRelations,
  dateRangeFilter,
} from '../utils';

const expandBooking = (booking, store) => {
  // Get pets through bookingPets junction table
  const bookingPets = store.getCollection('bookingPets')
    .filter(bp => bp.bookingId === booking.id || bp.bookingId === booking.recordId);
  const petIds = bookingPets.map(bp => bp.petId);
  const pets = petIds.map(id => store.getById('pets', id)).filter(Boolean);

  // Get owner
  const owner = booking.ownerId ? store.getById('owners', booking.ownerId) : null;

  // Get kennel
  const kennel = booking.kennelId ? store.getById('kennels', booking.kennelId) : null;

  // Get service
  const service = booking.serviceId ? store.getById('services', booking.serviceId) : null;

  return {
    ...booking,
    pets,
    pet: pets[0] || null, // For backwards compatibility
    owner,
    kennel,
    service,
    serviceName: service?.name || booking.serviceName,
    kennelName: kennel?.name || booking.kennelName,
  };
};

export const list = ({ searchParams, store }) => {
  let bookings = store.getCollection('bookings');

  // Date range filters
  if (searchParams.from || searchParams.startDate) {
    const fromDate = new Date(searchParams.from || searchParams.startDate);
    bookings = bookings.filter(b => new Date(b.checkOut) >= fromDate);
  }

  if (searchParams.to || searchParams.endDate) {
    const toDate = new Date(searchParams.to || searchParams.endDate);
    bookings = bookings.filter(b => new Date(b.checkIn) <= toDate);
  }

  // Status filter
  if (searchParams.status) {
    const statuses = searchParams.status.split(',').map(s => s.toUpperCase());
    bookings = bookings.filter(b => statuses.includes(b.status?.toUpperCase()));
  }

  // Pet filter
  if (searchParams.petId) {
    const bookingPets = store.getCollection('bookingPets');
    const bookingIds = bookingPets
      .filter(bp => bp.petId === searchParams.petId)
      .map(bp => bp.bookingId);
    bookings = bookings.filter(b => bookingIds.includes(b.id) || bookingIds.includes(b.recordId));
  }

  // Owner filter
  if (searchParams.ownerId) {
    bookings = bookings.filter(b => b.ownerId === searchParams.ownerId);
  }

  // Kennel filter
  if (searchParams.kennelId) {
    bookings = bookings.filter(b => b.kennelId === searchParams.kennelId);
  }

  // Expand relations
  const expanded = bookings.map(b => expandBooking(b, store));

  // Sort by check-in date descending by default
  expanded.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

  return buildListResponse(expanded, searchParams);
};

export const detail = ({ id, store }) => {
  const booking = store.getById('bookings', id);
  if (!booking) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandBooking(booking, store));
};

export const create = ({ body, store }) => {
  const now = new Date().toISOString();

  const newBooking = store.insert('bookings', {
    ...body,
    status: body.status || 'PENDING',
    totalPriceCents: body.totalPriceCents || body.totalCents || 0,
    depositCents: body.depositCents || 0,
    createdAt: now,
    updatedAt: now,
  });

  // Create bookingPets entries if petIds provided
  const petIds = body.petIds || (body.petId ? [body.petId] : []);
  petIds.forEach(petId => {
    store.insert('bookingPets', {
      bookingId: newBooking.id,
      petId,
    });
  });

  return buildCreateResponse(expandBooking(newBooking, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('bookings', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }

  // Update bookingPets if petIds changed
  if (body.petIds) {
    // Remove old entries
    const bookingPets = store.getCollection('bookingPets');
    const oldEntries = bookingPets.filter(bp => bp.bookingId === id);
    oldEntries.forEach(entry => store.delete('bookingPets', entry.id));

    // Add new entries
    body.petIds.forEach(petId => {
      store.insert('bookingPets', {
        bookingId: id,
        petId,
      });
    });
  }

  return buildUpdateResponse(expandBooking(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  // Also remove bookingPets entries
  const bookingPets = store.getCollection('bookingPets');
  const entries = bookingPets.filter(bp => bp.bookingId === id);
  entries.forEach(entry => store.delete('bookingPets', entry.id));

  const success = store.delete('bookings', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

export const checkin = ({ id, body, store }) => {
  const now = new Date().toISOString();
  const updated = store.update('bookings', id, {
    status: 'CHECKED_IN',
    checkedInAt: now,
    checkedInBy: body?.staffId || 'demo-user-001',
  });

  if (!updated) {
    return { data: { error: 'Booking not found' }, status: 404 };
  }

  return { data: expandBooking(updated, store), status: 200 };
};

export const checkout = ({ id, body, store }) => {
  const now = new Date().toISOString();
  const updated = store.update('bookings', id, {
    status: 'CHECKED_OUT',
    checkedOutAt: now,
    checkedOutBy: body?.staffId || 'demo-user-001',
  });

  if (!updated) {
    return { data: { error: 'Booking not found' }, status: 404 };
  }

  return { data: expandBooking(updated, store), status: 200 };
};

export default { list, detail, create, update, patch, delete: remove, checkin, checkout };
