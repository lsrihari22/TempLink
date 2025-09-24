import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isProd = process.env.NODE_ENV === 'production';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['query', 'error', 'warn'],
    errorFormat: isProd ? 'minimal' : 'pretty',
  });

if (!isProd) {
  globalForPrisma.prisma = prisma;
}
