import React from 'react';

export interface ProfilePillProps {
  initials?: string;
  name?: string;
  roleLabel?: string;
  isVerified?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const ProfilePill: React.FC<ProfilePillProps> = ({
  initials = 'DH',
  name = 'Debashishere007',
  roleLabel = 'Verified Agent',
  isVerified = true,
  isOpen = false,
  onClick,
  compact = false,
}) => {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`User profile: ${name}`}
        className="w-8 h-8 rounded-full bg-[#0d47a1] text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
      >
        {initials}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-label={`User profile: ${name} (${roleLabel})`}
      className={`flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-full border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/70 transition-all duration-150 cursor-pointer ${
        isOpen ? 'ring-2 ring-blue-500/30 border-blue-500 bg-slate-100' : ''
      }`}
    >
      {/* Avatar circle */}
      <div className="w-8 h-8 rounded-full bg-[#0d47a1] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
        {initials}
      </div>

      {/* User info */}
      <div className="hidden sm:flex flex-col pr-2 text-left">
        <span className="text-xs font-bold text-slate-800 leading-tight">
          {name}
        </span>
        <span className="text-[10px] font-medium text-emerald-600 leading-none flex items-center gap-1 mt-0.5">
          {isVerified && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
          {roleLabel}
        </span>
      </div>

      {/* Expand chevron */}
      <span 
        className={`material-symbols-outlined text-slate-400 text-base pr-1 transition-transform duration-150 ${
          isOpen ? 'rotate-180 text-slate-600' : ''
        }`} 
        aria-hidden="true"
      >
        expand_more
      </span>
    </button>
  );
};
