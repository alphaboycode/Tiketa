import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ContractBanner } from './components/ContractBanner';
import { TxModal } from './components/TxModal';
import { ExplorePage } from './pages/ExplorePage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { OrganizerPage } from './pages/OrganizerPage';
import { useTiketa } from './hooks/useTiketa';
import { Footer } from './components/Footer';
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
      <Footer contractAddress={contractAddress} />

      {/* Transaction Modal */}
      <TxModal txState={txState} onClose={clearTxState} />
    </div>
  );
};

export default App;
