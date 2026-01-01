/**
 * Mock API Utilities
 *
 * Helper functions for filtering, sorting, and paginating data
 */

/**
 * Apply search/filter parameters to a list of items
 */
export const filterItems = (items, params, filterConfig = {}) => {
  let filtered = [...items];

  // Text search across common fields
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(item => {
      const searchableFields = [
        item.name,
        item.firstName,
        item.lastName,
        `${item.firstName} ${item.lastName}`,
        item.email,
        item.phone,
        item.breed,
        item.notes,
      ].filter(Boolean);

      return searchableFields.some(field =>
        String(field).toLowerCase().includes(searchLower)
      );
    });
  }

  // Apply custom filters from filterConfig
  Object.entries(filterConfig).forEach(([param, filterFn]) => {
    if (params[param] !== undefined && params[param] !== '') {
      filtered = filtered.filter(item => filterFn(item, params[param]));
    }
  });

  // Common filters
  if (params.status) {
    filtered = filtered.filter(item =>
      item.status?.toUpperCase() === params.status.toUpperCase()
    );
  }

  if (params.isActive !== undefined) {
    const isActive = params.isActive === 'true' || params.isActive === true;
    filtered = filtered.filter(item => item.isActive === isActive);
  }

  return filtered;
};

/**
 * Sort items by a field
 */
export const sortItems = (items, sortBy, sortOrder = 'asc') => {
  if (!sortBy) return items;

  return [...items].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    // Handle nested fields (e.g., 'owner.lastName')
    if (sortBy.includes('.')) {
      const parts = sortBy.split('.');
      aVal = parts.reduce((obj, key) => obj?.[key], a);
      bVal = parts.reduce((obj, key) => obj?.[key], b);
    }

    // Handle dates
    if (aVal instanceof Date || (typeof aVal === 'string' && aVal.match(/^\d{4}-\d{2}-\d{2}/))) {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // Handle strings
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    // Compare
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Paginate items
 */
export const paginateItems = (items, limit, offset = 0) => {
  const total = items.length;
  const limitNum = parseInt(limit, 10) || 50;
  const offsetNum = parseInt(offset, 10) || 0;

  const paginated = items.slice(offsetNum, offsetNum + limitNum);

  return {
    items: paginated,
    meta: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + paginated.length < total,
    },
  };
};

/**
 * Expand related data onto items
 */
export const expandRelations = (items, store, relations = {}) => {
  return items.map(item => {
    const expanded = { ...item };

    Object.entries(relations).forEach(([field, config]) => {
      const { collection, foreignKey, type = 'one' } = config;

      if (type === 'one') {
        // Single relation (e.g., owner)
        const relatedId = item[foreignKey];
        if (relatedId) {
          expanded[field] = store.getById(collection, relatedId);
        }
      } else if (type === 'many') {
        // Many relation (e.g., pets)
        const relatedIds = item[foreignKey] || [];
        expanded[field] = relatedIds
          .map(id => store.getById(collection, id))
          .filter(Boolean);
      } else if (type === 'through') {
        // Through table relation (e.g., petOwners)
        const { through, throughForeignKey, throughLocalKey } = config;
        const links = store.getCollection(through)
          .filter(link => link[throughLocalKey] === item.id || link[throughLocalKey] === item.recordId);
        expanded[field] = links
          .map(link => store.getById(collection, link[throughForeignKey]))
          .filter(Boolean);
      }
    });

    return expanded;
  });
};

/**
 * Format date range filters
 */
export const dateRangeFilter = (items, fromParam, toParam, dateField = 'createdAt') => {
  let filtered = items;

  if (fromParam) {
    const fromDate = new Date(fromParam);
    filtered = filtered.filter(item => new Date(item[dateField]) >= fromDate);
  }

  if (toParam) {
    const toDate = new Date(toParam);
    filtered = filtered.filter(item => new Date(item[dateField]) <= toDate);
  }

  return filtered;
};

/**
 * Build a standard list response
 */
export const buildListResponse = (items, params = {}) => {
  const { limit, offset, sortBy, sort } = params;

  // Sort
  const sorted = sortItems(items, sortBy, sort);

  // Paginate
  if (limit) {
    const { items: paginated, meta } = paginateItems(sorted, limit, offset);
    return {
      data: paginated,
      meta,
      status: 200,
    };
  }

  return {
    data: sorted,
    status: 200,
  };
};

/**
 * Build a standard detail response
 */
export const buildDetailResponse = (item) => {
  if (!item) {
    return {
      data: { error: 'Not found' },
      status: 404,
    };
  }

  return {
    data: item,
    status: 200,
  };
};

/**
 * Build a standard create response
 */
export const buildCreateResponse = (item) => {
  return {
    data: item,
    status: 201,
  };
};

/**
 * Build a standard update response
 */
export const buildUpdateResponse = (item) => {
  if (!item) {
    return {
      data: { error: 'Not found' },
      status: 404,
    };
  }

  return {
    data: item,
    status: 200,
  };
};

/**
 * Build a standard delete response
 */
export const buildDeleteResponse = (success) => {
  return {
    data: null,
    status: success ? 204 : 404,
  };
};

export default {
  filterItems,
  sortItems,
  paginateItems,
  expandRelations,
  dateRangeFilter,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
};
