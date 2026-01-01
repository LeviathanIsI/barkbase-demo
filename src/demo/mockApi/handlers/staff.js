/**
 * Staff Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
} from '../utils';

export const list = ({ searchParams, store }) => {
  let staff = store.getCollection('staff');

  // Apply filters
  staff = filterItems(staff, searchParams, {
    role: (s, val) => s.role?.toUpperCase() === val.toUpperCase(),
    department: (s, val) => s.department?.toLowerCase().includes(val.toLowerCase()),
  });

  // Filter active only by default
  if (searchParams.isActive !== 'false') {
    staff = staff.filter(s => s.isActive !== false);
  }

  // Sort by name
  staff.sort((a, b) =>
    `${a.lastName || ''} ${a.firstName || ''}`.localeCompare(`${b.lastName || ''} ${b.firstName || ''}`)
  );

  return buildListResponse(staff, searchParams);
};

export const detail = ({ id, store }) => {
  const member = store.getById('staff', id);
  return buildDetailResponse(member);
};

// Staff is view-only in demo, but provide stubs
export const create = ({ body }) => {
  return {
    data: { error: 'Staff management is view-only in demo mode' },
    status: 403,
  };
};

export const update = create;
export const patch = create;
export const remove = create;
export { remove as delete };

// Roles endpoint
export const roles = ({ store }) => {
  return {
    data: [
      { id: 'ADMIN', name: 'Administrator', description: 'Full system access' },
      { id: 'MANAGER', name: 'Manager', description: 'Management access' },
      { id: 'STAFF', name: 'Staff', description: 'Standard staff access' },
    ],
    status: 200,
  };
};

// Memberships (team members with access to the tenant)
let demoMemberships = [
  { id: 'member-1', userId: 'demo-user-001', email: 'admin@barkbase.com', firstName: 'Demo', lastName: 'Admin', role: 'ADMIN', status: 'active', isOwner: true },
  { id: 'member-2', userId: 'demo-user-002', email: 'manager@barkbase.com', firstName: 'Sarah', lastName: 'Manager', role: 'MANAGER', status: 'active', isOwner: false },
  { id: 'member-3', userId: 'demo-user-003', email: 'staff@barkbase.com', firstName: 'Mike', lastName: 'Staff', role: 'STAFF', status: 'active', isOwner: false },
];

export const memberships = ({ body, id, pathname }) => {
  // DELETE
  if (pathname && id && !body) {
    demoMemberships = demoMemberships.filter(m => m.id !== id);
    return { data: { success: true }, status: 200 };
  }

  // GET list
  if (!body) {
    return { data: demoMemberships, status: 200 };
  }

  // PUT update
  if (id) {
    const idx = demoMemberships.findIndex(m => m.id === id);
    if (idx >= 0) {
      demoMemberships[idx] = { ...demoMemberships[idx], ...body.data };
      return { data: demoMemberships[idx], status: 200 };
    }
  }

  // POST create (invite)
  const newMember = {
    id: `member-${Date.now()}`,
    ...body.data,
    status: 'invited',
    createdAt: new Date().toISOString(),
  };
  demoMemberships.push(newMember);
  return { data: newMember, status: 201 };
};

export const resendInvite = ({ id }) => {
  return { data: { success: true, message: 'Invite resent' }, status: 200 };
};

export default { list, detail, create, update, patch, delete: remove, roles, memberships, resendInvite };
