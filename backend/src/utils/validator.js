export const VALID_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
export const VALID_STATUSES = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'];

/**
 * Validate payload for creating a new incident
 */
export function validateCreateIncident(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: { body: 'Request body must be a valid JSON object' } };
  }

  // Title validation
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long';
  } else if (data.title.trim().length > 200) {
    errors.title = 'Title cannot exceed 200 characters';
  }

  // Affected Service validation
  if (!data.affectedService || typeof data.affectedService !== 'string' || !data.affectedService.trim()) {
    errors.affectedService = 'Affected service is required';
  }

  // Severity validation
  if (!data.severity) {
    errors.severity = 'Severity is required';
  } else if (!VALID_SEVERITIES.includes(data.severity.toUpperCase())) {
    errors.severity = `Severity must be one of: ${VALID_SEVERITIES.join(', ')}`;
  }

  // Status validation (optional on creation, defaults to INVESTIGATING)
  if (data.status && !VALID_STATUSES.includes(data.status.toUpperCase())) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
  }

  // If status is RESOLVED, resolution notes are required
  if (data.status && data.status.toUpperCase() === 'RESOLVED' && (!data.resolutionNotes || !data.resolutionNotes.trim())) {
    errors.resolutionNotes = 'Resolution notes are required when status is RESOLVED';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate payload for updating an existing incident
 */
export function validateUpdateIncident(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: { body: 'Request body must be a valid JSON object' } };
  }

  const allowedFields = [
    'title',
    'description',
    'affectedService',
    'severity',
    'status',
    'assignee',
    'rootCause',
    'resolutionNotes',
    'author',
  ];

  const presentFields = Object.keys(data).filter(k => allowedFields.includes(k));
  if (presentFields.length === 0) {
    return {
      isValid: false,
      errors: { body: 'At least one valid field to update must be provided' },
    };
  }

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length < 5) {
      errors.title = 'Title must be a string with at least 5 characters';
    } else if (data.title.trim().length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }
  }

  if (data.affectedService !== undefined) {
    if (typeof data.affectedService !== 'string' || !data.affectedService.trim()) {
      errors.affectedService = 'Affected service cannot be empty';
    }
  }

  if (data.severity !== undefined) {
    if (!VALID_SEVERITIES.includes(String(data.severity).toUpperCase())) {
      errors.severity = `Severity must be one of: ${VALID_SEVERITIES.join(', ')}`;
    }
  }

  if (data.status !== undefined) {
    if (!VALID_STATUSES.includes(String(data.status).toUpperCase())) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
    }
    if (String(data.status).toUpperCase() === 'RESOLVED') {
      if (!data.resolutionNotes || !data.resolutionNotes.trim()) {
        errors.resolutionNotes = 'Resolution notes are required when resolving an incident';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate payload for adding a timeline event
 */
export function validateTimelineEvent(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: { body: 'Request body must be a valid JSON object' } };
  }

  if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
    errors.message = 'Timeline update message is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
