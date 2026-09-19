import React from 'react';
import { BRAND_CONFIG } from '../constants/navigationConstants';

export interface BrandEmblemProps {
  onClick?: () => void;
  compact?: boolean;
}

export const BrandEmblem: React.FC<BrandEmblemProps> = ({ onClick, compact = false }) => {
  return (
    <div 
      className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3.5'} cursor-pointer select-none`}
      onClick={onClick}
      role="banner"
    >
      {/* Official Lightning Emblem Logo */}
      <div className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-lg'} overflow-hidden bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center shadow-sm flex-shrink-0`}>
        <svg 
          className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-white`} 
          viewBox="0 0 24 24" 
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <span className={`${compact ? 'text-sm' : 'text-lg md:text-xl'} font-bold tracking-tight text-slate-950 leading-tight`}>
          {BRAND_CONFIG.name}
        </span>
        <span className={`${compact ? 'text-[9px]' : 'text-[10px] md:text-[11px]'} font-bold tracking-[0.14em] text-slate-400 uppercase leading-none mt-0.5`}>
          {compact ? BRAND_CONFIG.version : BRAND_CONFIG.subtitle}
        </span>
      </div>
    </div>
  );
};
