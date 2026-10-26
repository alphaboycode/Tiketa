import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ContractBanner } from './components/ContractBanner';
import { TxModal } from './components/TxModal';
import { ExplorePage } from './pages/ExplorePage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { OrganizerPage } from './pages/OrganizerPage';
import { useTiketa } from './hooks/useTiketa';
import { ExternalLink, Ticket } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'explore' | 'mytickets' | 'organizer'>('explore');

  const {
    contractAddress,
    updateContractAddress,
    account,
    chainId,
    isBotchain,
    balance,
    contractBalance,
    contractOwner,
    isOwner,
    isConnecting,
    tiers,
    myTickets,
    isLoadingTiers,
    txState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    buyTickets,
    createTier,
    setTierPrice,
    setTierActive,
    withdrawFunds,
    transferTicket,
    clearTxState,
  } = useTiketa();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        account={account}
        chainId={chainId}
        isBotchain={isBotchain}
        balance={balance}
        isOwner={isOwner}
        isConnecting={isConnecting}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        onSwitchNetwork={switchNetwork}
      />

      {/* Contract Banner */}
      <ContractBanner
        contractAddress={contractAddress}
        onUpdateAddress={updateContractAddress}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {currentTab === 'explore' && (
          <ExplorePage
            tiers={tiers}
            isLoading={isLoadingTiers}
            account={account}
            isBotchain={isBotchain}
            onBuy={buyTickets}
            onConnect={connectWallet}
            onSwitchNetwork={switchNetwork}
          />
        )}

        {currentTab === 'mytickets' && (
          <MyTicketsPage
            tickets={myTickets}
            account={account}
            onConnect={connectWallet}
            onExplore={() => setCurrentTab('explore')}
            onTransfer={transferTicket}
          />
        )}

        {currentTab === 'organizer' && (
          <OrganizerPage
            isOwner={isOwner}
            contractOwner={contractOwner}
            account={account}
            contractBalance={contractBalance}
            tiers={tiers}
            onCreateTier={createTier}
            onSetPrice={setTierPrice}
            onSetActive={setTierActive}
            onWithdraw={withdrawFunds}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-brand-400 rotate-45" />
            <span className="font-bold text-slate-300">Tiketa</span>
            <span>— Capped ERC-1155 Event Ticketing on Botchain Testnet (Chain ID 968)</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-400 transition flex items-center gap-1"
            >
              <span>Botchain Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-400 transition"
            >
              RPC Endpoint
            </a>
          </div>
        </div>
      </footer>

      {/* Transaction Modal */}
      <TxModal txState={txState} onClose={clearTxState} />
    </div>
  );
};

export default App;
