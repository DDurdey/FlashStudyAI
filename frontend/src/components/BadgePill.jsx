const config = {
  Easy:   { bg: '#0d2818', color: '#22c55e', border: '#14532d' },
  Medium: { bg: '#271f0a', color: '#f59e0b', border: '#451a03' },
  Hard:   { bg: '#2a0f0f', color: '#ef4444', border: '#450a0a' },
}

export default function BadgePill({ difficulty }) {
  const c = config[difficulty] ?? config.Medium
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      padding: '3px 9px',
      borderRadius: '999px',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      userSelect: 'none',
    }}>
      {difficulty}
    </span>
  )
}
