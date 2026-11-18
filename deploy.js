// Deploy AgentTip from vibe1 (NOT run automatically — see BUILD_LOG.md).
// Requires vibe1 to hold ~0.0001 BNB first (funded from the BAW wallet).
// Run: node deploy.js
const { ethers } = require('ethers');
const fs = require('fs');

const RPCS = [
  'https://bsc-dataseed.binance.org',
  'https://bsc-rpc.publicnode.com',
  'https://bsc-dataseed1.defibit.io',
];

async function main() {
  const wallets = JSON.parse(
    fs.readFileSync('/home/hatch/workspace/vibevibe/wallets.json', 'utf8')
  );
  const vibe1 = wallets.find((w) => w.address.toLowerCase() ===
    '0x71c25d7e918e8b355a581df6135b7a999fc1a17d');
  if (!vibe1) throw new Error('vibe1 key not found');
  const provider = new ethers.JsonRpcProvider(RPCS[0]);
  const signer = new ethers.Wallet(vibe1.privateKey, provider);
  console.log('deployer:', signer.address);
  console.log('balance BNB:', ethers.formatEther(await provider.getBalance(signer.address)));
  const abi = JSON.parse(fs.readFileSync('AgentTip.abi.json', 'utf8'));
  const bytecode = fs.readFileSync('AgentTip.bytecode.txt', 'utf8').trim();
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const fee = await provider.getFeeData();
  console.log('gasPrice gwei:', ethers.formatUnits(fee.gasPrice, 'gwei'));
  const tx = await factory.getDeployTransaction();
  const est = await provider.estimateGas(tx);
  console.log('estimated gas:', est.toString());
  const contract = await factory.deploy({
    gasLimit: (est * 120n) / 100n,
    gasPrice: fee.gasPrice,
  });
  console.log('deploy tx:', contract.deploymentTransaction().hash);
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log('CONTRACT ADDRESS:', addr);
  const receipt = await provider.getTransactionReceipt(contract.deploymentTransaction().hash);
  console.log('block:', receipt.blockNumber, 'gasUsed:', receipt.gasUsed.toString(),
    'status:', receipt.status);
  fs.writeFileSync('deployed.json', JSON.stringify({
    address: addr,
    txHash: contract.deploymentTransaction().hash,
    block: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    deployer: signer.address,
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
