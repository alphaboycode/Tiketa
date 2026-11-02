import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ContractBanner } from './components/ContractBanner';
import { TxModal } from './components/TxModal';
import { ExplorePage } from './pages/ExplorePage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { OrganizerPage } from './pages/OrganizerPage';
import { useTiketa } from './hooks/useTiketa';
import { ExternalLink } from 'lucide-react';
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
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/tiketa.jpeg" alt="Tiketa" className="w-5 h-5 rounded-md object-cover" />
              <span className="font-bold text-slate-200">Tiketa</span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                Proof on bot mainnet
              </span>
              <span>Chain id: <strong className="text-slate-100 font-mono">677</strong></span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-400">Contract:</span>
              <a
                href={`https://scan.botchain.ai/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 underline underline-offset-2 flex items-center gap-1"
              >
                <span>{contractAddress}</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://www.botchain.ai/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-brand-400 transition flex items-center gap-1 font-medium"
            >
              <span>BOT Chain Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://scan.botchain.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-brand-400 transition flex items-center gap-1 font-medium"
            >
              <span>BOTScan explorer</span>
              <ExternalLink className="w-3 h-3" />
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
