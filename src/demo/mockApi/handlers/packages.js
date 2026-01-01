/**
 * Packages Handler
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
  let packages = store.getCollection('packages');

  // Apply filters
  packages = filterItems(packages, searchParams, {
    type: (p, val) => p.packageType?.toLowerCase() === val.toLowerCase(),
    ownerId: (p, val) => p.ownerId === val,
  });

  // Filter active only by default
  if (searchParams.isActive !== 'false') {
    packages = packages.filter(p => p.isActive !== false);
  }

  // Expand with owner if assigned
  packages = packages.map(pkg => {
    if (pkg.ownerId) {
      const owner = store.getById('owners', pkg.ownerId);
      return { ...pkg, owner };
    }
    return pkg;
  });

  // Sort by name
  packages.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return buildListResponse(packages, searchParams);
};

export const detail = ({ id, store }) => {
  const pkg = store.getById('packages', id);
  if (!pkg) {
    return buildDetailResponse(null);
  }

  // Expand with owner if assigned
  if (pkg.ownerId) {
    const owner = store.getById('owners', pkg.ownerId);
    return buildDetailResponse({ ...pkg, owner });
  }

  return buildDetailResponse(pkg);
};

export const create = ({ body, store }) => {
  const newPackage = store.insert('packages', {
    ...body,
    isActive: true,
    creditsRemaining: body.credits || body.creditsRemaining || 0,
    creditsUsed: 0,
  });
  return buildCreateResponse(newPackage);
};

export const update = ({ id, body, store }) => {
  const updated = store.update('packages', id, body);
  return buildUpdateResponse(updated);
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('packages', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

export default { list, detail, create, update, patch, delete: remove };
