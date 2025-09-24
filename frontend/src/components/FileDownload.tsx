import React from 'react'
import { useParams } from 'react-router-dom'

export default function FileDownload() {
  const { token } = useParams<{ token: string }>()

  if (!token) {
    return <div className="p-6">Invalid or missing token.</div>
  }

  const downloadUrl = `${import.meta.env.VITE_API_URL}/file/${token}/download`

  return (
    <div className="p-6 space-y-2">
      <h2 className="text-lg font-semibold">Download</h2>
      <div className="text-sm text-gray-500">Token: {token}</div>
      <a className="text-blue-600 underline" href={downloadUrl}>
        Download file
      </a>
    </div>
  )
}
