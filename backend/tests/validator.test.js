import { describe, it, expect } from 'vitest';
import {
  validateCreateIncident,
  validateUpdateIncident,
  validateTimelineEvent,
  VALID_SEVERITIES,
  VALID_STATUSES,
} from '../src/utils/validator.js';

describe('Validator Utility', () => {
  describe('validateCreateIncident', () => {
    it('should validate a complete valid incident creation payload', () => {
      const payload = {
        title: 'Redis cache connection pool exhausted',
        description: 'Sessions failing to authenticate across us-west-2.',
        affectedService: 'Auth & SSO Service',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        assignee: 'Alex Rivera',
      };

      const result = validateCreateIncident(payload);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should reject missing title or title with less than 5 characters', () => {
      const res1 = validateCreateIncident({
        affectedService: 'Payment Gateway',
        severity: 'CRITICAL',
      });
      expect(res1.isValid).toBe(false);
      expect(res1.errors.title).toBeDefined();

      const res2 = validateCreateIncident({
        title: 'Down',
        affectedService: 'Payment Gateway',
        severity: 'CRITICAL',
      });
      expect(res2.isValid).toBe(false);
      expect(res2.errors.title).toContain('at least 5 characters');
    });

    it('should reject missing affectedService', () => {
      const res = validateCreateIncident({
        title: 'API Gateway 502 Bad Gateway',
        severity: 'HIGH',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.affectedService).toBeDefined();
    });

    it('should reject invalid severity level', () => {
      const res = validateCreateIncident({
        title: 'Database replica lag spike',
        affectedService: 'Primary Database',
        severity: 'DISASTER', // Not in P0-P3
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.severity).toBeDefined();
    });

    it('should require resolution notes when status is RESOLVED', () => {
      const res = validateCreateIncident({
        title: 'Memory leak in worker threads',
        affectedService: 'Data Pipeline',
        severity: 'MEDIUM',
        status: 'RESOLVED',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.resolutionNotes).toBeDefined();
    });
  });

  describe('validateUpdateIncident', () => {
    it('should pass on valid partial update', () => {
      const res = validateUpdateIncident({
        severity: 'CRITICAL',
        status: 'MONITORING',
        assignee: 'Sarah Chen',
      });
      expect(res.isValid).toBe(true);
    });

    it('should reject empty update body', () => {
      const res = validateUpdateIncident({});
      expect(res.isValid).toBe(false);
      expect(res.errors.body).toBeDefined();
    });

    it('should require resolution notes when transitioning status to RESOLVED', () => {
      const res = validateUpdateIncident({
        status: 'RESOLVED',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.resolutionNotes).toBeDefined();
    });
  });

  describe('validateTimelineEvent', () => {
    it('should validate a timeline event with non-empty message', () => {
      const res = validateTimelineEvent({
        message: 'Rebooted database secondary replica.',
        author: 'Sarah Chen',
        type: 'INVESTIGATION',
      });
      expect(res.isValid).toBe(true);
    });

    it('should reject empty timeline message', () => {
      const res = validateTimelineEvent({
        message: '',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.message).toBeDefined();
    });
  });
});
