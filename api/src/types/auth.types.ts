import { user_role } from '../generated/prisma';

export interface JWTPayload {
  userId: string;
  email: string;
  role: user_role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: user_role;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: user_role;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

// Extended Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userId?: string;
    }
  }
}