import { describe, it, expect } from 'vitest';
import {
  buildResponse,
  success,
  badRequest,
  notFound,
  serverError,
  CORS_HEADERS,
} from '../src/utils/response.js';

describe('Response Utility', () => {
  it('should include CORS headers in all responses', () => {
    const res = success({ hello: 'world' });
    expect(res.headers).toBeDefined();
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Access-Control-Allow-Methods']).toContain('GET');
    expect(res.headers['Content-Type']).toBe('application/json');
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ hello: 'world' });
  });

  it('should format 400 Bad Request properly', () => {
    const res = badRequest('Validation error', { title: 'Required' });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation error');
    expect(body.details).toEqual({ title: 'Required' });
  });

  it('should format 404 Not Found properly', () => {
    const res = notFound('Incident INC-1234 not found');
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Not Found');
    expect(body.message).toBe('Incident INC-1234 not found');
  });

  it('should format 500 Server Error properly', () => {
    const res = serverError('Unexpected crash', new Error('DB timeout'));
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Internal Server Error');
  });
});
