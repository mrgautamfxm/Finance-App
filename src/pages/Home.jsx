import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase.js'
import { getTransactions, deleteTransaction } from '../services/financeService.js'
import { calculateTotals } from '../utils/calculations.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import TransactionItem from '../components/TransactionItem.jsx'
import AddExpenseModal from '../components/AddExpenseModal.jsx'
import '../styles/home.css'

export default function Home() {
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadTransactions(user.id)
    })

    const handleOpenAdd = () => setShowModal(true)
    window.addEventListener('openAddExpense', handleOpenAdd)
    return () => window.removeEventListener('openAddExpense', handleOpenAdd)
  }, [])

  async function loadTransactions(userId) {
    try {
      const data = await getTransactions(userId)
      setTransactions(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return
    try {
      await deleteTransaction(id)
      await loadTransactions(user.id)
    } catch (err) {
      alert('Error deleting: ' + err.message)
    }
  }

  const totals = calculateTotals(transactions)
  const recentTransactions = transactions.slice(0, 5)

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">₣</div>
        <p className="loading-text">Loading...</p>
      </div>
    )
  }

  return (
    <div className="home-page">
      {/* Header */}
      <div className="home-header">
        <div>
          <p className="greeting">{greeting},</p>
          <p className="user-name">{user?.user_metadata?.name || 'User'} 👋</p>
          <p className="date-text">{dateStr}</p>
        </div>
        <div
          className="header-avatar"
          onClick={() => navigate('/profile')}
        >
          {(user?.user_metadata?.name || 'U')[0].toUpperCase()}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="balance-cards">
        <div className="balance-main">
          <div className="label">Remaining Balance</div>
          <div className="amount">{formatCurrency(totals.remaining)}</div>
          <div className="sub-label">Available money</div>
        </div>
        <div className="balance-row">
          <div className="balance-card">
            <div className="card-icon expense">💸</div>
            <div className="card-label">Total Expenses</div>
            <div className="card-amount negative">{formatCurrency(totals.totalExpenses)}</div>
          </div>
          <div className="balance-card">
            <div className="card-icon credit">💰</div>
            <div className="card-label">Total Credited</div>
            <div className="card-amount positive">{formatCurrency(totals.totalCredited)}</div>
          </div>
        </div>
      </div>

      {/* Add Expense Button */}
      <div className="add-expense-section">
        <button className="add-expense-btn" onClick={() => setShowModal(true)}>
          <span style={{ fontSize: 20 }}>＋</span> Add Expense / Money
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="recent-section">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <span className="see-all" onClick={() => navigate('/history')}>See All →</span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No transactions yet.<br />Tap the button above to add one!</p>
          </div>
        ) : (
          <div className="transaction-list">
            {recentTransactions.map(t => (
              <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onSaved={() => loadTransactions(user.id)}
        />
      )}
    </div>
  )
}