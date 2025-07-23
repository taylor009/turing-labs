import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { user_role, PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Initialize Supabase client only if credentials are provided
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Use service key for server operations
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Use anon key for JWT verification (this is what frontend tokens are signed with)
const supabaseAuth = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to ensure user exists in database
async function ensureUserExists(supabaseUser: any) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    });

    if (!existingUser) {
      const userRole = supabaseUser.user_metadata?.role || user_role.STAKEHOLDER;
      
      await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email || '',
          password: '', // Not used for Supabase users
          role: userRole,
        }
      });
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 Auth middleware called for:', req.method, req.path);
    console.log('🔐 Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    
    if (!supabaseAuth) {
      console.log('🔐 Supabase auth not configured');
      res.status(503).json({ error: 'Authentication service not configured' });
      return;
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 No valid Bearer token found');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = authHeader.substring(7);
    console.log('🔐 Token extracted:', token ? `${token.substring(0, 20)}...` : 'None');

    // Verify Supabase token using anon key client
    console.log('🔐 Verifying token with Supabase...');
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      console.log('🔐 Token verification failed:', error?.message || 'No user returned');
      res.status(401).json({ error: 'Invalid access token' });
      return;
    }

    console.log('🔐 Token verified successfully for user:', user.email);

    // Ensure user exists in database
    await ensureUserExists(user);

    // Map Supabase user to our request format
    const userRole = user.user_metadata?.role || user_role.STAKEHOLDER;
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email || '',
      role: userRole,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at || user.created_at),
    };
    req.userId = user.id;

    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Failed to verify access token' });
  }
};

export const requireRole = (roles: user_role | user_role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role 
      });
      return;
    }

    next();
  };
};

// Convenience middleware for common role requirements
export const requireAdmin = requireRole(user_role.ADMIN);
export const requireProductManager = requireRole([user_role.ADMIN, user_role.PRODUCT_MANAGER]);

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!supabaseAuth) {
      // Supabase not configured, continue without authentication
      next();
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Verify Supabase token using anon key client
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (!error && user) {
      // Ensure user exists in database
      await ensureUserExists(user);
      
      const userRole = user.user_metadata?.role || user_role.STAKEHOLDER;
      
      req.user = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email || '',
        role: userRole,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at || user.created_at),
      };
      req.userId = user.id;
    }

    next();
  } catch (error) {
    // Token is invalid, but we continue without authentication
    // This allows endpoints to handle both authenticated and unauthenticated users
    next();
  }
};

// Rate limiting middleware (basic implementation)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitLogin = (req: Request, _res: Response, next: NextFunction): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes

  const attempts = loginAttempts.get(clientIP);

  if (attempts) {
    if (now < attempts.resetTime) {
      if (attempts.count >= maxAttempts) {
        _res.status(429).json({
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((attempts.resetTime - now) / 1000),
        });
        return;
      }
    } else {
      // Reset the attempts after the window
      loginAttempts.set(clientIP, { count: 1, resetTime: now + windowMs });
    }
  } else {
    loginAttempts.set(clientIP, { count: 1, resetTime: now + windowMs });
  }

  next();
};

export const incrementLoginAttempt = (req: Request): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const attempts = loginAttempts.get(clientIP);
  
  if (attempts) {
    attempts.count += 1;
    loginAttempts.set(clientIP, attempts);
  }
};

export const clearLoginAttempts = (req: Request): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  loginAttempts.delete(clientIP);
};