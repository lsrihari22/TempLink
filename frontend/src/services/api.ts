import type { FileInfoResponse, FileUploadResponse } from "../../../shared/types/api";
const API = import.meta.env.VITE_API_URL as string;

export async function getInfo(token: string): Promise<FileInfoResponse> {
  const r = await fetch(`${API}/file/${token}/info`);
  return r.json();
}
export async function uploadFormData(fd: FormData): Promise<FileUploadResponse> {
  const r = await fetch(`${API}/upload`, { method: "POST", body: fd });
  return r.json();
}