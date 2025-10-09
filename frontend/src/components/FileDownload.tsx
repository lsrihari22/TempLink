import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import { getInfo } from '../services/api'
import type { ErrorCode, FileInfoData } from '@templink/shared/types'

const TOKEN_REGEX = /^[a-f0-9]{20}$/i

type InfoState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: FileInfoData }
  | { status: 'error'; error: { code: ErrorCode | 'NETWORK'; message: string } }

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString()
}

const errorMessages: Partial<Record<ErrorCode | 'NETWORK', string>> = {
  NOT_FOUND: 'No file found for this link.',
  DELETED: 'This file has been deleted.',
  EXPIRED: 'This file has expired.',
  LIMIT_REACHED: 'The download limit for this file has been reached.',
  INVALID_FILE: 'File no longer available.',
  BAD_REQUEST: 'Invalid request for this link.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  INTERNAL: 'Something went wrong. Please try again later.',
  NETWORK: 'Unable to load file details. Check your connection and retry.',
}

export default function FileDownload() {
  const params = useParams<{ token: string }>()
  const token = params.token?.trim() ?? ''
  const validToken = useMemo(() => TOKEN_REGEX.test(token), [token])
  const [infoState, setInfoState] = useState<InfoState>({ status: 'idle' })

  const fetchInfo = useCallback(() => {
    if (!token || !validToken) {
      setInfoState({ status: 'idle' })
      return
    }
    let cancelled = false
    setInfoState({ status: 'loading' })
    getInfo(token)
      .then((res) => {
        if (cancelled) return
        if ('error' in res) setInfoState({ status: 'error', error: res.error })
        else setInfoState({ status: 'success', data: res.data })
      })
      .catch(() => {
        if (cancelled) return
        setInfoState({ status: 'error', error: { code: 'NETWORK', message: 'Network error' } })
      })
    return () => { cancelled = true }
  }, [token, validToken])

  useEffect(() => { fetchInfo() }, [fetchInfo])

  if (!token) {
    return <div className="p-6">Missing token.</div>
  }

  if (!validToken) {
    return <div className="p-6">Invalid token.</div>
  }

  if (infoState.status === 'loading') {
    return <div className="p-6">Loading file details…</div>
  }

  if (infoState.status === 'error') {
    const message = errorMessages[infoState.error.code] ?? infoState.error.message
    return (
      <div className="p-6 space-y-3">
        <div className="text-lg font-semibold">Unable to load file</div>
        <p className="text-sm text-gray-500">{message}</p>
        <button
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
          onClick={() => fetchInfo()}
          type="button"
        >
          Retry
        </button>
        <Link className="text-blue-600 underline" to="/">
          Go back to uploads
        </Link>
      </div>
    )
  }

  if (infoState.status !== 'success') {
    return null
  }

  const details = infoState.data
  const downloadUrl = `${import.meta.env.VITE_API_URL}/file/${token}/download`
  function onDownloadClick() {
    // After download, refetch to update remaining count
    setTimeout(() => fetchInfo(), 1500)
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Download File</h2>
        <p className="text-sm text-gray-500">Token: {token}</p>
      </div>

      <div className="space-y-1 text-sm">
        <div>
          <span className="font-medium">Name:</span> {details.originalName}
        </div>
        <div>
          <span className="font-medium">Size:</span> {formatBytes(details.size)}
        </div>
        <div>
          <span className="font-medium">Expires:</span> {formatDate(details.expiresAt)}
        </div>
        <div>
          <span className="font-medium">Remaining downloads:</span>{' '}
          {details.remainingDownloads} of {details.maxDownloads}
        </div>
      </div>

      <a
        className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        href={downloadUrl}
        onClick={onDownloadClick}
      >
        Download file
      </a>

      <Link className="block text-sm text-blue-600 underline" to="/">
        Upload another file
      </Link>
    </div>
  )
}
