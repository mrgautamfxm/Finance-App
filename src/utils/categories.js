export const expenseCategories = [
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#6C5CE7' },
  { id: 'education', name: 'Education', icon: '📚', color: '#0984E3' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#E17055' },
  { id: 'food', name: 'Food', icon: '🍔', color: '#FDCB6E' },
  { id: 'health', name: 'Health & Medicines', icon: '💊', color: '#00B894' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#0984E3' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#E84393' },
  { id: 'bills', name: 'Bills', icon: '📄', color: '#636E72' },
  { id: 'other', name: 'Other', icon: '📦', color: '#B2BEC3' },
]

export const creditSources = [
  { id: 'salary', name: 'Salary', icon: '💼' },
  { id: 'pocket_money', name: 'Pocket Money', icon: '👛' },
  { id: 'scholarship', name: 'Scholarship', icon: '🎓' },
  { id: 'freelancing', name: 'Freelancing', icon: '💻' },
  { id: 'gift', name: 'Gift', icon: '🎁' },
  { id: 'other', name: 'Other', icon: '💰' },
]

export function getCategoryById(id) {
  return expenseCategories.find(c => c.id === id) || expenseCategories[expenseCategories.length - 1]
}

export function getSourceById(id) {
  return creditSources.find(c => c.id === id) || creditSources[creditSources.length - 1]
}