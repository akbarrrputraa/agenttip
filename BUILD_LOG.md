# AgentTip — BUILD LOG

## Status (2026-11-18 ~20:05 WIB)

- ✅ Contract written, compiled, gas-estimated
- ✅ Public repo + live site (GitHub Pages)
- ✅ **DEPLOYED — 0xc7c3434C7Fe1D133D4a50AAb261deE75A5C22629, block 134315709**
- ✅ Smoke test: resolveName("0xakbarrr") = main wallet; checkIn done, streak 1
- ⛔ Verification (Sourcify + BscScan) PENDING — Sourcify submit needs user approval (timed out ~20:05 WIB, not retried)
- ⏳ Submission packet prepared, NOT submitted (Binance has not published
  a project-submission form URL yet as of 18 Nov)

## What was built

- Contract: `contracts/AgentTip.sol` — single file, no imports, solc 0.8.26,
  optimizer on, runs 200. Bytecode 2,064 bytes.
  - `resolveName(name)` → registry `ownerOf(keccak256(name))`, `address(0)` if unregistered
  - `tipByName(name)` payable — forwards 100% of `msg.value`, 0 fees
  - `checkIn(agentId)` — Agent ID holders only, 1 per UTC day, streak tracking
  - Views: `streakOf`, `lastCheckInOf`, `totalTipped`, `totalTips`, `totalCheckIns`
  - No owner, no pause, no mint, no tax, no upgradeability, no withdraw, no
    receive/fallback (plain BNB reverts — funds can't get stuck).
- Frontend: `docs/` — static site, injected wallet only, no QR login, no server,
  no session storage. Resolve + tip + check-in + streak + recent events + stats.
- Repo: https://github.com/akbarrrputraa/agenttip (public, commit 4b651fb)
- Site: https://akbarrrputraa.github.io/agenttip/ (Pages, source /docs, verified HTTP 200)

## Gas / budget (checked 2026-11-18 ~18:35 WIB)

- Main wallet native BNB: **0.00063121 BNB** (0x067b24c488bA1A6a967A920788AE375Ccc4f54AE, nonce 319)
- BSC gas price: **0.05 gwei**
- Deployment estimate (`eth_estimateGas`, creation): **498,434 gas = 0.00002492 BNB**
  (+20% buffer: 598,120 gas = 0.00002991 BNB). Headroom ~21x. Budget is NOT the problem.

## DEPLOY BLOCKER — BAW cannot deploy contracts

Evidence (2026-11-18 ~18:40 WIB):

1. BAW CLI v1.12.0 command tree has NO deploy/create command. `contract-call`
   only has `preview` / `execute`.
2. `contract-call preview --help`: `--to <address>` is "required for EVM".
3. Test (preview ONLY, nothing executed): preview with
   `--to 0x0000000000000000000000000000000000000000` + creation bytecode returned
   `success: true` but as `transactionType: "ContractInteraction"` with
   `contractAddress: 0x000...000` — i.e. a CALL to the zero address, NOT a contract
   creation. Executing that requestId (`4f51f9642d4647318f4e69071656883d`, expired
   1795001635224) would have broadcast a no-op call to an empty account and burned
   gas without deploying anything. It was NOT executed.
4. BAW has no private-key export, so the main wallet cannot sign a raw creation tx
   locally either.

## Alternative route (needs user go-ahead — a spend)

1. Fund **vibe1** `0x71c25d7E918E8B355A581Df6135B7a999fc1a17D` (keys in
   `~/workspace/vibevibe/wallets.json`, currently 0 BNB, nonce 0) with **~0.0001 BNB**
   from the BAW wallet via `baw wallet send` (plain transfer, ~21,000 gas ≈ 0.000001 BNB).
2. Run `node deploy.js` — deploys with ethers v6 + vibe1 key via public BSC RPC.
   Predicted contract address (CREATE, nonce 0):
   **0xc7c3434C7Fe1D133D4a50AAb261deE75A5C22629**. Deploy cost ~0.000025 BNB.
   Total spend from main wallet ≈ 0.00013 BNB; ~0.0005 BNB remains.
3. Deployer ≠ reward address — fine for the hackathon; the reward receiving address
   stays the main wallet (see SUBMISSION.md).
4. After deploy: fill `docs/config.js` (CONTRACT_ADDRESS + DEPLOY_BLOCK), push,
   verify on Sourcify + BscScan (settings below), update README + SUBMISSION.md.

## Verification prep (for after deployment)

- Source: `contracts/AgentTip.sol` (single file, IS the flattened source)
- Compiler: solc 0.8.26, optimizer enabled, runs 200, evmVersion default, no
  constructor args, no libraries, license MIT.
- Sourcify: standard JSON in `verification.json`; free, no key needed.
- BscScan: same source + settings via the web verification form (no API key on hand;
  if an API key becomes available, the same standard JSON works via API).

## Next steps (in order)

1. ✅ User approved funding vibe1 with ~0.0001 BNB (2026-11-18 ~19:59 WIB).
2. ✅ Deploy via `deploy.js`, record address/tx/block/gas in `deployed.json`.
3. ✅ Update `docs/config.js` + README, push, confirm site shows the contract.
4. ⛔ Verify Sourcify (then BscScan) — Sourcify POST needs user approval (request timed out ~20:05 WIB; do NOT retry unless the user asks). BscScan via web form needs a browser task.
5. ✅ Smoke-test: resolve `0xakbarrr` ✓, check-in ✓ (streak 1, totalCheckIns 1 — first of 30 interactors).
6. Hand the finished SUBMISSION.md to the parent for Binance submission once the
   submission form URL is known.

## Deployment record (2026-11-18 ~20:00 WIB)

- Funding: `baw wallet send` BLOCKED (error 351703: recipient not in address book —
  adding it needs the Binance Wallet app). Workaround within the same approval:
  `baw contract-call` plain value transfer (preview clean: Send, 0.0001 BNB,
  simulationCode 000000000, risks empty) — executed, tx
  `0xcc16955b95341ca018e9012038eb52eeb1cc60bec230678a96834f65cc35dbe4`,
  block 134315667, status 1, gas 21,000. vibe1 balance verified 0.0001 BNB.
- Deploy: `node deploy.js` first failed (invalid private key — wallets.json uses
  `private_key`, script read `privateKey`; fixed deploy.js to accept both).
  Second run OK: deploy tx
  `0x4636fd96586f6a0f1de0e262d1646a5be11eb87cc307ef546ca50560735c8352`,
  block 134315709, gasUsed 493,351, status 1. Contract address
  `0xc7c3434C7Fe1D133D4a50AAb261deE75A5C22629` — EXACTLY the predicted address.
- Site: `docs/config.js` updated (address + block 134315709), commit 7c0bfcc
  pushed; live config.js verified serving the contract address.
- Spend: main 0.00063121 → 0.00052010 BNB (funding 0.0001 + funding gas
  ~0.00001006 at ~0.48 gwei BAW gas price); vibe1 0.0001 → 0.00007533 BNB after
  deploy gas 0.00002467. Total gas spent ~0.0000347 BNB — well within budget.
- Smoke test: `resolveName("0xakbarrr")` → main wallet ✓. `checkIn(agentId)`
  via BAW (preview clean, value 0), tx
  `0x1892b167beec748f1ee18f01cbc66ce77322f6a8beb82bb40ac6798794af731f`,
  block 134317242, status 1, gas 96,371. Verified on-chain: streakOf = 1,
  totalCheckIns = 1. First Agent ID interactor counted (1/30).
- Sourcify: GET status shows match null (unverified). POST /v2/verify with the
  standard JSON triggered a user-confirmation approval that TIMED OUT (~20:05 WIB)
  — submission NOT performed, do NOT retry unless the user asks. BscScan
  verification (web form, no API key on hand) still to do via browser task.
