# AgentTip — Binance Agent ID Hackathon submission packet

**Status: DEPLOYED + LIVE, NOT YET SUBMITTED.** (Binance has not published a
project-submission form URL as of 2026-11-18; check the announcement /
@BinanceWallet before submitting. Source verification: Sourcify submission
PENDING — the verification POST needs user approval (approval request timed out
2026-11-18 ~20:05 WIB, NOT retried); BscScan verification via web form also
pending.)

- **Project name:** AgentTip
- **Website:** https://akbarrrputraa.github.io/agenttip/
- **Source code (open-source):** https://github.com/akbarrrputraa/agenttip
- **Contract addresses (BNB Chain mainnet):**
  - AgentTip: `0xc7c3434C7Fe1D133D4a50AAb261deE75A5C22629` — deployed 2026-11-18 ~20:00 WIB, tx `0x4636fd96586f6a0f1de0e262d1646a5be11eb87cc307ef546ca50560735c8352`, block 134315709, gas 493.351, deployer vibe1 `0x71c25d7E918E8B355A581Df6135B7a999fc1a17D`
  - Agent ID registry (used, not ours): `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`
- **Reward receiving address:** `0x067b24c488bA1A6a967A920788AE375Ccc4f54AE`
- **Team:** individual — Agent ID `0xakbarrr` / `0xakbarrr.ai`

## Agent ID usage description

AgentTip uses Agent ID as its identity and payments layer. Agent ID is a
non-transferable on-chain name (`name.ai`) for an Agentic Wallet; its token ID is
`keccak256(name)` without the `.ai` suffix, held in the SPACE ID registry
(`0x60B9…022F`).

1. **Payments by name:** `tipByName(name)` resolves the name on-chain via
   `registry.ownerOf(keccak256(name))` and forwards 100% of the sent value to
   that wallet. Users pay people, not hex addresses. The contract takes no fee.
2. **Access control:** `checkIn(agentId)` verifies on-chain that the caller owns
   the Agent ID (`registry.ownerOf(agentId) == msg.sender`). Only Agent ID holders
   can check in — one per Agent ID per UTC day.
3. **Identity / reputation:** daily check-ins build a public, on-chain streak
   recorded per Agent ID (`streakOf`, `lastCheckInOf`), not per throwaway address.

No token, no fees, no paid features. No owner powers: no pause, mint, tax,
upgradeability, or withdraw. The frontend connects the user's own injected wallet
only — no QR login, no pairing codes, no server-side sessions, and every
transaction is confirmed by the user in their own wallet. No returns are promised.
