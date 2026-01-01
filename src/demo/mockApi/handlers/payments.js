/**
 * Payments Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

const expandPayment = (payment, store) => {
  const owner = payment.ownerId ? store.getById('owners', payment.ownerId) : null;
  const invoice = payment.invoiceId ? store.getById('invoices', payment.invoiceId) : null;

  return {
    ...payment,
    owner,
    invoice,
  };
};

export const list = ({ searchParams, store }) => {
  let payments = store.getCollection('payments');

  // Apply filters
  payments = filterItems(payments, searchParams, {
    ownerId: (p, val) => p.ownerId === val,
    invoiceId: (p, val) => p.invoiceId === val,
    method: (p, val) => p.method?.toUpperCase() === val.toUpperCase(),
  });

  // Status filter
  if (searchParams.status) {
    const statuses = searchParams.status.split(',').map(s => s.toUpperCase());
    payments = payments.filter(p => statuses.includes(p.status?.toUpperCase()));
  }

  // Date filters
  if (searchParams.from) {
    const fromDate = new Date(searchParams.from);
    payments = payments.filter(p => new Date(p.createdAt) >= fromDate);
  }

  if (searchParams.to) {
    const toDate = new Date(searchParams.to);
    payments = payments.filter(p => new Date(p.createdAt) <= toDate);
  }

  // Expand with relations
  payments = payments.map(p => expandPayment(p, store));

  // Sort by date descending
  payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Return format UI expects: { data: { payments: [...] } }
  return {
    data: { payments, total: payments.length },
    status: 200,
  };
};

export const detail = ({ id, store }) => {
  const payment = store.getById('payments', id);
  if (!payment) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandPayment(payment, store));
};

export const create = ({ body, store }) => {
  const now = new Date().toISOString();

  const newPayment = store.insert('payments', {
    ...body,
    status: body.status || 'SUCCEEDED',
    processedAt: now,
    processedBy: 'demo-user-001',
  });

  // Update invoice paid amount if linked
  if (body.invoiceId) {
    const invoice = store.getById('invoices', body.invoiceId);
    if (invoice) {
      const newPaidCents = (invoice.paidCents || 0) + (body.amountCents || 0);
      const newStatus = newPaidCents >= invoice.totalCents ? 'PAID' :
                        newPaidCents > 0 ? 'PARTIAL' : invoice.status;

      store.update('invoices', body.invoiceId, {
        paidCents: newPaidCents,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? now : invoice.paidAt,
      });
    }
  }

  return buildCreateResponse(expandPayment(newPayment, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('payments', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }
  return buildUpdateResponse(expandPayment(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('payments', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

// Refund payment
export const refund = ({ id, body, store }) => {
  const payment = store.getById('payments', id);
  if (!payment) {
    return { data: { error: 'Payment not found' }, status: 404 };
  }

  const refundAmount = body.amountCents || payment.amountCents;
  const now = new Date().toISOString();

  // Create refund record
  const refundPayment = store.insert('payments', {
    ownerId: payment.ownerId,
    invoiceId: payment.invoiceId,
    amountCents: -refundAmount,
    method: payment.method,
    status: 'REFUNDED',
    notes: `Refund for payment ${payment.id}`,
    refundedPaymentId: payment.id,
    processedAt: now,
    processedBy: 'demo-user-001',
  });

  // Update original payment status
  store.update('payments', id, { status: 'REFUNDED' });

  // Update invoice if linked
  if (payment.invoiceId) {
    const invoice = store.getById('invoices', payment.invoiceId);
    if (invoice) {
      const newPaidCents = Math.max(0, (invoice.paidCents || 0) - refundAmount);
      const newStatus = newPaidCents === 0 ? 'SENT' :
                        newPaidCents < invoice.totalCents ? 'PARTIAL' : 'PAID';

      store.update('invoices', payment.invoiceId, {
        paidCents: newPaidCents,
        status: newStatus,
      });
    }
  }

  return { data: expandPayment(refundPayment, store), status: 200 };
};

export default { list, detail, create, update, patch, delete: remove, refund };
