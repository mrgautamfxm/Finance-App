import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase.js'
import { getTransactions, addTransaction, getMonthlyBudget, updateMonthlyBudget } from '../services/financeService.js'
import { expenseCategories, creditSources } from '../utils/categories.js'
import { calculateTotals, calculateCategoryTotals } from '../utils/calculations.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AddExpenseModal from '../components/AddExpenseModal.jsx'
import '../styles/budget.css'

export default function Budget() {
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('credit')
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [budgetInput, setBudgetInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadData(user.id)
    })

    const handleOpenAdd = () => {
      setModalMode('expense')
      setShowModal(true)
    }
    window.addEventListener('openAddExpense', handleOpenAdd)
    return () => window.removeEventListener('openAddExpense', handleOpenAdd)
  }, [])

  async function loadData(userId) {
    try {
      const [txData, budgetData] = await Promise.all([
        getTransactions(userId),
        getMonthlyBudget(userId),
      ])
      setTransactions(txData || [])
      if (budgetData) {
        setMonthlyBudget(budgetData.monthly_limit || 0)
        setBudgetInput(budgetData.monthly_limit || '')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBudget() {
    if (!budgetInput || parseFloat(budgetInput) <= 0) return
    try {
      await updateMonthlyBudget(user.id, { monthly_limit: parseFloat(budgetInput) })
      setMonthlyBudget(parseFloat(budgetInput))
      alert('Monthly budget saved!')
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const totals = calculateTotals(transactions)
  const categoryTotals = calculateCategoryTotals(transactions)

  const chartData = expenseCategories
    .filter(c => categoryTotals[c.id])
    .map(c => ({
      name: c.name,
      amount: categoryTotals[c.id],
      color: c.color,
    }))

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">₣</div>
        <p className="loading-text">Loading Budget...</p>
      </div>
    )
  }

  return (
    <div className="budget-page">
      <div className="page-header">
        <h1>Budget</h1>
      </div>

      {/* Add Money Card */}
      <div className="add-money-card">
        <h3>Total Money Added</h3>
        <div className="total-credit">{formatCurrency(totals.totalCredited)}</div>
        <button className="add-money-btn" onClick={() => { setModalMode('credit'); setShowModal(true) }}>
          ＋ Add Money
        </button>
      </div>

      {/* Monthly Budget Setting */}
      <div className="monthly-budget-setting">
        <h3>📊 Monthly Budget Limit</h3>
        <div className="mb-row">
          <input
            type="number"
            placeholder="Set monthly budget"
            value={budgetInput}
            onChange={e => setBudgetInput(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSaveBudget}>
            Save
          </button>
        </div>
        {monthlyBudget > 0 && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-light)' }}>
            Spent: <strong>{formatCurrency(totals.totalExpenses)}</strong> of {formatCurrency(monthlyBudget)}
            {' '}{((totals.totalExpenses / monthlyBudget) * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Category Chart */}
      {chartData.length > 0 && (
        <div className="budget-overview">
          <h2>📊 Spending Overview</h2>
          <div style={{ height: 200, marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Progress Bars */}
      <div className="budget-overview">
        <h2>📂 Category-wise Spending</h2>

        {expenseCategories.map(cat => {
          const spent = categoryTotals[cat.id] || 0
          const percent = monthlyBudget > 0 ? Math.min((spent / monthlyBudget) * 100, 100) : 0

          return (
            <div key={cat.id} className="budget-item">
              <div className="budget-item-header">
                <div className="bi-left">
                  <div className="bi-icon" style={{ background: `${cat.color}15` }}>
                    {cat.icon}
                  </div>
                  <div className="bi-name">{cat.name}</div>
                </div>
                <div className="bi-percent">{percent.toFixed(0)}%</div>
              </div>
              <div className="budget-bar">
                <div
                  className="budget-bar-fill"
                  style={{
                    width: `${percent}%`,
                    background: `linear-gradient(90deg, ${cat.color}, ${cat.color}CC)`,
                  }}
                />
              </div>
              <div className="budget-item-footer">
                <span className="spent">{formatCurrency(spent)} spent</span>
                <span>{formatCurrency(monthlyBudget)} budget</span>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <AddExpenseModal
          mode={modalMode}
          onClose={() => setShowModal(false)}
          onSaved={() => loadData(user.id)}
        />
      )}
    </div>
  )
}