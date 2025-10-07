type UploadProgressProps = {
  progress: number | null
  status: 'idle' | 'loading' | 'success' | 'error'
}

export default function UploadProgress({ progress, status }: UploadProgressProps) {
  const showBar = status === 'loading' || (status === 'success' && progress !== null)
  if (!showBar) return null

  const value = progress ?? 100
  const clamped = Math.max(0, Math.min(100, value))
  const barColor = status === 'success' ? 'bg-green-500' : 'bg-blue-600'

  return (
    <div className="w-full space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`${barColor} h-full transition-all duration-200`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">
        {status === 'loading' ? `Uploading ${clamped}%` : 'Upload complete'}
      </div>
    </div>
  )
}
