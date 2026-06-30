/** Renders a heysalad delivery: the recommended bowl, nutritional stats, and LLM justification. */

interface SaladItem {
  id: string
  name: string
  priceUsd: number
  description: string
  dietary: string[]
  calories: number
  protein: number
  supplier: string
}

interface HeySaladDelivery {
  service: 'heysalad'
  salad: SaladItem
  recommendation: string
  request: string
  timestamp: string
}

const TAG_COLOURS: Record<string, { bg: string; color: string }> = {
  vegan:          { bg: '#f0fdf4', color: '#16a34a' },
  vegetarian:     { bg: '#f0fdf4', color: '#15803d' },
  'gluten-free':  { bg: '#fffbeb', color: '#b45309' },
  raw:            { bg: '#ecfdf5', color: '#059669' },
  'high-protein': { bg: '#fef2f2', color: '#dc2626' },
}

export function SaladPanel({ data }: { data: HeySaladDelivery }) {
  const { salad, recommendation } = data
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div className="salad-panel" data-testid="salad-panel">
      <div className="salad-head">
        🥗 <strong>{salad.name}</strong>
        <span className="salad-price">{usd.format(salad.priceUsd)}</span>
      </div>

      <p className="salad-desc">{salad.description}</p>

      <div className="salad-tags">
        {salad.dietary.map(tag => {
          const c = TAG_COLOURS[tag] ?? { bg: '#f6f1f1', color: '#4a3f41' }
          return (
            <span key={tag} className="salad-tag" style={{ background: c.bg, color: c.color }}>
              {tag}
            </span>
          )
        })}
      </div>

      <div className="salad-stats">
        <span>🔥 {salad.calories} kcal</span>
        <span>💪 {salad.protein}g protein</span>
        <span>🏪 {salad.supplier}</span>
      </div>

      <p className="salad-rec">
        <em>"{recommendation}"</em>
      </p>
    </div>
  )
}
