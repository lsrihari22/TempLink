export interface FileUploadResponse {
  success: boolean;
  data: { token: string; downloadUrl: string; fileName: string; fileSize: number; expiresAt: string; maxDownloads: number; uploadId: string; };
}
export interface FileInfoResponse {
  success: boolean;
  data: { fileName: string; fileSize: number; expiresAt: string; remainingDownloads: number; isExpired: boolean; };
}