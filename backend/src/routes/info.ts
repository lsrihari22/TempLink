import { Router, Request, Response } from 'express';
import { getInfo } from '../services/fileService';

const router = Router();

// GET /api/file/:token/info
router.get('/file/:token/info', (req: Request, res: Response) => {
  const { token } = req.params;
  const info = getInfo(token);
  if (!info) {
    return res.status(404).json({ error: 'File not found' });
  }
  if (info.status !== 'active') {
    return res.status(410).json({ error: `File ${info.status}`, info });
  }
  return res.status(200).json({ info });
});

export default router;
