# AgentTip

Tip any Agent ID by its `.ai` name, and check in daily to build an on-chain streak.

**Live site:** https://akbarrrputraa.github.io/agenttip/
**Contract:** `TBD` (deploys to BNB Chain mainnet — see `deployed.json` after deployment)
**Hackathon:** Binance Agent ID Hackathon (submission period 18 Nov – 9 Dec 2026)

## What it does

- **Tip by name** — enter an Agent ID name like `0xakbarrr` and an amount. The
  contract resolves the name to its owner's wallet on-chain and forwards **100%
  of the tip**. No fee, no cut, no token.
- **Daily check-in** — Agent ID holders check in once per UTC day (free, gas
  only). Consecutive days build a public on-chain streak per Agent ID.

Agent ID is the product's identity layer: it is used for **access control**
(only Agent ID holders can check in), **payments** (tips resolve by name), and
**identity** (streaks are recorded per Agent ID, not per throwaway address).

## How Agent ID is used (on-chain)

- Registry: SPACE ID Agent ID `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`
  (ERC-721, non-transferable, one per user).
- A name's token ID is `keccak256(name)` **without** the `.ai` suffix, e.g.
  `keccak256("0xakbarrr") = 0xc06fa04e24f3172097e5e033c10428f9686c5391b194ed0497f3ed1c6acf585b`.
- `resolveName(name)` → `registry.ownerOf(tokenId)` (returns `address(0)` when
  the name is unregistered).
- `tipByName(name)` — resolves, then forwards the full `msg.value`.
- `checkIn(agentId)` — requires `registry.ownerOf(agentId) == msg.sender`;
  one check-in per Agent ID per UTC day; streak increments on consecutive days,
  resets to 1 after a missed day.

## Contract

Single file, no imports, no dependencies: [`contracts/AgentTip.sol`](contracts/AgentTip.sol)

- Compiler: solc 0.8.26, optimizer enabled, runs 200.
- Deployment gas (estimated): ~498,434 gas.
- **No owner.** There is no owner, no pause, no mint, no tax, no upgradeability,
  no withdraw function, no unlimited approvals. Plain transfers to the contract
  revert (no `receive`/`fallback`), so funds can never get stuck in it.
- Tips follow checks-effects-interactions: state and events update before the
  external call. A failed transfer reverts the whole tip.

## Frontend

Static site in [`docs/`](docs/) (GitHub Pages). It talks only to the user's own
injected wallet (Binance Wallet / MetaMask) and public read-only RPCs. There is:

- **No QR login, no pairing codes, no session stored on any server.** The user
  connects their own wallet and confirms every transaction themselves.
- No promised returns, no "passive income", no token sale.
- A risk note on the page: tips are irreversible; the site never asks for a seed
  phrase or private key.

## Run it locally

```bash
npm install
node compile.js        # writes AgentTip.abi.json + AgentTip.bytecode.txt
node deploy.js         # deploys from the funded deployer key (see BUILD_LOG.md)
```

## Verify

- Sourcify: single-file source, solc 0.8.26, optimizer on, runs 200.
- BscScan: same source + settings via the web verification form.

## License

MIT
