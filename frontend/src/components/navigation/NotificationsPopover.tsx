import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { setActiveTab } from '../../store/slices/coreSlice';

export interface NotificationItem {
  id: string;
  title: string;
  summary: string;
  timeAgo: string;
  icon: string;
  unread: boolean;
  type: 'bid' | 'workflow' | 'compliance' | 'system';
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Bid on Lot #LOT-2026-99',
    summary: 'Buyer Apex Liquidation submitted $14.50/cs for 500 cases.',
    timeAgo: '5m ago',
    icon: 'storefront',
    unread: true,
    type: 'bid',
  },
  {
    id: 'notif-2',
    title: 'Campaign Auto-Escalation Completed',
    summary: 'Stage 1 expired; cascaded 120 cases to Secondary Liquidators.',
    timeAgo: '22m ago',
    icon: 'account_tree',
    unread: true,
    type: 'workflow',
  },
  {
    id: 'notif-3',
    title: 'FDA Compliance Verified',
    summary: 'COA & lot traceability cleared for Danone Lot #904.',
    timeAgo: '1h ago',
    icon: 'verified',
    unread: true,
    type: 'compliance',
  },
  {
    id: 'notif-4',
    title: 'Newark Node Synchronized',
    summary: 'Clearinghouse settlement engine latency: 42ms.',
    timeAgo: '2h ago',
    icon: 'hub',
    unread: true,
    type: 'system',
  },
];

export interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAll?: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onViewAll,
}) => {
  const dispatch = useAppDispatch();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleViewAll = () => {
    dispatch(setActiveTab('inbox'));
    onClose();
    onViewAll?.();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Quick Notifications"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-slate-800 dark:text-slate-200 transition-all duration-150 animate-in fade-in slide-in-from-top-1"
    >
      {/* Header */}
      <div className="p-3.5 px-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white text-sm">Notifications</span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {unreadCount} Unread
          </span>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 ${
              item.unread ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-base leading-none" aria-hidden="true">
                {item.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                  {item.timeAgo}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                {item.summary}
              </p>
            </div>
            {item.unread && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
            )}
          </div>
        ))}
      </div>

      {/* Footer Action */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleViewAll}
          className="w-full py-2 px-3 bg-[#0d47a1] hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <span>View All in Inbox</span>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
};
