import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BadgePill from '../components/BadgePill'
import { getDeck } from '../lib/api'

export default function QuizPage() {
  const { id } = useParams()
  const [index, setIndex] = useState(0)
  const [inputs, setInputs] = useState({}) // per-card answer text keyed by card index
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [deck, setDeck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // answers[cardIndex] = true (correct) | false (incorrect) — index-keyed so prev/skip compose correctly
  const [answers, setAnswers] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true

    async function loadDeck() {
      if (!id) {
        setError('Missing deck id.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const deckData = await getDeck(id)
        if (!alive) return
        setDeck(deckData)
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Failed to load quiz deck.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadDeck()

    return () => {
      alive = false
    }
  }, [id])

  const cards = deck?.flashcards ?? []
  const card = cards[index]
  const progress = cards.length ? (index / cards.length) * 100 : 0

  // Score derived from answers map — always accurate regardless of navigation order
  const correct = Object.values(answers).filter(Boolean).length
  const incorrect = Object.values(answers).filter(v => !v).length

  const handleReveal = () => setRevealed(true)

  const handleNext = (isCorrect) => {
    setAnswers(a => ({ ...a, [index]: isCorrect }))
    if (index + 1 >= cards.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setRevealed(false)
    }
  }

  // Skip forward without scoring the current card
  const handleSkip = () => {
    if (index + 1 >= cards.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setRevealed(false)
    }
  }

  // Go back — no score change (answers map is index-keyed, stays intact)
  const handlePrev = () => {
    if (index === 0) return
    setIndex(i => i - 1)
    setRevealed(false)
  }

  const handleRestart = () => {
    setIndex(0)
    setInputs({})
    setRevealed(false)
    setAnswers({})
    setDone(false)
  }

  if (done) {
    const total = cards.length
    const pct = Math.round((correct / total) * 100)
    return (
      <div className="fade-up" style={{ maxWidth: '480px', margin: '0 auto', paddingTop: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {pct >= 80 ? '🏆' : pct >= 50 ? '📚' : '💪'}
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '32px', letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Quiz complete
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
          You got {correct} out of {total} correct
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
          <StatBox label="Correct" value={correct} color="var(--easy)" />
          <StatBox label="Incorrect" value={incorrect} color="var(--hard)" />
          <StatBox label="Score" value={`${pct}%`} color="var(--accent)" />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => navigate(`/deck/${id}`)} style={btnStyle('outline')}>
            Back to deck
          </button>
          <button onClick={handleRestart} style={{ ...actionBtn('accent'), flex: 1 }}>
            Retry quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ maxWidth: '560px', margin: '0 auto', paddingTop: '32px' }}>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Loading quiz
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Fetching the deck from the backend...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Could not load quiz
          </h1>
          <p style={{ color: 'var(--hard)', marginBottom: '20px' }}>{error}</p>
          <button onClick={() => navigate('/')} style={btnStyle('outline')}>
            Back to upload
          </button>
        </div>
      ) : !cards.length ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            No cards available
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate a deck first.</p>
        </div>
      ) : (
        <>

      {/* Back to deck */}
      <button
        onClick={() => navigate(`/deck/${id}`)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '13px',
          padding: '0 0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ← back to deck
      </button>

      {/* Progress bar */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {index > 0 && (
              <button
                onClick={handlePrev}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: 0 }}
              >
                ← prev
              </button>
            )}
            <span>{index + 1} / {cards.length}</span>
            {index < cards.length - 1 && (
              <button
                onClick={handleSkip}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: 0 }}
              >
                skip →
              </button>
            )}
          </div>
          <span>{correct} correct</span>
        </div>
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '999px' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '32px',
        marginBottom: '20px',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <BadgePill difficulty={card.difficulty} />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {card.topic}
        </p>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '18px', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
          {card.question}
        </p>
      </div>

      {/* Answer input */}
      <textarea
        value={inputs[index] ?? ''}
        onChange={e => setInputs(prev => ({ ...prev, [index]: e.target.value }))}
        placeholder="Type your answer here..."
        disabled={revealed}
        rows={3}
        style={{
          width: '100%',
          background: revealed ? '#0d0d0d' : 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          fontSize: '14px',
          padding: '16px',
          resize: 'none',
          outline: 'none',
          fontFamily: 'DM Sans, sans-serif',
          marginBottom: '16px',
          transition: 'border-color 0.2s',
          opacity: revealed ? 0.5 : 1,
        }}
        onFocus={e => !revealed && (e.target.style.borderColor = 'var(--border-hi)')}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />

      {/* Reveal / action */}
      {!revealed ? (
        <button onClick={handleReveal} disabled={!(inputs[index] ?? '').trim()} style={actionBtn('accent', !(inputs[index] ?? '').trim())}>
          Reveal answer
        </button>
      ) : (
        <>
          <div style={{
            background: '#0c160a',
            border: '1px solid #1e3d18',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Correct answer</p>
            <p style={{ fontSize: '14px', color: '#c8e6c0', lineHeight: 1.6 }}>{card.answer}</p>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center' }}>
            How did you do?
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleNext(false)} style={{ ...actionBtn('outline'), flex: 1, borderColor: '#3d1515', color: 'var(--hard)' }}>
              ✗ Incorrect
            </button>
            <button onClick={() => handleNext(true)} style={{ ...actionBtn('outline'), flex: 1, borderColor: '#1a3d12', color: 'var(--easy)' }}>
              ✓ Correct
            </button>
          </div>
        </>
      )}

        </>
      )}

    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px 24px',
      textAlign: 'center',
      minWidth: '90px',
    }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', color, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function actionBtn(variant, disabled = false) {
  const base = {
    width: '100%',
    padding: '13px',
    borderRadius: 'var(--radius)',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 700,
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '-0.01em',
  }
  if (variant === 'accent') return { ...base, background: disabled ? 'var(--border)' : 'var(--accent)', border: 'none', color: disabled ? 'var(--text-muted)' : 'var(--bg)', opacity: disabled ? 0.6 : 1 }
  return { ...base, background: 'transparent', border: '1px solid var(--border-hi)', color: 'var(--text)' }
}

function btnStyle(variant) {
  const base = {
    padding: '10px 20px',
    borderRadius: 'var(--radius)',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }
  if (variant === 'outline') return { ...base, background: 'transparent', border: '1px solid var(--border-hi)', color: 'var(--text)' }
  return { ...base, background: 'var(--accent)', border: 'none', color: 'var(--bg)' }
}
