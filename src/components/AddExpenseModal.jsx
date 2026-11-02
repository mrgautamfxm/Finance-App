import React, { useState } from 'react'
import { expenseCategories, creditSources } from '../utils/categories.js'
import { addTransaction } from '../services/financeService.js'
import { supabase } from '../services/supabase.js'

export default function AddExpenseModal({ onClose, onSaved, mode = 'expense' }) {
  const [category, setCategory] = useState(expenseCategories[0].id)
  const [source, setSource] = useState(creditSources[0].id)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState(mode)

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    if (!description.trim()) {
      alert('Please enter a description')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const transaction = {
        user_id: user.id,
        type: tab,
        category: tab === 'expense' ? category : null,
        source: tab === 'credit' ? source : null,
        description: description.trim(),
        amount: parseFloat(amount),
        date: date,
        created_at: new Date().toISOString(),
      }

      await addTransaction(transaction)
      onSaved()
      onClose()
    } catch (err) {
      alert('Error saving: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-handle"></div>
        <div className="modal-title">
          {tab === 'expense' ? 'Add Expense' : 'Add Money'}
        </div>

        {/* Tab Switch */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setTab('expense')}
            style={{
              flex: 1, padding: 12, border: 'none', borderRadius: 12,
              background: tab === 'expense' ? 'var(--primary)' : 'var(--border)',
              color: tab === 'expense' ? 'white' : 'var(--text-light)',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            💸 Expense
          </button>
          <button
            onClick={() => setTab('credit')}
            style={{
              flex: 1, padding: 12, border: 'none', borderRadius: 12,
              background: tab === 'credit' ? 'var(--success)' : 'var(--border)',
              color: tab === 'credit' ? 'white' : 'var(--text-light)',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            💰 Credit
          </button>
        </div>

        {tab === 'expense' ? (
          <div className="input-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="input-group">
            <label>Source</label>
            <select value={source} onChange={e => setSource(e.target.value)}>
              {creditSources.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="input-group">
          <label>{tab === 'expense' ? 'What did you purchase?' : 'Description'}</label>
          <input
            type="text"
            placeholder={tab === 'expense' ? 'e.g., Breakfast, Vegetables, Books' : 'e.g., Salary, Pocket Money'}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        <div className="input-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 8 }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : tab === 'expense' ? 'Save Expense' : 'Add Money'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: 14, border: 'none', background: 'none',
            fontFamily: 'inherit', fontSize: 14, color: 'var(--text-lighter)',
            cursor: 'pointer', marginTop: 8,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}