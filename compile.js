const solc = require('solc');
const fs = require('fs');
const src = fs.readFileSync('contracts/AgentTip.sol', 'utf8');
const input = {
  language: 'Solidity',
  sources: { 'AgentTip.sol': { content: src } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } }
  }
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
if (out.errors) for (const e of out.errors) console.log(e.severity + ': ' + e.formattedMessage);
const c = out.contracts['AgentTip.sol']['AgentTip'];
fs.writeFileSync('AgentTip.abi.json', JSON.stringify(c.abi, null, 2));
fs.writeFileSync('AgentTip.bytecode.txt', '0x' + c.evm.bytecode.object);
fs.writeFileSync('AgentTip.deployed.txt', '0x' + c.evm.deployedBytecode.object);
console.log('bytecode bytes:', c.evm.bytecode.object.length / 2);
console.log('deployed bytes:', c.evm.deployedBytecode.object.length / 2);
console.log('functions:', c.abi.filter(x => x.type === 'function').map(x => x.name).join(', '));
