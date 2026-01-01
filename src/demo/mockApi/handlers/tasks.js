/**
 * Tasks Handler
 */

import {
  filterItems,
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

const expandTask = (task, store) => {
  const expanded = { ...task };

  // Expand pet if petId exists
  if (task.petId) {
    expanded.pet = store.getById('pets', task.petId);
  }

  // Expand owner if ownerId exists
  if (task.ownerId) {
    expanded.owner = store.getById('owners', task.ownerId);
  }

  // Expand kennel if kennelId exists
  if (task.kennelId) {
    expanded.kennel = store.getById('kennels', task.kennelId);
  }

  // Expand assignee
  if (task.assignedTo) {
    expanded.assignee = store.getById('staff', task.assignedTo);
  }

  return expanded;
};

export const list = ({ searchParams, store }) => {
  let tasks = store.getCollection('tasks');

  // Filter by status
  if (searchParams.status) {
    const statuses = searchParams.status.split(',').map(s => s.toUpperCase());
    tasks = tasks.filter(t => statuses.includes(t.status?.toUpperCase()));
  }

  // Filter by priority
  if (searchParams.priority) {
    tasks = tasks.filter(t => t.priority?.toUpperCase() === searchParams.priority.toUpperCase());
  }

  // Filter by type
  if (searchParams.type) {
    tasks = tasks.filter(t => t.type?.toUpperCase() === searchParams.type.toUpperCase());
  }

  // Filter by assignee
  if (searchParams.assignedTo) {
    tasks = tasks.filter(t => t.assignedTo === searchParams.assignedTo);
  }

  // Filter overdue tasks
  if (searchParams.overdue === 'true') {
    const now = new Date();
    tasks = tasks.filter(t => {
      if (t.status === 'COMPLETED') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < now;
    });
  }

  // Filter today's tasks
  if (searchParams.today === 'true') {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    tasks = tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate >= startOfDay && dueDate < endOfDay;
    });
  }

  // Filter by date range
  if (searchParams.from) {
    const fromDate = new Date(searchParams.from);
    tasks = tasks.filter(t => new Date(t.dueDate) >= fromDate);
  }

  if (searchParams.to) {
    const toDate = new Date(searchParams.to);
    tasks = tasks.filter(t => new Date(t.dueDate) <= toDate);
  }

  // Apply search
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    tasks = tasks.filter(t =>
      t.title?.toLowerCase().includes(search) ||
      t.description?.toLowerCase().includes(search)
    );
  }

  // Expand relations
  tasks = tasks.map(t => expandTask(t, store));

  // Sort by due date (soonest first), then by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  tasks.sort((a, b) => {
    const dateCompare = new Date(a.dueDate) - new Date(b.dueDate);
    if (dateCompare !== 0) return dateCompare;
    return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
  });

  return buildListResponse(tasks, searchParams);
};

export const detail = ({ id, store }) => {
  const task = store.getById('tasks', id);
  if (!task) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(expandTask(task, store));
};

export const create = ({ body, store }) => {
  const newTask = store.insert('tasks', {
    ...body,
    status: body.status || 'PENDING',
  });

  return buildCreateResponse(expandTask(newTask, store));
};

export const update = ({ id, body, store }) => {
  const updated = store.update('tasks', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }
  return buildUpdateResponse(expandTask(updated, store));
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('tasks', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

export default { list, detail, create, update, patch, delete: remove };
