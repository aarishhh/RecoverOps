import { describe, it, expect, beforeEach } from 'vitest';
import * as dynamoService from '../src/services/dynamoService.js';

describe('DynamoService', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = new Map();

    const sampleIncident = {
      id: 'INC-1001',
      title: 'Stripe webhook 504 gateway timeout',
      description: 'Checkout requests failing.',
      affectedService: 'Payment Gateway',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      assignee: 'Alex Rivera',
      createdAt: '2026-10-27T10:00:00.000Z',
      updatedAt: '2026-10-27T10:00:00.000Z',
      rootCause: '',
      resolutionNotes: '',
      timeline: [
        {
          id: 'tl-1',
          timestamp: '2026-10-27T10:00:00.000Z',
          author: 'Alex Rivera',
          type: 'SYSTEM',
          message: 'Incident declared.',
        },
      ],
    };
    mockStore.set(sampleIncident.id, sampleIncident);

    const mockDocClient = {
      async send(command) {
        const cmdName = command.constructor?.name;

        if (cmdName === 'ScanCommand') {
          const items = Array.from(mockStore.values());
          const { FilterExpression, ExpressionAttributeValues } = command.input || {};
          let filtered = items;
          if (FilterExpression && ExpressionAttributeValues) {
            if (ExpressionAttributeValues[':status']) {
              filtered = filtered.filter((i) => i.status === ExpressionAttributeValues[':status']);
            }
            if (ExpressionAttributeValues[':severity']) {
              filtered = filtered.filter((i) => i.severity === ExpressionAttributeValues[':severity']);
            }
            if (ExpressionAttributeValues[':service']) {
              filtered = filtered.filter((i) => i.affectedService === ExpressionAttributeValues[':service']);
            }
          }
          return { Items: filtered };
        }

        if (cmdName === 'GetCommand') {
          const id = command.input.Key.id;
          return { Item: mockStore.get(id) || null };
        }

        if (cmdName === 'PutCommand') {
          const item = command.input.Item;
          mockStore.set(item.id, item);
          return {};
        }

        if (cmdName === 'UpdateCommand') {
          const id = command.input.Key.id;
          const existing = mockStore.get(id);
          if (existing) {
            const { ExpressionAttributeValues } = command.input;
            const updated = {
              ...existing,
              timeline: ExpressionAttributeValues[':timeline'] || existing.timeline,
              updatedAt: ExpressionAttributeValues[':updatedAt'] || new Date().toISOString(),
            };
            mockStore.set(id, updated);
            return { Attributes: updated };
          }
          return { Attributes: null };
        }

        if (cmdName === 'DeleteCommand') {
          const id = command.input.Key.id;
          mockStore.delete(id);
          return {};
        }

        return {};
      },
    };

    dynamoService.setDocumentClient(mockDocClient);
  });

  it('should list incidents and return summary metrics', async () => {
    const res = await dynamoService.listIncidents();
    expect(res.incidents).toHaveLength(1);
    expect(res.count).toBe(1);
    expect(res.metrics.total).toBe(1);
    expect(res.metrics.open).toBe(1);
    expect(res.metrics.critical).toBe(1);
    expect(res.metrics.resolved).toBe(0);
  });

  it('should filter incidents by severity and service', async () => {
    const res = await dynamoService.listIncidents({
      severity: 'CRITICAL',
      service: 'Payment Gateway',
    });
    expect(res.incidents).toHaveLength(1);

    const emptyRes = await dynamoService.listIncidents({
      severity: 'LOW',
    });
    expect(emptyRes.incidents).toHaveLength(0);
  });

  it('should get an incident by id', async () => {
    const item = await dynamoService.getIncidentById('INC-1001');
    expect(item).toBeDefined();
    expect(item.title).toBe('Stripe webhook 504 gateway timeout');
  });

  it('should return null for non-existent incident', async () => {
    const item = await dynamoService.getIncidentById('INC-9999');
    expect(item).toBeNull();
  });

  it('should create an incident with initial timeline item and timestamps', async () => {
    const created = await dynamoService.createIncident({
      title: 'Auth cluster latency spike',
      description: 'p99 latency above 3s',
      affectedService: 'Auth & SSO Service',
      severity: 'HIGH',
      status: 'INVESTIGATING',
      assignee: 'Marcus Vance',
    });

    expect(created.id).toMatch(/^INC-/);
    expect(created.createdAt).toBeDefined();
    expect(created.timeline).toHaveLength(1);
    expect(created.timeline[0].message).toContain('Incident declared');

    // Verify it is in the store
    const fetched = await dynamoService.getIncidentById(created.id);
    expect(fetched).toBeDefined();
    expect(fetched.title).toBe('Auth cluster latency spike');
  });

  it('should update incident and append status change to timeline', async () => {
    const updated = await dynamoService.updateIncident('INC-1001', {
      status: 'RESOLVED',
      rootCause: 'NAT gateway connection limit reached',
      resolutionNotes: 'Provisioned dual NAT gateways.',
      author: 'Alex Rivera',
    });

    expect(updated.status).toBe('RESOLVED');
    expect(updated.rootCause).toBe('NAT gateway connection limit reached');
    expect(updated.timeline.length).toBeGreaterThan(1);
    const lastEvent = updated.timeline[updated.timeline.length - 1];
    expect(lastEvent.type).toBe('RESOLVED');
  });

  it('should add a custom timeline event', async () => {
    const updated = await dynamoService.addTimelineEvent('INC-1001', {
      message: 'Mitigation hotfix applied to edge proxy.',
      author: 'Sarah Chen',
      type: 'INVESTIGATION',
    });

    expect(updated.timeline).toHaveLength(2);
    expect(updated.timeline[1].message).toBe('Mitigation hotfix applied to edge proxy.');
  });

  it('should delete an incident', async () => {
    const success = await dynamoService.deleteIncident('INC-1001');
    expect(success).toBe(true);

    const fetched = await dynamoService.getIncidentById('INC-1001');
    expect(fetched).toBeNull();
  });
});
