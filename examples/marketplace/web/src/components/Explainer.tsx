/** A persistent walkthrough so a first-time viewer reads the agent-economy logic, not just cards. */
export function Explainer() {
  return (
    <section className="explain" data-testid="explain">
      <div className="explain-copy">
        <p className="section-kicker">How it works</p>
        <h2>One round, visible from bid to settlement.</h2>
        <p className="explain-lead">
          Each round a <strong>buyer</strong> broadcasts a need over CoralOS. <strong>Seller agents</strong> decide
          whether to bid, the winner delivers the result, and payment settles through a <strong>Solana escrow</strong>.
        </p>
      </div>
      <ol className="explain-flow">
        <li><b>WANT</b><span>The buyer asks for one World Cup fixture's edge.</span></li>
        <li><b>bid / decline</b><span>Only the specialist carries <code>txline</code>; generalists sit out.</span></li>
        <li><b>award + deposit</b><span>The winning bid price is locked in escrow on devnet.</span></li>
        <li><b>deliver</b><span>The seller returns verified odds and an LLM value call.</span></li>
        <li><b>release</b><span>Escrow pays the seller and links the transaction to Explorer.</span></li>
      </ol>
    </section>
  )
}
