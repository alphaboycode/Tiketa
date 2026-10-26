const path = require('path');
const { ethers } = require(path.resolve(__dirname, '../../web/node_modules/ethers'));

const RPC_URL = 'https://rpc.bohr.life';
const CHAIN_ID = 968;
const CONTRACT_ADDRESS = '0x917524fccd12d61a36918506d5e80679699e534f';

const TIKETA_ABI = [
  'function buy(uint256 id, uint256 amount) payable',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function remaining(uint256 id) view returns (uint256)',
  'function tierInfo(uint256 id) view returns (string name, uint256 maxSupply, uint256 price, uint256 currentSupply, uint256 remainingSupply, bool active, bool exists)',
  'event TicketsPurchased(address indexed buyer, uint256 indexed id, uint256 amount, uint256 totalPrice)',
];

const WALLETS_TO_FINISH = [
  {
    name: 'Wallet 2',
    address: '0x6D6b1C815b26982111FA90e2c0F0202c36d15C96',
    privateKey: '0x243ff32bcc62e5eca16104384fe41e600cfc8b73da396336ffe98d00d2c4bec8',
    targetTickets: 8,
  },
  {
    name: 'Wallet 3',
    address: '0xE13c7c280704035FB65E35e21374abCC0478626C',
    privateKey: '0xc4035d6c9b45ef5e444362c14696f202367f68eacddf22be1d477bd00545e498',
    targetTickets: 8,
  },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry(fn, maxRetries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[Attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay / 1000}s...]`);
      await sleep(delay);
    }
  }
}

async function main() {
  console.log(`Connecting to Botchain RPC: ${RPC_URL}...`);
  const network = ethers.Network.from({ chainId: CHAIN_ID, name: 'botchain' });
  const provider = new ethers.JsonRpcProvider(RPC_URL, network, { staticNetwork: network });

  const readContract = new ethers.Contract(CONTRACT_ADDRESS, TIKETA_ABI, provider);
  const info = await retry(() => readContract.tierInfo(1));
  const tier1Price = info[2]; // 0.01 BOT

  for (const w of WALLETS_TO_FINISH) {
    const currentTickets = Number(await retry(() => readContract.balanceOf(w.address, 1)));
    const needed = w.targetTickets - currentTickets;
    console.log(`\n========================================`);
    console.log(`${w.name} (${w.address}) currently owns ${currentTickets} tickets. Needed to reach ${w.targetTickets}: ${needed}`);

    if (needed <= 0) {
      console.log(`${w.name} already has ${currentTickets} tickets!`);
      continue;
    }

    const wallet = new ethers.Wallet(w.privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, TIKETA_ABI, wallet);
    let nonce = await retry(() => provider.getTransactionCount(w.address, 'latest'));

    for (let i = 1; i <= needed; i++) {
      console.log(`\n[${w.name}] Submitting buy(1, 1) - (${currentTickets + i}/${w.targetTickets}) (nonce: ${nonce})...`);
      const tx = await retry(() =>
        contract.buy(1, 1, {
          value: tier1Price,
          nonce: nonce,
          gasPrice: ethers.parseUnits('20', 'gwei'),
          gasLimit: 200000,
        })
      );
      console.log(`Tx submitted! Hash: ${tx.hash}`);

      const receipt = await retry(() => tx.wait(1));
      console.log(`Tx confirmed in block ${receipt.blockNumber}! Status: ${receipt.status} (Gas used: ${receipt.gasUsed})`);
      nonce++;
      await sleep(1000);
    }

    const finalTickets = await retry(() => readContract.balanceOf(w.address, 1));
    console.log(`${w.name} finished! Final Tier 1 Tickets: ${finalTickets.toString()}`);
  }

  // Final check of all 3 wallets
  const allWallets = [
    { name: 'Wallet 1', address: '0xf391f681B8613E2155e5cC5560bDCFBbFE409801' },
    { name: 'Wallet 2', address: '0x6D6b1C815b26982111FA90e2c0F0202c36d15C96' },
    { name: 'Wallet 3', address: '0xE13c7c280704035FB65E35e21374abCC0478626C' },
  ];

  console.log(`\n========================================`);
  console.log(`FINAL TIKETA ON-CHAIN TICKET STATUS`);
  console.log(`========================================\n`);

  for (const w of allWallets) {
    const tBal = await retry(() => readContract.balanceOf(w.address, 1));
    const botBal = await retry(() => provider.getBalance(w.address));
    console.log(`- ${w.name} (${w.address}):`);
    console.log(`  Tickets Owned: ${tBal.toString()} / 8`);
    console.log(`  BOT Balance: ${ethers.formatEther(botBal)} BOT`);
  }

  const finalInfo = await retry(() => readContract.tierInfo(1));
  console.log(`\nTier 1 ("${finalInfo[0]}"):`);
  console.log(`Total Minted: ${finalInfo[3].toString()} tickets`);
  console.log(`Remaining: ${finalInfo[4].toString()} tickets`);
}

main().catch((err) => {
  console.error('Error completing buys:', err);
  process.exit(1);
});
