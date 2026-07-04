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

export function SaladPanel({ data }: { data: HeySaladDelivery }) {
  const { salad, recommendation, request } = data
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div className="salad-panel" data-testid="salad-panel">
      <div className="salad-meta">
        <span>Paid service</span>
        <strong>deliverService("heysalad {request}")</strong>
      </div>

      <div className="salad-head">
        <strong>{salad.name}</strong>
        <span className="salad-price">{usd.format(salad.priceUsd)}</span>
      </div>

      <p className="salad-desc">{salad.description}</p>

      <div className="salad-tags">
        {salad.dietary.map(tag => {
          return (
            <span key={tag} className="salad-tag">
              {tag}
            </span>
          )
        })}
      </div>

      <div className="salad-stats">
        <span>{salad.calories} kcal</span>
        <span>{salad.protein}g protein</span>
        <span>{salad.supplier}</span>
      </div>

      <p className="salad-rec">
        <em>"{recommendation}"</em>
      </p>

      <p className="salad-proof">
        Kiosk value: a customer-ready recommendation with supplier, price, calories, protein, and dietary fit.
      </p>
    </div>
  )
}
