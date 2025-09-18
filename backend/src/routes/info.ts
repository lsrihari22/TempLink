import { Router, Request, Response } from 'express';
import { getInfo } from '../services/fileService';
import { validateTokenParam } from '../middleware/validation';

const router = Router();

// GET /api/file/:token/info
router.get('/file/:token/info', validateTokenParam, (req: Request, res: Response) => {
  const { token } = req.params;
  const info = getInfo(token);
  if (!info) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
  }
  if (info.status !== 'active') {
    return res.status(410).json({ error: { code: 'GONE', message: `File ${info.status}` }, data: info });
  }
  return res.status(200).json({ data: info });
});

export default router;
