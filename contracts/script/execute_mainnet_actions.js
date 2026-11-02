const path = require('path');
const { ethers } = require(path.resolve(__dirname, '../../web/node_modules/ethers'));

const RPC_URL = 'https://rpc.botchain.ai';
const CHAIN_ID = 677;
const CONTRACT_ADDRESS = '0x2eed1ec62c2d3cdf220b7fdb94b5bb398ec27de0';

const TIKETA_ABI = [
  'function buy(uint256 id, uint256 amount) payable',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes data)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function remaining(uint256 id) view returns (uint256)',
  'function tierInfo(uint256 id) view returns (string name, uint256 maxSupply, uint256 price, uint256 currentSupply, uint256 remainingSupply, bool active, bool exists)',
  'function withdraw()',
  'event TicketsPurchased(address indexed buyer, uint256 indexed id, uint256 amount, uint256 totalPrice)',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
];

const WALLETS = [
  {
    name: 'Wallet 1',
    address: '0xf391f681B8613E2155e5cC5560bDCFBbFE409801',
    privateKey: '0x14696c828346a34d3b1bb83ac75db71ae44c3f3ef330d1daaefc4e3824443b0e',
  },
  {
    name: 'Wallet 2',
    address: '0x6D6b1C815b26982111FA90e2c0F0202c36d15C96',
    privateKey: '0x243ff32bcc62e5eca16104384fe41e600cfc8b73da396336ffe98d00d2c4bec8',
  },
  {
    name: 'Wallet 3',
    address: '0xE13c7c280704035FB65E35e21374abCC0478626C',
    privateKey: '0xc4035d6c9b45ef5e444362c14696f202367f68eacddf22be1d477bd00545e498',
  },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry(fn, maxRetries = 6, delay = 2500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`  [Retry ${attempt}/${maxRetries} after error: ${err.message}. Waiting ${delay / 1000}s...]`);
      await sleep(delay);
    }
  }
}

async function main() {
  console.log('===============================================================');
  console.log(`Starting Mainnet Transactions on Botchain (Chain ID: ${CHAIN_ID})`);
  console.log(`Tiketa Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}`);
  console.log('===============================================================\n');

  const network = ethers.Network.from({
    chainId: CHAIN_ID,
    name: 'botchain_mainnet',
  });
  const provider = new ethers.JsonRpcProvider(RPC_URL, network, {
    staticNetwork: network,
  });

  const readContract = new ethers.Contract(CONTRACT_ADDRESS, TIKETA_ABI, provider);

  // Fetch tier details
  console.log('Fetching Event Tiers from contract:');
  const t1 = await retry(() => readContract.tierInfo(1));
  const t2 = await retry(() => readContract.tierInfo(2));
  const t3 = await retry(() => readContract.tierInfo(3));

  console.log(`Tier 1: ${t1[0]} | Price: ${ethers.formatEther(t1[2])} BOT | Remaining: ${t1[4]}`);
  console.log(`Tier 2: ${t2[0]} | Price: ${ethers.formatEther(t2[2])} BOT | Remaining: ${t2[4]}`);
  console.log(`Tier 3: ${t3[0]} | Price: ${ethers.formatEther(t3[2])} BOT | Remaining: ${t3[4]}\n`);

  const txResults = [];

  // Define 8 actions for each wallet
  const actionsPerWallet = [
    // Wallet 1 actions
    [
      { type: 'buy', tier: 1, amount: 1, name: 'Buy Summit Ticket (Tier 1)', price: t1[2] },
      { type: 'buy', tier: 1, amount: 1, name: 'Buy Summit Ticket (Tier 1)', price: t1[2] },
      { type: 'buy', tier: 2, amount: 1, name: 'Buy Hackathon Ticket (Tier 2)', price: t2[2] },
      { type: 'buy', tier: 2, amount: 1, name: 'Buy Hackathon Ticket (Tier 2)', price: t2[2] },
      { type: 'buy', tier: 3, amount: 1, name: 'Buy VIP Gala Ticket (Tier 3)', price: t3[2] },
      { type: 'buy', tier: 3, amount: 1, name: 'Buy VIP Gala Ticket (Tier 3)', price: t3[2] },
      { type: 'transfer', to: WALLETS[1].address, toName: 'Wallet 2', tier: 1, amount: 1, name: 'Transfer Tier 1 to Wallet 2' },
      { type: 'transfer', to: WALLETS[2].address, toName: 'Wallet 3', tier: 2, amount: 1, name: 'Transfer Tier 2 to Wallet 3' },
    ],
    // Wallet 2 actions
    [
      { type: 'buy', tier: 1, amount: 1, name: 'Buy Summit Ticket (Tier 1)', price: t1[2] },
      { type: 'buy', tier: 1, amount: 1, name: 'Buy Summit Ticket (Tier 1)', price: t1[2] },
      { type: 'buy', tier: 2, amount: 1, name: 'Buy Hackathon Ticket (Tier 2)', price: t2[2] },
      { type: 'buy', tier: 2, amount: 1, name: 'Buy Hackathon Ticket (Tier 2)', price: t2[2] },
      { type: 'buy', tier: 3, amount: 1, name: 'Buy VIP Gala Ticket (Tier 3)', price: t3[2] },
      { type: 'buy', tier: 3, amount: 1, name: 'Buy VIP Gala Ticket (Tier 3)', price: t3[2] },
      { type: 'transfer', to: WALLETS[0].address, toName: 'Wallet 1', tier: 3, amount: 1, name: 'Transfer Tier 3 to Wallet 1' },
      { type: 'transfer', to: WALLETS[2].address, toName: 'Wallet 3', tier: 1, amount: 1, name: 'Transfer Tier 1 to Wallet 3' },
    ],
    // Wallet 3 actions
    [
      { type: 'buy', tier: 1, amount: 1, name: 'Buy Summit Ticket (Tier 1)', price: t1[2] },
      { type: 'buy', tier: 1, amount: 1, name: 'Buy Summit Ticket (Tier 1)', price: t1[2] },
      { type: 'buy', tier: 2, amount: 1, name: 'Buy Hackathon Ticket (Tier 2)', price: t2[2] },
      { type: 'buy', tier: 2, amount: 1, name: 'Buy Hackathon Ticket (Tier 2)', price: t2[2] },
      { type: 'buy', tier: 3, amount: 1, name: 'Buy VIP Gala Ticket (Tier 3)', price: t3[2] },
      { type: 'buy', tier: 3, amount: 1, name: 'Buy VIP Gala Ticket (Tier 3)', price: t3[2] },
      { type: 'transfer', to: WALLETS[0].address, toName: 'Wallet 1', tier: 2, amount: 1, name: 'Transfer Tier 2 to Wallet 1' },
      { type: 'transfer', to: WALLETS[1].address, toName: 'Wallet 2', tier: 3, amount: 1, name: 'Transfer Tier 3 to Wallet 2' },
    ],
  ];

  for (let wIdx = 0; wIdx < WALLETS.length; wIdx++) {
    const wInfo = WALLETS[wIdx];
    const signer = new ethers.Wallet(wInfo.privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, TIKETA_ABI, signer);

    const initialBal = await retry(() => provider.getBalance(wInfo.address));
    let nonce = await retry(() => provider.getTransactionCount(wInfo.address, 'latest'));

    console.log(`>>> Starting 8 transactions for ${wInfo.name} (${wInfo.address})`);
    console.log(`    Current Balance: ${ethers.formatEther(initialBal)} BOT | Initial Nonce: ${nonce}`);

    const walletActions = actionsPerWallet[wIdx];

    for (let aIdx = 0; aIdx < walletActions.length; aIdx++) {
      const act = walletActions[aIdx];
      const txNum = wIdx * 8 + aIdx + 1;
      console.log(`\n[Tx #${txNum} / 24] (${wInfo.name} - Step ${aIdx + 1}/8): ${act.name}`);

      const feeData = await retry(() => provider.getFeeData());
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      let tx;
      if (act.type === 'buy') {
        const val = act.price * BigInt(act.amount);
        tx = await retry(() =>
          contract.buy(act.tier, act.amount, {
            value: val,
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: 150000n,
          })
        );
      } else if (act.type === 'transfer') {
        tx = await retry(() =>
          contract.safeTransferFrom(wInfo.address, act.to, act.tier, act.amount, '0x', {
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: 120000n,
          })
        );
      }

      console.log(`  Tx Sent! Hash: ${tx.hash}`);
      console.log(`  Waiting for confirmation...`);

      const receipt = await retry(() => tx.wait(1));
      nonce++;

      console.log(`  Confirmed in block ${receipt.blockNumber} (Status: ${receipt.status})`);
      console.log(`  Explorer: https://scan.botchain.ai/tx/${tx.hash}`);

      txResults.push({
        txNumber: txNum,
        walletName: wInfo.name,
        walletAddress: wInfo.address,
        action: act.name,
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
        explorerUrl: `https://scan.botchain.ai/tx/${tx.hash}`,
      });

      await sleep(1500);
    }

    const finalBal = await retry(() => provider.getBalance(wInfo.address));
    const b1 = await retry(() => readContract.balanceOf(wInfo.address, 1));
    const b2 = await retry(() => readContract.balanceOf(wInfo.address, 2));
    const b3 = await retry(() => readContract.balanceOf(wInfo.address, 3));

    console.log(`\n--- ${wInfo.name} Completed ---`);
    console.log(`Final BOT Balance: ${ethers.formatEther(finalBal)} BOT`);
    console.log(`Ticket Inventory: Tier 1: ${b1.toString()} | Tier 2: ${b2.toString()} | Tier 3: ${b3.toString()}\n`);
  }

  // Summary
  console.log('\n===============================================================');
  console.log('ALL 24 TRANSACTIONS EXECUTED SUCCESSFULLY ON BOTCHAIN MAINNET!');
  console.log('===============================================================');
  console.log(JSON.stringify(txResults, null, 2));
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
