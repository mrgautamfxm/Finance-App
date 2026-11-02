import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase.js'
import { addTransaction, getTransactions, deleteTransaction } from '../services/financeService.js'
import { expenseCategories } from '../utils/categories.js'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function StudentExpense() {
  const [userId, setUserId] = useState(null)
  const [attended, setAttended] = useState(null) 
  const [isTodayDone, setIsTodayDone] = useState(false)
  
  const [allowance, setAllowance] = useState(() => parseFloat(localStorage.getItem('se_allowance')) || 100)
  const [travel, setTravel] = useState(() => parseFloat(localStorage.getItem('se_travel')) || 60)
  
  const [extraCategory, setExtraCategory] = useState('food')
  const [extraDesc, setExtraDesc] = useState('')
  const [extraAmount, setExtraAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const [stats, setStats] = useState({ 
    attendedDays: 0, absentDays: 0, 
    todayAllowance: 0, todaySpent: 0, todayLeftover: 0,
    totalAllowance: 0, totalSpent: 0, totalLeftover: 0 
  })

  // Helper: Check if a transaction is SE-related
  function isSETransaction(t) {
    return (
      t.description === 'Daily College Allowance' ||
      t.description === 'Daily College Travel' ||
      t.description === 'Absent' ||
      (t.description && t.description.startsWith('SE: '))
    )
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadAllData(user.id)
      }
    })
  }, [])

  const handleAllowanceChange = (val) => {
    setAllowance(val)
    localStorage.setItem('se_allowance', val)
  }

  const handleTravelChange = (val) => {
    setTravel(val)
    localStorage.setItem('se_travel', val)
  }

  async function loadAllData(uid) {
    if (!uid) return

    const today = new Date().toISOString().split('T')[0]
    const allData = await getTransactions(uid) || []
    
    // Filter ONLY SE transactions
    const seData = allData.filter(t => isSETransaction(t))
    const todaySE = seData.filter(t => t.date === today)

    // Check if today is already marked
    const hasAttended = todaySE.some(t => t.description === 'Daily College Allowance')
    const hasAbsent = todaySE.some(t => t.description === 'Absent')
    setIsTodayDone(hasAttended || hasAbsent)
    if (hasAttended) setAttended(true)
    if (hasAbsent) setAttended(false)

    // Calculate stats
    let totalAllowance = 0
    let totalSpent = 0
    const attendedDates = new Set()
    const absentDates = new Set()
    
    let todayAllowance = 0
    let todaySpent = 0
    const dailyLeftovers = {}

    seData.forEach(t => {
      if (t.description === 'Daily College Allowance') {
        totalAllowance += parseFloat(t.amount) || 0
        attendedDates.add(t.date)
        if (!dailyLeftovers[t.date]) dailyLeftovers[t.date] = { allowance: 0, spent: 0 }
        dailyLeftovers[t.date].allowance += parseFloat(t.amount) || 0
      }
      if (t.type === 'expense' && t.description !== 'Absent') {
        totalSpent += parseFloat(t.amount) || 0
        if (!dailyLeftovers[t.date]) dailyLeftovers[t.date] = { allowance: 0, spent: 0 }
        dailyLeftovers[t.date].spent += parseFloat(t.amount) || 0
      }
      if (t.description === 'Absent') {
        absentDates.add(t.date)
      }

      if (t.date === today) {
        if (t.description === 'Daily College Allowance') {
          todayAllowance += parseFloat(t.amount) || 0
        }
        if (t.type === 'expense' && t.description !== 'Absent') {
          todaySpent += parseFloat(t.amount) || 0
        }
      }
    })

    let cumulativeLeftover = 0
    Object.values(dailyLeftovers).forEach(day => {
      cumulativeLeftover += (day.allowance - day.spent)
    })

    setStats({
      attendedDays: attendedDates.size,
      absentDays: absentDates.size,
      todayAllowance,
      todaySpent,
      todayLeftover: todayAllowance - todaySpent,
      totalAllowance,
      totalSpent,
      totalLeftover: cumulativeLeftover
    })
  }

  async function resetToday() {
    if (!userId) return
    if (!confirm('Reset today? This will delete today\'s SE transactions.')) return
    
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const allData = await getTransactions(userId) || []
      const todaySE = allData.filter(t => t.date === today && isSETransaction(t))
      
      for (const t of todaySE) {
        await deleteTransaction(t.id)
      }
      
      await loadAllData(userId)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function markAttended() {
    if (isTodayDone || !userId || loading) return
    
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      await addTransaction({
        user_id: userId, type: 'credit', source: 'pocket_money', category: null,
        description: 'Daily College Allowance', amount: parseFloat(allowance),
        date: today, created_at: new Date().toISOString()
      })

      await addTransaction({
        user_id: userId, type: 'expense', category: 'travel', source: null,
        description: 'Daily College Travel', amount: parseFloat(travel),
        date: today, created_at: new Date().toISOString()
      })

      await loadAllData(userId)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function markNotAttended() {
    if (isTodayDone || !userId || loading) return

    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      await addTransaction({
        user_id: userId, type: 'expense', category: 'other', source: null,
        description: 'Absent', amount: 0,
        date: today, created_at: new Date().toISOString()
      })

      await loadAllData(userId)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addExtraExpense() {
    if (!extraAmount || !extraDesc) return alert('Please fill description and amount')
    if (!userId || loading) return

    setLoading(true)
    try {
      await addTransaction({
        user_id: userId, type: 'expense', category: extraCategory, source: null,
        description: 'SE: ' + extraDesc,  // PREFIX WITH "SE: "
        amount: parseFloat(extraAmount),
        date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString()
      })
      setExtraDesc('')
      setExtraAmount('')
      await loadAllData(userId)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '20px 20px 10px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🎓 Student Expense</h1>
      </div>

      {/* Attendance Toggle */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12, fontSize: 16, color: '#636E72' }}>Did you attend college today?</h3>
        
        {isTodayDone && (
          <div style={{ background: '#FFF3CD', color: '#856404', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
            ✅ Today already done!
            <button 
              onClick={resetToday}
              style={{ 
                marginLeft: 10, background: '#E17055', color: 'white', border: 'none', 
                padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 
              }}
            >
              🔄 Reset
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={markAttended} 
            disabled={isTodayDone || loading || !userId}
            style={{ 
              flex: 1, padding: 16, borderRadius: 16, border: 'none', 
              background: (attended === true && isTodayDone) ? '#00B894' : '#FFFFFF', 
              color: (attended === true && isTodayDone) ? 'white' : '#2D3436',
              fontWeight: 700, fontSize: 15, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', 
              cursor: (isTodayDone || loading || !userId) ? 'not-allowed' : 'pointer', 
              opacity: (isTodayDone || loading || !userId) ? 0.5 : 1
            }}
          >
            {loading ? '⏳' : '✅'} Attended
          </button>
          <button 
            onClick={markNotAttended} 
            disabled={isTodayDone || loading || !userId}
            style={{ 
              flex: 1, padding: 16, borderRadius: 16, border: 'none', 
              background: (attended === false && isTodayDone) ? '#E17055' : '#FFFFFF', 
              color: (attended === false && isTodayDone) ? 'white' : '#2D3436',
              fontWeight: 700, fontSize: 15, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', 
              cursor: (isTodayDone || loading || !userId) ? 'not-allowed' : 'pointer', 
              opacity: (isTodayDone || loading || !userId) ? 0.5 : 1
            }}
          >
            {loading ? '⏳' : '❌'} Didn't Attend
          </button>
        </div>
      </div>

      {/* If Attended: Show Inputs */}
      {attended === true && !isTodayDone && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, marginTop: 0 }}>💰 Daily Settings</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#636E72', fontWeight: 600, display: 'block', marginBottom: 6 }}>Daily Allowance (₹)</label>
              <input type="number" value={allowance} onChange={e => handleAllowanceChange(e.target.value)}
                style={{ width: '100%', padding: 12, border: '2px solid #E8E8F0', borderRadius: 10, fontSize: 16, fontWeight: 700, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#636E72', fontWeight: 600, display: 'block', marginBottom: 6 }}>Daily Travel Expense (₹)</label>
              <input type="number" value={travel} onChange={e => handleTravelChange(e.target.value)}
                style={{ width: '100%', padding: 12, border: '2px solid #E8E8F0', borderRadius: 10, fontSize: 16, fontWeight: 700, boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, marginTop: 0 }}>➕ Add Extra Expense</h3>
            <select value={extraCategory} onChange={e => setExtraCategory(e.target.value)}
              style={{ width: '100%', padding: 12, marginBottom: 12, border: '2px solid #E8E8F0', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="text" placeholder="e.g., Lunch, Printing" value={extraDesc} onChange={e => setExtraDesc(e.target.value)}
              style={{ width: '100%', padding: 12, marginBottom: 12, border: '2px solid #E8E8F0', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            <input type="number" placeholder="Amount ₹" value={extraAmount} onChange={e => setExtraAmount(e.target.value)}
              style={{ width: '100%', padding: 12, marginBottom: 12, border: '2px solid #E8E8F0', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            <button onClick={addExtraExpense} disabled={loading}
              style={{ width: '100%', padding: 14, background: '#6C5CE7', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>📊 Today's Balance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: '#D1FAE5', padding: 12, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#065F46' }}>Allowance</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#065F46' }}>{formatCurrency(stats.todayAllowance)}</div>
          </div>
          <div style={{ background: '#FEE2E2', padding: 12, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#991B1B' }}>Spent</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#991B1B' }}>{formatCurrency(stats.todaySpent)}</div>
          </div>
          <div style={{ background: '#DBEAFE', padding: 12, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#1E40AF' }}>Leftover</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1E40AF' }}>{formatCurrency(stats.todayLeftover)}</div>
          </div>
        </div>

        <h3 style={{ fontSize: 15, marginBottom: 12, marginTop: 20 }}>📈 Overall College Stats</h3>
        <div style={{ background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)', padding: 20, borderRadius: 16, color: 'white', boxShadow: '0 4px 16px rgba(108, 92, 231, 0.3)', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, textAlign: 'center', marginBottom: 15 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.attendedDays}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Days Attended</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.absentDays}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Days Absent</div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 12, textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Total Allowance Received</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(stats.totalAllowance)}</div>
          </div>
          
          <div style={{ background: 'rgba(0,184,148,0.3)', padding: 15, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>💰 Total Leftover (Cumulative)</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(stats.totalLeftover)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}