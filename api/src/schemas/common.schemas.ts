import { z } from 'zod';

// Common field validations
export const commonSchemas = {
  // Basic types
  id: z.string().cuid('Invalid ID format'),
  email: z.string().email('Invalid email address'),
  url: z.string().url('Invalid URL format'),
  uuid: z.string().uuid('Invalid UUID format'),
  
  // String validations
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').trim(),
  description: z.string().max(1000, 'Description too long').trim().optional(),
  longText: z.string().max(5000, 'Text too long').trim().optional(),
  
  // Numbers
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonNegativeInt: z.number().int().min(0, 'Must be non-negative'),
  positiveFloat: z.number().positive('Must be a positive number'),
  nonNegativeFloat: z.number().min(0, 'Must be non-negative'),
  percentage: z.number().min(0, 'Percentage must be at least 0').max(100, 'Percentage cannot exceed 100'),
  
  // Dates
  dateString: z.string().datetime('Invalid date format'),
  futureDate: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    'Date must be in the future'
  ),
  pastDate: z.string().datetime().refine(
    (date) => new Date(date) < new Date(),
    'Date must be in the past'
  ),
  
  // Common patterns
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Must be lowercase letters, numbers, and hyphens only'),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  
  // Arrays
  nonEmptyStringArray: z.array(z.string().min(1)).min(1, 'At least one item is required'),
  stringArray: z.array(z.string()),
  idArray: z.array(z.string().cuid()),
};

// Common query parameter schemas
export const querySchemas = {
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
  
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  search: z.object({
    q: z.string().trim().optional(),
    search: z.string().trim().optional(),
  }),
  
  filtering: z.object({
    filter: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  
  // Combined common query schema
  listQuery: z.object({
    // Pagination
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    
    // Sorting
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    
    // Search
    search: z.string().trim().optional(),
    
    // Common filters
    status: z.string().optional(),
    category: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};

// Common parameter schemas
export const paramSchemas = {
  id: z.object({
    id: commonSchemas.id,
  }),
  
  proposalId: z.object({
    proposalId: commonSchemas.id,
  }),
  
  userId: z.object({
    userId: commonSchemas.id,
  }),
  
  stakeholderId: z.object({
    stakeholderId: commonSchemas.id,
  }),
  
  approvalId: z.object({
    approvalId: commonSchemas.id,
  }),
  
  proposalAndStakeholder: z.object({
    proposalId: commonSchemas.id,
    stakeholderId: commonSchemas.id,
  }),
  
  proposalAndApproval: z.object({
    proposalId: commonSchemas.id,
    approvalId: commonSchemas.id,
  }),
};

// Common response schemas
export const responseSchemas = {
  success: z.object({
    success: z.boolean().default(true),
    message: z.string().optional(),
  }),
  
  error: z.object({
    error: z.string(),
    message: z.string().optional(),
    details: z.array(z.object({
      field: z.string(),
      code: z.string(),
      message: z.string(),
    })).optional(),
    timestamp: z.string(),
  }),
  
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
  
  listResponse: <T>(dataSchema: z.ZodSchema<T>) => z.object({
    data: z.array(dataSchema),
    pagination: responseSchemas.pagination,
  }),
};

// Business rule validators
export const businessRules = {
  // Password strength
  strongPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number')
    .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)'),
  
  // Cost validation for food products
  productCost: z.number()
    .positive('Cost must be positive')
    .max(10000, 'Cost seems unusually high')
    .refine(
      (cost) => Number.isFinite(cost) && cost > 0,
      'Cost must be a valid positive number'
    ),
  
  // Project name validation
  projectName: z.string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name too long')
    .trim()
    .refine(
      (name) => !/^\s*$/.test(name),
      'Project name cannot be only whitespace'
    )
    .refine(
      (name) => !/[<>{}]/.test(name),
      'Project name cannot contain <, >, {, or }'
    ),
  
  // Stakeholder email validation (stricter than basic email)
  stakeholderEmail: z.string()
    .email('Invalid email address')
    .refine(
      (email) => !email.includes('+'),
      'Email aliases with + are not allowed for stakeholders'
    )
    .refine(
      (email) => email.includes('.'),
      'Email must contain a domain with extension'
    ),
  
  // Comment validation
  comment: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment too long')
    .trim()
    .refine(
      (comment) => !/^\s*$/.test(comment),
      'Comment cannot be only whitespace'
    ),
};

// File validation schemas
export const fileSchemas = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
  
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt'],
  },
  
  spreadsheet: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    allowedExtensions: ['xls', 'xlsx', 'csv'],
  },
};

// Custom validators for business logic
export const customValidators = {
  // Validate that end date is after start date
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  ),
  
  // Validate that at least one of multiple fields is provided
  atLeastOne: <T extends Record<string, any>>(
    schema: z.ZodSchema<T>,
    fields: (keyof T)[]
  ) => schema.refine(
    (data) => fields.some(field => data[field] != null && data[field] !== ''),
    {
      message: `At least one of the following fields is required: ${fields.join(', ')}`,
    }
  ),
  
  // Validate unique items in array
  uniqueArray: <T>(itemSchema: z.ZodSchema<T>, getKey?: (item: T) => string | number) => 
    z.array(itemSchema).refine(
      (items) => {
        if (getKey) {
          const keys = items.map(getKey);
          return new Set(keys).size === keys.length;
        }
        return new Set(items).size === items.length;
      },
      'Array items must be unique'
    ),
  
  // Conditional validation based on another field
  conditional: <T extends Record<string, any>>(
    baseSchema: z.ZodSchema<T>,
    condition: (data: T) => boolean,
    conditionalSchema: z.ZodSchema<Partial<T>>
  ) => z.union([
    baseSchema.and(conditionalSchema),
    baseSchema.refine(data => !condition(data), 'Conditional validation failed')
  ]),
};

// Export types for TypeScript inference
export type CommonId = z.infer<typeof commonSchemas.id>;
export type ListQuery = z.infer<typeof querySchemas.listQuery>;
export type PaginationParams = z.infer<typeof querySchemas.pagination>;
export type SortingParams = z.infer<typeof querySchemas.sorting>;
export type ErrorResponse = z.infer<typeof responseSchemas.error>;
export type SuccessResponse = z.infer<typeof responseSchemas.success>;
export type PaginationResponse = z.infer<typeof responseSchemas.pagination>;