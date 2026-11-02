export function calculateTotals(transactions) {
  let totalExpenses = 0
  let totalCredited = 0

  transactions.forEach(t => {
    if (t.type === 'expense') {
      totalExpenses += parseFloat(t.amount) || 0
    } else {
      totalCredited += parseFloat(t.amount) || 0
    }
  })

  return {
    totalExpenses,
    totalCredited,
    remaining: totalCredited - totalExpenses,
  }
}

export function calculateCategoryTotals(transactions) {
  const categories = {}

  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = 0
    }
    categories[t.category] += parseFloat(t.amount) || 0
  })

  return categories
}

export function filterByDateRange(transactions, range) {
  const now = new Date()
  let startDate

  switch (range) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1))
      break
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1))
      break
    default:
      return transactions
  }

  return transactions.filter(t => new Date(t.created_at) >= startDate)
}