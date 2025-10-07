import './App.css'
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import FileUpload from './components/FileUpload'
import FileDownload from './components/FileDownload'
import LinkManager from './components/LinkManager'
import type { UploadData } from '@templink/shared/types'

const App = () => {
  const [lastUpload, setLastUpload] = useState<UploadData | null>(null)

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
