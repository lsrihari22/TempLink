import app from './app';
import { prisma } from './database/client';
import { startCleanup, stopCleanup } from './jobs/cleanup';

const PORT = Number(process.env.PORT || 3000);
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Configure HTTP server timeouts for better resilience
// Keep connections alive but avoid hanging forever
// Note: available on Node http.Server; cast to any to avoid type friction
(server as any).keepAliveTimeout = 75_000; // 75s, slightly below common LB idle timeouts
(server as any).headersTimeout = 76_000;   // must be greater than keepAliveTimeout

// Start background cleanup job
startCleanup();

let isShuttingDown = false;
let isDraining = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  const FORCE_TIMEOUT_MS = 30000;
  const forceTimer = setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, FORCE_TIMEOUT_MS);

  isDraining = true;
  app.locals.isDraining = true;
  
  // Stop background jobs before disconnecting DB
  try { await stopCleanup(); } catch {}

  server.close(async (err?: Error) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
    }
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error('Error disconnecting Prisma:', e);
    }
    clearTimeout(forceTimer);
    console.log('Shutdown complete. Bye!');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  gracefulShutdown('unhandledRejection');
});
