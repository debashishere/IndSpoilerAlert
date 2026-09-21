import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Inbox,
  Send,
  Eye,
  Clock,
  Search,
  RefreshCw,
  Tag,
  Building2,
  MessageSquare,
  X,
  CheckCircle2,
  Activity,
  Filter,
  AlertCircle,
  UserCheck,
  MoreVertical
} from 'lucide-react';

export interface EmailMessage {
  messageId: string;
  senderType: 'supplier' | 'buyer' | 'system';
  senderEmail: string;
  body: string;
  sentAt: string;
  messageIdHeader?: string;
}

export interface EmailThread {
  threadId: string;
  supplierId: string;
  buyerEmail: string;
  listingId?: string;
  campaignId?: string;
  subject: string;
  status: 'active' | 'closed' | 'awarded';
  openCount: number;
  firstOpenedAt?: string;
  lastOpenedAt?: string;
  messages: EmailMessage[];
  updatedAt: string;
  createdAt: string;
}

export interface EmailCommunicationsViewProps {
  supplierId?: string;
  embedded?: boolean;
  accountName?: string;
  emailAddress?: string;
  onThreadsLoaded?: (threads: EmailThread[]) => void;
}

// --- Send Direct Email Modal ---
export const SendEmailModal: React.FC<{
  supplierId: string;
  accountName?: string;
  emailAddress?: string;
  onClose: () => void;
  onSent?: (threadId?: string) => void;
}> = ({ supplierId, accountName = 'IndSpoiler Alert Platform', emailAddress = 'noreply@spoileralert.com', onClose, onSent }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string; previewUrl?: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) return;

    setSending(true);
    setStatus(null);

    try {
      const res = await fetch('/api/settings/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
          supplierId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({
          success: true,
          message: data.message || 'Email sent successfully!',
          previewUrl: data.previewUrl
        });
        setTo('');
        setSubject('');
        setBody('');
        if (onSent) onSent(data.threadId);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setStatus({
          success: false,
          message: data.error || 'Failed to send email.'
        });
      }
    } catch (err: any) {
      setStatus({
        success: false,
        message: err.message || 'Network error while sending email.'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" data-testid="send-email-modal">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-[20px]">send</span>
            <Send className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Send Direct Email
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send an email message directly to a buyer or liquidation partner
            </p>
          </div>
        </div>

        {status && (
          <div
            className={`mb-5 p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              status.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {status.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{status.message}</span>
            </div>
            {status.previewUrl && (
              <a
                href={status.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:underline"
              >
                Preview
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              From (Account Name &amp; Email)
            </label>
            <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{accountName}</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">{emailAddress}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="modal-send-to" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              To (Recipient Email) <span className="text-rose-500">*</span>
            </label>
            <input
              id="modal-send-to"
              type="email"
              required
              placeholder="buyer@retailchain.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="modal-send-subject" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Subject Line <span className="text-rose-500">*</span>
            </label>
            <input
              id="modal-send-subject"
              type="text"
              required
              placeholder="Enter email subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="modal-send-body" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Message Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="modal-send-body"
              rows={4}
              required
              placeholder="Type your plain text message body here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Email</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- View Telemetry Modal ---
export const TelemetryModal: React.FC<{
  thread: EmailThread;
  onClose: () => void;
}> = ({ thread, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" data-testid="telemetry-modal">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 md:p-7 shadow-2xl relative text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200 space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-[20px]">activity_zone</span>
            <Activity className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Email Telemetry &amp; Open Audit
            </h3>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Thread #{thread.threadId}
            </p>
          </div>
        </div>

        {/* Telemetry Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Total Opens
            </span>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 leading-none">
              {thread.openCount}
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Tracking Status
            </span>
            <p className="text-xs font-semibold flex items-center gap-1.5 mt-2 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Pixel 1x1</span>
            </p>
          </div>
        </div>

        {/* Timestamps & Identity Details */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Recipient Email</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{thread.buyerEmail}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Subject Line</span>
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[280px]">{thread.subject}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
            <span className="font-semibold text-slate-500 dark:text-slate-400">First Opened At</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {thread.firstOpenedAt ? new Date(thread.firstOpenedAt).toLocaleString() : 'Not opened yet'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Last Opened At</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {thread.lastOpenedAt ? new Date(thread.lastOpenedAt).toLocaleString() : 'Not opened yet'}
            </span>
          </div>
        </div>

        {/* Outbound Messages Summary */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Messages Dispatched ({thread.messages?.length || 0})</span>
          </h4>
          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1.5">
            {thread.messages?.map((m, i) => (
              <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs flex items-center justify-between">
                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                  {m.senderType} ({m.senderEmail})
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main View ---
export const EmailCommunicationsView: React.FC<EmailCommunicationsViewProps> = ({
  supplierId = 'default',
  embedded = false,
  accountName: initialAccountName = 'IndSpoiler Alert Platform',
  emailAddress: initialEmailAddress = 'noreply@spoileralert.com',
  onThreadsLoaded
}) => {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [currentThread, setCurrentThread] = useState<EmailThread | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'active' | 'closed' | 'awarded'>('all');
  const [loading, setLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyStatus, setReplyStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [activeMenuThreadId, setActiveMenuThreadId] = useState<string | null>(null);
  const [telemetryModalThread, setTelemetryModalThread] = useState<EmailThread | null>(null);
  const [accountName, setAccountName] = useState<string>(initialAccountName);
  const [emailAddress, setEmailAddress] = useState<string>(initialEmailAddress);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAccountDetails();
    fetchThreads();
  }, [supplierId]);

  const fetchAccountDetails = async () => {
    try {
      const res = await fetch(`/api/settings/smtp?supplierId=${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (data.senderName) setAccountName(data.senderName);
          if (data.senderEmail || data.user) setEmailAddress(data.senderEmail || data.user);
        }
      }
    } catch (err) {
      console.error('Failed to fetch account details:', err);
    }
  };

  useEffect(() => {
    if (selectedThreadId) {
      fetchThreadDetail(selectedThreadId);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages?.length]);

  const fetchThreads = async (selectThreadId?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/email-threads?supplierId=${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        const threadList = Array.isArray(data) ? data : [];
        setThreads(threadList);
        if (onThreadsLoaded) {
          onThreadsLoaded(threadList);
        }
        if (selectThreadId) {
          setSelectedThreadId(selectThreadId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch email threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/email-threads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentThread(data);
      }
    } catch (err) {
      console.error('Failed to fetch thread detail:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyBody.trim()) return;

    setSendingReply(true);
    setReplyStatus(null);
    try {
      const res = await fetch(`/api/email-threads/${selectedThreadId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, message: replyBody })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyBody('');
        setReplyStatus({ type: 'success', text: 'Reply dispatched securely.' });
        fetchThreadDetail(selectedThreadId);
        fetchThreads();
        setTimeout(() => setReplyStatus(null), 3000);
      } else {
        setReplyStatus({ type: 'error', text: data.error || 'Failed to send reply.' });
      }
    } catch (err: any) {
      setReplyStatus({ type: 'error', text: err.message || 'Network error sending reply.' });
    } finally {
      setSendingReply(false);
    }
  };

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.listingId && t.listingId.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'sent') {
      matchesStatus =
        t.messages?.some(
          (m) =>
            m.senderType === 'supplier' ||
            m.senderType === 'system' ||
            (emailAddress && m.senderEmail?.toLowerCase() === emailAddress.toLowerCase())
        ) ?? (t.messages && t.messages.length > 0);
    } else if (statusFilter !== 'all') {
      matchesStatus = t.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400';
      case 'awarded':
        return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
      case 'closed':
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
      default:
        return 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div className={embedded ? "w-full font-sans text-slate-900 dark:text-slate-100 flex flex-col gap-3" : "w-full p-4 md:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100 flex flex-col gap-4"}>
      {/* Telemetry Detail Modal */}
      {telemetryModalThread && (
        <TelemetryModal
          thread={telemetryModalThread}
          onClose={() => setTelemetryModalThread(null)}
        />
      )}

      {/* Send Email Modal */}
      {showSendEmailModal && (
        <SendEmailModal
          supplierId={supplierId}
          accountName={accountName}
          emailAddress={emailAddress}
          onClose={() => setShowSendEmailModal(false)}
          onSent={fetchThreads}
        />
      )}

      {/* Workbench Section Header (Matching Ingestion / Insight design standard) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-[20px]">inbox</span>
            <Inbox className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0 leading-snug">
              Inbox Workspace
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
              Buyer negotiation threads with real-time open telemetry &amp; direct email dispatch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Current Mailbox & Account Badge */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300" data-testid="inbox-account-name">
                {accountName}
              </span>
              <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
              <span className="font-mono text-blue-600 dark:text-blue-400" data-testid="inbox-email-address">
                {emailAddress}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSendEmailModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Email</span>
          </button>

          <button
            type="button"
            onClick={() => fetchThreads()}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2-Pane Operational Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* Left Thread List Pane (lg:col-span-4 & bg-card for strict test and styling adherence) */}
        <div className="lg:col-span-4 bg-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-2xs h-[calc(100vh-320px)] min-h-[560px]">
          {/* Active Mailbox Banner */}
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Active Mailbox
            </span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={emailAddress}>
              {emailAddress}
            </span>
          </div>

          {/* Search + Filter Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search buyer, subject, listing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
              <Filter className="w-3.5 h-3.5 shrink-0 text-slate-400 mr-0.5" />
              {(['all', 'sent', 'active', 'closed', 'awarded'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {s === 'sent' && <Send className="w-3 h-3" />}
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Threads List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/70">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {statusFilter === 'sent' ? 'No sent emails found' : 'No buyer messages found'}
                  </p>
                  <p className="text-xs mt-1 max-w-[220px] mx-auto text-slate-500 dark:text-slate-400">
                    {statusFilter === 'sent'
                      ? 'No outbound sent emails matching your criteria.'
                      : 'Your buyer inbox is currently empty.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.threadId === selectedThreadId;
                const lastMsg = thread.messages?.[thread.messages.length - 1];
                const hasOpened = thread.openCount > 0;

                return (
                  <div
                    key={thread.threadId}
                    onClick={() => setSelectedThreadId(thread.threadId)}
                    className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-900/20 border-l-blue-600 dark:border-l-blue-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs truncate flex-1 min-w-0 text-slate-900 dark:text-slate-100">
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="truncate">{thread.buyerEmail}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasOpened && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800"
                            title="Telemetry Active - Email Opened"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{thread.openCount} {thread.openCount === 1 ? 'open' : 'opens'}</span>
                          </span>
                        )}

                        {/* 3-Dot Telemetry Action Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            data-testid={`thread-actions-${thread.threadId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuThreadId(activeMenuThreadId === thread.threadId ? null : thread.threadId);
                            }}
                            className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                            title="Thread Actions & Telemetry"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuThreadId === thread.threadId && (
                            <div
                              className="absolute right-0 top-7 z-30 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-150 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setTelemetryModalThread(thread);
                                  setActiveMenuThreadId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg font-semibold transition-all text-left cursor-pointer"
                              >
                                <Activity className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                <span>TELEMETRY</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold truncate mb-1 text-slate-800 dark:text-slate-200 m-0">
                      {thread.subject}
                    </h4>

                    {lastMsg && (
                      <p className="text-xs line-clamp-1 mb-2 leading-relaxed text-slate-500 dark:text-slate-400 m-0">
                        {lastMsg.senderType === 'supplier' ? <span className="font-semibold text-slate-700 dark:text-slate-300">You: </span> : ''}
                        {lastMsg.body}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-medium pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {thread.listingId && (
                          <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded font-mono text-[10px] flex items-center gap-1">
                            <Tag className="w-3 h-3 text-blue-600 dark:text-blue-400" /> #{thread.listingId}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 border rounded capitalize text-[10px] font-semibold ${getStatusBadge(thread.status)}`}>
                          {thread.status}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(thread.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Conversation & Message Stream Pane */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-2xs h-[calc(100vh-320px)] min-h-[560px] relative">
          {currentThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4 shrink-0">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate m-0 leading-snug">
                    {currentThread.subject}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      To: <strong className="font-mono text-slate-800 dark:text-slate-200">{currentThread.buyerEmail}</strong>
                    </span>
                    {currentThread.listingId && (
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md font-mono text-[11px] font-semibold">
                        Listing #{currentThread.listingId}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 border rounded-md text-[11px] font-semibold capitalize ${getStatusBadge(currentThread.status)}`}>
                      {currentThread.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTelemetryModalThread(currentThread)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                    title="Open Full TELEMETRY Audit"
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Telemetry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedThreadId(null);
                      setCurrentThread(null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Close Thread View"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Timeline Scroll Area */}
              <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-3.5 bg-slate-50/40 dark:bg-slate-950/40 custom-scrollbar">
                {!currentThread.messages || currentThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 py-10 text-slate-400">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-medium">No messages in this thread yet.</p>
                  </div>
                ) : (
                  currentThread.messages.map((msg, idx) => {
                    const isSupplier = msg.senderType === 'supplier';
                    const isSystem = msg.senderType === 'system';
                    if (isSystem) {
                      return (
                        <div key={idx} className="flex justify-center my-3">
                          <span className="px-3.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
                            {msg.body}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className={`flex flex-col ${isSupplier ? 'items-end' : 'items-start'} space-y-1.5`}>
                        <div className="flex items-center gap-2 text-xs px-1 text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {isSupplier ? `You (${msg.senderEmail})` : currentThread.buyerEmail}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span className="font-mono text-[11px]">{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] p-3.5 px-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-2xs ${
                            isSupplier
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-xs'
                          }`}
                        >
                          {msg.body}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Status Notice */}
              {replyStatus && (
                <div
                  className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-t ${
                    replyStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {replyStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{replyStatus.text}</span>
                </div>
              )}

              {/* Reply Composer Form */}
              <form onSubmit={handleSendReply} className="p-3.5 px-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Reply
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-0.5">Smart Insert:</span>
                    <button
                      type="button"
                      onClick={() => setReplyBody((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + '{{current_bid}}')}
                      className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      + Bid
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyBody((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + '{{inventory_table}}')}
                      className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      + Inventory
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Type your reply message..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-2xs leading-relaxed"
                />

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Secure SMTP Dispatch
                  </span>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyBody.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 space-y-3 text-center text-slate-500 dark:text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">
                  Select a thread
                </h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500 dark:text-slate-400 m-0">
                  Choose an email thread from the left to view the full buyer conversation history and live open telemetry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSendEmailModal(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Direct Email</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
