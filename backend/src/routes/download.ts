import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { consumeDownload, get, markDeleted } from '../services/fileService';

const router = Router();

router.get('/file/:token/download', (req: Request, res: Response) => {
  const { token } = req.params;
  const result = consumeDownload(token);

  if (!result) {
    const rec = get(token);
    if (!rec) {
      return res.status(404).json({ error: 'File not found' });
    }
    return res.status(410).json({ error: 'File unavailable (expired, deleted, or download limit reached)' });
  }

  const { record, shouldDelete } = result;
  const safeName = path.basename(record.originalName).replace(/"/g, '');

  res.setHeader('Content-Type', record.mimeType);
  if (record.size) res.setHeader('Content-Length', String(record.size));
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

  const stream = fs.createReadStream(record.storagePath);
  stream.on('error', (err) => {
    console.error('Stream error:', err);
    return res.status(410).json({ error: 'File not available' });
  });

  stream.pipe(res);

  res.on('finish', () => {
    if (shouldDelete) {
      fs.promises.unlink(record.storagePath).catch(() => {});
      markDeleted(token);
    }
  });
});

export default router;
