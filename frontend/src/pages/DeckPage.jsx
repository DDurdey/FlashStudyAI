import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FlashCard from '../components/FlashCard'

const MOCK_CARDS = [
  { id: 1, question: 'What is the difference between TCP and UDP?', answer: 'TCP is connection-oriented and guarantees delivery with error checking. UDP is connectionless, faster, but has no delivery guarantee.', difficulty: 'Medium' },
  { id: 2, question: 'Define Big-O notation.', answer: 'A mathematical notation that describes the upper bound of an algorithm\'s time or space complexity as input size grows.', difficulty: 'Easy' },
  { id: 3, question: 'What is a race condition?', answer: 'A race condition occurs when two or more threads access shared data concurrently and the outcome depends on the order of execution.', difficulty: 'Hard' },
  { id: 4, question: 'What does REST stand for?', answer: 'Representational State Transfer — an architectural style for distributed hypermedia systems.', difficulty: 'Easy' },
  { id: 5, question: 'Explain the CAP theorem.', answer: 'A distributed system can only guarantee two of three properties: Consistency, Availability, and Partition tolerance.', difficulty: 'Hard' },
  { id: 6, question: 'What is memoization?', answer: 'An optimization technique that caches the results of expensive function calls so they aren\'t recomputed for the same inputs.', difficulty: 'Medium' },
]

const FILTERS = ['All', 'Easy', 'Medium', 'Hard']

export default function DeckPage() {
  const [filter, setFilter] = useState('All')
  const navigate = useNavigate()

  const filtered = filter === 'All'
    ? MOCK_CARDS
    : MOCK_CARDS.filter(c => c.difficulty === filter)

  return (
    <div className="fade-up">

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '13px', padding: '0 0 16px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          ← back
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '28px',
              letterSpacing: '-0.03em',
              marginBottom: '4px',
            }}>
              Your deck
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {MOCK_CARDS.length} cards · click any card to reveal the answer
            </p>
          </div>

          <button
            onClick={() => navigate('/quiz/mock-123')}
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
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
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center' }}>
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
