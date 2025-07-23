import { Router } from 'express';
import { z } from 'zod';
import { 
  validateBody, 
  validateQuery, 
  validateParams, 
  validateMultiple, 
  validateAsync, 
  validateFile 
} from '../middleware/validation.middleware';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { user_role } from '../generated/prisma';
import {
  testBasicValidation,
  testComplexValidation,
  testBusinessRules,
  testAsyncValidation,
  testMultipleValidation,
  testFileValidation,
} from '../controllers/validation-test.controller';
import { commonSchemas, businessRules, querySchemas, paramSchemas } from '../schemas/common.schemas';

const router: Router = Router();

// Only allow admin and product managers to access validation test endpoints
router.use(authenticateToken);
router.use(requireRole([user_role.ADMIN, user_role.PRODUCT_MANAGER]));

// Test basic body validation
router.post('/basic-body',
  validateBody(z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    age: z.number().int().min(0).max(120),
  })),
  testBasicValidation
);

// Test query parameter validation
router.get('/basic-query',
  validateQuery(querySchemas.listQuery),
  testBasicValidation
);

// Test URL parameter validation
router.get('/basic-params/:id/:userId',
  validateParams(z.object({
    id: commonSchemas.id,
    userId: commonSchemas.id,
  })),
  testBasicValidation
);

// Test complex nested validation
router.post('/complex',
  validateBody(z.object({
    user: z.object({
      name: commonSchemas.name,
      email: commonSchemas.email,
      profile: z.object({
        bio: z.string().max(500).optional(),
        website: commonSchemas.url.optional(),
      }).optional(),
    }),
    project: z.object({
      name: businessRules.projectName,
      cost: businessRules.productCost,
      objectives: commonSchemas.nonEmptyStringArray,
    }),
    settings: z.object({
      notifications: z.boolean().default(true),
      privacy: z.enum(['public', 'private', 'friends']).default('private'),
    }).optional(),
  })),
  testComplexValidation
);

// Test business rules validation
router.post('/business-rules',
  validateBody(z.object({
    password: businessRules.strongPassword,
    projectName: businessRules.projectName,
    cost: businessRules.productCost,
    email: businessRules.stakeholderEmail,
    comment: businessRules.comment.optional(),
  })),
  testBusinessRules
);

// Test async validation
router.post('/async',
  validateBody(z.object({
    email: commonSchemas.email,
    name: commonSchemas.name,
  })),
  validateAsync(async (data: any, req) => {
    // Simulate checking if email already exists
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Mock business rule: email cannot be 'admin@example.com'
    if (data.email === 'admin@example.com') {
      return { valid: false, errors: ['Email address is reserved'] };
    }
    
    // Mock business rule: name cannot be the same as current user's name
    if (req.user && data.name === req.user.name) {
      return { valid: false, errors: ['Name cannot be the same as your current name'] };
    }
    
    return { valid: true };
  }),
  testAsyncValidation
);

// Test multiple validation targets
router.post('/multiple/:id',
  validateMultiple([
    {
      target: 'params',
      schema: paramSchemas.id,
    },
    {
      target: 'query',
      schema: z.object({
        include: z.string().optional(),
        format: z.enum(['json', 'xml']).default('json'),
      }),
    },
    {
      target: 'body',
      schema: z.object({
        data: z.record(z.string(), z.any()),
      }),
    },
    {
      target: 'headers',
      schema: z.object({
        'x-test-header': z.string().min(1),
      }),
      stripUnknown: false,
    },
  ]),
  testMultipleValidation
);

// Test file validation
router.post('/file',
  validateFile({
    required: true,
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
  }),
  validateBody(z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  })),
  testFileValidation
);

// Test partial validation (for PATCH requests)
router.patch('/partial/:id',
  validateParams(paramSchemas.id),
  validateBody(z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    bio: z.string().max(1000),
  }), { allowPartial: true }),
  testBasicValidation
);

// Test validation error responses
router.post('/test-errors',
  validateBody(z.object({
    requiredField: z.string().min(1, 'This field is required'),
    emailField: z.string().email('Must be a valid email'),
    numberField: z.number().int().positive('Must be a positive integer'),
    enumField: z.enum(['option1', 'option2', 'option3']),
    arrayField: z.array(z.string()).min(1, 'Array must have at least one item'),
    nestedField: z.object({
      subField: z.string().min(5, 'Sub field must be at least 5 characters'),
    }),
  })),
  testBasicValidation
);

// Test custom refinements
router.post('/refinements',
  validateBody(z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    password: z.string(),
    confirmPassword: z.string(),
    items: z.array(z.string()).min(1),
  }).refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  ).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    }
  ).refine(
    (data) => new Set(data.items).size === data.items.length,
    {
      message: 'Items must be unique',
      path: ['items'],
    }
  )),
  testComplexValidation
);

export default router;