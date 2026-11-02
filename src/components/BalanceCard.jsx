import React from 'react'

export default function BalanceCard({ label, amount, icon, type }) {
  return (
    <div className="balance-card">
      <div className={`card-icon ${type}`}>{icon}</div>
      <div className="card-label">{label}</div>
      <div className={`card-amount ${type}`}>
        {type === 'expense' ? '-' : '+'}₹{Math.abs(amount).toLocaleString('en-IN')}
      </div>
    </div>
  )
}