/**
 * Invoices Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

const expandInvoice = (invoice, store) => {
  const owner = invoice.ownerId ? store.getById('owners', invoice.ownerId) : null;
  const booking = invoice.bookingId ? store.getById('bookings', invoice.bookingId) : null;

  // Get line items
  const lineItems = store.getCollection('invoiceLines')
    .filter(line => line.invoiceId === invoice.id || line.invoiceId === invoice.recordId);

  // Get payments
  const payments = store.getCollection('payments')
    .filter(p => p.invoiceId === invoice.id || p.invoiceId === invoice.recordId);

  const paidCents = payments
    .filter(p => p.status === 'SUCCEEDED')
    .reduce((sum, p) => sum + (p.amountCents || 0), 0);

  return {
    ...invoice,
    owner,
    booking,
    lineItems,
    payments,
    paidCents,
    balanceDue: (invoice.totalCents || 0) - paidCents,
  };
};

export const list = ({ searchParams, store }) => {
  let invoices = store.getCollection('invoices');

  // Apply filters
  invoices = filterItems(invoices, searchParams, {
    ownerId: (i, val) => i.ownerId === val,
    bookingId: (i, val) => i.bookingId === val,
  });

  // Status filter
  if (searchParams.status) {
    const statuses = searchParams.status.split(',').map(s => s.toUpperCase());
    invoices = invoices.filter(i => statuses.includes(i.status?.toUpperCase()));
  }

  // Date filters
  if (searchParams.from) {
    const fromDate = new Date(searchParams.from);
    invoices = invoices.filter(i => new Date(i.createdAt) >= fromDate);
  }

  if (searchParams.to) {
    const toDate = new Date(searchParams.to);
    invoices = invoices.filter(i => new Date(i.createdAt) <= toDate);
  }

  // Expand with relations
  invoices = invoices.map(i => expandInvoice(i, store));

  // Sort by date descending
  invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Return format UI expects: { data: { invoices: [...] } }
  return {
    data: { invoices, total: invoices.length },
    status: 200,
  };
};

export const detail = ({ id, store }) => {
  const invoice = store.getById('invoices', id);
  if (!invoice) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandInvoice(invoice, store));
};

export const create = ({ body, store }) => {
  // Generate invoice number
  const invoiceNumber = store.getNextSequence('INV-', 'invoices');

  const newInvoice = store.insert('invoices', {
    ...body,
    invoiceNumber,
    status: body.status || 'DRAFT',
    subtotalCents: body.subtotalCents || 0,
    taxCents: body.taxCents || 0,
    discountCents: body.discountCents || 0,
    totalCents: body.totalCents || body.subtotalCents || 0,
    paidCents: 0,
  });

  // Create line items if provided
  if (body.lineItems && body.lineItems.length > 0) {
    body.lineItems.forEach(line => {
      store.insert('invoiceLines', {
        invoiceId: newInvoice.id,
        ...line,
      });
    });
  }

  return buildCreateResponse(expandInvoice(newInvoice, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('invoices', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }

  // Update line items if provided
  if (body.lineItems) {
    // Remove old line items
    const oldLines = store.getCollection('invoiceLines')
      .filter(line => line.invoiceId === id);
    oldLines.forEach(line => store.delete('invoiceLines', line.id));

    // Add new line items
    body.lineItems.forEach(line => {
      store.insert('invoiceLines', {
        invoiceId: id,
        ...line,
      });
    });
  }

  return buildUpdateResponse(expandInvoice(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  // Remove line items
  const lines = store.getCollection('invoiceLines')
    .filter(line => line.invoiceId === id);
  lines.forEach(line => store.delete('invoiceLines', line.id));

  const success = store.delete('invoices', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

// Send invoice
export const send = ({ id, store }) => {
  const now = new Date().toISOString();
  const updated = store.update('invoices', id, {
    status: 'SENT',
    sentAt: now,
  });

  if (!updated) {
    return { data: { error: 'Invoice not found' }, status: 404 };
  }

  return { data: expandInvoice(updated, store), status: 200 };
};

// Void invoice
export const voidInvoice = ({ id, store }) => {
  const updated = store.update('invoices', id, {
    status: 'VOID',
    voidedAt: new Date().toISOString(),
  });

  if (!updated) {
    return { data: { error: 'Invoice not found' }, status: 404 };
  }

  return { data: expandInvoice(updated, store), status: 200 };
};

export { voidInvoice as void };

export default { list, detail, create, update, patch, delete: remove, send, void: voidInvoice };
