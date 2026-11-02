import React from 'react'
import { getCategoryById, getSourceById } from '../utils/categories.js'
import { formatCurrency, formatDate } from '../utils/formatCurrency.js'

export default function TransactionItem({ transaction, onDelete }) {
  const isExpense = transaction.type === 'expense'
  const category = isExpense
    ? getCategoryById(transaction.category)
    : getSourceById(transaction.source)

  return (
    <div className="transaction-item">
      <div
        className="transaction-icon"
        style={{ background: isExpense ? `${category.color}15` : '#D1FAE5' }}
      >
        {category.icon}
      </div>
      <div className="transaction-info">
        <div className="t-name">{transaction.description}</div>
        <div className="t-category">
          {category.name} • {formatDate(transaction.created_at)}
        </div>
      </div>
      <div className={`transaction-amount ${isExpense ? 'expense' : 'credit'}`}>
        {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(transaction.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-lighter)',
            cursor: 'pointer',
            fontSize: 16,
            padding: '4px 8px',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}