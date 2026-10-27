import {
  success,
  badRequest,
  notFound,
  serverError,
  buildResponse,
} from './utils/response.js';
import {
  validateCreateIncident,
  validateUpdateIncident,
  validateTimelineEvent,
} from './utils/validator.js';
import * as dynamoService from './services/dynamoService.js';

/**
 * Main AWS Lambda handler for API Gateway proxy events
 */
export async function handler(event, context) {
  // CloudWatch logging for request tracing
  console.log('Incoming event:', JSON.stringify({
    httpMethod: event.httpMethod || event.requestContext?.http?.method,
    path: event.path || event.rawPath,
    queryStringParameters: event.queryStringParameters,
  }));

  try {
    const httpMethod = (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();
    const rawPath = event.path || event.rawPath || '/';
    // Strip trailing slash and optional stage prefix (/prod, /dev, /api)
    const normalizedPath = rawPath.replace(/^\/(prod|dev|v1|api)(?=\/|$)/, '').replace(/\/+$/, '') || '/';

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return buildResponse(200, { message: 'OK' });
    }

    // Parse Body
    let body = {};
    if (event.body) {
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch (err) {
        return badRequest('Invalid JSON payload in request body');
      }
    }

    const queryParams = event.queryStringParameters || {};
    const pathParams = event.pathParameters || {};

    // 1. Health check endpoint: GET /health
    if (httpMethod === 'GET' && normalizedPath === '/health') {
      return success({
        status: 'healthy',
        service: 'RecoverOps Incident API',
        timestamp: new Date().toISOString(),
        table: dynamoService.getTableName(),
        version: '1.0.0',
      });
    }

    // 2. Incident List: GET /incidents
    if (httpMethod === 'GET' && normalizedPath === '/incidents') {
      const result = await dynamoService.listIncidents({
        search: queryParams.search,
        status: queryParams.status,
        severity: queryParams.severity,
        service: queryParams.service,
      });
      return success(result);
    }

    // 3. Create Incident: POST /incidents
    if (httpMethod === 'POST' && normalizedPath === '/incidents') {
      const validation = validateCreateIncident(body);
      if (!validation.isValid) {
        return badRequest('Incident validation failed', validation.errors);
      }

      const newIncident = await dynamoService.createIncident(body);
      return success({
        message: 'Incident declared successfully',
        incident: newIncident,
      }, 201);
    }

    // Check for timeline addition: POST /incidents/{id}/timeline
    const timelineMatch = normalizedPath.match(/^\/incidents\/([^/]+)\/timeline$/);
    if (httpMethod === 'POST' && timelineMatch) {
      const incidentId = decodeURIComponent(pathParams.id || timelineMatch[1]);
      const validation = validateTimelineEvent(body);
      if (!validation.isValid) {
        return badRequest('Timeline event validation failed', validation.errors);
      }

      const updated = await dynamoService.addTimelineEvent(incidentId, body);
      if (!updated) {
        return notFound(`Incident ${incidentId} not found`);
      }
      return success({
        message: 'Timeline event recorded',
        incident: updated,
      });
    }

    // Check for single incident routes: /incidents/{id}
    const singleIncidentMatch = normalizedPath.match(/^\/incidents\/([^/]+)$/);
    if (singleIncidentMatch) {
      const incidentId = decodeURIComponent(pathParams.id || singleIncidentMatch[1]);

      // 4. Get Incident by ID: GET /incidents/{id}
      if (httpMethod === 'GET') {
        const item = await dynamoService.getIncidentById(incidentId);
        if (!item) {
          return notFound(`Incident ${incidentId} not found`);
        }
        return success({ incident: item });
      }

      // 5. Update Incident: PUT /incidents/{id}
      if (httpMethod === 'PUT') {
        const validation = validateUpdateIncident(body);
        if (!validation.isValid) {
          return badRequest('Update validation failed', validation.errors);
        }

        const updated = await dynamoService.updateIncident(incidentId, body);
        if (!updated) {
          return notFound(`Incident ${incidentId} not found`);
        }
        return success({
          message: 'Incident updated successfully',
          incident: updated,
        });
      }

      // 6. Delete Incident: DELETE /incidents/{id}
      if (httpMethod === 'DELETE') {
        const deleted = await dynamoService.deleteIncident(incidentId);
        if (!deleted) {
          return notFound(`Incident ${incidentId} not found`);
        }
        return success({
          message: `Incident ${incidentId} deleted successfully`,
          id: incidentId,
        });
      }
    }

    // Route not found
    return notFound(`Endpoint ${httpMethod} ${rawPath} not recognized`);
  } catch (error) {
    console.error('Unhandled Lambda Exception:', error);
    return serverError('An error occurred while processing your incident request', error);
  }
}
