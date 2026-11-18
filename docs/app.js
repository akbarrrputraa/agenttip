// AgentTip frontend — no server, no session storage, no QR login.
// Talks to the user's own injected wallet + public read-only RPCs only.
const CFG = window.AGENTTIP;
const $ = (id) => document.getElementById(id);
const CHAIN_ID_HEX = '0x38'; // BSC 56
const BSCSCAN = 'https://bscscan.com/tx/';

let provider = null;      // read-only public RPC
let signer = null;
let contract = null;      // read-only instance
let account = null;
let ABI = null;

function normName(raw) {
  let n = (raw || '').trim().toLowerCase();
  if (n.endsWith('.ai')) n = n.slice(0, -3);
  return n;
}
function nameToId(name) {
  return ethers.keccak256(ethers.toUtf8Bytes(name));
}
function shortAddr(a) {
  return a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
}
async function loadAbi() {
  // ABI is fetched from the repo so the page never hardcodes it.
  const res = await fetch('./AgentTip.abi.json');
  ABI = await res.json();
}
function readContract() {
  return new ethers.Contract(CFG.CONTRACT_ADDRESS, ABI, provider);
}
function deployed() {
  return CFG.CONTRACT_ADDRESS && CFG.CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

async function refreshStats() {
  if (!deployed()) return;
  try {
    const c = readContract();
    const [tipped, tips, checkins] = await Promise.all([
      c.totalTipped(), c.totalTips(), c.totalCheckIns(),
    ]);
    $('statTipped').textContent = ethers.formatEther(tipped) + ' BNB';
    $('statTips').textContent = tips.toString();
    $('statCheckins').textContent = checkins.toString();
  } catch (e) { /* read-only stats are best-effort */ }
}

async function refreshActivity() {
  const box = $('activity');
  if (!deployed()) { box.innerHTML = '<p>Contract not deployed yet.</p>'; return; }
  try {
    const c = readContract();
    const from = CFG.DEPLOY_BLOCK || (await provider.getBlockNumber()) - 20000;
    const [tips, checkins] = await Promise.all([
      c.queryFilter(c.filters.Tipped, from),
      c.queryFilter(c.filters.CheckedIn, from),
    ]);
    const rows = [];
    for (const e of tips.slice(-10).reverse()) {
      rows.push(`<li>💸 <b>${ethers.formatEther(e.args.amount)} BNB</b> → ${e.args.name}.ai (${shortAddr(e.args.to)}) · <a href="${BSCSCAN}${e.transactionHash}" target="_blank" rel="noopener">tx</a></li>`);
    }
    for (const e of checkins.slice(-10).reverse()) {
      rows.push(`<li>✅ check-in · streak ${e.args.streak} · ${shortAddr(e.args.wallet)} · <a href="${BSCSCAN}${e.transactionHash}" target="_blank" rel="noopener">tx</a></li>`);
    }
    box.innerHTML = rows.length ? `<ul>${rows.join('')}</ul>` : '<p>No activity yet.</p>';
  } catch (e) {
    box.innerHTML = '<p>Could not load activity (public RPC busy — try again).</p>';
  }
}

async function connect() {
  if (!window.ethereum) {
    $('walletInfo').textContent = 'No injected wallet found. Open this page in Binance Wallet or MetaMask.';
    return;
  }
  try {
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const net = await browserProvider.getNetwork();
    if (net.chainId !== 56n) {
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
      } catch (e) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: CHAIN_ID_HEX, chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: CFG.RPCS, blockExplorerUrls: ['https://bscscan.com'] }],
        });
      }
    }
    const accounts = await browserProvider.send('eth_requestAccounts', []);
    account = accounts[0];
    signer = await browserProvider.getSigner();
    contract = new ethers.Contract(CFG.CONTRACT_ADDRESS, ABI, signer);
    $('walletInfo').textContent = 'Connected: ' + shortAddr(account);
    $('tipBtn').disabled = !deployed();
    $('checkinBtn').disabled = !deployed();
  } catch (e) {
    $('walletInfo').textContent = 'Connection failed: ' + (e && e.message ? e.message : e);
  }
}

async function resolve() {
  const name = normName($('tipName').value);
  const out = $('resolveOut');
  if (!name) { out.textContent = 'Enter a name first.'; return; }
  if (!deployed()) { out.textContent = 'Contract not deployed yet.'; return; }
  try {
    const c = readContract();
    const addr = await c.resolveName(name);
    if (addr === ethers.ZeroAddress) {
      out.innerHTML = `<span class="err">${name}.ai is not registered.</span>`;
    } else {
      out.innerHTML = `<span class="ok">${name}.ai → ${addr}</span>`;
      $('tipBtn').disabled = !account;
    }
  } catch (e) {
    out.textContent = 'Resolve failed: ' + (e && e.message ? e.message : e);
  }
}

async function tip() {
  const name = normName($('tipName').value);
  const amount = $('tipAmount').value;
  const st = $('tipStatus');
  if (!contract || !account) { st.textContent = 'Connect your wallet first.'; return; }
  if (!name || !amount || Number(amount) <= 0) { st.textContent = 'Enter a name and an amount above 0.'; return; }
  try {
    st.textContent = 'Resolving ' + name + '.ai …';
    const to = await contract.resolveName(name);
    if (to === ethers.ZeroAddress) { st.innerHTML = '<span class="err">Name is not registered. Tip cancelled — nothing was sent.</span>'; return; }
    st.textContent = `Sending ${amount} BNB to ${name}.ai (${to}) — confirm in your wallet…`;
    const tx = await contract.tipByName(name, { value: ethers.parseEther(amount) });
    st.innerHTML = `Sent. Waiting for confirmation… <a href="${BSCSCAN}${tx.hash}" target="_blank" rel="noopener">tx</a>`;
    await tx.wait();
    st.innerHTML = `<span class="ok">Tipped ${amount} BNB to ${name}.ai.</span> <a href="${BSCSCAN}${tx.hash}" target="_blank" rel="noopener">tx</a>`;
    refreshStats(); refreshActivity();
  } catch (e) {
    st.innerHTML = '<span class="err">Failed: ' + (e && e.reason ? e.reason : (e && e.message ? e.message : e)) + '</span>';
  }
}

async function showStreak() {
  const name = normName($('myName').value);
  const out = $('streakOut');
  if (!name) { out.textContent = 'Enter your Agent ID name first.'; return; }
  if (!deployed()) { out.textContent = 'Contract not deployed yet.'; return; }
  try {
    const id = nameToId(name);
    const c = readContract();
    const [streak, last] = await Promise.all([c.streakOf(id), c.lastCheckInOf(id)]);
    const owner = await c.resolveName(name);
    out.innerHTML = owner === ethers.ZeroAddress
      ? `<span class="err">${name}.ai is not registered.</span>`
      : `streak <b>${streak}</b> day(s) · last check-in day ${last} (UTC) · owner ${shortAddr(owner)}`;
  } catch (e) {
    out.textContent = 'Lookup failed: ' + (e && e.message ? e.message : e);
  }
}

async function checkIn() {
  const name = normName($('myName').value);
  const st = $('checkinStatus');
  if (!contract || !account) { st.textContent = 'Connect your wallet first.'; return; }
  if (!name) { st.textContent = 'Enter your Agent ID name first.'; return; }
  try {
    const id = nameToId(name);
    const owner = await contract.resolveName(name);
    if (owner.toLowerCase() !== account.toLowerCase()) {
      st.innerHTML = '<span class="err">That name is not owned by your connected wallet. Check-in cancelled.</span>';
      return;
    }
    st.textContent = 'Checking in — confirm in your wallet…';
    const tx = await contract.checkIn(id);
    st.innerHTML = `Sent. Waiting for confirmation… <a href="${BSCSCAN}${tx.hash}" target="_blank" rel="noopener">tx</a>`;
    await tx.wait();
    const streak = await contract.streakOf(id);
    st.innerHTML = `<span class="ok">Checked in! Current streak: ${streak} day(s).</span> <a href="${BSCSCAN}${tx.hash}" target="_blank" rel="noopener">tx</a>`;
    refreshStats(); refreshActivity();
  } catch (e) {
    st.innerHTML = '<span class="err">Failed: ' + (e && e.reason ? e.reason : (e && e.message ? e.message : e)) + '</span>';
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  provider = new ethers.JsonRpcProvider(CFG.RPCS[0]);
  await loadAbi();
  if (!deployed()) $('deployBanner').style.display = 'block';
  else $('contractLink').innerHTML = `<a href="https://bscscan.com/address/${CFG.CONTRACT_ADDRESS}" target="_blank" rel="noopener">${CFG.CONTRACT_ADDRESS}</a>`;
  $('connectBtn').addEventListener('click', connect);
  $('resolveBtn').addEventListener('click', resolve);
  $('tipBtn').addEventListener('click', tip);
  $('streakBtn').addEventListener('click', showStreak);
  $('checkinBtn').addEventListener('click', checkIn);
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
  }
  refreshStats();
  refreshActivity();
});
