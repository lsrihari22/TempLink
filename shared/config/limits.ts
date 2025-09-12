export const LIMITS = {
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
  MAX_TTL_MINUTES: 24 * 60,               // 24h
  MAX_DOWNLOADS: 3,
  ALLOWED_MIME: ["image/jpeg","image/png","application/pdf","text/plain"]
} as const;