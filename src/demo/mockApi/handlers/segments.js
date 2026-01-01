/**
 * Segments Handler
 */

import {
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

export const list = ({ searchParams, store }) => {
  let segments = store.getCollection('segments');

  // Filter by type
  if (searchParams.type) {
    segments = segments.filter(s => s.type === searchParams.type);
  }

  // Filter by object type
  if (searchParams.objectType) {
    segments = segments.filter(s => s.objectType === searchParams.objectType);
  }

  // Filter by status
  if (searchParams.status) {
    segments = segments.filter(s => s.status === searchParams.status);
  }

  // Search by name
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    segments = segments.filter(s =>
      s.name?.toLowerCase().includes(search) ||
      s.description?.toLowerCase().includes(search)
    );
  }

  // Sort by created date descending
  segments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Return format UI expects
  return {
    data: { segments, total: segments.length },
    status: 200,
  };
};

export const detail = ({ id, store }) => {
  const segment = store.getById('segments', id);
  if (!segment) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(segment);
};

export const create = ({ body, store }) => {
  const newSegment = store.insert('segments', {
    ...body,
    type: body.type || 'dynamic',
    status: 'active',
    memberCount: 0,
    lastRefreshedAt: new Date().toISOString(),
  });

  return buildCreateResponse(newSegment);
};

export const update = ({ id, body, store }) => {
  const updated = store.update('segments', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }
  return buildUpdateResponse(updated);
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('segments', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

// Get segment members (returns owners or pets based on segment objectType)
export const members = ({ id, searchParams, store }) => {
  const segment = store.getById('segments', id);
  if (!segment) {
    return { data: { members: [], total: 0 }, status: 404 };
  }

  // Get members based on object type
  const collection = segment.objectType === 'pet' ? 'pets' : 'owners';
  let members = store.getCollection(collection);

  // For demo, just return a subset as "members"
  members = members.slice(0, segment.memberCount || 5);

  return {
    data: { members, total: members.length },
    status: 200,
  };
};

// Preview segment (returns estimated count)
export const preview = ({ body, store }) => {
  // For demo, return a random count based on conditions
  const estimatedCount = Math.floor(Math.random() * 20) + 5;
  return {
    data: { estimatedCount, preview: [] },
    status: 200,
  };
};

// Clone segment
export const clone = ({ id, store }) => {
  const segment = store.getById('segments', id);
  if (!segment) {
    return { data: { error: 'Segment not found' }, status: 404 };
  }

  const cloned = store.insert('segments', {
    ...segment,
    id: undefined,
    recordId: undefined,
    name: `${segment.name} (Copy)`,
    memberCount: 0,
  });

  return { data: cloned, status: 201 };
};

// Refresh segment
export const refresh = ({ id, store }) => {
  if (id) {
    const updated = store.update('segments', id, {
      lastRefreshedAt: new Date().toISOString(),
    });
    return { data: updated, status: 200 };
  }
  // Refresh all
  return { data: { message: 'All segments refreshed' }, status: 200 };
};

// Get segment activity
export const activity = ({ id, store }) => {
  return {
    data: {
      activity: [
        { type: 'refresh', timestamp: new Date().toISOString(), details: 'Segment refreshed' },
        { type: 'member_added', timestamp: new Date(Date.now() - 86400000).toISOString(), details: '3 members added' },
      ]
    },
    status: 200,
  };
};

export default { list, detail, create, update, patch, delete: remove, members, preview, clone, refresh, activity };
