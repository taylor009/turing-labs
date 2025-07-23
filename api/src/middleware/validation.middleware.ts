import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { ValidationError } from '../utils/errors';

// Define the parts of the request that can be validated
export type ValidationTarget = 'body' | 'params' | 'query' | 'headers';

// Configuration for validation middleware
export interface ValidationConfig {
  target: ValidationTarget;
  schema: ZodSchema<any>;
  stripUnknown?: boolean; // Remove fields not in schema
  allowPartial?: boolean; // Allow partial validation (for PATCH operations)
}

// Validation error response format
export interface ValidationErrorResponse {
  error: string;
  message: string;
  details: {
    field: string;
    code: string;
    message: string;
    received?: any;
  }[];
  timestamp: string;
}

/**
 * Format Zod validation errors into a user-friendly format
 */
function formatValidationErrors(error: ZodError): ValidationErrorResponse['details'] {
  return error.issues.map((err: ZodIssue) => ({
    field: err.path.join('.') || 'root',
    code: err.code,
    message: err.message,
    received: 'received' in err ? err.received : undefined,
  }));
}

/**
 * Create validation middleware for a specific part of the request
 */
export function validateRequest(config: ValidationConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { target, schema, stripUnknown = true, allowPartial = false } = config;
      
      // Get the data to validate based on target
      let dataToValidate: any;
      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'headers':
          dataToValidate = req.headers;
          break;
        default:
          res.status(500).json({ error: 'Invalid validation target' });
          return;
      }

      // Apply schema transformations if needed
      let finalSchema = schema;
      if (allowPartial) {
        finalSchema = (schema as any).partial();
      }

      // Parse and validate the data
      const result = finalSchema.parse(dataToValidate);

      // Replace the original data with validated/transformed data
      if (stripUnknown) {
        switch (target) {
          case 'body':
            req.body = result;
            break;
          case 'params':
            req.params = result;
            break;
          case 'query':
            // req.query is read-only in Express, so we need to delete properties and reassign
            Object.keys(req.query).forEach(key => delete (req.query as any)[key]);
            Object.assign(req.query, result);
            break;
          case 'headers':
            // Don't modify headers as it might break other middleware
            break;
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Create structured validation error
        const details = formatValidationErrors(error);
        const validationError = new ValidationError(
          `Invalid ${config.target} data`,
          details,
          error
        );
        next(validationError);
        return;
      }

      // Handle unexpected errors
      next(error);
    }
  };
}

/**
 * Convenience function for body validation
 */
export function validateBody<T>(schema: ZodSchema<T>, options?: { stripUnknown?: boolean; allowPartial?: boolean }) {
  return validateRequest({
    target: 'body',
    schema,
    stripUnknown: options?.stripUnknown,
    allowPartial: options?.allowPartial,
  });
}

/**
 * Convenience function for params validation
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validateRequest({
    target: 'params',
    schema,
    stripUnknown: true,
  });
}

/**
 * Convenience function for query validation
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validateRequest({
    target: 'query',
    schema,
    stripUnknown: true,
  });
}

/**
 * Convenience function for header validation
 */
export function validateHeaders<T>(schema: ZodSchema<T>) {
  return validateRequest({
    target: 'headers',
    schema,
    stripUnknown: false, // Don't strip headers as it might break other middleware
  });
}

/**
 * Middleware to validate multiple parts of the request
 */
export function validateMultiple(configs: ValidationConfig[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      for (const config of configs) {
        const { target, schema, stripUnknown = true, allowPartial = false } = config;
        
        let dataToValidate: any;
        switch (target) {
          case 'body':
            dataToValidate = req.body;
            break;
          case 'params':
            dataToValidate = req.params;
            break;
          case 'query':
            dataToValidate = req.query;
            break;
          case 'headers':
            dataToValidate = req.headers;
            break;
          default:
            res.status(500).json({ error: `Invalid validation target: ${target}` });
            return;
        }

        let finalSchema = schema;
        if (allowPartial) {
          finalSchema = (schema as any).partial();
        }

        const result = finalSchema.parse(dataToValidate);

        if (stripUnknown) {
          switch (target) {
            case 'body':
              req.body = result;
              break;
            case 'params':
              req.params = result;
              break;
            case 'query':
              // req.query is read-only in Express, so we need to delete properties and reassign
              Object.keys(req.query).forEach(key => delete (req.query as any)[key]);
              Object.assign(req.query, result);
              break;
          }
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatValidationErrors(error);
        const validationError = new ValidationError(
          'Invalid request data',
          details,
          error
        );
        next(validationError);
        return;
      }

      next(error);
    }
  };
}

/**
 * Async validation for complex business rules that require database lookups
 */
export function validateAsync<T>(
  validator: (data: T, req: Request) => Promise<{ valid: boolean; errors?: string[] }>
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await validator(req.body, req);
      
      if (!result.valid) {
        const details = (result.errors || ['Validation failed']).map((error, index) => ({
          field: `business_rule_${index}`,
          code: 'custom',
          message: error,
        }));
        
        const validationError = new ValidationError(
          'Business rule validation failed',
          details
        );
        next(validationError);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate file uploads
 */
export function validateFile(options: {
  required?: boolean;
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  fieldName?: string;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const {
        required = false,
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedMimeTypes = [],
        allowedExtensions = [],
        fieldName = 'file'
      } = options;

      const file = req.file || (req as any).files?.[fieldName];

      if (required && !file) {
        const validationError = new ValidationError(
          `File '${fieldName}' is required`,
          [{
            field: fieldName,
            code: 'required',
            message: `File '${fieldName}' is required`,
          }]
        );
        next(validationError);
        return;
      }

      if (file) {
        const errors: string[] = [];

        // Check file size
        if (file.size > maxSize) {
          errors.push(`File size exceeds maximum allowed size of ${maxSize} bytes`);
        }

        // Check MIME type
        if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
          errors.push(`File type '${file.mimetype}' is not allowed`);
        }

        // Check file extension
        if (allowedExtensions.length > 0) {
          const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
          if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            errors.push(`File extension '${fileExtension}' is not allowed`);
          }
        }

        if (errors.length > 0) {
          const details = errors.map((error, index) => ({
            field: `file_${index}`,
            code: 'invalid_file',
            message: error,
          }));
          
          const validationError = new ValidationError(
            'Invalid file',
            details
          );
          next(validationError);
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}