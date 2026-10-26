import React, { useState } from 'react';
import { Shield, PlusCircle, ArrowDownToLine, ToggleLeft, ToggleRight } from 'lucide-react';
import { TierData } from '../types';

interface OrganizerPageProps {
  isOwner: boolean;
  contractOwner: string | null;
  account: string | null;
  contractBalance: string;
  tiers: TierData[];
  onCreateTier: (id: number, name: string, maxSupply: number, priceBOT: string) => Promise<any>;
  onSetPrice: (id: number, newPriceBOT: string) => Promise<any>;
  onSetActive: (id: number, active: boolean) => Promise<any>;
  onWithdraw: () => Promise<any>;
}

export const OrganizerPage: React.FC<OrganizerPageProps> = ({
  isOwner,
  contractOwner,
  account,
  contractBalance,
  tiers,
  onCreateTier,
  onSetPrice,
  onSetActive,
  onWithdraw,
}) => {
  // Create tier state
  const [newId, setNewId] = useState<number>(3);
  const [newName, setNewName] = useState<string>('');
  const [newMaxSupply, setNewMaxSupply] = useState<number>(100);
  const [newPrice, setNewPrice] = useState<string>('0.01');
  const [isCreating, setIsCreating] = useState(false);

  // Edit price state
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});
  const [isUpdatingPrice, setIsUpdatingPrice] = useState<number | null>(null);

  // Action states
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Auto-suggest next ID based on existing tiers
  React.useEffect(() => {
    if (tiers.length > 0) {
      const highestId = Math.max(...tiers.map((t) => t.id));
      setNewId(highestId + 1);
    }
  }, [tiers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Please enter a tier name');
      return;
    }
    if (newId <= 0) {
      alert('Tier ID must be positive integer');
      return;
    }
    if (newMaxSupply <= 0) {
      alert('Max supply must be greater than 0');
      return;
    }
    if (parseFloat(newPrice) < 0) {
      alert('Price cannot be negative');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateTier(newId, newName.trim(), newMaxSupply, newPrice);
      setNewName('');
      setNewId((prev) => prev + 1);
    } catch (err) {
      // Handled by TxModal
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePrice = async (id: number) => {
    const priceVal = priceInputs[id];
    if (!priceVal || parseFloat(priceVal) < 0) {
      alert('Please enter a valid price in BOT');
      return;
    }

    setIsUpdatingPrice(id);
    try {
      await onSetPrice(id, priceVal);
      setPriceInputs((prev) => ({ ...prev, [id]: '' }));
    } catch (err) {
      // Handled by TxModal
    } finally {
      setIsUpdatingPrice(null);
    }
  };

  const handleWithdraw = async () => {
    if (parseFloat(contractBalance) <= 0) {
      alert('No proceeds available to withdraw.');
      return;
    }

    setIsWithdrawing(true);
    try {
      await onWithdraw();
    } catch (err) {
      // Handled by TxModal
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 text-rose-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Organizer Access Only</h2>
        <p className="text-slate-400 text-sm mb-4">
          This dashboard is reserved for the contract owner.
        </p>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono break-all">
          <span className="text-slate-500 block mb-1">Contract Owner:</span>
          {contractOwner || 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6">
      {/* Organizer Header & Treasury Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Organizer Dashboard</span>
            </span>
            {account && (
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Event Administration</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage ticket tiers, update prices, toggle sales availability, and withdraw ticket revenues.
          </p>
        </div>

        {/* Treasury Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-brand-500/30 flex items-center justify-between gap-6 bg-slate-900/90">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Accumulated Proceeds</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {parseFloat(contractBalance).toFixed(4)}
              </span>
              <span className="text-sm font-bold text-brand-400">BOT</span>
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || parseFloat(contractBalance) <= 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-40"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{isWithdrawing ? 'Withdrawing...' : 'Withdraw BOT'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Create Tier + Manage Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create Tier Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white">Create New Tier</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Deploy a new ticket token ID with custom supply cap and pricing in BOT.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tier ID (Token ID)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newId}
                  onChange={(e) => setNewId(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tier Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP Backstage Pass"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Supply (Ticket Cap)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newMaxSupply}
                  onChange={(e) => setNewMaxSupply(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Price per Ticket (in BOT)
                </label>
                <input
                  type="text"
                  placeholder="0.01"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition disabled:opacity-50 mt-4"
              >
                {isCreating ? 'Creating Tier...' : 'Create Ticket Tier'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Manage Existing Tiers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Manage Existing Tiers</h2>
            <span className="text-xs text-slate-400 font-mono">{tiers.length} total tiers</span>
          </div>

          {tiers.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-sm">
              No tiers created yet. Use the form on the left to add your first tier.
            </div>
          ) : (
            <div className="space-y-4">
              {tiers.map((tier) => {
                const maxNum = Number(tier.maxSupply);
                const currentNum = Number(tier.currentSupply);
                const remainingNum = Number(tier.remainingSupply);
                const currentInputPrice = priceInputs[tier.id] ?? '';

                return (
                  <div
                    key={tier.id}
                    className="glass-panel rounded-2xl p-5 border-slate-800 space-y-4 hover:border-slate-700 transition"
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-brand-300 bg-brand-500/10 px-2 py-1 rounded-md border border-brand-500/20">
                          ID #{tier.id}
                        </span>
                        <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                      </div>

                      {/* Active Status toggle */}
                      <button
                        onClick={() => onSetActive(tier.id, !tier.active)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          tier.active
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                        }`}
                        title="Click to toggle tier active status"
                      >
                        {tier.active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-rose-400" />}
                        <span>{tier.active ? 'Active (Selling)' : 'Paused (Locked)'}</span>
                      </button>
                    </div>

                    {/* Stats & Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Minted / Cap</span>
                        <span className="font-mono font-semibold text-slate-200">
                          {currentNum} / {maxNum} ({remainingNum} remaining)
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Current Price</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {tier.priceFormatted} BOT
                        </span>
                      </div>

                      {/* Edit Price Form */}
                      <div>
                        <span className="text-slate-400 block mb-1">Update Price (BOT)</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="New BOT"
                            value={currentInputPrice}
                            onChange={(e) =>
                              setPriceInputs((prev) => ({
                                ...prev,
                                [tier.id]: e.target.value,
                              }))
                            }
                            className="w-24 bg-slate-950 border border-slate-700 px-2 py-1 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-brand-500"
                          />
                          <button
                            onClick={() => handleUpdatePrice(tier.id)}
                            disabled={!currentInputPrice || isUpdatingPrice === tier.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition disabled:opacity-40"
                          >
                            {isUpdatingPrice === tier.id ? '...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
