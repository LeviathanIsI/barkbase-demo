/**
 * Runs Handler - Play areas for pets
 */

import {
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

export const list = ({ searchParams, store }) => {
  let runs = store.getCollection('runs');

  // Filter by species
  if (searchParams.species) {
    runs = runs.filter(r => r.species?.toLowerCase() === searchParams.species.toLowerCase());
  }

  // Filter by size
  if (searchParams.size) {
    runs = runs.filter(r => r.size?.toUpperCase() === searchParams.size.toUpperCase());
  }

  // Filter active only by default
  if (searchParams.isActive !== 'false') {
    runs = runs.filter(r => r.isActive !== false);
  }

  // Sort by sortOrder
  runs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return buildListResponse(runs, searchParams);
};

export const detail = ({ id, store }) => {
  const run = store.getById('runs', id);
  return buildDetailResponse(run);
};

export const create = ({ body, store }) => {
  const newRun = store.insert('runs', {
    ...body,
    isActive: true,
  });
  return buildCreateResponse(newRun);
};

export const update = ({ id, body, store }) => {
  const updated = store.update('runs', id, body);
  return buildUpdateResponse(updated);
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('runs', id);
  return buildDeleteResponse(success);
};

/**
 * Get run assignments for a date
 * Returns runs with their assignments nested
 */
export const assignments = ({ searchParams, store }) => {
  const runs = store.getCollection('runs').filter(r => r.isActive !== false);
  const allAssignments = store.getCollection('runAssignments');

  // Filter assignments by date if provided
  let assignments = allAssignments;
  if (searchParams.date) {
    const targetDate = searchParams.date;
    assignments = allAssignments.filter(a => {
      const assignmentDate = a.date?.split('T')[0];
      return assignmentDate === targetDate;
    });
  }

  // Sort runs by sortOrder
  runs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return {
    data: {
      assignments,
      runs: runs.map(r => ({
        id: r.id,
        name: r.name,
        code: r.code,
        size: r.size,
        species: r.species,
        sortOrder: r.sortOrder,
        maxCapacity: r.maxCapacity,
      })),
      total: assignments.length,
    },
    status: 200,
  };
};

/**
 * Save run assignments
 */
export const saveAssignments = ({ body, store }) => {
  const { date, assignments } = body;

  // For demo, just return success
  return {
    data: { success: true, date, count: assignments?.length || 0 },
    status: 200,
  };
};

export { remove as delete };

export default { list, detail, create, update, patch, delete: remove, assignments, saveAssignments };
