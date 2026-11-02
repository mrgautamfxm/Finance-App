import React from 'react'

export default function Header({ title, subtitle, onBack }) {
  return (
    <div className="page-header">
      <div>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-lighter)', fontWeight: 500 }}>{subtitle}</p>}
        <h1>{title}</h1>
      </div>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
      )}
    </div>
  )
}