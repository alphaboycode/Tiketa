import React from 'react';
import { ExternalLink, Globe, Search } from 'lucide-react';
import botchainLogo from '../assets/botchainlogo.svg';

interface FooterProps {
  contractAddress: string;
}

export const Footer: React.FC<FooterProps> = ({ contractAddress }) => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 py-10 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Tiketa Protocol Top Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
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
                <span className="truncate max-w-[180px] sm:max-w-none">{contractAddress}</span>
                <ExternalLink className="w-3 h-3 inline flex-shrink-0" />
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

        {/* Subtle Divider */}
        <div className="border-t border-slate-900" />

        {/* PART OF THE ECOSYSTEM Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto pt-2 pb-2">
          {/* Header */}
          <div className="text-brand-400 font-semibold text-xs tracking-[0.25em] uppercase font-mono">
            PART OF THE ECOSYSTEM
          </div>

          {/* Circular Logo Badge */}
          <div className="relative flex items-center justify-center p-2">
            <div className="w-24 h-24 rounded-full bg-slate-900/90 border border-brand-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)] ring-4 ring-brand-500/10 transition-transform duration-300 hover:scale-105">
              <img
                src={botchainLogo}
                alt="BOT Chain Logo"
                className="w-12 h-12 object-contain select-none"
              />
            </div>
          </div>

          {/* BOT Chain Name */}
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="text-brand-400">BOT</span>{' '}
            <span className="text-white">Chain</span>
          </div>

          {/* Slogan */}
          <p className="text-slate-300 text-xs sm:text-sm tracking-wide">
            Tipped, thanked, on chain
          </p>

          {/* Diamond Separator */}
          <div className="flex items-center justify-center gap-3 w-40 mx-auto py-1">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-brand-500/50" />
            <div className="w-1.5 h-1.5 rotate-45 bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-brand-500/50" />
          </div>

          {/* Links: botchain.ai & Explorer (no GitHub) */}
          <div className="flex items-center justify-center gap-8 text-xs sm:text-sm text-slate-300">
            <a
              href="https://www.botchain.ai/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition group font-medium"
            >
              <Globe className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition" />
              <span>botchain.ai</span>
            </a>
            <a
              href="https://scan.botchain.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition group font-medium"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition" />
              <span>Explorer</span>
            </a>
          </div>

          {/* Footer Copyright Line */}
          <div className="pt-2 text-[11px] sm:text-xs text-slate-400 font-sans tracking-wide">
            © 2026 <strong className="text-white font-semibold">BOT Chain</strong> · Mainnet · Chain ID <strong className="text-white font-semibold">677</strong>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
