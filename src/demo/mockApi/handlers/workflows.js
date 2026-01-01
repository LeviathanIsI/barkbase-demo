/**
 * Workflows Handler
 */

import {
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

export const list = ({ searchParams, store }) => {
  let workflows = store.getCollection('workflows');

  // Filter by status
  if (searchParams.status) {
    workflows = workflows.filter(w => w.status === searchParams.status);
  }

  // Filter by object type
  if (searchParams.objectType) {
    workflows = workflows.filter(w => w.objectType === searchParams.objectType);
  }

  // Search by name
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    workflows = workflows.filter(w =>
      w.name?.toLowerCase().includes(search) ||
      w.description?.toLowerCase().includes(search)
    );
  }

  // Sort by created date descending
  workflows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Return format UI expects: { data: { workflows: [...] } }
  return {
    data: { workflows },
    status: 200,
  };
};

export const detail = ({ id, store }) => {
  const workflow = store.getById('workflows', id);
  if (!workflow) {
    return buildDetailResponse(null);
  }
  return buildDetailResponse(workflow);
};

/**
 * Get workflow steps - returns steps in builder format
 */
export const steps = ({ id, pathname, store }) => {
  // Extract workflow ID from pathname: /api/v1/workflows/{workflowId}/steps
  const pathParts = pathname.split('/').filter(Boolean);
  const stepsIndex = pathParts.indexOf('steps');
  const workflowId = stepsIndex > 0 ? pathParts[stepsIndex - 1] : id;

  const workflow = store.getById('workflows', workflowId);
  if (!workflow) {
    return { data: { error: 'Workflow not found' }, status: 404 };
  }

  // Transform seed data format to builder format
  const transformedSteps = (workflow.steps || []).map((step, index) => ({
    id: step.id,
    stepType: step.type || step.stepType || step.step_type || 'action',
    actionType: step.actionType || step.action_type || null,
    name: step.name || getStepName(step),
    config: step.config || {},
    position: step.position ?? step.order ?? index,
    parentStepId: step.parentStepId || step.parent_step_id || null,
    branchId: step.branchId || step.branch_id || null,
  }));

  return {
    data: { steps: transformedSteps },
    status: 200,
  };
};

// Helper to generate step name from type
function getStepName(step) {
  const type = step.type || step.stepType;
  const actionType = step.actionType || step.action_type;

  if (type === 'action') {
    const actionNames = {
      send_sms: 'Send SMS',
      send_email: 'Send Email',
      create_task: 'Create Task',
    };
    return actionNames[actionType] || 'Action';
  }
  if (type === 'wait') {
    const config = step.config || {};
    if (config.duration && config.unit) {
      return `Wait ${config.duration} ${config.unit}`;
    }
    return 'Delay';
  }
  if (type === 'determinator') {
    return 'If/Then Branch';
  }
  return 'Step';
}

export const create = ({ body, store }) => {
  const newWorkflow = store.insert('workflows', {
    ...body,
    status: body.status || 'draft',
    enrolledTotal: 0,
    enrolledLast7Days: 0,
    completedTotal: 0,
    failedTotal: 0,
  });

  return buildCreateResponse(newWorkflow);
};

export const update = ({ id, body, store }) => {
  const updated = store.update('workflows', id, body);
  if (!updated) {
    return buildUpdateResponse(null);
  }
  return buildUpdateResponse(updated);
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('workflows', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

// Get workflow stats
export const stats = ({ store }) => {
  const workflows = store.getCollection('workflows');

  const active = workflows.filter(w => w.status === 'active').length;
  const paused = workflows.filter(w => w.status === 'paused').length;
  const draft = workflows.filter(w => w.status === 'draft').length;

  const totalEnrolled = workflows.reduce((sum, w) => sum + (w.enrolledTotal || 0), 0);
  const last7Days = workflows.reduce((sum, w) => sum + (w.enrolledLast7Days || 0), 0);
  const completed = workflows.reduce((sum, w) => sum + (w.completedTotal || 0), 0);
  const failed = workflows.reduce((sum, w) => sum + (w.failedTotal || 0), 0);

  return {
    data: {
      workflows: {
        total: workflows.length,
        active,
        paused,
        draft,
      },
      executions: {
        totalEnrolled,
        last7Days,
        completed,
        failed,
        successRate: totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0,
      },
    },
    status: 200,
  };
};

// Workflow templates (static data for demo)
export const templates = () => {
  return {
    data: [
      {
        id: 'template-001',
        name: 'Vaccination Reminder',
        description: 'Send reminders when pet vaccinations are expiring',
        category: 'health',
        objectType: 'pet',
        icon: 'syringe',
      },
      {
        id: 'template-002',
        name: 'Booking Confirmation',
        description: 'Send confirmation when booking is made',
        category: 'bookings',
        objectType: 'booking',
        icon: 'calendar',
      },
      {
        id: 'template-003',
        name: 'Post-Checkout Follow-up',
        description: 'Thank you and review request after checkout',
        category: 'bookings',
        objectType: 'booking',
        icon: 'star',
      },
      {
        id: 'template-004',
        name: 'New Client Welcome',
        description: 'Welcome sequence for new pet owners',
        category: 'owners',
        objectType: 'owner',
        icon: 'user-plus',
      },
      {
        id: 'template-005',
        name: 'Payment Reminder',
        description: 'Automated reminders for overdue invoices',
        category: 'billing',
        objectType: 'invoice',
        icon: 'credit-card',
      },
      {
        id: 'template-006',
        name: 'Birthday Celebration',
        description: 'Send birthday wishes and special offers',
        category: 'engagement',
        objectType: 'pet',
        icon: 'cake',
      },
    ],
    status: 200,
  };
};

// Activate workflow
export const activate = ({ id, pathname, store }) => {
  // Extract workflow ID from pathname: /api/v1/workflows/{workflowId}/activate
  const pathParts = pathname.split('/').filter(Boolean);
  const activateIndex = pathParts.indexOf('activate');
  const workflowId = activateIndex > 0 ? pathParts[activateIndex - 1] : id;

  const updated = store.update('workflows', workflowId, { status: 'active' });
  if (!updated) {
    return { data: { error: 'Workflow not found' }, status: 404 };
  }
  return { data: updated, status: 200 };
};

// Pause workflow
export const pause = ({ id, pathname, store }) => {
  // Extract workflow ID from pathname: /api/v1/workflows/{workflowId}/pause
  const pathParts = pathname.split('/').filter(Boolean);
  const pauseIndex = pathParts.indexOf('pause');
  const workflowId = pauseIndex > 0 ? pathParts[pauseIndex - 1] : id;

  const updated = store.update('workflows', workflowId, { status: 'paused' });
  if (!updated) {
    return { data: { error: 'Workflow not found' }, status: 404 };
  }
  return { data: updated, status: 200 };
};

export default { list, detail, steps, create, update, patch, delete: remove, stats, templates, activate, pause };
