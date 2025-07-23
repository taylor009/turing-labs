import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Custom log format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS Z' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, userId, method, url, ip, userAgent, duration, statusCode, ...meta } = info;
    
    const logEntry: any = {
      timestamp,
      level,
      message,
    };

    // Add request context if available
    if (requestId) logEntry.requestId = requestId;
    if (userId) logEntry.userId = userId;
    if (method) logEntry.method = method;
    if (url) logEntry.url = url;
    if (ip) logEntry.ip = ip;
    if (userAgent) logEntry.userAgent = userAgent;
    if (duration !== undefined) logEntry.duration = duration;
    if (statusCode) logEntry.statusCode = statusCode;

    // Add any additional metadata
    if (Object.keys(meta).length > 0) {
      logEntry.meta = meta;
    }

    return JSON.stringify(logEntry);
  })
);

// Development format for better readability in console
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, method, url, duration, statusCode, userId, ...meta } = info;
    
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;
    
    if (requestId) logMessage += ` [${requestId}]`;
    if (method && url) logMessage += ` ${method} ${url}`;
    if (statusCode) logMessage += ` ${statusCode}`;
    if (duration !== undefined) logMessage += ` ${duration}ms`;
    if (userId) logMessage += ` user:${userId}`;
    
    logMessage += ` ${message}`;
    
    // Add stack trace for errors
    if (info.stack) {
      logMessage += `\n${info.stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create transports based on environment
const transports: winston.transport[] = [];

if (process.env.NODE_ENV === 'production') {
  // Production: JSON format for log aggregation
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
} else {
  // Development: Pretty format for console
  transports.push(
    new winston.transports.Console({
      format: devFormat,
    })
  );
}

// Create the main logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Add colors for development
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  http: 'magenta',
  debug: 'white',
});

/**
 * Request context for correlation
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  startTime?: number;
}

/**
 * Create a child logger with request context
 */
export function createRequestLogger(context: Partial<RequestContext>) {
  const requestId = context.requestId || uuidv4();
  return logger.child({
    requestId,
    userId: context.userId,
    method: context.method,
    url: context.url,
    ip: context.ip,
    userAgent: context.userAgent,
  });
}

/**
 * Log request completion with timing
 */
export function logRequest(
  logger: winston.Logger,
  statusCode: number,
  startTime: number,
  error?: Error
) {
  const duration = Date.now() - startTime;
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger.log(level, `Request completed`, {
    statusCode,
    duration,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
  });
}

/**
 * Log slow requests for performance monitoring
 */
export function logSlowRequest(
  logger: winston.Logger,
  duration: number,
  threshold: number = 1000
) {
  if (duration > threshold) {
    logger.warn('Slow request detected', {
      duration,
      threshold,
    });
  }
}

/**
 * Log database operations
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  duration: number,
  error?: Error
) {
  const level = error ? 'error' : duration > 1000 ? 'warn' : 'debug';
  
  logger.log(level, `Database operation: ${operation}`, {
    operation,
    table,
    duration,
    error: error ? {
      name: error.name,
      message: error.message,
    } : undefined,
  });
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh',
  userId: string,
  success: boolean,
  ip?: string,
  userAgent?: string,
  error?: Error
) {
  const level = success ? 'info' : 'warn';
  
  logger.log(level, `Authentication event: ${event}`, {
    event,
    userId,
    success,
    ip,
    userAgent,
    error: error ? {
      name: error.name,
      message: error.message,
    } : undefined,
  });
}

/**
 * Log external service calls
 */
export function logExternalServiceCall(
  service: string,
  operation: string,
  duration: number,
  success: boolean,
  error?: Error
) {
  const level = success ? 'info' : 'error';
  
  logger.log(level, `External service call: ${service}/${operation}`, {
    service,
    operation,
    duration,
    success,
    error: error ? {
      name: error.name,
      message: error.message,
    } : undefined,
  });
}

// Create logs directory if it doesn't exist (for production)
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const path = require('path');
  const logsDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

export default logger;