import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { ErrorCode, UploadData } from '@templink/shared/types'
import { uploadFormData } from '../services/api'
import UploadProgress from './UploadProgress'

type FileUploadProps = {
  onSuccess?: (data: UploadData) => void
}

type UploadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: { code: ErrorCode | 'NETWORK'; message: string } }
  | { status: 'success'; data: UploadData }

const MAX_DOWNLOAD_CAP = 10

const errorMessages: Partial<Record<ErrorCode | 'NETWORK', string>> = {
  BAD_REQUEST: 'Upload request was invalid. Double-check your inputs.',
  INVALID_FILE: 'The selected file is not allowed.',
  LIMIT_REACHED: 'Download limit exceeded for this file.',
  INTERNAL: 'Something went wrong on the server. Try again shortly.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  NETWORK: 'Network error. Please ensure you are online and retry.',
}

export default function FileUpload({ onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [maxDownloads, setMaxDownloads] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [progress, setProgress] = useState<number | null>(null)

  const canSubmit = useMemo(() => {
    if (!file) return false
    if (state.status === 'loading') return false
    return true
  }, [file, state.status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.status === 'loading') return

    const form = event.currentTarget
    if (!file) {
      setState({
        status: 'error',
        error: { code: 'BAD_REQUEST', message: 'Select a file to upload.' },
      })
      setProgress(null)
      return
    }

    const trimmedMax = maxDownloads.trim()
    if (trimmedMax) {
      const parsed = Number(trimmedMax)
      if (!Number.isFinite(parsed) || parsed < 1) {
        setState({
          status: 'error',
          error: { code: 'BAD_REQUEST', message: 'Max downloads must be a positive number.' },
        })
        setProgress(null)
        return
      }
      if (parsed > MAX_DOWNLOAD_CAP) {
        setState({
          status: 'error',
          error: {
            code: 'BAD_REQUEST',
            message: `Max downloads cannot exceed ${MAX_DOWNLOAD_CAP}.`,
          },
        })
        setProgress(null)
        return
      }
    }

    const trimmedExpires = expiresAt.trim()
    if (trimmedExpires) {
      const date = new Date(trimmedExpires)
      if (Number.isNaN(date.getTime())) {
        setState({
          status: 'error',
          error: { code: 'BAD_REQUEST', message: 'Expiration must be a valid date.' },
        })
        setProgress(null)
        return
      }
      if (date.getTime() <= Date.now()) {
        setState({
          status: 'error',
          error: { code: 'BAD_REQUEST', message: 'Expiration must be in the future.' },
        })
        setProgress(null)
        return
      }
    }

    const fd = new FormData()
    fd.append('file', file)

    if (trimmedMax) {
      fd.append('maxDownloads', trimmedMax)
    }

    if (trimmedExpires) {
      const date = new Date(trimmedExpires)
      fd.append('expiresAt', date.toISOString())
    }

    setState({ status: 'loading' })
    setProgress(0)

    try {
      const response = await uploadFormData(fd, {
        onProgress: (value) => setProgress(value),
      })
      if ('error' in response) {
        setState({ status: 'error', error: response.error })
        setProgress(null)
        return
      }

      setState({ status: 'success', data: response.data })
      onSuccess?.(response.data)
      setMaxDownloads('')
      setExpiresAt('')
      setFile(null)
      form.reset()
    } catch (error) {
      console.error('Upload failed', error)
      setState({
        status: 'error',
        error: { code: 'NETWORK', message: 'Network error' },
      })
      setProgress(null)
    }
  }

  function renderMessage() {
    if (state.status === 'loading') {
      return <p className="text-sm text-gray-500">Uploading...</p>
    }
    if (state.status === 'error') {
      const message = errorMessages[state.error.code] ?? state.error.message
      return <p className="text-sm text-red-600">{message}</p>
    }
    if (state.status === 'success') {
      return <p className="text-sm text-green-600">Upload complete! Share the link below.</p>
    }
    return null
  }

  return (
    <form className="space-y-4 rounded border border-gray-200 p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Upload a file</h2>
        <p className="text-sm text-gray-500">Select a file and optional limits before uploading.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700" htmlFor="file">
          File
        </label>
        <input
          id="file"
          type="file"
          className="w-full rounded border border-gray-300 px-3 py-2"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null
            setFile(selected)
          }}
        />
        {file ? (
          <p className="text-xs text-gray-500">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        ) : (
          <p className="text-xs text-gray-500">Maximum size depends on server configuration.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="maxDownloads">
            Max downloads (optional)
          </label>
          <input
            id="maxDownloads"
            type="number"
            min={1}
            max={MAX_DOWNLOAD_CAP}
            placeholder={`1-${MAX_DOWNLOAD_CAP}`}
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={maxDownloads}
            onChange={(event) => setMaxDownloads(event.target.value)}
          />
          <p className="text-xs text-gray-500">Leave blank to use the default server limit.</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="expiresAt">
            Expiration (optional)
          </label>
          <input
            id="expiresAt"
            type="datetime-local"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
          <p className="text-xs text-gray-500">Set when the file should expire. Leave empty for default.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          disabled={!canSubmit}
        >
          {state.status === 'loading' ? 'Uploading...' : 'Upload file'}
        </button>
        {renderMessage()}
      </div>
      <UploadProgress progress={progress} status={state.status} />
    </form>
  )
}
