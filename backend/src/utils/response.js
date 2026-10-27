/**
 * Standard CORS headers for AWS API Gateway proxy responses
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * Format standard API Gateway Lambda proxy response
 */
export function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

export function success(data, statusCode = 200) {
  return buildResponse(statusCode, data);
}

export function badRequest(message, errors = null) {
  return buildResponse(400, {
    error: 'Bad Request',
    message,
    ...(errors ? { details: errors } : {}),
  });
}

export function notFound(message = 'Resource not found') {
  return buildResponse(404, {
    error: 'Not Found',
    message,
  });
}

export function serverError(message = 'Internal server error', error = null) {
  // In CloudWatch logs, log full internal error details
  if (error) {
    console.error('SERVER_ERROR:', error);
  }
  return buildResponse(500, {
    error: 'Internal Server Error',
    message,
  });
}
