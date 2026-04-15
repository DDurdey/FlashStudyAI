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
  const [sourceFileFilter, setSourceFileFilter] = useState('All files')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'slide'
  const [slideIndex, setSlideIndex] = useState(0)
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

  const cards = useMemo(() => deck?.flashcards ?? [], [deck])

  const topicOptions = useMemo(() => {
    return ['All topics', ...topics.map(topic => topic.topic)]
  }, [topics])

  const sourceFiles = useMemo(() => {
    return [...new Set(cards.map(c => c.source_file).filter(Boolean))]
  }, [cards])

  const filtered = cards.filter(card => {
    const difficultyMatch = filter === 'All' || card.difficulty === filter
    const topicMatch = topicFilter === 'All topics' || card.topic === topicFilter
    const sourceMatch = sourceFileFilter === 'All files' || card.source_file === sourceFileFilter
    return difficultyMatch && topicMatch && sourceMatch
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

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', border: '1px solid var(--border-hi)', borderRadius: '8px', overflow: 'hidden' }}>
              {[['grid', '⊞'], ['slide', '▷']].map(([mode, icon]) => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); setSlideIndex(0) }}
                  title={mode === 'grid' ? 'Grid view' : 'Slide view'}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    background: viewMode === mode ? 'var(--accent)' : 'transparent',
                    color: viewMode === mode ? 'var(--bg)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.15s',
                  }}
                >
                  {icon}
                </button>
              ))}
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

      {/* Source file pills — only shown when cards come from multiple files */}
      {sourceFiles.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '4px' }}>File</span>
          {['All files', ...sourceFiles].map(sf => (
            <button
              key={sf}
              onClick={() => setSourceFileFilter(sf)}
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                border: `1px solid ${sourceFileFilter === sf ? 'var(--accent)' : 'var(--border)'}`,
                background: sourceFileFilter === sf ? 'var(--accent)' : 'transparent',
                color: sourceFileFilter === sf ? 'var(--bg)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={sf}
            >
              {sf}
            </button>
          ))}
        </div>
      )}

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

      {/* Cards */}
      {viewMode === 'slide' ? (() => {
        const safeIndex = Math.min(slideIndex, Math.max(0, filtered.length - 1))
        const card = filtered[safeIndex]
        return filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>No cards match these filters.</p>
        ) : (
          <div style={{ maxWidth: '420px', margin: '0 auto' }}>
            {/* key=safeIndex forces FlashCard to remount so it resets to question side */}
            <FlashCard key={safeIndex} {...card} index={0} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '20px' }}>
              <button
                onClick={() => setSlideIndex(i => Math.max(0, i - 1))}
                disabled={safeIndex === 0}
                style={{ ...slideNavBtn, opacity: safeIndex === 0 ? 0.3 : 1 }}
              >
                ← prev
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '60px', textAlign: 'center' }}>
                {safeIndex + 1} / {filtered.length}
              </span>
              <button
                onClick={() => setSlideIndex(i => Math.min(filtered.length - 1, i + 1))}
                disabled={safeIndex === filtered.length - 1}
                style={{ ...slideNavBtn, opacity: safeIndex === filtered.length - 1 ? 0.3 : 1 }}
              >
                next →
              </button>
            </div>
          </div>
        )
      })() : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {filtered.map((card, i) => (
            <FlashCard key={card.id ?? `${card.question}-${i}`} {...card} index={i} />
          ))}
        </div>
      )}

    </div>
  )
}

const slideNavBtn = {
  background: 'none',
  border: '1px solid var(--border-hi)',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '8px 18px',
  borderRadius: '8px',
  transition: 'all 0.15s',
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