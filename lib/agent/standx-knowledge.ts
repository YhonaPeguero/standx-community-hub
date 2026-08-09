/**
 * Curated digest of the official StandX documentation (docs.standx.com).
 *
 * Deliberately NOT a dump of the whole docs site — it rides in the system
 * prompt on every request. It carries (a) enough grounded fact to answer the
 * common questions correctly and (b) the doc URL map so the assistant can
 * always hand off to the authoritative page instead of guessing.
 *
 * Sourced from docs.standx.com. When a number here disagrees with the live
 * docs, the live docs win — the prompt tells the model to say so and link out.
 */

export interface DocEntry {
  title: string;
  url: string;
  /** One line on what the page answers. */
  covers: string;
}

const DOCS_BASE = "https://docs.standx.com";

export const docPages: DocEntry[] = [
  {
    title: "About StandX",
    url: `${DOCS_BASE}/docs/about-standx`,
    covers: "What StandX is, Universal Markets, Universal Yield, the SIP-5 vision"
  },
  {
    title: "$DUSD Overview",
    url: `${DOCS_BASE}/docs/dusd-overview`,
    covers: "What DUSD is, where the yield comes from, why no staking is required"
  },
  {
    title: "DUSD Product FAQ",
    url: `${DOCS_BASE}/docs/dusd-overview/product-faq`,
    covers: "Common DUSD questions"
  },
  {
    title: "DUSD User Guide",
    url: `${DOCS_BASE}/docs/dusd-overview/user-guide`,
    covers: "Step-by-step DUSD usage"
  },
  {
    title: "Minting DUSD",
    url: `${DOCS_BASE}/docs/dusd-solutions/minting-dusd`,
    covers: "How to mint DUSD from USDT/USDC, minimums, fees"
  },
  {
    title: "Redeeming DUSD",
    url: `${DOCS_BASE}/docs/dusd-solutions/redeeming-dusd`,
    covers: "How to redeem DUSD back to collateral"
  },
  {
    title: "DUSD Yielding Circle",
    url: `${DOCS_BASE}/docs/dusd-solutions/dusd-yielding-circle`,
    covers: "How yield is generated and distributed"
  },
  {
    title: "Risks & Hedging System",
    url: `${DOCS_BASE}/docs/dusd-solutions/risks-hedging-system`,
    covers: "Delta-neutral hedging, custody, reserve fund, risk model"
  },
  {
    title: "Key Addresses",
    url: `${DOCS_BASE}/docs/dusd-solutions/key-addresses`,
    covers: "Official contract addresses on BSC and Solana"
  },
  {
    title: "Perps Overview",
    url: `${DOCS_BASE}/docs/standx-perps-overview`,
    covers: "The perps exchange, margin yield, who built it"
  },
  {
    title: "StandX Wallet Guide",
    url: `${DOCS_BASE}/docs/standx-perps-overview/standx-wallet-guide`,
    covers: "Cash Wallet vs Perps Wallet, transferring between them"
  },
  {
    title: "First Perps Trade with Binance Wallet",
    url: `${DOCS_BASE}/docs/standx-perps-overview/how-to-make-your-first-perps-trade-using-binance-wallet`,
    covers: "Complete first-trade walkthrough"
  },
  {
    title: "The Execution Panel",
    url: `${DOCS_BASE}/docs/standx-perps-overview/the-execution-panel`,
    covers: "Placing and managing orders in the UI"
  },
  {
    title: "The Market Monitor",
    url: `${DOCS_BASE}/docs/standx-perps-overview/the-market-monitor`,
    covers: "Reading the market view and order book"
  },
  {
    title: "StandX Vault & SLP",
    url: `${DOCS_BASE}/docs/standx-perps-overview/standx-vault-slp`,
    covers: "The vault, SLP, and how liquidity backstops work"
  },
  {
    title: "Margin & Leverage",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/margin-leverage`,
    covers: "Initial/maintenance margin, cross vs isolated, margin tiers"
  },
  {
    title: "Liquidation",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/liquidation`,
    covers: "When and how positions are liquidated, clearance fee"
  },
  {
    title: "Funding Rate",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/funding-rate`,
    covers: "Funding formula, cadence, caps"
  },
  {
    title: "Trading Fee",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/trading-fee`,
    covers: "Maker and taker fee rates with worked examples"
  },
  {
    title: "Take Profit and Stop Loss (TP/SL)",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/take-profit-and-stop-loss-orders-tp-sl`,
    covers: "Setting TP/SL orders"
  },
  {
    title: "ADL (Auto-Deleveraging)",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/adl`,
    covers: "What ADL is and when it triggers"
  },
  {
    title: "Price Indicators",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/price-indicators`,
    covers: "Mark price, index price, last price"
  },
  {
    title: "Withdrawal",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/withdrawal`,
    covers: "Withdrawing funds, withdrawal slots, freeing a stuck slot"
  },
  {
    title: "Network Yield",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/network-yield`,
    covers: "The referral program: activation threshold, yield tiers, share rate"
  },
  {
    title: "Block Trade",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/block-trade`,
    covers: "Large off-book trades (SIP-1)"
  },
  {
    title: "Community Vaults",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/community-vaults`,
    covers: "Community-run vaults (SIP-5b)"
  },
  {
    title: "Community Maker Yield",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/community-maker-yield`,
    covers: "Community market making rewards (SIP-5a)"
  },
  {
    title: "Contract Specifications",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/contract-specifications`,
    covers: "Per-market contract specs"
  },
  {
    title: "Earn on StandX",
    url: `${DOCS_BASE}/docs/standx-earn`,
    covers: "Campaigns, points, and LP opportunities"
  },
  {
    title: "Mainnet Campaigns",
    url: `${DOCS_BASE}/docs/standx-earn/mainnet-campaigns`,
    covers: "Active mainnet campaigns and how to qualify"
  },
  {
    title: "Audits",
    url: `${DOCS_BASE}/docs/resources/audits`,
    covers: "Security audit reports"
  },
  {
    title: "Media Assets",
    url: `${DOCS_BASE}/docs/resources/media-assets`,
    covers: "Official StandX brand and media assets"
  },
  {
    title: "SIPs (StandX Improvement Proposals)",
    url: `${DOCS_BASE}/sip/sip`,
    covers: "Index of SIP-1 through SIP-5b"
  },
  {
    title: "API Reference",
    url: `${DOCS_BASE}/standx-api/standx-api`,
    covers: "REST, WebSocket, auth, and rate limits for programmatic trading"
  }
];

/**
 * The concept digest. Written as compact prose because the model reads it, not
 * a human. Facts here are grounded in the doc pages listed above.
 */
export const standxKnowledge = `
## What StandX is
StandX is a perpetual futures DEX ("Perps DEX") live on mainnet across BNB Chain and Solana,
built by core members of the original Binance Futures founding team. Its pitch is
"Universal Markets. Universal Yield." — permissionless listing of any market, on top of a
yield-bearing collateral asset. The order book is fully onchain; funds sit in audited
smart contracts with self-custody.

## DUSD — the yield-bearing stablecoin
- DUSD is StandX's native stablecoin and the unified margin/quote asset for perps.
- It is yield-bearing with NO staking and NO locking. Rewards are auto-distributed to holders'
  wallets based on the balance held at each address.
- Yield comes from two real sources: staking rewards on spot assets (e.g. ETH, SOL) and
  funding-fee revenue from short perpetual futures positions. It is "real yield", not token emissions.
- Mint with USDT or USDC. Minimum mint is $5. No minting fee is currently applied.
  You need a little BNB or SOL for network fees. Yield starts accruing immediately after mint.
- Backing is market-neutral: spot collateral hedged with short perps to stay delta-neutral,
  held with custodians, plus a reserve fund to absorb periods of negative funding.
- Because margin itself earns, a trader earns yield on collateral while a position is open.

## Perps mechanics (the numbers people ask for)
- Trading fees: maker 0.01%, taker 0.04%, charged on the notional value of each matched trade.
- Margin tiers (default table; specific markets may differ):
  tier 1, notional 0–1,000,000 USDT: up to 40x, maintenance margin 1.25%
  tier 2, 1,000,000–10,000,000: up to 20x, 2.50%
  tier 3, 10,000,000–100,000,000: up to 10x, 5.00%
  tier 4, 100,000,000–500,000,000: up to 5x, 10.00%
- Cross margin shares the whole balance across positions; isolated margin caps loss to the
  margin assigned to one position. Switch modes before opening a position.
- Liquidation triggers when margin balance falls below the maintenance requirement, measured on
  mark price (not last traded price) to resist manipulation. Small positions go out as a single
  IOC order at bankruptcy price; large positions liquidate tranche by tranche and stop early if
  margin recovers. If the vault cannot absorb the risk, ADL offsets it. A liquidation clearance
  fee is taken from whatever margin remains.
- Funding rate is paid between longs and shorts, not to StandX. Positive rate: longs pay shorts.
  Baseline interest rate 0.00125%/hour (0.01% per 8h). Premium index sampled every 5 seconds and
  time-weighted. Funding is capped at 4%/hour, and individual pairs can set a lower cap.
  Funding payment = position notional x funding rate.

## Wallets and moving money
- Two-wallet system. The Cash Wallet is the main account and receives all deposits.
  The Perps Wallet is the active trading account used as margin.
- Transfer instantly between them with the Transfer function. You must move funds to the
  Perps Wallet before you can trade with them.
- To withdraw: make sure the amount is in the Cash Wallet, then submit an on-chain withdrawal
  request on Solana or BSC, which opens a Withdrawal Slot that StandX processes automatically.
  Requests exceeding the Cash Wallet balance fail; use "Free Slot" to release a failed slot.

## Network Yield (referrals)
- Earn a share of invitees' trading fees, up to 20%, and optionally rebate part back to them.
- Not active by default: reaching 500,000 DUSD of cumulative personal trading volume unlocks the
  5% base rate, and the full trading history counts toward that activation.
- Higher tiers come from Network Volume accumulated after launch:
  10% at 2.5mn, 15% at 7.5mn, 20% at 15mn DUSD. Rates and thresholds can be adjusted.

## SIPs — StandX Improvement Proposals
SIP-1 Block Trade, SIP-2 Position Yield, SIP-3 DUSD Native Yield, SIP-4 Block Options,
SIP-5 Universal Markets (permissionless listing), SIP-5a Community Maker Yield,
SIP-5b Community Vaults. SIP-5 is the flagship: anyone meeting public rules can list a market —
perps, spot, prediction, pre-market — funded through a Reward Vault with a Shield Vault
buffering extreme liquidations.
`.trim();

/**
 * Look a page up by title. Throws rather than returning undefined so a typo or
 * a renamed page fails at module load instead of silently dropping a link.
 */
export function findDoc(title: string): DocEntry {
  const page = docPages.find((entry) => entry.title === title);
  if (!page) {
    throw new Error(`Unknown StandX doc page: ${title}`);
  }
  return page;
}

/** Compact "title — url" list injected into the prompt so links are never invented. */
export function renderDocIndex(): string {
  return docPages
    .map((page) => `- ${page.title} (${page.covers}): ${page.url}`)
    .join("\n");
}
