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
app.use('/api/file', downloadLimiter);

// API routes
app.use('/api', uploadRoutes);
app.use('/api', downloadRoutes);
app.use('/api', infoRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
