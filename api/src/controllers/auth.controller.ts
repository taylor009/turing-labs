import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { JWTUtils } from '../utils/jwt.utils';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput 
} from '../schemas/auth.schemas';
import { AuthResponse, AuthenticatedUser, AuthTokens } from '../types/auth.types';
import { user_role } from '../generated/prisma';
import { incrementLoginAttempt, clearLoginAttempts } from '../middleware/auth.middleware';

const SALT_ROUNDS = 12;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body) as RegisterInput;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role || user_role.STAKEHOLDER,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate tokens
      const tokens = await AuthController.generateTokensForUser(user);

      const response: AuthResponse = {
        user: user as AuthenticatedUser,
        tokens,
      };

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: response,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body) as LoginInput;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (!user) {
        incrementLoginAttempt(req);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

      if (!isValidPassword) {
        incrementLoginAttempt(req);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Clear login attempts on successful login
      clearLoginAttempts(req);

      // Generate tokens
      const tokens = await AuthController.generateTokensForUser(user);

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      };

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: response,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Validate input
      const validatedData = refreshTokenSchema.parse(req.body) as RefreshTokenInput;

      // Verify refresh token
      JWTUtils.verifyRefreshToken(validatedData.refreshToken);

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { 
          token: validatedData.refreshToken,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      // Generate new tokens
      const tokens = await AuthController.generateTokensForUser(storedToken.user);

      // Remove old refresh token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      const response: AuthResponse = {
        user: storedToken.user as AuthenticatedUser,
        tokens,
      };

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: response,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Remove refresh token from database
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Remove all refresh tokens for the user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      return res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      return res.status(200).json({
        success: true,
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper method to generate tokens for a user
  private static async generateTokensForUser(user: any): Promise<AuthTokens> {
    const tokenId = uuidv4();

    // Generate access token
    const accessToken = JWTUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Generate refresh token
    const refreshToken = JWTUtils.generateRefreshToken({
      userId: user.id,
      tokenId,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt: JWTUtils.getTokenExpirationDate(JWT_REFRESH_EXPIRES_IN),
      },
    });

    return { accessToken, refreshToken };
  }

  // Cleanup expired refresh tokens (should be called periodically)
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`Cleaned up ${result.count} expired refresh tokens`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }
}