import React, { useState } from 'react';
import { ExternalLink, Edit2, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { getExplorerAddressUrl, formatAddress } from '../utils/format';
import { TIKETA_ADDRESS } from '../contracts';

interface ContractBannerProps {
  contractAddress: string;
  onUpdateAddress: (addr: string) => void;
}

export const ContractBanner: React.FC<ContractBannerProps> = ({
  contractAddress,
  onUpdateAddress,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputAddr, setInputAddr] = useState(contractAddress);

  const isConfigured =
    Boolean(contractAddress) &&
    contractAddress !== '0x0000000000000000000000000000000000000000' &&
    /^0x[a-fA-F0-9]{40}$/.test(contractAddress);

  const handleSave = () => {
    if (/^0x[a-fA-F0-9]{40}$/.test(inputAddr)) {
      onUpdateAddress(inputAddr);
      setIsEditing(false);
    } else {
      alert('Please enter a valid Ethereum / Botchain contract address (0x...)');
    }
  };

  const handleReset = () => {
    setInputAddr(TIKETA_ADDRESS);
    onUpdateAddress(TIKETA_ADDRESS);
    setIsEditing(false);
  };

  return (
    <div className="w-full bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-semibold text-slate-300">Tiketa Contract:</span>

          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputAddr}
                onChange={(e) => setInputAddr(e.target.value.trim())}
                placeholder="0x..."
                className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-slate-100 font-mono text-xs w-64 sm:w-80 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleSave}
                className="p-1 rounded bg-brand-600 hover:bg-brand-500 text-white transition"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleReset}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Reset to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-200">
                {isConfigured ? formatAddress(contractAddress, 6) : 'Not deployed / Not configured'}
              </span>

              {isConfigured && (
                <a
                  href={getExplorerAddressUrl(contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand-400 hover:text-brand-300 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <button
                onClick={() => {
                  setInputAddr(contractAddress);
                  setIsEditing(true);
                }}
                className="text-slate-500 hover:text-slate-300 p-0.5"
                title="Change contract address"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {!isConfigured && (
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Deploy contract with Foundry or paste address above</span>
          </div>
        )}
      </div>
    </div>
  );
};
