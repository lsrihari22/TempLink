import express from 'express';
import uploadRoutes from './routes/upload';
import downloadRoutes from './routes/download';
import infoRoutes from './routes/info';
import { apiLimiter, downloadLimiter, uploadLimiter } from './middleware/rateLimit';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.set('trust proxy', 1);

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
