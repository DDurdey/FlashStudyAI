import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: 'rgba(9,9,9,0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 50,
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '17px',
          letterSpacing: '-0.02em',
          color: 'var(--text)',
        }}>
          Flash<span style={{ color: 'var(--accent)' }}>Study</span>
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <NavLink to="/" active={pathname === '/'}>Upload</NavLink>
      </div>
    </nav>
  )
}

function NavLink({ to, children, active }) {
  return (
    <Link to={to} style={{
      textDecoration: 'none',
      fontSize: '13px',
      fontWeight: 500,
      padding: '5px 12px',
      borderRadius: '6px',
      color: active ? 'var(--bg)' : 'var(--text-muted)',
      background: active ? 'var(--accent)' : 'transparent',
      transition: 'all 0.15s',
    }}>
      {children}
    </Link>
  )
}
