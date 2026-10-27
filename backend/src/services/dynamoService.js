import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.INCIDENTS_TABLE_NAME || 'RecoverOps-Incidents';
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

// Initialize DynamoDB Client
let client = new DynamoDBClient({ region: REGION });
let docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

/**
 * Allow injecting a custom document client (useful for unit tests or DynamoDB-local)
 */
export function setDocumentClient(customDocClient) {
  docClient = customDocClient;
}

export function getTableName() {
  return TABLE_NAME;
}

/**
 * Generate readable incident ID (e.g. INC-9501)
 */
export function generateIncidentId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INC-${rand}`;
}

/**
 * List incidents with optional filters (search, status, severity, service)
 */
export async function listIncidents(filters = {}) {
  const { search, status, severity, service } = filters;

  const filterExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  if (status) {
    filterExpressions.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = status.toUpperCase();
  }

  if (severity) {
    filterExpressions.push('#severity = :severity');
    expressionAttributeNames['#severity'] = 'severity';
    expressionAttributeValues[':severity'] = severity.toUpperCase();
  }

  if (service) {
    filterExpressions.push('#affectedService = :service');
    expressionAttributeNames['#affectedService'] = 'affectedService';
    expressionAttributeValues[':service'] = service;
  }

  const params = {
    TableName: TABLE_NAME,
  };

  if (filterExpressions.length > 0) {
    params.FilterExpression = filterExpressions.join(' AND ');
    params.ExpressionAttributeNames = expressionAttributeNames;
    params.ExpressionAttributeValues = expressionAttributeValues;
  }

  const command = new ScanCommand(params);
  const response = await docClient.send(command);
  let items = response.Items || [];

  // Filter by search query in-memory if provided
  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    items = items.filter((inc) => 
      (inc.title && inc.title.toLowerCase().includes(term)) ||
      (inc.description && inc.description.toLowerCase().includes(term)) ||
      (inc.id && inc.id.toLowerCase().includes(term))
    );
  }

  // Sort descending by creation date
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate high-level summary metrics
  const total = items.length;
  const open = items.filter((i) => i.status !== 'RESOLVED').length;
  const critical = items.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const resolved = items.filter((i) => i.status === 'RESOLVED').length;

  return {
    incidents: items,
    count: items.length,
    metrics: {
      total,
      open,
      critical,
      resolved,
    },
  };
}

/**
 * Get single incident by ID
 */
export async function getIncidentById(id) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  });

  const response = await docClient.send(command);
  return response.Item || null;
}

/**
 * Create a new incident in DynamoDB
 */
export async function createIncident(data) {
  const now = new Date().toISOString();
  const id = data.id || generateIncidentId();

  const newIncident = {
    id,
    title: data.title.trim(),
    description: (data.description || '').trim(),
    affectedService: data.affectedService.trim(),
    severity: data.severity.toUpperCase(),
    status: (data.status || 'INVESTIGATING').toUpperCase(),
    assignee: (data.assignee || 'Unassigned').trim(),
    rootCause: (data.rootCause || '').trim(),
    resolutionNotes: (data.resolutionNotes || '').trim(),
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        author: data.assignee || 'Incident Command',
        type: 'SYSTEM',
        message: `Incident declared with severity ${data.severity.toUpperCase()} for ${data.affectedService.trim()}.`,
      },
    ],
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: newIncident,
  });

  await docClient.send(command);
  return newIncident;
}

/**
 * Update an existing incident
 */
export async function updateIncident(id, updates) {
  const existing = await getIncidentById(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const timelineAdditions = [];

  if (updates.status && updates.status.toUpperCase() !== existing.status) {
    const isResolved = updates.status.toUpperCase() === 'RESOLVED';
    timelineAdditions.push({
      id: `tl-${Date.now()}-status`,
      timestamp: now,
      author: updates.author || 'Incident Responder',
      type: isResolved ? 'RESOLVED' : 'STATUS_CHANGE',
      message: `Status updated from ${existing.status} to ${updates.status.toUpperCase()}${
        updates.resolutionNotes ? `: ${updates.resolutionNotes}` : '.'
      }`,
    });
  }

  if (updates.severity && updates.severity.toUpperCase() !== existing.severity) {
    timelineAdditions.push({
      id: `tl-${Date.now()}-sev`,
      timestamp: now,
      author: updates.author || 'Incident Responder',
      type: 'SEVERITY_CHANGE',
      message: `Severity modified from ${existing.severity} to ${updates.severity.toUpperCase()}.`,
    });
  }

  if (updates.assignee && updates.assignee.trim() !== existing.assignee) {
    timelineAdditions.push({
      id: `tl-${Date.now()}-ass`,
      timestamp: now,
      author: updates.author || 'Incident Responder',
      type: 'UPDATE',
      message: `Incident reassigned to ${updates.assignee.trim()}.`,
    });
  }

  const updatedIncident = {
    ...existing,
    ...(updates.title ? { title: updates.title.trim() } : {}),
    ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
    ...(updates.affectedService ? { affectedService: updates.affectedService.trim() } : {}),
    ...(updates.severity ? { severity: updates.severity.toUpperCase() } : {}),
    ...(updates.status ? { status: updates.status.toUpperCase() } : {}),
    ...(updates.assignee ? { assignee: updates.assignee.trim() } : {}),
    ...(updates.rootCause !== undefined ? { rootCause: updates.rootCause.trim() } : {}),
    ...(updates.resolutionNotes !== undefined ? { resolutionNotes: updates.resolutionNotes.trim() } : {}),
    updatedAt: now,
    timeline: [...(existing.timeline || []), ...timelineAdditions],
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: updatedIncident,
  });

  await docClient.send(command);
  return updatedIncident;
}

/**
 * Add a timeline event to an incident
 */
export async function addTimelineEvent(id, { message, author = 'Incident Responder', type = 'UPDATE' }) {
  const existing = await getIncidentById(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const newEvent = {
    id: `tl-${Date.now()}`,
    timestamp: now,
    author: author.trim() || 'Incident Responder',
    type: (type || 'UPDATE').toUpperCase(),
    message: message.trim(),
  };

  const updatedTimeline = [...(existing.timeline || []), newEvent];

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'SET #timeline = :timeline, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#timeline': 'timeline',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':timeline': updatedTimeline,
      ':updatedAt': now,
    },
    ReturnValues: 'ALL_NEW',
  });

  const response = await docClient.send(command);
  return response.Attributes || { ...existing, timeline: updatedTimeline, updatedAt: now };
}

/**
 * Delete an incident by ID
 */
export async function deleteIncident(id) {
  const existing = await getIncidentById(id);
  if (!existing) {
    return false;
  }

  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id },
  });

  await docClient.send(command);
  return true;
}
