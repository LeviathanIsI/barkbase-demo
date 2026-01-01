/**
 * Run Templates Handler
 */

import {
  buildListResponse,
  buildDetailResponse,
  buildCreateResponse,
  buildUpdateResponse,
  buildDeleteResponse,
} from '../utils';

export const list = ({ searchParams, store }) => {
  let templates = store.getCollection('runTemplates');

  // Filter active only by default
  if (searchParams.isActive !== 'false') {
    templates = templates.filter(t => t.isActive !== false);
  }

  return buildListResponse(templates, searchParams);
};

export const detail = ({ id, store }) => {
  const template = store.getById('runTemplates', id);
  return buildDetailResponse(template);
};

export const create = ({ body, store }) => {
  const newTemplate = store.insert('runTemplates', {
    ...body,
    isActive: true,
  });
  return buildCreateResponse(newTemplate);
};

export const update = ({ id, body, store }) => {
  const updated = store.update('runTemplates', id, body);
  return buildUpdateResponse(updated);
};

export const patch = update;

export const remove = ({ id, store }) => {
  const success = store.delete('runTemplates', id);
  return buildDeleteResponse(success);
};

export { remove as delete };

export default { list, detail, create, update, patch, delete: remove };
