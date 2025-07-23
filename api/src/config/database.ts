import { PrismaClient } from '../generated/prisma';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;

// Database connection helper
export async function connectToDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

// Graceful shutdown helper
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Disconnected from PostgreSQL database');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}

// Health check helper
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}