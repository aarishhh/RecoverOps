import { describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../src/handler.js';
import * as dynamoService from '../src/services/dynamoService.js';

describe('Lambda Handler Integration', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = new Map();

    const sampleIncident = {
      id: 'INC-2001',
      title: 'Stripe webhook 504 gateway timeout',
      description: 'Checkout failure in us-east-1.',
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
          return { Items: items };
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

  it('should handle OPTIONS preflight request with 200 and CORS headers', async () => {
    const event = {
      httpMethod: 'OPTIONS',
      path: '/incidents',
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('should handle GET /health', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
    expect(body.service).toContain('RecoverOps');
  });

  it('should handle GET /incidents', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/incidents',
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.incidents).toHaveLength(1);
    expect(body.metrics.critical).toBe(1);
  });

  it('should handle POST /incidents with valid payload', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/incidents',
      body: JSON.stringify({
        title: 'Kafka lag spike on telemetry topic',
        description: 'Lag exceeded 50k messages',
        affectedService: 'Data Pipeline & Kafka',
        severity: 'MEDIUM',
        status: 'INVESTIGATING',
        assignee: 'Priya Sharma',
      }),
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('declared successfully');
    expect(body.incident.title).toBe('Kafka lag spike on telemetry topic');
  });

  it('should reject POST /incidents with 400 when missing required fields', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/incidents',
      body: JSON.stringify({
        title: 'Down',
      }),
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Bad Request');
    expect(body.details.affectedService).toBeDefined();
  });

  it('should handle GET /incidents/{id}', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/incidents/INC-2001',
      pathParameters: { id: 'INC-2001' },
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.incident.id).toBe('INC-2001');
  });

  it('should return 404 for non-existent incident', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/incidents/INC-9999',
      pathParameters: { id: 'INC-9999' },
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(404);
  });

  it('should handle PUT /incidents/{id}', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/incidents/INC-2001',
      pathParameters: { id: 'INC-2001' },
      body: JSON.stringify({
        status: 'RESOLVED',
        rootCause: 'Egress NAT limit',
        resolutionNotes: 'Added secondary NAT gateway.',
        author: 'Alex Rivera',
      }),
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.incident.status).toBe('RESOLVED');
  });

  it('should handle POST /incidents/{id}/timeline', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/incidents/INC-2001/timeline',
      pathParameters: { id: 'INC-2001' },
      body: JSON.stringify({
        message: 'Secondary NAT gateway provisioned.',
        author: 'Alex Rivera',
        type: 'UPDATE',
      }),
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.incident.timeline).toHaveLength(2);
  });

  it('should handle DELETE /incidents/{id}', async () => {
    const event = {
      httpMethod: 'DELETE',
      path: '/incidents/INC-2001',
      pathParameters: { id: 'INC-2001' },
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('deleted');
  });

  it('should return 404 for unknown endpoints', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/unknown-route',
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(404);
  });
});
