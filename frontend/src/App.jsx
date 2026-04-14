import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import UploadPage from './pages/UploadPage'
import DeckPage from './pages/DeckPage'
import QuizPage from './pages/QuizPage'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/deck/:id" element={<DeckPage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
        </Routes>
      </main>
    </div>
  )
}
