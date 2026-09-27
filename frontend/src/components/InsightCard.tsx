import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

export interface InsightCardProps {
  title: string;
  value: React.ReactNode;
  subtext: string;
  tooltipText: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
  iconTextClass?: string;
  valueClass?: string;
  subtextClass?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  value,
  subtext,
  valueClass = "text-slate-900 dark:text-slate-100",
  subtextClass = "text-slate-500 dark:text-slate-400",
  tooltipText,
  isExpanded,
  onToggle
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isControlled = isExpanded !== undefined;
  const isOpen = isControlled ? isExpanded : internalOpen;

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  const handleClose = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, isControlled, onToggle]);

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between relative"
    >
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <button
            type="button"
            aria-label={`More information about ${title}`}
            onClick={handleToggle}
            className="text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-[20px] font-bold font-mono leading-none ${valueClass}`}>
            {value}
          </span>
          <span className={`text-[11px] font-semibold ${subtextClass}`}>
            {subtext}
          </span>
        </div>
      </div>

      {isOpen && (
        <div 
          data-testid="info-overlay"
          className="absolute z-10 top-full left-0 mt-2 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg text-xs text-slate-600 dark:text-slate-300"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-slate-900 dark:text-slate-100">{title} Info</span>
            <button aria-label="Close modal" onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
          </div>
          {tooltipText}
        </div>
      )}
    </div>
  );
};
