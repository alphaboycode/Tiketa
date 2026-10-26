import React, { useState } from 'react';
import { Ticket, Send, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserTicket } from '../types';

interface MyTicketsPageProps {
  tickets: UserTicket[];
  account: string | null;
  onConnect: () => void;
  onExplore: () => void;
  onTransfer: (to: string, tierId: number, amount: number) => Promise<any>;
}

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({
  tickets,
  account,
  onConnect,
  onExplore,
  onTransfer,
}) => {
  const [transferModalTier, setTransferModalTier] = useState<UserTicket | null>(null);
  const [recipient, setRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenTransfer = (ticket: UserTicket) => {
    setTransferModalTier(ticket);
    setRecipient('');
    setTransferAmount(1);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalTier) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      alert('Please enter a valid recipient address (0x...)');
      return;
    }
    if (transferAmount <= 0 || transferAmount > Number(transferModalTier.quantity)) {
      alert(`Transfer quantity must be between 1 and ${transferModalTier.quantity}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onTransfer(recipient, transferModalTier.tierId, transferAmount);
      setTransferModalTier(null);
    } catch (err) {
      // Handled by TxModal
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-6 text-brand-400">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
        <p className="text-slate-400 text-sm mb-6">
          Connect your Web3 wallet to inspect your on-chain ticket balances and manage ticket transfers.
        </p>
        <button
          onClick={onConnect}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Tickets</h1>
          <p className="text-slate-400 text-sm mt-1">
            Verified on-chain ERC-1155 tickets held in <span className="font-mono text-slate-200">{account}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            {tickets.reduce((acc, t) => acc + Number(t.quantity), 0)} Total Tickets Owned
          </span>
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 text-brand-400">
            <Ticket className="w-8 h-8 rotate-12" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Tickets in this Wallet</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
            You don't own any event tickets yet. Explore the available tiers to mint tickets on Botchain.
          </p>
          <button
            onClick={onExplore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition"
          >
            <span>Explore Event Tiers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((t) => (
            <div
              key={t.tierId}
              className="glass-panel rounded-3xl p-6 flex flex-col justify-between border-slate-800 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                    Token ID #{t.tierId}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{t.name}</h3>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-6 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Quantity Owned:</span>
                    <span className="text-lg font-bold text-brand-300 font-mono">
                      {t.quantity.toString()} ticket{Number(t.quantity) > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Mint Price:</span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {t.priceFormatted} BOT
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenTransfer(t)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-brand-400" />
                  <span>Transfer / Resale</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Transfer Tickets</h3>
            <p className="text-xs text-slate-400 mb-6">
              Transfer standard ERC-1155 tickets of tier <span className="text-brand-300 font-semibold">{transferModalTier.name}</span> to another Botchain address.
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Recipient Address (0x...)
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.trim())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>Quantity to Send</span>
                  <span className="text-slate-400 font-mono">Max: {transferModalTier.quantity.toString()}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={Number(transferModalTier.quantity)}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setTransferModalTier(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
