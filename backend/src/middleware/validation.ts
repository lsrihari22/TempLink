import { Response, Request, NextFunction } from "express";
import { env } from "../env";

function badRequest(res: Response, message: string) {
  return res.status(400).json({ error: { code: 'BAD_REQUEST', message } });
}

export function validateTokenParam(req: Request, res: Response, next: NextFunction) {
    const token = String((req.params as any)?.token || '');
    if (!/^[a-f0-9]{20}$/i.test(token)) {
        return badRequest(res, 'Invalid token');
    }
    next();
}

export function validateUploadOptions(req: Request, res: Response, next: NextFunction) {
    const body: any = (req as any).body || {};

    const now = Date.now();
    let expiresAt: Date | undefined;
    const expiresAtRaw = body.expiresAt as string | undefined;
    if (expiresAtRaw) {
        const parsedExpiresAt = new Date(expiresAtRaw);
        if(isNaN(parsedExpiresAt.getTime())){
            return badRequest(res, 'Invalid expiresAt');
        }
        if(parsedExpiresAt.getTime() <= now){
            return badRequest(res, 'expiresAt must be in the future');
        }
        expiresAt = parsedExpiresAt;
    }

    let maxDownloads: string | number | undefined;
    const maxDownloadsRaw = body.maxDownloads as string | number | undefined;
    const CAP = env.MAX_DOWNLOADS_CAP;

    if(typeof maxDownloadsRaw !== 'undefined'){
        const n = typeof maxDownloadsRaw === 'string'? parseInt(String(maxDownloadsRaw),10) : Math.trunc(maxDownloadsRaw);
        if(!Number.isFinite(n) ){
            return badRequest(res, 'maxDownloads must be a positive integer');
        }else if(n < 1){
            return badRequest(res, 'maxDownloads must be at least 1');
        }else if(n > CAP){
            return badRequest(res, `maxDownloads cannot exceed ${CAP}`);
        }
        maxDownloads = n;
    }

    (res as any).locals = (res as any).locals || {};
    (res as any).locals.validatedUpload = { expiresAt, maxDownloads } as {
        expiresAt?: Date;
        maxDownloads?: number;
    };
    next();
}
