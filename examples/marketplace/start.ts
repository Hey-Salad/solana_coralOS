/**
 * Marketplace starter — the headline example.
 *
 * Launches one session graph: a market buyer + three LLM seller personas. coral-server spawns each
 * as a container; the buyer broadcasts a WANT, the sellers compete with LLM bids, and the winner is
 * settled through the escrow contract. All sellers reuse the seller-agent image and share the receive
 * wallet — differentiation is persona/floor/inventory (set in each coral-agent.toml), not code.
 *
 *   CORAL_SERVER_URL  default http://localhost:5555
 *   CORAL_TOKEN       default dev   (must be in coral.toml [auth] keys)
 *
 * Run from the host after `docker compose up coral`:  npm install && npm start
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = process.env.CORAL_SERVER_URL ?? 'http://localhost:5555'
const TOKEN = process.env.CORAL_TOKEN ?? 'dev'
const NS = 'default'
const AUTH = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

// ── Load repo-root .env (2 levels up: marketplace → examples → root) ──
function loadEnv(): Record<string, string> {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const env: Record<string, string> = { ...(process.env as Record<string, string>) }
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no .env — rely on process.env */ }
  return env
}

// ── Typed coral option values ──
const str = (value: string) => ({ type: 'string', value })
const f64 = (value: number) => ({ type: 'f64', value })
const finiteNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const optionalF64 = (env: Record<string, string>, key: string, fallback: number) =>
  env[key] ? { [key]: f64(finiteNumber(env[key], fallback)) } : {}

const agent = (name: string, options: Record<string, unknown>) => ({
  id: { name, version: '0.1.0', registrySourceId: { type: 'local' } },
  name,
  provider: { type: 'local', runtime: 'docker' },
  options,
})

async function main() {
  const env = loadEnv()
  const wallet = env.WALLET
  const keypair = env.BUYER_KEYPAIR_B58
  if (!wallet || !keypair) {
    throw new Error('WALLET and BUYER_KEYPAIR_B58 must be set in .env — run `node scripts/setup.js`')
  }
  const rpc = env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
  const trace = env.TRACE ?? ''

  // LLM provider — Anthropic by default; flip the whole market with LLM_PROVIDER=openai in .env.
  // Coral logs session option values, so raw provider keys are opt-in here. Prefer injecting keys
  // through the local container/server environment; use CORAL_PASS_SECRET_OPTIONS=1 only for local dev.
  const llmOpts: Record<string, unknown> = {}
  const passSecretOptions = env.CORAL_PASS_SECRET_OPTIONS === '1'
  if (passSecretOptions && env.ANTHROPIC_API_KEY) llmOpts.ANTHROPIC_API_KEY = str(env.ANTHROPIC_API_KEY)
  if (passSecretOptions && env.OPENAI_API_KEY) llmOpts.OPENAI_API_KEY = str(env.OPENAI_API_KEY)
  if (env.LLM_PROVIDER) llmOpts.LLM_PROVIDER = str(env.LLM_PROVIDER)
  if (env.LLM_MODEL) llmOpts.LLM_MODEL = str(env.LLM_MODEL)
  if (trace) llmOpts.TRACE = str(trace)

  // Every seller shares the receive wallet + RPC; persona/floor/inventory come from each toml default.
  const seller = (name: string) =>
    agent(name, { SELLER_WALLET: str(wallet), SOLANA_RPC_URL: str(rpc), AGENT_NAME: str(name), ...llmOpts })

  // World Cup specialist — only joins when a TxLINE token is present (see examples/txodds/DEMO.md).
  // It carries SERVICES=txline + the token; the generalist personas decline txline WANTs automatically.
  const txlineKey = env.TXLINE_API_KEY
  const worldcup = txlineKey
    ? [agent('seller-worldcup', {
        SELLER_WALLET: str(wallet), SOLANA_RPC_URL: str(rpc), AGENT_NAME: str('seller-worldcup'),
        SERVICES: str('txline'), FLOOR_SOL: f64(finiteNumber(env.WORLDCUP_FLOOR_SOL, 0.0005)),
        TXLINE_API_KEY: str(txlineKey),
        ...(env.TXLINE_BASE_URL ? { TXLINE_BASE_URL: str(env.TXLINE_BASE_URL) } : {}),
        ...llmOpts,
      })]
    : []

  const sellers = ['seller-cheap', 'seller-premium', 'seller-lazy', ...(txlineKey ? ['seller-worldcup'] : [])]

  // Optional broker swarm (ENABLE_BROKER=1, see docs/SWARM.md): the buyer buys from a broker, which
  // resells from the real sellers. Needs a funded broker wallet — `node scripts/setup.js --broker`.
  const brokerWanted = env.ENABLE_BROKER === '1'
  const brokerReady = brokerWanted && !!env.BROKER_KEYPAIR_B58 && !!env.BROKER_WALLET
  if (brokerWanted && !brokerReady) {
    console.warn('[marketplace] ENABLE_BROKER=1 but BROKER_KEYPAIR_B58/BROKER_WALLET missing — run `node scripts/setup.js --broker`. Skipping broker.')
  }
  const brokerAgents = brokerReady
    ? [agent('broker', {
        BROKER_KEYPAIR_B58: str(env.BROKER_KEYPAIR_B58), BROKER_WALLET: str(env.BROKER_WALLET),
        AGENT_NAME: str('broker'), SOLANA_RPC_URL: str(rpc), UPSTREAM_SELLERS: str(sellers.join(',')),
        ...(env.BROKER_MARGIN_SOL ? { BROKER_MARGIN_SOL: f64(finiteNumber(env.BROKER_MARGIN_SOL, 0.0001)) } : {}),
        ...llmOpts,
      })]
    : []
  // Who the buyer shops + the payout wallet it binds the escrow to (F3): the broker if enabled, else the sellers.
  const buyerSellers = brokerReady ? ['broker'] : sellers
  const buyerExpectedWallet = brokerReady ? env.BROKER_WALLET : wallet

  // F8: a txline market needs both the World Cup token AND the worldcup seller. If .env still says
  // BUYER_SERVICE=txline but no token is present (e.g. a stale .env after a failed mint), fall back to
  // the HeySalad kiosk market rather than broadcasting txline WANTs nothing can fill.
  const wantsTxline = (env.BUYER_SERVICE ?? 'heysalad') === 'txline'
  const fellBack = wantsTxline && !txlineKey
  if (fellBack) console.warn('[marketplace] BUYER_SERVICE=txline but no TXLINE_API_KEY — falling back to heysalad.')
  const buyerService = fellBack ? 'heysalad' : (env.BUYER_SERVICE ?? 'heysalad')
  const buyerArg = fellBack ? 'vegan high-protein lunch rush' : (env.BUYER_ARG ?? 'vegan high-protein lunch rush')
  const buyerArgs = fellBack ? '' : (env.BUYER_ARGS ?? '')

  const buyerOpts: Record<string, unknown> = {
    BUYER_KEYPAIR_B58: str(keypair),
    AGENT_NAME: str('buyer-agent'),
    SOLANA_RPC_URL: str(rpc),
    // F3: the expected seller payout wallet — the buyer binds the escrow seller= to it (broker if enabled).
    SELLER_WALLET: str(buyerExpectedWallet),
    BUYER_MAX_SOL: f64(finiteNumber(env.BUYER_MAX_SOL, 0.001)),
    BUYER_SERVICE: str(buyerService),
    BUYER_ARG: str(buyerArg),
    ...(buyerArgs ? { BUYER_ARGS: str(buyerArgs) } : {}),
    MARKET_SELLERS: str(buyerSellers.join(',')),
    ...optionalF64(env, 'BID_WINDOW_MS', 5000),
    ...optionalF64(env, 'CYCLE_INTERVAL_MS', 30000),
    ...llmOpts,
  }

  const sres = await fetch(`${BASE}/api/v1/local/session`, {
    method: 'POST', headers: AUTH,
    body: JSON.stringify({
      agentGraphRequest: {
        agents: [
          agent('buyer-agent', buyerOpts),
          seller('seller-cheap'),
          seller('seller-premium'),
          seller('seller-lazy'),
          ...worldcup,
          ...brokerAgents,
        ],
      },
      namespaceProvider: { type: 'create_if_not_exists', namespaceRequest: { name: NS } },
      execution: { mode: 'immediate' },
    }),
  })
  if (!sres.ok) throw new Error(`session create failed: ${sres.status} ${await sres.text()}`)
  const { sessionId } = await sres.json() as { sessionId: string }

  const lineup = brokerReady ? `broker (reselling ${sellers.join(', ')})` : sellers.join(', ')
  console.log(`\n✅ Market session ${sessionId} — buyer + ${lineup}.`)
  console.log(`   receive wallet: ${wallet}`)
  console.log('   The buyer broadcasts a WANT; sellers bid; the winner settles via escrow.\n')
  console.log('   Watch the market:')
  console.log('     docker logs -f buyer-agent      # WANT → AWARD (with a reason) → DEPOSITED → RELEASED')
  console.log('     docker logs -f seller-cheap     # BID → ESCROW_REQUIRED → DELIVERED')
  console.log('   Set TRACE=1 in .env to see the coral_* calls + Explorer links for deposit/release.\n')
}

main().catch((e) => { console.error(`[marketplace] ${e}`); process.exitCode = 1 })
