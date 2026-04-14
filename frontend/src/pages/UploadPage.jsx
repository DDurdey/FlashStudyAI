import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const MOCK_CARDS = [
  { id: 1, question: 'What is the difference between TCP and UDP?', answer: 'TCP is connection-oriented and guarantees delivery with error checking. UDP is connectionless, faster, but has no delivery guarantee.', difficulty: 'Medium' },
  { id: 2, question: 'Define Big-O notation.', answer: 'A mathematical notation that describes the upper bound of an algorithm\'s time or space complexity as input size grows.', difficulty: 'Easy' },
  { id: 3, question: 'What is a race condition?', answer: 'A race condition occurs when two or more threads access shared data concurrently and the outcome depends on the order of execution.', difficulty: 'Hard' },
  { id: 4, question: 'What does REST stand for?', answer: 'Representational State Transfer — an architectural style for distributed hypermedia systems.', difficulty: 'Easy' },
  { id: 5, question: 'Explain the CAP theorem.', answer: 'A distributed system can only guarantee two of three properties: Consistency, Availability, and Partition tolerance.', difficulty: 'Hard' },
  { id: 6, question: 'What is memoization?', answer: 'An optimization technique that caches the results of expensive function calls so they aren\'t recomputed for the same inputs.', difficulty: 'Medium' },
]

function estimateMaxCards(file) {
  if (!file) return 0
  const estimatedWords = Math.floor(file.size / 6)
  return Math.min(Math.max(Math.floor(estimatedWords / 150), 3), 50)
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cardCount, setCardCount] = useState(10)
  const inputRef = useRef()
  
  const navigate = useNavigate()

  const maxCards = estimateMaxCards(file)

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain']
    if (!allowed.includes(f.type)) {
      alert('Please upload a PDF, DOCX, or TXT file.')
      return
    }
    setFile(f)
    setCardCount(Math.min(10, estimateMaxCards(f)))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleGenerate = async () => {
    if (!file) return
    setLoading(true)
    // TODO: replace with real API call in Phase 2
    // const formData = new FormData()
    // formData.append('file', file)
    // formData.append('card_count', cardCount)
    // const res = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData)
    // const cards = res.data.cards
    await new Promise(r => setTimeout(r, 1800))

    // Save mock deck to localStorage
    const deckId = `deck-${Date.now()}`
    const deck = {
      id: deckId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      createdAt: new Date().toISOString(),
      cardCount,
      cards: MOCK_CARDS.slice(0, Math.min(cardCount, MOCK_CARDS.length)),
    }
    const existing = JSON.parse(localStorage.getItem('flashstudy-decks') || '[]')
    localStorage.setItem('flashstudy-decks', JSON.stringify([deck, ...existing]))

    setLoading(false)
    
    navigate(`/deck/${deckId}`)
  }

  return (
    <div className="fade-up" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>

      <h1 style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: '36px',
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
        marginBottom: '10px',
      }}>
        Upload your notes.<br />
        <span style={{ color: 'var(--accent)' }}>Get flashcards.</span>
      </h1>

      <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '14px' }}>
        Supports PDF, DOCX, and plain text. Cards ready in under 15 seconds.
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--accent)' : file ? '#2d4a1e' : 'var(--border-hi)'}`,
          borderRadius: 'var(--radius)',
          background: dragging ? '#111a09' : file ? '#0c160a' : 'var(--bg-card)',
          padding: '56px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '20px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />

        {file ? (
          <>
            <div style={{
              width: '40px', height: '40px', borderRadius: '8px',
              background: '#1a3d12', border: '1px solid #2d5a1e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: '20px',
            }}>📄</div>
            <p style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{file.name}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {(file.size / 1024).toFixed(1)} KB · click to replace
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: '40px', height: '40px', borderRadius: '8px',
              background: 'var(--border)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: '20px',
            }}>↑</div>
            <p style={{ fontWeight: 500, marginBottom: '4px' }}>
              {dragging ? 'Drop it here' : 'Drag & drop your file'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              or click to browse · PDF, DOCX, TXT
            </p>
          </>
        )}
      </div>

      {/* Card count selector — only shown once a file is picked */}
      {file && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Number of flashcards</span>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '20px',
              color: 'var(--accent)',
            }}>{cardCount}</span>
          </div>

          <input
            type="range"
            min={3}
            max={maxCards || 3}
            value={cardCount}
            onChange={e => setCardCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>3 min</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ~{maxCards} estimated max from this file
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{maxCards} max</span>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!file || loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: file ? 'var(--accent)' : 'var(--border)',
          color: file ? 'var(--bg)' : 'var(--text-muted)',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '15px',
          letterSpacing: '-0.01em',
          cursor: file ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? `Generating ${cardCount} flashcards...` : `Generate ${file ? cardCount : ''} flashcards →`}
      </button>

    </div>
  )
}