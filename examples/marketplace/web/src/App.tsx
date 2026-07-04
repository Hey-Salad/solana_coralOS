import { useState } from 'react'
import { useFeed, startMarket } from './api'
import { MarketView } from './components/MarketView'
import { Explainer } from './components/Explainer'
import logoUrl from './design-system/assets/logos/HeySalad-Logo-Black.svg'

/** Read ?session=<id> from the URL so the launcher can deep-link straight to a live market. */
const initialSession = new URLSearchParams(window.location.search).get('session') ?? ''

export default function App() {
  const [session, setSession] = useState(initialSession)
  const [starting, setStarting] = useState(false)
  const [startErr, setStartErr] = useState<string>()
  const { rounds, connected, error } = useFeed(session)
  const connectionLabel = session ? (connected ? 'Live' : 'Waiting') : 'Ready'
  const connectionClass = connected || !session ? 'conn-on' : 'conn-off'
  const marketStatus = session ? (connected ? 'connected' : 'waiting') : 'ready'
  const settledCount = rounds.filter((round) => round.status === 'settled').length
  const latestRound = rounds.reduce((max, round) => Math.max(max, round.round), 0)
  const sessionDisplay = session ? `${session.slice(0, 10)}...` : 'No session'
  const startLabel = starting ? 'Starting...' : (session ? 'New market' : 'Start market')

  async function onStart() {
    setStarting(true)
    setStartErr(undefined)
    try {
      const id = await startMarket()
      setSession(id)
      const url = new URL(window.location.href)
      url.searchParams.set('session', id)
      window.history.replaceState({}, '', url)
    } catch (e) {
      setStartErr((e as Error).message)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="app">
      <header className="app-head">
        <div className="brand-lockup">
          <img src={logoUrl} alt="HeySalad" className="brand-logo" />
          <span className="product-kicker">CoralOS</span>
        </div>
        <div className="head-actions">
          <a href="https://heysalad.ai" className="head-link">heysalad.ai</a>
          <span className={`conn-chip ${connectionClass}`} data-testid="conn" title={session ? (connected ? 'connected' : (error ?? 'waiting for feed')) : 'ready to start'}>
            <span className="dot" />
            {connectionLabel}
          </span>
        </div>
      </header>

      <section className="hero-panel" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div className="hero-copy">
            <h1 id="hero-title">
              <span>Kiosk agents buy.</span>
              <span>Food agents earn.</span>
            </h1>
            <p className="sub">
              A live HeySalad kiosk market where supplier agents bid over CoralOS,
              deliver a paid food recommendation, and settle through Solana devnet escrow.
            </p>
            <div className="session-bar">
              <input
                aria-label="session id"
                placeholder="Paste a market session id"
                value={session}
                onChange={(e) => setSession(e.target.value.trim())}
              />
              <button onClick={onStart} disabled={starting} data-testid="start">
                {startLabel}
              </button>
            </div>
            {startErr && <p className="start-err" data-testid="start-err">{startErr}</p>}
          </div>

          <aside className="market-preview" aria-label="Market status">
            <div className="preview-head">
              <div>
                <p className="section-kicker">Kiosk market</p>
                <h2>{session ? 'Session running' : 'Ready to hire agents'}</h2>
              </div>
              <span className={`conn-chip ${connectionClass}`}>
                <span className="dot" />
                {connectionLabel}
              </span>
            </div>

            <div className="preview-metrics">
              <div>
                <span className="metric-label">Session</span>
                <strong>{sessionDisplay}</strong>
              </div>
              <div>
                <span className="metric-label">Rounds</span>
                <strong>{latestRound}</strong>
              </div>
              <div>
                <span className="metric-label">Settled</span>
                <strong>{settledCount}</strong>
              </div>
            </div>

            <div className="preview-flow">
              <div className="flow-step">
                <span>1</span>
                <div>
                  <strong>Kiosk broadcasts need</strong>
                  <p>CoralOS opens the lunch request to supplier agents.</p>
                </div>
              </div>
              <div className="flow-step">
                <span>2</span>
                <div>
                  <strong>Supplier agents bid</strong>
                  <p>Budget, premium, and specialist agents price their service.</p>
                </div>
              </div>
              <div className="flow-step">
                <span>3</span>
                <div>
                  <strong>Escrow pays the winner</strong>
                  <p>The delivery unlocks payment with devnet Explorer proof.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Explainer />

      <section className="market-shell" aria-labelledby="market-title">
        <div className="market-shell-head">
          <div>
            <p className="section-kicker">Live feed</p>
            <h2 id="market-title">Agent settlement rounds</h2>
          </div>
          <div className="market-meta">
            <span>{sessionDisplay}</span>
            <span className={`pill ${connected || !session ? 'pill-settled' : 'pill-refunded'}`}>
              {marketStatus}
            </span>
          </div>
        </div>
        <main>
          {session ? <MarketView rounds={rounds} /> : (
            <p className="empty">Start a market to watch the kiosk buy from supplier agents and settle on devnet.</p>
          )}
        </main>
      </section>
    </div>
  )
}
