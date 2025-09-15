import rateLimit from 'express-rate-limit';

function makeHandler(code: string, message: string) {
  return (_req: any, res: any, _next: any, _options: any) => {
    res.status(429).json({ error: { code, message } });
  };
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('RATE_LIMITED', 'Too many requests, please try again later.'),
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('RATE_LIMITED', 'Too many upload requests, please try again later.'),
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('RATE_LIMITED', 'Too many download requests, please try again later.'),
});

export { apiLimiter, uploadLimiter, downloadLimiter };
