import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, History, BookOpen, PieChart, User } from 'lucide-react'

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/se', icon: BookOpen, label: 'SE' }, // Using BookOpen to be safe with lucide-react versions
    { path: '/budget', icon: PieChart, label: 'Budget' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '8px 0 12px',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      zIndex: 100,
      borderTop: '1px solid #E8E8F0',
    }}>
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path
        const Icon = tab.icon

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#6C5CE7' : '#B2BEC3',
              fontFamily: 'Inter, sans-serif',
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              padding: '4px 8px',
              flex: 1,
              transition: 'color 0.2s'
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}