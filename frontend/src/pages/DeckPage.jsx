import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FlashCard from '../components/FlashCard'

const FILTERS = ['All', 'Easy', 'Medium', 'Hard']

export default function DeckPage() {
  const { id } = useParams()
  const [filter, setFilter] = useState('All')
  const navigate = useNavigate()
  const decks = JSON.parse(localStorage.getItem('flashstudy-decks') || '[]')
  const deck = decks.find(d => d.id === id) || null

  if (!deck) return (
    <div style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--text-muted)' }}>
      <p style={{ marginBottom: '16px' }}>Deck not found.</p>
      <button onClick={() => navigate('/')} style={backBtnStyle}>← back to upload</button>
    </div>
  )

  const filtered = filter === 'All'
    ? deck.cards
    : deck.cards.filter(c => c.difficulty === filter)

  return (
    <div className="fade-up">

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button onClick={() => navigate('/')} style={backBtnStyle}>← back</button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '28px',
              letterSpacing: '-0.03em',
              marginBottom: '4px',
            }}>
              {deck.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {deck.cards.length} cards · click any card to reveal the answer
            </p>
          </div>

          <button
            onClick={() => navigate(`/quiz/${id}`)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-hi)',
              background: 'transparent',
              color: 'var(--text)',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.background = 'var(--bg-hover)'; e.target.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'var(--border-hi)' }}
          >
            Quiz mode →
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              background: filter === f ? 'var(--accent)' : 'transparent',
              color: filter === f ? 'var(--bg)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {filtered.map((card, i) => (
          <FlashCard key={card.id} {...card} index={i} />
        ))}
      </div>

    </div>
  )
}

const backBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '0 0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}