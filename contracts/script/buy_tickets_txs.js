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
  const network = ethers.Network.from({
    chainId: CHAIN_ID,
    name: 'botchain',
  });
  const provider = new ethers.JsonRpcProvider(RPC_URL, network, {
    staticNetwork: network,
  });

  const readContract = new ethers.Contract(CONTRACT_ADDRESS, TIKETA_ABI, provider);
  const info = await retry(() => readContract.tierInfo(1));
  console.log(`\nTiketa Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Tier 1: "${info[0]}" | Price: ${ethers.formatEther(info[2])} BOT | Remaining: ${info[4]}`);

  const tier1Price = info[2]; // 0.01 BOT
  const txsPerWallet = 8;
  const results = {};

  for (const w of WALLETS) {
    console.log(`\n========================================`);
    console.log(`Executing 8 Buy Transactions on Tiketa for ${w.name}: ${w.address}`);
    const wallet = new ethers.Wallet(w.privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, TIKETA_ABI, wallet);

    const initialBotBalance = await retry(() => provider.getBalance(w.address));
    const initialTicketBalance = await retry(() => readContract.balanceOf(w.address, 1));
    console.log(`Initial BOT Balance: ${ethers.formatEther(initialBotBalance)} BOT`);
    console.log(`Initial Tier 1 Tickets: ${initialTicketBalance.toString()}`);

    results[w.name] = {
      address: w.address,
      initialTickets: initialTicketBalance.toString(),
      txHashes: [],
    };

    let nonce = await retry(() => provider.getTransactionCount(w.address, 'latest'));

    for (let i = 1; i <= txsPerWallet; i++) {
      console.log(`\n[${w.name}] Submitting buy(1, 1) - Tx ${i}/${txsPerWallet} (nonce: ${nonce})...`);
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
      console.log(
        `Tx confirmed in block ${receipt.blockNumber}! Status: ${receipt.status} (Gas used: ${receipt.gasUsed})`
      );
      results[w.name].txHashes.push({
        index: i,
        hash: tx.hash,
        block: receipt.blockNumber,
        explorerUrl: `https://scan.bohr.life/tx/${tx.hash}`,
      });
      nonce++;
      await sleep(1000);
    }

    const finalBotBalance = await retry(() => provider.getBalance(w.address));
    const finalTicketBalance = await retry(() => readContract.balanceOf(w.address, 1));
    results[w.name].finalTickets = finalTicketBalance.toString();
    results[w.name].finalBot = ethers.formatEther(finalBotBalance);
    console.log(`\n${w.name} finished! Tickets owned: ${initialTicketBalance} -> ${finalTicketBalance}`);
    console.log(`Remaining BOT balance: ${results[w.name].finalBot} BOT`);
  }

  const finalRemaining = await retry(() => readContract.remaining(1));
  console.log(`\n========================================`);
  console.log(`ALL 24 TIKETA CONTRACT BUY TRANSACTIONS COMPLETE!`);
  console.log(`Tier 1 Remaining Supply: ${finalRemaining.toString()}`);
  console.log(`========================================\n`);

  for (const [name, data] of Object.entries(results)) {
    console.log(`### ${name} (${data.address})`);
    console.log(`Tickets Owned (Tier 1): ${data.initialTickets} -> ${data.finalTickets} (+8 tickets)`);
    console.log(`Remaining BOT: ${data.finalBot} BOT`);
    console.log(`Contract Buy Transactions:`);
    data.txHashes.forEach((t) => {
      console.log(`  [${t.index}/8] Block ${t.block} -> ${t.hash}`);
      console.log(`         Explorer: ${t.explorerUrl}`);
    });
    console.log('');
  }
}

main().catch((err) => {
  console.error('Error in buy script:', err);
  process.exit(1);
});
