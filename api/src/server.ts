import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { 
  requestIdMiddleware, 
  requestLoggingMiddleware, 
  errorHandler, 
  notFoundHandler, 
  setupGlobalErrorHandlers 
} from './middleware/error-handler.middleware';
import { logger } from './utils/logger';
import emailRoutes from './routes/email.routes';
import authRoutes from './routes/auth.routes';
import proposalRoutes from './routes/proposal.routes';
import stakeholderRoutes from './routes/stakeholder.routes';
import approvalRoutes from './routes/approval.routes';
import templateRoutes from './routes/template.routes';
import validationTestRoutes from './routes/validation-test.routes';
import errorTestRoutes from './routes/error-test.routes';
import { setupSwagger } from './swagger';

// Setup global error handlers
setupGlobalErrorHandlers();

const app: Application = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for accurate IP addresses in logs
app.set('trust proxy', true);

// Core middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());

// Request ID and logging middleware (must be early in the chain)
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);

// Test route for debugging
app.get('/test', (_req, res) => {
  res.json({ message: 'Server is working!' });
});

// Setup Swagger documentation
try {
  console.log('🔧 Attempting to setup Swagger...');
  setupSwagger(app);
} catch (error) {
  console.error('❌ Failed to setup Swagger:', error);
}

// Morgan logging with Winston integration
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/proposals', stakeholderRoutes);
app.use('/api/proposals', approvalRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/validation-test', validationTestRoutes);
app.use('/api/error-test', errorTestRoutes);

app.get('/health', (_req: Request, res: Response) => {
  const requestLogger = (_req as any).logger || logger;
  
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      email: process.env.SENDGRID_API_KEY ? 'configured' : 'not configured',
      supabase: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'not configured',
      logging: 'operational',
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  requestLogger.info('Health check requested', { status: healthStatus.status });
  res.status(200).json(healthStatus);
});

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    const server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        services: {
          email: process.env.SENDGRID_API_KEY ? 'Ready' : 'Not configured',
          supabase: process.env.SUPABASE_URL ? 'Ready' : 'Not configured',
        },
        healthCheckUrl: `http://localhost:${PORT}/health`,
      });
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error 
    });
    process.exit(1);
  }
}

startServer();

export default app;