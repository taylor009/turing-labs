import jwt from 'jsonwebtoken';
import { JWTPayload, RefreshTokenPayload } from '../types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class JWTUtils {
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'turinglabs-api',
      audience: 'turinglabs-web',
    } as any);
  }

  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'turinglabs-api',
      audience: 'turinglabs-web',
    } as any);
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'turinglabs-api',
        audience: 'turinglabs-web',
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      throw new Error('Failed to verify access token');
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'turinglabs-api',
        audience: 'turinglabs-web',
      }) as RefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      throw new Error('Failed to verify refresh token');
    }
  }

  static getTokenExpirationDate(expiresIn: string): Date {
    const now = new Date();
    
    // Parse the expires in format (e.g., '7d', '15m', '1h')
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    
    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        // Default to hours if no unit specified
        return new Date(now.getTime() + value * 60 * 60 * 1000);
    }
  }

  static extractTokenFromAuthHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}