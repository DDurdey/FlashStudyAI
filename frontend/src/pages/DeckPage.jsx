import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FlashCard from '../components/FlashCard'
import { getDeck, getDeckTopics } from '../lib/api'

const FILTERS = ['All', 'Easy', 'Medium', 'Hard']

export default function DeckPage() {
  const { id } = useParams()
  const [filter, setFilter] = useState('All')
  const [deck, setDeck] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [topicFilter, setTopicFilter] = useState('All topics')
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

        const [deckData, topicData] = await Promise.all([
          getDeck(id),
          getDeckTopics(id),
        ])

        if (!alive) return

        setDeck(deckData)
        setTopics(topicData)
        setTopicFilter('All topics')
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Failed to load deck.')
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

  const topicOptions = useMemo(() => {
    return ['All topics', ...topics.map(topic => topic.topic)]
  }, [topics])

  const filtered = cards.filter(card => {
    const difficultyMatch = filter === 'All' || card.difficulty === filter
    const topicMatch = topicFilter === 'All topics' || card.topic === topicFilter
    return difficultyMatch && topicMatch
  })

  if (loading) {
    return (
      <div className="fade-up" style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '60px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '30px', letterSpacing: '-0.03em', marginBottom: '10px' }}>
          Loading your deck
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Fetching the generated flashcards from the backend...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fade-up" style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '60px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '30px', letterSpacing: '-0.03em', marginBottom: '10px' }}>
          Could not load deck
        </h1>
        <p style={{ color: 'var(--hard)', marginBottom: '24px' }}>{error}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: '1px solid var(--border-hi)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          Back to upload
        </button>
      </div>
    )
  }

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
              {deck?.deck_name ?? 'Your deck'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {cards.length} cards · click any card to reveal the answer
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
      </div>

      {/* Topic pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {topicOptions.map(topic => (
          <button
            key={topic}
            onClick={() => setTopicFilter(topic)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: `1px solid ${topicFilter === topic ? 'var(--accent)' : 'var(--border)'}`,
              background: topicFilter === topic ? 'var(--accent)' : 'transparent',
              color: topicFilter === topic ? 'var(--bg)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {topic}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center' }}>
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {topics.length ? (
        <div style={{ marginBottom: '20px', padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-card)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Topic summary
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {topics.map(topic => (
              <span
                key={topic.topic}
                style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-hi)',
                  fontSize: '12px',
                  color: 'var(--text)',
                }}
              >
                {topic.topic} · {topic.count}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {filtered.map((card, i) => (
          <FlashCard key={card.id ?? `${card.question}-${i}`} {...card} index={i} />
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