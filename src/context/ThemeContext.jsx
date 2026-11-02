import React, { createContext, useState, useEffect } from 'react'

const themes = {
  purple:  { primary: '#6C5CE7', light: '#A29BFE', dark: '#5A4BD1', bg: '#F8F9FE' },
  red:     { primary: '#FF4757', light: '#FF6B81', dark: '#C0392B', bg: '#FFF5F5' },
  orange:  { primary: '#FFA502', light: '#FFD32A', dark: '#E67E22', bg: '#FFF8F0' },
  yellow:  { primary: '#ECCC68', light: '#FFF200', dark: '#D4AC0D', bg: '#FFFDF0' },
  green:   { primary: '#2ED573', light: '#7BED9F', dark: '#26AE60', bg: '#F0FFF4' },
  blue:    { primary: '#1E90FF', light: '#70A1FF', dark: '#0984E3', bg: '#F0F8FF' },
  indigo:  { primary: '#5352ED', light: '#706FF5', dark: '#3742FA', bg: '#F4F4FF' },
  dark:    { primary: '#A29BFE', light: '#6C5CE7', dark: '#DFE6E9', bg: '#1E1E2E', text: '#DFE6E9', card: '#2D2D44', border: '#444466' }
}

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('finora-theme') || 'purple')
  const theme = themes[themeName]

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--primary-light', theme.light)
    root.style.setProperty('--primary-dark', theme.dark)
    root.style.setProperty('--bg', theme.bg)
    
    if (themeName === 'dark') {
      root.style.setProperty('--text', theme.text || '#DFE6E9')
      root.style.setProperty('--text-light', '#B2BEC3')
      root.style.setProperty('--text-lighter', '#636E72')
      root.style.setProperty('--card', theme.card || '#2D2D44')
      root.style.setProperty('--border', theme.border || '#444466')
    } else {
      root.style.setProperty('--text', '#2D3436')
      root.style.setProperty('--text-light', '#636E72')
      root.style.setProperty('--text-lighter', '#B2BEC3')
      root.style.setProperty('--card', '#FFFFFF')
      root.style.setProperty('--border', '#E8E8F0')
    }

    localStorage.setItem('finora-theme', themeName)
  }, [themeName, theme])

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, themes: Object.keys(themes) }}>
      {children}
    </ThemeContext.Provider>
  )
}