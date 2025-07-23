import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
// import { Prisma } from '@prisma/client';
import { 
  AppError, 
  ValidationError, 
  DatabaseError, 
  InternalServerError,
  AuthenticationError,
  createErrorResponse,
  // isOperationalError
} from '../utils/errors';
import { logger, createRequestLogger, logRequest } from '../utils/logger';

/**
 * Add request ID to all requests for correlation
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Add to request object
  (req as any).requestId = requestId;
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Create request logger with context
  const requestLogger = createRequestLogger({
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });
  
  // Add logger to request
  (req as any).logger = requestLogger;
  (req as any).startTime = Date.now();
  
  // Log incoming request
  requestLogger.info('Request received', {
    method: req.method,
    url: req.originalUrl || req.url,
    query: req.query,
    body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
    headers: sanitizeHeaders(req.headers),
  });
  
  next();
}

/**
 * Request logging middleware for completion
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override send to capture response
  res.send = function(body) {
    logRequestCompletion(req, res);
    return originalSend.call(this, body);
  };
  
  // Override json to capture response
  res.json = function(body) {
    logRequestCompletion(req, res);
    return originalJson.call(this, body);
  };
  
  next();
}

/**
 * Log request completion with timing and status
 */
function logRequestCompletion(req: Request, res: Response) {
  const requestLogger = (req as any).logger;
  const startTime = (req as any).startTime;
  
  if (requestLogger && startTime) {
    logRequest(requestLogger, res.statusCode, startTime);
  }
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'confirmPassword', 'token', 'apiKey', 'secret'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Sanitize headers for logging (remove sensitive data)
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  for (const header of sensitiveHeaders) {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Convert various error types to AppError instances
 */
function normalizeError(error: Error): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      code: issue.code,
      message: issue.message,
      received: 'received' in issue ? issue.received : undefined,
    }));
    
    return new ValidationError('Request validation failed', details, error);
  }
  
  // Prisma database errors (commented out until Prisma types are properly imported)
  // TODO: Add Prisma error handling when @prisma/client types are available
  if (error.name?.includes('Prisma') || (error as any).code) {
    const prismaError = error as any;
    let message = 'Database operation failed';
    
    if (prismaError.code) {
      switch (prismaError.code) {
        case 'P2002':
          message = 'Unique constraint violation';
          break;
        case 'P2025':
          message = 'Record not found';
          break;
        case 'P2003':
          message = 'Foreign key constraint violation';
          break;
        case 'P2016':
          message = 'Query interpretation error';
          break;
      }
    }
    
    return new DatabaseError(`${message}: ${error.message}`, error);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
    return new AuthenticationError(error.message, error);
  }
  
  // Default to internal server error
  return new InternalServerError(error.message, error);
}

/**
 * Central error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const requestLogger = (req as any).logger || logger;
  
  // Normalize error to AppError
  const normalizedError = normalizeError(error);
  
  // Log the error
  const logLevel = normalizedError.statusCode >= 500 ? 'error' : 'warn';
  requestLogger[logLevel]('Error occurred', {
    error: {
      name: normalizedError.name,
      message: normalizedError.message,
      statusCode: normalizedError.statusCode,
      isOperational: normalizedError.isOperational,
      stack: normalizedError.stack,
    },
    originalError: error !== normalizedError ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
  });
  
  // Create error response
  const includeStack = process.env.NODE_ENV === 'development' && normalizedError.statusCode >= 500;
  const errorResponse = createErrorResponse(normalizedError, requestId, includeStack);
  
  // Send error response
  res.status(normalizedError.statusCode).json(errorResponse);
}

/**
 * Catch unhandled async errors in Express
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle 404 errors for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req as any).requestId;
  const error = createErrorResponse(
    new Error(`Route ${req.method} ${req.originalUrl} not found`),
    requestId
  );
  
  error.statusCode = 404;
  error.error = 'NotFound';
  
  res.status(404).json(error);
}

/**
 * Global exception handlers for uncaught errors
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
    
    // Graceful shutdown
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? {
        name: reason.name,
        message: reason.message,
        stack: reason.stack,
      } : reason,
      promise: promise.toString(),
    });
    
    // Graceful shutdown
    process.exit(1);
  });
  
  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  // Handle SIGINT
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}