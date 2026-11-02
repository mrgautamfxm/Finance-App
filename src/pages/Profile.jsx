import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase.js'
import { getUserProfile, updateProfile, getTransactions } from '../services/financeService.js'
import { calculateTotals, calculateCategoryTotals } from '../utils/calculations.js'
import { getCategoryById } from '../utils/categories.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import html2canvas from 'html2canvas'

// Define the 7 Rainbow Themes + Dark Mode
const themes = [
  { name: 'purple', color: '#6C5CE7', bg: '#F8F9FE' },
  { name: 'red', color: '#FF4757', bg: '#FFF5F5' },
  { name: 'orange', color: '#FFA502', bg: '#FFF8F0' },
  { name: 'yellow', color: '#ECCC68', bg: '#FFFDF0' },
  { name: 'green', color: '#2ED573', bg: '#F0FFF4' },
  { name: 'blue', color: '#1E90FF', bg: '#F0F8FF' },
  { name: 'indigo', color: '#5352ED', bg: '#F4F4FF' },
  { name: 'dark', color: '#A29BFE', bg: '#1E1E2E', text: '#DFE6E9', card: '#2D2D44', border: '#444466' }
]

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [editing, setEditing] = useState(false)
  const [reportPeriod, setReportPeriod] = useState('month')
  const [generating, setGenerating] = useState(false)
  const reportRef = React.useRef(null)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '', bio: '', contact: '', instagram: '', facebook: '', whatsapp: '', telegram: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadProfile(user.id)
        loadTransactions(user.id)
      }
    })
  }, [])

  async function loadProfile(userId) {
    try {
      const data = await getUserProfile(userId)
      if (data) {
        setProfile(data)
        setFormData({
          name: data.name || '', bio: data.bio || '', contact: data.contact || '',
          instagram: data.instagram || '', facebook: data.facebook || '',
          whatsapp: data.whatsapp || '', telegram: data.telegram || '',
        })
      } else {
        setFormData(prev => ({ ...prev, name: user?.user_metadata?.name || '' }))
      }
    } catch (err) { console.error(err) }
  }

  async function loadTransactions(userId) {
    try {
      const data = await getTransactions(userId)
      setTransactions(data || [])
    } catch (err) { console.error(err) }
  }

  async function handleSaveProfile() {
    try {
      await updateProfile(user.id, formData)
      setProfile({ ...profile, ...formData })
      setEditing(false)
      alert('Profile updated!')
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Function to apply theme
  const applyTheme = (theme) => {
    const root = document.documentElement
    root.style.setProperty('--primary', theme.color)
    root.style.setProperty('--primary-light', theme.color + 'CC')
    root.style.setProperty('--bg', theme.bg)
    
    if (theme.name === 'dark') {
      root.style.setProperty('--text', theme.text)
      root.style.setProperty('--card', theme.card)
      root.style.setProperty('--border', theme.border)
      root.style.setProperty('--text-light', '#B2BEC3')
    } else {
      root.style.setProperty('--text', '#2D3436')
      root.style.setProperty('--card', '#FFFFFF')
      root.style.setProperty('--border', '#E8E8F0')
      root.style.setProperty('--text-light', '#636E72')
    }
    localStorage.setItem('finora-theme', theme.name)
  }

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('finora-theme') || 'purple'
    const theme = themes.find(t => t.name === savedTheme)
    if (theme) applyTheme(theme)
  }, [])

  async function generateReportImage() {
    if (!reportRef.current) return
    setGenerating(true)
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#F8F9FE', useCORS: true })
      const link = document.createElement('a')
      link.download = `finora-report-${reportPeriod}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setGenerating(false) }
  }

  const totals = calculateTotals(transactions)
  const categoryTotals = calculateCategoryTotals(transactions)
  const reportCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="profile-page" style={{ paddingBottom: 100 }}>
      <div className="page-header"><h1>Profile</h1></div>

      {/* Profile Header */}
      <div style={{ margin: '0 20px 20px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', borderRadius: 20, padding: '32px 24px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, border: '3px solid rgba(255,255,255,0.3)' }}>
          {formData.name ? formData.name[0].toUpperCase() : 'U'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{formData.name || 'User'}</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{user?.email}</div>
      </div>

      {/* Personal Info */}
      <div className="profile-section" style={{ margin: '0 20px 16px', background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>👤 Personal Information</h3>
        {editing ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Name</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: 12, border: '2px solid var(--border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Bio</label>
              <input value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} style={{ width: '100%', padding: 12, border: '2px solid var(--border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveProfile} style={{ flex: 1, padding: 12, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 12, background: 'var(--border)', color: 'var(--text)', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Name</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{formData.name || 'Not set'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Email</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{user?.email}</span>
            </div>
            <button onClick={() => setEditing(true)} style={{ width: '100%', padding: 12, background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>✏️ Edit Profile</button>
          </>
        )}
      </div>

      {/* ========================================== */}
      {/*  NEW SECTION: Theme Selector               */}
      {/* ========================================== */}
      <div className="profile-section" style={{ margin: '0 20px 16px', background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🎨 App Theme</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {themes.map(t => (
            <button
              key={t.name}
              onClick={() => applyTheme(t)}
              title={t.name}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--border)',
                background: t.name === 'dark' ? '#1E1E2E' : t.color,
                cursor: 'pointer', transition: 'transform 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', marginTop: 12 }}>Tap a color to change the app theme!</p>
      </div>

      {/* Expense Report */}
      <div className="report-section" style={{ margin: '0 20px 16px', background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>📊 Expense Report</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => setReportPeriod(p)}
              style={{ flex: 1, padding: 10, border: '1.5px solid var(--border)', borderRadius: 8, background: reportPeriod === p ? 'var(--primary)' : 'var(--card)', color: reportPeriod === p ? 'white' : 'var(--text)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div ref={reportRef} style={{ background: '#F8F9FE', borderRadius: 12, padding: 20, border: '1px solid var(--border)', marginBottom: 14 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>₣ FINORA</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Expense Report</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: 10, background: 'white', borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#00B894' }}>{formatCurrency(totals.totalCredited)}</div>
              <div style={{ fontSize: 10, color: '#B2BEC3', marginTop: 2 }}>Credit</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: 'white', borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E17055' }}>{formatCurrency(totals.totalExpenses)}</div>
              <div style={{ fontSize: 10, color: '#B2BEC3', marginTop: 2 }}>Expenses</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: 'white', borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totals.remaining)}</div>
              <div style={{ fontSize: 10, color: '#B2BEC3', marginTop: 2 }}>Remaining</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={generateReportImage} disabled={generating} style={{ flex: 1, padding: 12, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
            {generating ? '⏳ Generating...' : '📥 Download'}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{ margin: '0 20px', width: 'calc(100% - 40px)', padding: 14, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
        🚪 Log Out
      </button>
    </div>
  )
}