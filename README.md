# Tiketa — On-Chain Event Ticketing dApp

**Tiketa** is an on-chain event ticketing platform built on the **Botchain testnet** (Chain ID: `968`). It leverages **ERC-1155** (`ERC1155Supply`) to manage multiple ticket tiers with enforced supply caps, exact native token payment, reentrancy protection, and transferability.

---

## Architecture Overview

```
Tiketa/
├── contracts/               # Foundry smart contracts
│   ├── src/
│   │   └── Tiketa.sol       # ERC-1155 ticketing contract with custom errors & events
│   ├── test/
│   │   └── Tiketa.t.sol     # Comprehensive test suite (unit + fuzz testing)
│   ├── script/
│   │   ├── Deploy.s.sol     # Deployment script configuring default GA & VIP tiers
│   │   └── exportContracts.js # Syncs ABI & deployed address to frontend
│   └── foundry.toml         # Foundry configuration with Botchain RPC & Solc 0.8.24
├── web/                     # Vite + React + TypeScript + Tailwind frontend
│   ├── src/
│   │   ├── contracts/       # Auto-generated ABI & Botchain network config
│   │   ├── hooks/           # useTiketa Web3 & contract interaction hook
│   │   ├── pages/           # Explore (Tiers), My Tickets, and Organizer views
│   │   └── components/      # Navbar, ContractBanner, TxModal
└── README.md
```

---

## Network Details (Botchain Testnet)

- **Network Name**: Botchain Testnet
- **Chain ID**: `968` (Hex: `0x3c8`)
- **RPC URL**: `https://rpc.bohr.life`
- **Native Currency**: `BOT` (18 decimals)
- **Block Explorer**: `https://scan.bohr.life/`
- **RPC Endpoint in Foundry**: configured as `botchain = "https://rpc.bohr.life"`

---

## Features

### Smart Contract (`Tiketa.sol`)
- **ERC-1155 Multi-Token**: Each ticket tier corresponds to a distinct token ID (e.g. ID 1 = General Admission, ID 2 = VIP).
- **Supply Cap Enforcement**: Hard ceiling on available tickets per tier via `totalSupply(id) + amount <= maxSupply`.
- **Exact Native Payment**: Requires `msg.value == price * amount`; rejects underpayment and overpayment.
- **Reentrancy Protection**: Uses OpenZeppelin `ReentrancyGuard` on all state-changing and payable functions.
- **Organizer Governance**:
  - `createTier(id, name, maxSupply, price)`: Create new ticket tiers.
  - `setPrice(id, newPrice)`: Adjust tier ticket prices.
  - `setTierActive(id, active)`: Pause or activate tier sales.
  - `withdraw()`: Withdraw accumulated ticket proceeds in BOT to the organizer.
- **Secondary Market / Transfers**: Standard ERC-1155 transfers (`safeTransferFrom`, `safeBatchTransferFrom`) remain enabled for peer-to-peer transfers and resale.
- **Custom Errors & Events**: Fully typed custom errors and granular event logs for every action.

### Web Application
- **Auto Network Switching**: Detects connected network and prompts MetaMask / injected wallet to add/switch to Botchain Testnet (`wallet_addEthereumChain` / `wallet_switchEthereumChain`).
- **Ticket Marketplace**: Browse tiers, view live remaining supply vs. cap with progress bars, select quantity, and purchase tickets with instant calculation in BOT.
- **My Tickets**: Displays owned tickets per tier and provides a transfer modal to send tickets to any Botchain address.
- **Organizer Dashboard**: Exclusively accessible to the contract owner to create new tiers, update prices, toggle sales availability, and withdraw BOT revenues.
- **Transaction Feedback**: Real-time status modals with direct links to `https://scan.bohr.life/tx/<hash>`.
- **Contract Address Config**: Dynamic contract address inspector and override control directly in the UI.

---

## Getting Started

### Prerequisites
- [Foundry](https://getfoundry.sh/) (`forge`, `cast`)
- [Node.js](https://nodejs.org/) (v18+ or v20+) / [Bun](https://bun.sh/)
- MetaMask or any Web3 injected browser wallet

---

## 1. Keystore Setup (No Private Keys)

Tiketa uses encrypted Foundry `cast` keystores to protect private keys.

To import your organizer account into the `Tiketa` / `tiketa` keystore:

```bash
cast wallet import tiketa --interactive
```

Cast will prompt you to enter your private key securely and set a password to encrypt it.

To verify your account is listed:
```bash
cast wallet list
```

---

## 2. Environment Variables

Tiketa does not require private keys in `.env` files. Copy the template:

```bash
cp .env.example .env
```

`.env.example` contents:
```ini
# Botchain Testnet Configuration
BOTCHAIN_RPC_URL="https://rpc.bohr.life"
BOTCHAIN_EXPLORER_URL="https://scan.bohr.life/"

# Deployed Tiketa Smart Contract Address (auto-populated by export script)
TIKETA_CONTRACT_ADDRESS=""

# Frontend Vite variables
VITE_BOTCHAIN_RPC="https://rpc.bohr.life"
VITE_TIKETA_ADDRESS=""
```

---

## 3. Testing Smart Contracts

Run the complete test suite covering supply caps, exact payments, inactive tiers, owner restrictions, withdrawals, ERC-1155 transfers, and fuzz testing:

```bash
cd contracts
forge test -vvv
```

All 25 tests pass.

---

## 4. Deployment to Botchain Testnet

Deploy the contract and initialize the default tiers (**GA**: ID 1, Cap 500, Price 0.01 BOT; **VIP**: ID 2, Cap 50, Price 0.05 BOT).

Deploy command:
```bash
forge script script/Deploy.s.sol --rpc-url botchain --account tiketa --password papa4mama4  --broadcast
```

Alternatively, omit `--password` to enter your keystore password interactively:
```bash
forge script script/Deploy.s.sol --rpc-url botchain --account tiketa --broadcast
```

### Export ABI and Address to Frontend
After broadcasting the deployment, run the export script to sync the deployed contract address and ABI to `web/src/contracts/`:

```bash
# From contracts directory
node script/exportContracts.js

# Or provide address explicitly if needed
node script/exportContracts.js 0xYourDeployedAddressHere
```

---

## 5. Contract Verification on Bohr Explorer

The Botchain testnet explorer is available at [https://scan.bohr.life/](https://scan.bohr.life/).

### Automated Verification via Forge:
```bash
forge verify-contract <DEPLOYED_ADDRESS> src/Tiketa.sol:Tiketa \
  --verifier-url "https://scan.bohr.life/api" \
  --verifier blockscout \
  --constructor-args $(cast abi-encode "constructor(address,string)" <DEPLOYER_ADDRESS> "https://api.tiketa.xyz/metadata/{id}.json")
```

### Web UI Verification:
If the API endpoint does not accept automated verification, flatten the contract and verify manually:
1. Generate the flattened source:
   ```bash
   forge flatten src/Tiketa.sol > Tiketa.flattened.sol
   ```
2. Navigate to `https://scan.bohr.life/address/<DEPLOYED_ADDRESS>/contract_verification`
3. Select Compiler Type **Solidity (Single File)**, Compiler Version **v0.8.24**, and Open Source License **MIT**.
4. Paste the content of `Tiketa.flattened.sol` and submit.

---

## 6. Running the Frontend

Install dependencies and start the Vite development server:

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To create a production build:
```bash
npm run build
```

---

## Final Checklist to Deploy and Run

| Step | Command | Description |
|---|---|---|
| **1. Import Account** | `cast wallet import tiketa --interactive` | Import deployer wallet into cast keystore |
| **2. Run Tests** | `cd contracts && forge test` | Verify all 25 test cases pass |
| **3. Deploy** | `forge script script/Deploy.s.sol --rpc-url botchain --account tiketa --password papa4mama4  --broadcast` | Deploy Tiketa to Botchain testnet (Chain 968) |
| **4. Export ABI** | `node script/exportContracts.js` | Export deployed address and ABI to `web/` |
| **5. Install Frontend** | `cd ../web && npm install` | Install frontend dependencies |
| **6. Start App** | `npm run dev` | Launch dApp at `http://localhost:5173` |
| **7. Connect & Buy** | Switch to Botchain testnet in MetaMask | Mint GA or VIP tickets and view them in "My Tickets" |
