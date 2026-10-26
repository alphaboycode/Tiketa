const { ethers } = require(require('path').resolve(__dirname, '../../web/node_modules/ethers'));

const RPC_URL = 'https://rpc.bohr.life';
const CHAIN_ID = 968;

const WALLETS = [
  {
    name: 'Wallet 1',
    address: '0xf391f681B8613E2155e5cC5560bDCFBbFE409801',
    privateKey: '0x14696c828346a34d3b1bb83ac75db71ae44c3f3ef330d1daaefc4e3824443b0e',
    recipient: '0x6D6b1C815b26982111FA90e2c0F0202c36d15C96', // send to Wallet 2
  },
  {
    name: 'Wallet 2',
    address: '0x6D6b1C815b26982111FA90e2c0F0202c36d15C96',
    privateKey: '0x243ff32bcc62e5eca16104384fe41e600cfc8b73da396336ffe98d00d2c4bec8',
    recipient: '0xE13c7c280704035FB65E35e21374abCC0478626C', // send to Wallet 3
  },
  {
    name: 'Wallet 3',
    address: '0xE13c7c280704035FB65E35e21374abCC0478626C',
    privateKey: '0xc4035d6c9b45ef5e444362c14696f202367f68eacddf22be1d477bd00545e498',
    recipient: '0xf391f681B8613E2155e5cC5560bDCFBbFE409801', // send to Wallet 1
  },
];

async function main() {
  console.log(`Connecting to Botchain RPC: ${RPC_URL} (Chain ID: ${CHAIN_ID})...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'botchain',
  });

  const txAmount = ethers.parseEther('0.001'); // 0.001 BOT per transaction
  const numTxsPerWallet = 8;
  const results = {};

  for (const w of WALLETS) {
    console.log(`\n========================================`);
    console.log(`Processing ${w.name}: ${w.address}`);
    const wallet = new ethers.Wallet(w.privateKey, provider);

    const initialBalance = await provider.getBalance(w.address);
    const initialNonce = await provider.getTransactionCount(w.address, 'latest');
    console.log(`Initial Balance: ${ethers.formatEther(initialBalance)} BOT`);
    console.log(`Initial Nonce: ${initialNonce}`);

    results[w.name] = {
      address: w.address,
      startNonce: initialNonce,
      txHashes: [],
    };

    let currentNonce = initialNonce;
    for (let i = 1; i <= numTxsPerWallet; i++) {
      console.log(`\nSending Tx ${i}/${numTxsPerWallet} from ${w.name} (nonce: ${currentNonce})...`);
      const tx = await wallet.sendTransaction({
        to: w.recipient,
        value: txAmount,
        nonce: currentNonce,
        gasLimit: 21000,
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });
      console.log(`Tx submitted! Hash: ${tx.hash}`);

      const receipt = await tx.wait(1);
      console.log(`Tx confirmed in block ${receipt.blockNumber}! Status: ${receipt.status}`);
      results[w.name].txHashes.push({
        index: i,
        hash: tx.hash,
        block: receipt.blockNumber,
        to: w.recipient,
        amount: '0.001 BOT',
      });
      currentNonce++;
    }

    const finalNonce = await provider.getTransactionCount(w.address, 'latest');
    const finalBalance = await provider.getBalance(w.address);
    results[w.name].finalNonce = finalNonce;
    results[w.name].finalBalance = ethers.formatEther(finalBalance);
    console.log(`\n${w.name} finished: Nonce increased from ${initialNonce} -> ${finalNonce}`);
    console.log(`Final Balance: ${results[w.name].finalBalance} BOT`);
  }

  console.log(`\n========================================`);
  console.log(`ALL TRANSACTIONS COMPLETE SUMMARY`);
  console.log(`========================================\n`);

  for (const [name, data] of Object.entries(results)) {
    console.log(`### ${name} (${data.address})`);
    console.log(`Starting Nonce: ${data.startNonce} | Final Nonce: ${data.finalNonce} (Total Txs: ${data.txHashes.length})`);
    console.log(`Remaining Balance: ${data.finalBalance} BOT`);
    console.log(`Transactions:`);
    data.txHashes.forEach((t) => {
      console.log(`  [${t.index}/8] Block ${t.block} -> Hash: ${t.hash} (Sent ${t.amount} to ${t.to})`);
    });
    console.log('');
  }
}

main().catch((err) => {
  console.error('Error executing transactions:', err);
  process.exit(1);
});
