import React, { useState } from 'react';
import { Ticket, Sparkles, Check, ShoppingBag, Plus, Minus, Layers } from 'lucide-react';
import { TierData } from '../types';

interface ExplorePageProps {
  tiers: TierData[];
  isLoading: boolean;
  account: string | null;
  isBotchain: boolean;
  onBuy: (tierId: number, amount: number, totalCostWei: bigint) => Promise<any>;
  onConnect: () => void;
  onSwitchNetwork: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  tiers,
  isLoading,
  account,
  isBotchain,
  onBuy,
  onConnect,
  onSwitchNetwork,
}) => {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const getQuantity = (id: number) => quantities[id] || 1;

  const setQuantity = (id: number, val: number, max: number) => {
    const clamped = Math.max(1, Math.min(val, max));
    setQuantities((prev) => ({ ...prev, [id]: clamped }));
  };

  const handleBuy = async (tier: TierData) => {
    if (!account) {
      onConnect();
      return;
    }
    if (!isBotchain) {
      onSwitchNetwork();
      return;
    }

    const qty = getQuantity(tier.id);
    const totalCostWei = tier.price * BigInt(qty);

    setBuyingId(tier.id);
    try {
      await onBuy(tier.id, qty, totalCostWei);
    } catch (e) {
      // Handled by txState modal
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>On-Chain Ticketing Protocol</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Verifiable Event Tickets on <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">Botchain</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-6 leading-relaxed">
            Mint real ERC-1155 tickets directly to your wallet. Every tier is supply-capped, fully on-chain, and freely transferable.
          </p>
          <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Exact Payment Guaranteed</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Capped Supply Enforcement</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Transfer & Resale OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Available Ticket Tiers</h2>
            <p className="text-sm text-slate-400 mt-1">Select your tier, choose quantity, and mint directly on Botchain.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>{tiers.length} Tier{tiers.length === 1 ? '' : 's'} Active</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((n) => (
              <div key={n} className="glass-panel rounded-2xl p-6 h-72 animate-pulse flex flex-col justify-between">
                <div className="h-6 w-2/3 bg-slate-800 rounded mb-4" />
                <div className="h-4 w-1/2 bg-slate-800 rounded mb-4" />
                <div className="h-10 w-full bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : tiers.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Ticket className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Ticket Tiers Found</h3>
            <p className="text-sm text-slate-400 mb-6">
              Ensure the Tiketa smart contract is deployed on Botchain testnet and default tiers are initialized.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const maxNum = Number(tier.maxSupply);
              const remainingNum = Number(tier.remainingSupply);
              const soldNum = maxNum - remainingNum;
              const percentSold = maxNum > 0 ? Math.round((soldNum / maxNum) * 100) : 0;
              const isSoldOut = remainingNum <= 0;
              const qty = getQuantity(tier.id);
              const totalCost = (parseFloat(tier.priceFormatted) * qty).toFixed(4);

              return (
                <div
                  key={tier.id}
                  className={`glass-panel rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 ${
                    !tier.active
                      ? 'opacity-70 border-slate-800'
                      : isSoldOut
                      ? 'border-slate-800'
                      : 'glass-panel-hover border-slate-700/60'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                          Tier #{tier.id}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-2 group-hover:text-brand-300 transition">
                          {tier.name}
                        </h3>
                      </div>

                      <div>
                        {!tier.active ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Paused
                          </span>
                        ) : isSoldOut ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Sold Out
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-xs text-slate-400 block mb-1">Price per Ticket</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-white tracking-tight">
                          {tier.priceFormatted}
                        </span>
                        <span className="text-sm font-bold text-brand-400">BOT</span>
                      </div>
                    </div>

                    {/* Supply Progress */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Availability</span>
                        <span className="font-semibold text-slate-200">
                          {remainingNum} / {maxNum} remaining
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Purchase Controls */}
                  <div className="space-y-4 pt-4 border-t border-slate-800/60">
                    {tier.active && !isSoldOut ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300">Quantity</span>
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                            <button
                              onClick={() => setQuantity(tier.id, qty - 1, remainingNum)}
                              disabled={qty <= 1}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 flex items-center justify-center text-slate-200 transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-white font-mono">
                              {qty}
                            </span>
                            <button
                              onClick={() => setQuantity(tier.id, qty + 1, remainingNum)}
                              disabled={qty >= remainingNum}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 flex items-center justify-center text-slate-200 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Total Amount:</span>
                          <span className="font-semibold text-slate-200 font-mono">
                            {totalCost} BOT
                          </span>
                        </div>

                        <button
                          onClick={() => handleBuy(tier)}
                          disabled={buyingId === tier.id}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>{buyingId === tier.id ? 'Purchasing...' : `Buy ${qty} Ticket${qty > 1 ? 's' : ''}`}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl bg-slate-800/60 text-slate-500 font-semibold text-sm cursor-not-allowed border border-slate-800"
                      >
                        {!tier.active ? 'Sales Paused' : 'Sold Out'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
