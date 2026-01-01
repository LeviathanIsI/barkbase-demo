/**
 * Dashboard Handler - Analytics and dashboard data
 */

export const list = ({ store, pathname }) => {
  const bookings = store.getCollection('bookings');
  const pets = store.getCollection('pets');
  const owners = store.getCollection('owners');
  const kennels = store.getCollection('kennels');
  const invoices = store.getCollection('invoices');
  const payments = store.getCollection('payments');

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfToday = new Date(today);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // Calculate occupancy
  const activeBookings = bookings.filter(b =>
    b.status === 'CHECKED_IN' ||
    (b.status === 'CONFIRMED' && new Date(b.checkIn) <= now && new Date(b.checkOut) >= now)
  );

  const totalCapacity = kennels.reduce((sum, k) => sum + (k.maxOccupancy || 1), 0);
  const currentOccupancy = activeBookings.length;

  // Today's arrivals and departures
  const todayArrivals = bookings.filter(b => {
    const checkIn = new Date(b.checkIn);
    return checkIn >= startOfToday && checkIn <= endOfToday &&
      ['PENDING', 'CONFIRMED'].includes(b.status);
  });

  const todayDepartures = bookings.filter(b => {
    const checkOut = new Date(b.checkOut);
    return checkOut >= startOfToday && checkOut <= endOfToday &&
      b.status === 'CHECKED_IN';
  });

  // Revenue calculations
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthPayments = payments.filter(p =>
    new Date(p.createdAt) >= thisMonthStart && p.status === 'SUCCEEDED'
  );
  const monthlyRevenue = thisMonthPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);

  const todayPayments = payments.filter(p => {
    const pDate = new Date(p.createdAt);
    return pDate >= startOfToday && pDate <= endOfToday && p.status === 'SUCCEEDED';
  });
  const todayRevenue = todayPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);

  // Pending invoices
  const pendingInvoices = invoices.filter(i =>
    ['SENT', 'PARTIAL', 'OVERDUE'].includes(i.status)
  );
  const pendingAmount = pendingInvoices.reduce((sum, i) =>
    sum + (i.totalCents || 0) - (i.paidCents || 0), 0
  );

  // Expiring vaccinations (next 30 days)
  const vaccinations = store.getCollection('vaccinations');
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringVaccinations = vaccinations.filter(v => {
    const expires = new Date(v.expiresAt);
    return expires >= now && expires <= thirtyDaysFromNow;
  });

  if (pathname.includes('/summary') || pathname.includes('/kpis')) {
    return {
      data: {
        totalPets: pets.filter(p => p.isActive !== false).length,
        totalOwners: owners.filter(o => o.isActive !== false).length,
        totalKennels: kennels.filter(k => k.isActive !== false).length,
        occupancyRate: totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0,
        monthlyRevenue,
        pendingAmount,
      },
      status: 200,
    };
  }

  return {
    data: {
      occupancy: {
        current: currentOccupancy,
        total: totalCapacity,
        rate: totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0,
      },
      today: {
        arrivals: todayArrivals.length,
        departures: todayDepartures.length,
        revenue: todayRevenue,
      },
      month: {
        revenue: monthlyRevenue,
        bookings: bookings.filter(b => new Date(b.createdAt) >= thisMonthStart).length,
      },
      alerts: {
        expiringVaccinations: expiringVaccinations.length,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: invoices.filter(i => i.status === 'OVERDUE').length,
      },
      stats: {
        totalPets: pets.filter(p => p.isActive !== false).length,
        totalOwners: owners.filter(o => o.isActive !== false).length,
        activeBookings: activeBookings.length,
      },
    },
    status: 200,
  };
};

export const detail = list;

/**
 * Current occupancy endpoint
 */
export const occupancy = ({ store }) => {
  const bookings = store.getCollection('bookings');
  const kennels = store.getCollection('kennels');

  const now = new Date();

  // Calculate occupancy
  const activeBookings = bookings.filter(b =>
    b.status === 'CHECKED_IN' ||
    (b.status === 'CONFIRMED' && new Date(b.checkIn) <= now && new Date(b.checkOut) >= now)
  );

  const totalCapacity = kennels.reduce((sum, k) => sum + (k.maxOccupancy || 1), 0);
  const currentOccupancy = activeBookings.length;

  return {
    data: {
      currentOccupancy,
      totalCapacity,
      occupancyRate: totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0,
      availableKennels: totalCapacity - currentOccupancy,
    },
    status: 200,
  };
};

/**
 * Saved reports endpoint
 */
export const savedReports = ({ body, id, pathname }) => {
  // In-memory saved reports for demo
  const reports = [
    { id: 'report-1', recordId: 'report-1', name: 'Monthly Revenue', type: 'revenue', createdAt: new Date().toISOString() },
    { id: 'report-2', recordId: 'report-2', name: 'Occupancy Trends', type: 'occupancy', createdAt: new Date().toISOString() },
  ];

  // GET list
  if (!body && !pathname.includes('/duplicate')) {
    return { data: reports, status: 200 };
  }

  // POST duplicate
  if (pathname.includes('/duplicate')) {
    return { data: { ...reports[0], id: 'report-new', name: 'Copy of Report' }, status: 201 };
  }

  // PUT update
  if (body && id) {
    return { data: { id, ...body }, status: 200 };
  }

  // POST create
  if (body) {
    return { data: { id: 'report-new', recordId: 'report-new', ...body }, status: 201 };
  }

  return { data: reports, status: 200 };
};

export default { list, detail, occupancy, savedReports };
