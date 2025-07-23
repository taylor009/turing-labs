import { User } from '../generated/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: {
        fieldname: string;
        originalname: string;
        mimetype: string;
        size: number;
        buffer?: Buffer;
        path?: string;
      };
      files?: {
        [fieldname: string]: {
          fieldname: string;
          originalname: string;
          mimetype: string;
          size: number;
          buffer?: Buffer;
          path?: string;
        }[];
      };
    }
  }
}

export {};