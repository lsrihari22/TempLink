import axios, { AxiosError, type AxiosProgressEvent } from 'axios'
import type { FileInfoResponse, FileUploadResponse } from '@templink/shared/types'

const API = import.meta.env.VITE_API_URL as string

const client = axios.create({
  baseURL: API,
})

export async function getInfo(token: string): Promise<FileInfoResponse> {
  const response = await client.get<FileInfoResponse>(`/file/${token}/info`)
  return response.data
}

type UploadOptions = {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

function handleProgress(event: AxiosProgressEvent, notify?: (percent: number) => void) {
  if (!notify) return
  const { loaded, total } = event
  if (typeof total === 'number' && total > 0) {
    const percent = Math.min(100, Math.round((loaded / total) * 100))
    notify(percent)
  }
}

export async function uploadFormData(
  fd: FormData,
  options: UploadOptions = {},
): Promise<FileUploadResponse> {
  try {
    const response = await client.post<FileUploadResponse>(
      '/upload',
      fd,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: options.signal,
        onUploadProgress: (event) => handleProgress(event, options.onProgress),
      },
    )

    options.onProgress?.(100)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<FileUploadResponse>
      if (err.response?.data) {
        return err.response.data
      }
    }
    throw error
  }
}
