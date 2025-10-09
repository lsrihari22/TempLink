import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UploadData } from '@templink/shared/types'

type LinkManagerProps = {
  upload: UploadData | null
}

export default function LinkManager({ upload }: LinkManagerProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const shareUrl = useMemo(() => {
    if (!upload) return ''
    return `${window.location.origin}/${upload.token}`
  }, [upload])

  const directDownload = upload?.links?.absolute?.download
    ?? (upload ? `${import.meta.env.VITE_API_URL}/file/${upload.token}/download` : '')

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Copy failed', error)
      setCopied(null)
    }
  }

  if (!upload) {
    return (
      <div className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        Upload a file to see shareable links here.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded border border-gray-200 p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Share your file</h2>
        <p className="text-sm text-gray-500">Use these links to view or download the uploaded file.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Recently uploaded</div>
          <Link
            to={`/${upload.token}`}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            View details
          </Link>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Token</div>
          <div className="mt-1 flex items-center gap-2">
            <code className="rounded bg-gray-100 px-2 py-1 text-sm">{upload.token}</code>
            <button
              type="button"
              className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
              onClick={() => handleCopy(upload.token, 'token')}
            >
              Copy
            </button>
            {copied === 'token' && <span className="text-xs text-green-600">Copied!</span>}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Share link</div>
          <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center">
            <a className="text-blue-600 underline" href={shareUrl}>
              {shareUrl}
            </a>
            <button
              type="button"
              className="w-fit rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
              onClick={() => handleCopy(shareUrl, 'share')}
            >
              Copy
            </button>
            {copied === 'share' && <span className="text-xs text-green-600">Copied!</span>}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Direct download</div>
          <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center">
            <a className="text-blue-600 underline" href={directDownload}>
              {directDownload}
            </a>
            <button
              type="button"
              className="w-fit rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
              onClick={() => handleCopy(directDownload, 'download')}
            >
              Copy
            </button>
            {copied === 'download' && <span className="text-xs text-green-600">Copied!</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
