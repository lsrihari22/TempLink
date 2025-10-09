import type { ApiError, ErrorCode } from '@templink/shared/types'

const messages: Partial<Record<ErrorCode, string>> = {
  NOT_FOUND: 'No file found for this link.',
  DELETED: 'This file has been deleted.',
  EXPIRED: 'This file has expired.',
  LIMIT_REACHED: 'The download limit for this file has been reached.',
  INVALID_FILE: 'The selected file is not allowed.',
  BAD_REQUEST: 'Invalid request. Please check your inputs and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and retry.',
  INTERNAL: 'Something went wrong. Please try again later.',
}

export function errorMessageFromApi(err: ApiError['error'] | { code: string; message: string }) {
  return messages[(err.code as ErrorCode)] ?? err.message ?? 'Unexpected error'
}

