/**
 * Calendar Handler
 */

export const list = ({ searchParams, store, pathname }) => {
  const bookings = store.getCollection('bookings');
  const kennels = store.getCollection('kennels');

  const from = searchParams.from ? new Date(searchParams.from) : new Date();
  const to = searchParams.to ? new Date(searchParams.to) : new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Handle occupancy endpoint
  if (pathname.includes('/occupancy')) {
    const days = [];
    const currentDate = new Date(from);

    while (currentDate <= to) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Count bookings for this day
      const dayBookings = bookings.filter(b => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        const dayDate = new Date(dateStr);

        return checkIn <= dayDate && checkOut >= dayDate &&
          ['CONFIRMED', 'CHECKED_IN'].includes(b.status);
      });

      const totalCapacity = kennels.reduce((sum, k) => sum + (k.maxOccupancy || 1), 0);
      const occupied = dayBookings.length;

      days.push({
        date: dateStr,
        occupied,
        capacity: totalCapacity,
        available: totalCapacity - occupied,
        rate: totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { data: days, status: 200 };
  }

  // Calendar events endpoint
  const events = bookings
    .filter(b => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return checkOut >= from && checkIn <= to;
    })
    .map(b => {
      // Get pet info
      const bookingPets = store.getCollection('bookingPets')
        .filter(bp => bp.bookingId === b.id || bp.bookingId === b.recordId);
      const pets = bookingPets
        .map(bp => store.getById('pets', bp.petId))
        .filter(Boolean);
      const pet = pets[0];

      // Get kennel info
      const kennel = b.kennelId ? store.getById('kennels', b.kennelId) : null;

      // Get owner info
      const owner = b.ownerId ? store.getById('owners', b.ownerId) : null;

      return {
        id: b.id,
        title: pet ? pet.name : 'Booking',
        start: b.checkIn,
        end: b.checkOut,
        status: b.status,
        type: 'booking',
        resourceId: b.kennelId,
        extendedProps: {
          booking: b,
          pet,
          pets,
          kennel,
          owner,
        },
      };
    });

  return { data: events, status: 200 };
};

export const detail = list;

export default { list, detail };
