import React from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { TxState } from '../types';
import { getExplorerTxUrl } from '../utils/format';

interface TxModalProps {
  txState: TxState;
  onClose: () => void;
}

export const TxModal: React.FC<TxModalProps> = ({ txState, onClose }) => {
  if (txState.status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700/80 bg-slate-900/95 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center pt-2 pb-4">
          {txState.status === 'pending' && (
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4 text-brand-400">
              <Loader2 className="w-9 h-9 animate-spin" />
            </div>
          )}

          {txState.status === 'success' && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          )}

          {txState.status === 'error' && (
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 text-rose-400">
              <AlertCircle className="w-9 h-9" />
            </div>
          )}

          <h3 className="text-xl font-bold tracking-tight mb-2">
            {txState.status === 'pending' && (txState.action || 'Transaction Processing')}
            {txState.status === 'success' && 'Transaction Confirmed!'}
            {txState.status === 'error' && 'Transaction Failed'}
          </h3>

          <p className="text-sm text-slate-300 max-w-xs break-words mb-4">
            {txState.status === 'pending' && (txState.message || 'Please confirm the transaction in your wallet and wait for Botchain confirmation.')}
            {txState.status === 'success' && (txState.message || 'Your on-chain action completed successfully.')}
            {txState.status === 'error' && (txState.message || 'Something went wrong. Please check your balance and try again.')}
          </p>

          {txState.hash && (
            <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-mono">
                {txState.hash.substring(0, 10)}...{txState.hash.substring(txState.hash.length - 8)}
              </span>
              <a
                href={getExplorerTxUrl(txState.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium transition"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition bg-slate-800 hover:bg-slate-700 text-slate-200 mt-2"
          >
            {txState.status === 'pending' ? 'Dismiss Window' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
