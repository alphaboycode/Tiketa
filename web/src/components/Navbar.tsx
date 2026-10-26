import React from 'react';
import { Ticket, Shield, Wallet, AlertTriangle } from 'lucide-react';
import { formatAddress } from '../utils/format';

interface NavbarProps {
  currentTab: 'explore' | 'mytickets' | 'organizer';
  setCurrentTab: (tab: 'explore' | 'mytickets' | 'organizer') => void;
  account: string | null;
  chainId: number | null;
  isBotchain: boolean;
  balance: string;
  isOwner: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  account,
  isBotchain,
  balance,
  isOwner,
  isConnecting,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => setCurrentTab('explore')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Ticket className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                Tiketa
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full">
                Botchain
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setCurrentTab('explore')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                currentTab === 'explore'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Event Tiers
            </button>
            <button
              onClick={() => setCurrentTab('mytickets')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                currentTab === 'mytickets'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              My Tickets
            </button>
            {isOwner && (
              <button
                onClick={() => setCurrentTab('organizer')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                  currentTab === 'organizer'
                    ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40'
                    : 'text-brand-400/80 hover:text-brand-300 hover:bg-brand-500/10'
                }`}
              >
                <Shield className="w-4 h-4 text-brand-400" />
                <span>Organizer</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Actions: Network & Wallet */}
        <div className="flex items-center gap-3">
          {/* Network Indicator */}
          {account && (
            <div>
              {isBotchain ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Botchain (968)</span>
                </div>
              ) : (
                <button
                  onClick={onSwitchNetwork}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition animate-bounce"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Switch to Botchain</span>
                </button>
              )}
            </div>
          )}

          {/* Connect / User Info */}
          {account ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 pl-3">
              <div className="hidden lg:flex flex-col text-right mr-1">
                <span className="text-xs font-semibold text-slate-200">
                  {parseFloat(balance).toFixed(4)} BOT
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatAddress(account)}
                </span>
              </div>
              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                title="Disconnect wallet"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="md:hidden flex border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setCurrentTab('explore')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            currentTab === 'explore' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          Event Tiers
        </button>
        <button
          onClick={() => setCurrentTab('mytickets')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            currentTab === 'mytickets' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          My Tickets
        </button>
        {isOwner && (
          <button
            onClick={() => setCurrentTab('organizer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              currentTab === 'organizer' ? 'bg-brand-600/30 text-brand-300' : 'text-brand-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Organizer</span>
          </button>
        )}
      </div>
    </header>
  );
};
