# HeySalad Agent Kiosk

Submission package for Superteam UK / Imperial AI Agent Hackathon: Build the Agent Economy.

## One-line pitch

HeySalad Agent Kiosk lets a kiosk AI hire food supplier agents, compare their bids, buy the best recommendation, and pay the winning agent through Solana devnet escrow.

## What the agent sells

`deliverService("heysalad ...")` sells a customer-ready salad recommendation:

- bowl name and price
- dietary fit
- calories and protein
- supplier identity
- one-sentence recommendation

The customer is the kiosk agent. It buys on behalf of a hungry customer or restaurant operator when it needs a fast, nutrition-aware recommendation.

## Why it is worth paying for

The kiosk needs a recommendation it can use immediately at checkout. The paid result is structured, supplier-specific, and priced. The seller agent only delivers after escrow is funded. The buyer only releases funds after delivery.

Default request:

```text
heysalad vegan high-protein lunch rush
```

Default maximum spend:

```text
0.001 SOL
```

## Agent economy

```text
kiosk buyer agent
  -> broadcasts WANT over CoralOS
  -> supplier agents bid or decline
  -> buyer chooses best value inside budget
  -> buyer deposits SOL into escrow
  -> winning supplier delivers a salad recommendation
  -> buyer releases escrow
  -> Solana Explorer proves settlement
```

The current seller personas are:

- `QuickGreen Express` - low-floor budget supplier
- `FreshBowl Premium` - premium nutrition and provenance
- `ProteinHub Specialist` - high-protein specialist

The repo also includes the broker/swarm primitive, so this can become:

```text
kiosk buyer -> broker -> supplier market
```

That turns one seller into a graph of agents.

## Live demo

Public dashboard:

```text
https://coral.heysalad.app
```

Click `Start a market`. The dashboard shows:

- `WANT`
- `BID`
- `AWARD`
- `DEPOSITED`
- `DELIVERED`
- `RELEASED`
- clickable Solana devnet Explorer links

Latest verified run:

```text
Session: 2361bec0-a7f1-4766-a2a2-efd39c608c53
Deposit: https://explorer.solana.com/tx/5HComgdiDBrs55GW4ARDzNq9skGmdLSjasvqMfRUVLqgJjvcPjLYmnWVEf6UtvT67kck67chPVCoYf8SDGviG8Kv?cluster=devnet
Release: https://explorer.solana.com/tx/27TrWz66AaeuCkT4vpnDaVXLPYRZK4QcnxQHC2G1d4wJk3cfZNiMDoXQvtAo5XUDeKPzaggZzkfqQbcaAPMDF7HR?cluster=devnet
```

## One-command local run

From the repo root:

```bash
npm install
node scripts/setup.js
npm run dev
```

Server runbook:

```bash
scripts/heysalad-demo.sh
```

Required local secrets stay in `.env` only:

```text
OPENAI_API_KEY=...
WALLET=...
BUYER_KEYPAIR_B58=...
```

Do not commit `.env`.

## Kiosk tie-in

`kiosk-beta.heysalad.ai` is the product surface. It is where the human or restaurant operator interacts with HeySalad.

`coral.heysalad.app` is the agent economy layer behind it. It proves the kiosk can buy a service from autonomous supplier agents and settle the payment on-chain.

For the submission, the story is:

```text
The kiosk asks. Agents compete. Solana pays the winner.
```

## Judging fit

### Technology

- CoralOS runtime launches buyer and seller agents.
- Market protocol runs `WANT -> BID -> AWARD -> DEPOSITED -> DELIVERED -> RELEASED`.
- Escrow settlement links resolve on Solana devnet.
- The seller service is a real fork point: `coral-agents/seller-agent/src/service.ts`.

### Impact

- Restaurants and kiosks can buy recommendations, upsells, procurement decisions, or fulfilment services from agents.
- Supplier agents can earn per useful delivery.
- The same market can extend into broker/reseller graphs.

### Creativity and UX

- A food kiosk becomes an autonomous buyer.
- Food suppliers compete with different price and quality personas.
- The dashboard makes the full agent transaction readable, including the payment proof.

## Five-slide deck

### 1. The moment

Headline: `The kiosk decides to pay.`

Show the live dashboard with a settled round. Say: the customer asks for food, the kiosk broadcasts a paid need, and an agent earns.

### 2. The product

Headline: `HeySalad Agent Kiosk`

Explain the buyer, sellers, and paid service:

```text
deliverService("heysalad vegan high-protein lunch rush")
```

### 3. The economy

Headline: `A market, not one chatbot`

Show the graph:

```text
kiosk buyer -> supplier agents -> optional broker -> supplier market
```

### 4. The settlement

Headline: `Escrow makes delivery honest`

Show `DEPOSITED`, `DELIVERED`, `RELEASED`, and the Explorer link.

### 5. The proof

Headline: `The agent got paid`

Show the live Explorer transaction and the delivered salad recommendation. End with the URL and repo.

## Three-minute demo video script

### 0:00-0:30 Problem

Restaurants and kiosks need fast decisions: what should a customer buy, which supplier can fulfil it, and who gets paid. Today that is either manual or trapped inside one app.

### 0:30-1:00 Solution

HeySalad turns the kiosk into a buyer agent. It broadcasts a need over CoralOS. Food supplier agents compete. The winning agent earns through Solana escrow.

### 1:00-2:20 Demo

Open `https://coral.heysalad.app`.

Click `Start a market`.

Narrate the flow:

1. The kiosk broadcasts `heysalad vegan high-protein lunch rush`.
2. Supplier agents bid with different prices and reasons.
3. The buyer awards the best value inside budget.
4. SOL is deposited into escrow.
5. The winner delivers a salad recommendation.
6. The buyer releases funds.
7. Open the Explorer link.

### 2:20-2:45 Why now

Agents can now make useful purchase decisions, but they need a market and settlement rail. CoralOS coordinates the agents. Solana settles the work.

### 2:45-3:00 Team and next step

HeySalad is building food commerce agents. Next step: connect the live kiosk checkout at `kiosk-beta.heysalad.ai` so a real order can trigger the agent market behind the scenes.
