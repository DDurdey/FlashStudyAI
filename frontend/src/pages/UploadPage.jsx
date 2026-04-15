import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadDocument } from '../lib/api'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cardCount, setCardCount] = useState(10)
  const inputRef = useRef()
  const navigate = useNavigate()

  const maxCards = files.length ? Math.max(...files.map(estimateMaxCards)) : 0

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => {
      if (!ALLOWED_TYPES.includes(f.type)) return false
      return true
    })
    if (valid.length < incoming.length) {
      setError('Some files were skipped — only PDF, DOCX, and TXT are supported.')
    } else {
      setError('')
    }
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      const added = valid.filter(f => !names.has(f.name))
      const next = [...prev, ...added]
      if (added.length > 0) {
        setCardCount(Math.min(20, Math.max(...next.map(estimateMaxCards))))
      }
      return next
    })
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleGenerate = async () => {
    if (!files.length) return
    setLoading(true)
    setError('')
    try {
      const result = await uploadDocument({ files, cardCount })
      navigate(`/deck/${result.deck.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards.')
    } finally {
      setLoading(false)
    }
  }

  const totalCards = files.length * cardCount

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
        Supports PDF, DOCX, and plain text. Upload multiple files to combine them into one deck.
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--accent)' : 'var(--border-hi)'}`,
          borderRadius: 'var(--radius)',
          background: dragging ? '#111a09' : 'var(--bg-card)',
          padding: '40px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: files.length ? '12px' : '20px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          style={{ display: 'none' }}
          onChange={e => { addFiles(e.target.files); e.target.value = '' }}
        />
        <div style={{
          width: '40px', height: '40px', borderRadius: '8px',
          background: 'var(--border)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', fontSize: '20px',
        }}>↑</div>
        <p style={{ fontWeight: 500, marginBottom: '4px' }}>
          {dragging ? 'Drop files here' : files.length ? 'Drop more files' : 'Drag & drop your files'}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          or click to browse · PDF, DOCX, TXT
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: '20px',
        }}>
          {files.map((f, i) => (
            <div
              key={f.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: i < files.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '16px' }}>📄</span>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                {(f.size / 1024).toFixed(1)} KB
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: '16px', padding: '0 2px', lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Card count selector */}
      {files.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              Cards per file
              {files.length > 1 && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {totalCards} total</span>
              )}
            </span>
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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>3</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ~{maxCards} estimated max
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{maxCards}</span>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!files.length || loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: files.length ? 'var(--accent)' : 'var(--border)',
          color: files.length ? 'var(--bg)' : 'var(--text-muted)',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '15px',
          letterSpacing: '-0.01em',
          cursor: files.length ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading
          ? `Generating ${totalCards} flashcards...`
          : files.length
            ? `Generate ${totalCards} flashcard${totalCards !== 1 ? 's' : ''} →`
            : 'Select files to get started'}
      </button>

      {error ? (
        <p style={{ color: 'var(--hard)', fontSize: '13px', marginTop: '14px', textAlign: 'center' }}>
          {error}
        </p>
      ) : null}

    </div>
  )
}

function estimateMaxCards(file) {
  if (!file) return 0
  const kb = file.size / 1024
  return Math.min(100, Math.max(3, Math.round(kb)))
}
