import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase.js'
import { getTransactions, deleteTransaction } from '../services/financeService.js'
import { getCategoryById } from '../utils/categories.js'
import { formatCurrency, formatDate } from '../utils/formatCurrency.js'
import TransactionItem from '../components/TransactionItem.jsx'
import '../styles/history.css'

export default function History() {
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState('') // New date filter
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadTransactions(user.id)
    })
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
      alert('Error: ' + err.message)
    }
  }

  let filtered = [...transactions]

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    )
  }

  // Type filter
  if (filter === 'expense') filtered = filtered.filter(t => t.type === 'expense')
  else if (filter === 'credit') filtered = filtered.filter(t => t.type === 'credit')

  // STRICT DATE FILTER
  if (selectedDate) {
    filtered = filtered.filter(t => t.date === selectedDate)
  }

  // Group by Date (using t.date, not created_at)
  const groupedByDate = {}
  filtered.forEach(t => {
    const date = t.date || formatDate(t.created_at)
    if (!groupedByDate[date]) groupedByDate[date] = []
    groupedByDate[date].push(t)
  })

  // Sort dates descending
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a))

  if (loading) return <div className="loading-screen"><div className="loading-logo">₣</div><p className="loading-text">Loading...</p></div>

  return (
    <div className="history-page">
      <div className="page-header"><h1>History</h1></div>

      {/* Search & Date Filter */}
      <div className="search-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input className="search-input" type="text" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            style={{ width: '100%', padding: 12, border: '2px solid var(--border)', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
          />
          {selectedDate && <button onClick={() => setSelectedDate('')} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13 }}>Clear Date Filter</button>}
        </div>
      </div>

      {/* Type Filters */}
      <div className="filter-bar">
        {['all', 'expense', 'credit'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'expense' ? '💸 Expenses' : '💰 Credits'}
          </button>
        ))}
      </div>

      {/* Transactions Grouped by Date */}
      {sortedDates.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><p>No transactions found for this filter.</p></div>
      ) : (
        sortedDates.map(date => (
          <div key={date} className="date-group">
            <div className="date-label">{date}</div>
            <div className="transactions">
              {groupedByDate[date].map(t => (
                <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}