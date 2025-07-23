import { Router } from 'express';
import { z } from 'zod';
import { 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError, 
  InternalServerError, 
  DatabaseError,
  BusinessRuleError,
  ExternalServiceError 
} from '../utils/errors';
import { validateBody } from '../middleware/validation.middleware';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { user_role } from '../generated/prisma';

const router: Router = Router();

// Only allow admin access to error testing endpoints
router.use(authenticateToken);
router.use(requireRole([user_role.ADMIN]));

// Test validation errors
router.post('/validation-error',
  validateBody(z.object({
    name: z.string().min(1).max(50),
    email: z.string().email(),
    age: z.number().int().positive(),
  })),
  (_req, res) => {
    res.json({ message: 'Validation passed' });
  }
);

// Test custom validation error
router.post('/custom-validation-error', (_req, _res, next) => {
  const error = new ValidationError(
    'Custom validation failed',
    [
      { field: 'username', code: 'custom', message: 'Username already taken' },
      { field: 'email', code: 'custom', message: 'Email domain not allowed' },
    ]
  );
  next(error);
});

// Test authentication error
router.get('/auth-error', (_req, _res, next) => {
  const error = new AuthenticationError('Token has expired');
  next(error);
});

// Test authorization error
router.get('/authz-error', (_req, _res, next) => {
  const error = new AuthorizationError('Insufficient permissions to access this resource');
  next(error);
});

// Test not found error
router.get('/not-found-error', (_req, _res, next) => {
  const error = new NotFoundError('User with ID 123 not found');
  next(error);
});

// Test conflict error
router.post('/conflict-error', (_req, _res, next) => {
  const error = new ConflictError('Resource already exists');
  next(error);
});

// Test database error
router.get('/database-error', (_req, _res, next) => {
  const error = new DatabaseError('Connection timeout');
  next(error);
});

// Test business rule error
router.post('/business-rule-error', (_req, _res, next) => {
  const error = new BusinessRuleError(
    'Cannot delete proposal with pending approvals',
    'proposal_deletion_with_pending_approvals'
  );
  next(error);
});

// Test external service error
router.get('/external-service-error', (_req, _res, next) => {
  const error = new ExternalServiceError(
    'Email service unavailable',
    'sendgrid'
  );
  next(error);
});

// Test unhandled error
router.get('/unhandled-error', (_req, _res, next) => {
  const error = new Error('This is an unhandled generic error');
  next(error);
});

// Test internal server error
router.get('/internal-server-error', (_req, _res, next) => {
  const error = new InternalServerError('Something went wrong internally');
  next(error);
});

// Test async error
router.get('/async-error', async (_req, _res, _next) => {
  // Simulate async operation that fails
  await new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Async operation failed'));
    }, 100);
  });
});

// Test timeout simulation
router.get('/timeout-simulation', async (_req, res, _next) => {
  // Simulate a slow request
  await new Promise(resolve => setTimeout(resolve, 3000));
  res.json({ message: 'Request completed after delay' });
});

// Test large payload (should be handled by body parser limits)
router.post('/large-payload-test',
  validateBody(z.object({
    data: z.string().max(1000000), // 1MB string
  })),
  (_req, res) => {
    res.json({ message: 'Large payload processed' });
  }
);

// Test error handling chain
router.get('/error-chain', (_req, _res, next) => {
  try {
    // Simulate nested error
    const originalError = new Error('Original cause');
    const wrappedError = new ValidationError('Validation failed due to processing error', [], originalError);
    next(wrappedError);
  } catch (error) {
    next(error);
  }
});

// Test successful request for comparison
router.get('/success', (_req, res) => {
  res.json({
    message: 'Request successful',
    timestamp: new Date().toISOString(),
  });
});

export default router;