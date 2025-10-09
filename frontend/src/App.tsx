import './App.css'
import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import FileUpload from './components/FileUpload'
import FileDownload from './components/FileDownload'
import LinkManager from './components/LinkManager'
import type { UploadData } from '@templink/shared/types'

const App = () => {
  const [lastUpload, setLastUpload] = useState<UploadData | null>(null)
  const location = useLocation()
  const prevPath = useRef(location.pathname)

  // Clear lastUpload when navigating back to home from another route
  useEffect(() => {
    if (location.pathname === '/' && prevPath.current !== '/') {
      setLastUpload(null)
      try { localStorage.removeItem('templink:lastUpload') } catch {}
    }
    prevPath.current = location.pathname
  }, [location.pathname])

  // Load persisted upload on initial mount (so refresh preserves state)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('templink:lastUpload')
      if (raw) {
        setLastUpload(JSON.parse(raw))
      }
    } catch {}
  }, [])

  // Persist on change
  useEffect(() => {
    try {
      if (lastUpload) localStorage.setItem('templink:lastUpload', JSON.stringify(lastUpload))
    } catch {}
  }, [lastUpload])

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <div className="p-6 space-y-6">
            <FileUpload onSuccess={setLastUpload} />
            <LinkManager upload={lastUpload} />
          </div>
        )}
      />
      <Route path="/:token" element={<FileDownload />} />
      <Route path="*" element={<div className="p-6">Not Found</div>} />
    </Routes>
  )
}

export default App
