import './App.css'
import { Routes, Route } from 'react-router-dom'
import FileUpload from './components/FileUpload'
import FileDownload from './components/FileDownload'
import LinkManager from './components/LinkManager'

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<div className="p-6 space-y-6"><FileUpload /><LinkManager /></div>}
      />
      <Route path="/:token" element={<FileDownload />} />
      <Route path="*" element={<div className="p-6">Not Found</div>} />
    </Routes>
  )
}

export default App
