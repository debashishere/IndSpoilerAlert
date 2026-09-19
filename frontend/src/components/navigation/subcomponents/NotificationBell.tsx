import React from 'react';

export interface NotificationBellProps {
  hasUnread?: boolean;
  unreadCount?: number;
  isOpen?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  hasUnread = true,
  unreadCount = 4,
  isOpen = false,
  onClick,
  compact = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
      title="Notifications"
      className={`${
        compact ? 'w-8 h-8' : 'w-10 h-10'
      } rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 shadow-sm relative ${
        isOpen ? 'ring-2 ring-blue-500/30 border-blue-500' : ''
      }`}
    >
      <span className="material-symbols-outlined text-xl leading-none" aria-hidden="true">
        notifications
      </span>
      {/* Embedded SVG Fallback for environments without Google Fonts */}
      <svg 
        className="w-5 h-5 hidden" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {hasUnread && (
        <span 
          className={`absolute ${
            compact ? 'top-1.5 right-1.5 w-2 h-2' : 'top-2 right-2 w-2 h-2'
          } bg-blue-600 rounded-full border-2 border-white`}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
