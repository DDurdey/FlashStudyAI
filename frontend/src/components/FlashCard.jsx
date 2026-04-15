import { useState } from 'react'
import BadgePill from './BadgePill'

export default function FlashCard({ question, answer, difficulty, index = 0 }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={`flip-card${flipped ? ' flipped' : ''} fade-up`}
      style={{
        height: '220px',
        animationDelay: `${index * 0.05}s`,
      }}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="flip-card-inner">

        {/* Front — Question */}
        <div className="flip-card-front">
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
          }}>
            <BadgePill difficulty={difficulty} />
          </div>

          <p style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--text)',
            lineHeight: 1.5,
            maxWidth: '260px',
          }}>
            {question}
          </p>

          <span style={{
            position: 'absolute',
            bottom: '14px',
            right: '16px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}>
            tap to reveal
          </span>
        </div>

        {/* Back — Answer */}
        <div className="flip-card-back">
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
          }}>
            <span style={{
              fontSize: '11px',
              color: 'var(--accent)',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>Answer</span>
          </div>

          <p style={{
            fontSize: '14px',
            color: '#c8e6c0',
            lineHeight: 1.6,
            maxWidth: '260px',
          }}>
            {answer}
          </p>

          <span style={{
            position: 'absolute',
            bottom: '14px',
            right: '16px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}>
            tap to flip back
          </span>
        </div>

      </div>
    </div>
  )
}