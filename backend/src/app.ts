import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import uploadRoutes from './routes/upload';
import downloadRoutes from './routes/download';
import infoRoutes from './routes/info';
import { apiLimiter, downloadLimiter, uploadLimiter } from './middleware/rateLimit';
import { prisma } from './database/client';
import { env } from './env';

const app = express();

app.use(express.json());
app.set('trust proxy', 1);

// Security, CORS, and request logging
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = env.CORS_ORIGINS;
      if (!allowed || allowed.size === 0) return callback(null, false);
      if (!origin) return callback(null, true); // non-browser or same-origin
      const ok = allowed.has(String(origin).toLowerCase());
      return callback(null, ok);
    },
    credentials: true,
  })
);
app.use(morgan('combined'));

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/readyz', async (req, res) => {
  try {
    if (req.app.locals?.isDraining) {
      return res.status(503).send('draining');
    }
    // Simple DB ping
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send('ok');
  } catch (err) {
    console.error('DB not reachable:', err);
    res.status(500).send('db not ready');
  }
});

// Rate limiting before route handlers
app.use('/api', apiLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/file/:token/download', downloadLimiter);

// API routes
app.use('/api', uploadRoutes);
app.use('/api', downloadRoutes);
app.use('/api', infoRoutes);

// 404 for unknown routes
app.use((req, res) => {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err && err.name === 'MulterError') {
    const code = err.code === 'LIMIT_FILE_SIZE' || err.code === 'INVALID_FILE_TYPE' ? 'INVALID_FILE' : 'BAD_REQUEST';
    const message = err.message || 'Invalid upload';
    return res.status(400).json({ error: { code, message } });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal Server Error' } });
  }
});

export default app;
