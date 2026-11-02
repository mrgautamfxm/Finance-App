import React from 'react'
import { getCategoryById } from '../utils/categories.js'

export default function CategoryIcon({ categoryId, size = 42 }) {
  const cat = getCategoryById(categoryId)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `${cat.color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
      }}
    >
      {cat.icon}
    </div>
  )
}