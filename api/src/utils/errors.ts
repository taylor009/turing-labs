/**
 * Custom error classes for the application
 */

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;
  
  constructor(
    message: string = 'Validation failed',
    public details?: Array<{
      field: string;
      code: string;
      message: string;
      received?: any;
    }>,
    cause?: Error
  ) {
    super(message, cause);
  }
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly isOperational = true;
  
  constructor(message: string = 'Authentication failed', cause?: Error) {
    super(message, cause);
  }
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly isOperational = true;
  
  constructor(message: string = 'Access denied', cause?: Error) {
    super(message, cause);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;
  
  constructor(message: string = 'Resource not found', cause?: Error) {
    super(message, cause);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly isOperational = true;
  
  constructor(message: string = 'Resource conflict', cause?: Error) {
    super(message, cause);
  }
}

export class TooManyRequestsError extends AppError {
  readonly statusCode = 429;
  readonly isOperational = true;
  
  constructor(message: string = 'Too many requests', cause?: Error) {
    super(message, cause);
  }
}

export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = false;
  
  constructor(message: string = 'Internal server error', cause?: Error) {
    super(message, cause);
  }
}

export class DatabaseError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = false;
  
  constructor(message: string = 'Database error', cause?: Error) {
    super(message, cause);
  }
}

export class ExternalServiceError extends AppError {
  readonly statusCode = 503;
  readonly isOperational = true;
  
  constructor(
    message: string = 'External service unavailable',
    public service: string,
    cause?: Error
  ) {
    super(message, cause);
  }
}

export class BusinessRuleError extends AppError {
  readonly statusCode = 422;
  readonly isOperational = true;
  
  constructor(
    message: string = 'Business rule violation',
    public rule: string,
    cause?: Error
  ) {
    super(message, cause);
  }
}

/**
 * Type guard to check if error is an operational error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Helper function to create consistent error objects for API responses
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  stack?: string;
  details?: any;
}

/**
 * Create a standardized error response object
 */
export function createErrorResponse(
  error: Error,
  requestId?: string,
  includeStack: boolean = false
): ErrorResponse {
  const response: ErrorResponse = {
    error: error.name,
    message: error.message,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
  };

  if (requestId) {
    response.requestId = requestId;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  // Add specific error details
  if (error instanceof ValidationError && error.details) {
    response.details = error.details;
  } else if (error instanceof ExternalServiceError) {
    response.details = { service: error.service };
  } else if (error instanceof BusinessRuleError) {
    response.details = { rule: error.rule };
  }

  return response;
}