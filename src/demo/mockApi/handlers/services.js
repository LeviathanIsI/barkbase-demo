/**
 * Services Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

export const list = ({ searchParams, store }) => {
  let services = store.getCollection('services');

  // Apply filters
  services = filterItems(services, searchParams, {
    category: (s, val) => s.category?.toLowerCase() === val.toLowerCase(),
  });

  // Filter active only by default
  if (searchParams.isActive !== 'false') {
    services = services.filter(s => s.isActive !== false);
  }

  // Sort by sort order, then name
  services.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  return buildListResponse(services, searchParams);
};

export const detail = ({ id, store }) => {
  const service = store.getById('services', id);
  return buildDetailResponse(service);
};

export const create = ({ body, store }) => {
  const newService = store.insert('services', {
    ...body,
    isActive: true,
    sortOrder: body.sortOrder || 0,
  });
  return buildCreateResponse(newService);
};

export const update = ({ id, body, store }) => {
  const updated = store.update('services', id, body);
  return buildUpdateResponse(updated);
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('services', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

// Add-on services (subset of services)
export const addons = ({ searchParams, store }) => {
  let services = store.getCollection('services');

  // Filter to add-on category
  services = services.filter(s =>
    s.category?.toLowerCase() === 'addon' ||
    s.category?.toLowerCase() === 'add-on' ||
    s.isAddOn === true
  );

  // Filter active only
  services = services.filter(s => s.isActive !== false);

  return buildListResponse(services, searchParams);
};

export default { list, detail, create, update, patch, delete: remove, addons };
