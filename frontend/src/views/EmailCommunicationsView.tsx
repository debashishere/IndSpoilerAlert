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

interface EmailMessage {
  messageId: string;
  senderType: 'supplier' | 'buyer' | 'system';
  senderEmail: string;
  body: string;
  sentAt: string;
  messageIdHeader?: string;
}

interface EmailThread {
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

interface EmailCommunicationsViewProps {
  supplierId?: string;
  embedded?: boolean;
  accountName?: string;
  emailAddress?: string;
}

// --- Send Direct Email Modal ---
const SendEmailModal: React.FC<{
  supplierId: string;
  accountName?: string;
  emailAddress?: string;
  onClose: () => void;
  onSent?: (threadId?: string) => void;
}> = ({ supplierId, accountName = 'IndSpoiler Alert Platform', emailAddress = 'eveline94@ethereal.email', onClose, onSent }) => {
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
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_40px_rgba(0,0,0,0.2)] relative text-[hsl(var(--text-primary))] animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-card-hover))] rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Send Direct Email</h3>
            <p className="text-sm text-slate-400">Send an email message directly to a buyer or partner</p>
          </div>
        </div>

        {status && (
          <div
            className={`mb-5 p-4 rounded-xl border text-sm flex items-center justify-between shadow-lg ${
              status.success
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {status.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{status.message}</span>
            </div>
            {status.previewUrl && (
              <a
                href={status.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold transition-colors underline"
              >
                Preview
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">From (Account Name & Email)</label>
            <div className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between text-slate-300 shadow-inner">
              <span className="font-semibold text-slate-200">{accountName}</span>
              <span className="font-mono text-xs text-indigo-400">{emailAddress}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="modal-send-to" className="text-xs font-bold text-slate-300 uppercase tracking-wide">To (Recipient Email)</label>
            <input
              id="modal-send-to"
              type="email"
              required
              placeholder="buyer@retailchain.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all shadow-inner"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="modal-send-subject" className="text-xs font-bold text-slate-300 uppercase tracking-wide">Subject Line</label>
            <input
              id="modal-send-subject"
              type="text"
              required
              placeholder="Enter email subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all shadow-inner"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="modal-send-body" className="text-xs font-bold text-slate-300 uppercase tracking-wide">Message Body</label>
            <textarea
              id="modal-send-body"
              rows={5}
              required
              placeholder="Type your plain text message body here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all resize-none shadow-inner"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- View Telemetry Modal ---
const TelemetryModal: React.FC<{
  thread: EmailThread;
  onClose: () => void;
}> = ({ thread, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" data-testid="telemetry-modal">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative text-slate-100 animate-in zoom-in-95 duration-200 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Email Telemetry & Open Audit
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Thread #{thread.threadId}
            </p>
          </div>
        </div>

        {/* Telemetry Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 shadow-inner">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-400" /> Total Opens
            </span>
            <p className="text-2xl font-black text-white">{thread.openCount}</p>
          </div>
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 shadow-inner">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Tracking Status
            </span>
            <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Active Pixel 1x1
            </p>
          </div>
        </div>

        {/* Timestamps & Identity Details */}
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3.5 text-xs shadow-inner">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-bold uppercase tracking-wide">Recipient Email</span>
            <span className="font-mono text-indigo-300 font-semibold">{thread.buyerEmail}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-bold uppercase tracking-wide">Subject Line</span>
            <span className="text-slate-200 font-semibold truncate max-w-[280px]">{thread.subject}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-bold uppercase tracking-wide">First Opened At</span>
            <span className="text-slate-300 font-medium font-mono">
              {thread.firstOpenedAt ? new Date(thread.firstOpenedAt).toLocaleString() : 'Not opened yet'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wide">Last Opened At</span>
            <span className="text-slate-300 font-medium font-mono">
              {thread.lastOpenedAt ? new Date(thread.lastOpenedAt).toLocaleString() : 'Not opened yet'}
            </span>
          </div>
        </div>

        {/* Outbound Messages Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-indigo-400" /> Messages Dispatched ({thread.messages?.length || 0})
          </h4>
          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-2">
            {thread.messages?.map((m, i) => (
              <div key={i} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs flex items-center justify-between">
                <span className="font-semibold text-slate-300 capitalize">{m.senderType} ({m.senderEmail})</span>
                <span className="text-slate-500 font-mono text-[11px]">{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors"
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
  emailAddress: initialEmailAddress = 'eveline94@ethereal.email'
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
        setThreads(data);
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
    const map: Record<string, string> = {
      active: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      closed: 'bg-slate-700/40 border-slate-600 text-slate-400',
      awarded: 'bg-amber-500/15 border-amber-500/30 text-amber-400'
    };
    return map[status] || map.active;
  };

  return (
    <div className={embedded ? "space-y-3 text-slate-100 font-sans h-full flex flex-col" : "p-3 md:p-4 w-full h-[calc(100vh-70px)] space-y-3 text-slate-100 font-sans flex flex-col"}>
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

      {/* Header Bar */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              Inbox Workspace
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Buyer inbox with real-time open telemetry, conversation history & direct email dispatch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Current Email Address & Account Name */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs shadow-inner">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account:</span>
                <span className="font-bold text-slate-100" data-testid="inbox-account-name">{accountName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email:</span>
                <span className="font-mono text-indigo-400 text-xs font-semibold" data-testid="inbox-email-address">{emailAddress}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSendEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:shadow-indigo-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              Send Email
            </button>
            <button
              onClick={() => fetchThreads()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/80 transition-colors shadow-sm"
              title="Refresh Inbox"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Split-Pane Workspace (Max Utilization of Space) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* Thread Sidebar Column */}
        <div className="lg:col-span-4 bg-card bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-xl flex flex-col overflow-hidden shadow-xl">
          {/* Active Mailbox Banner */}
          <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              Active Mailbox
            </span>
            <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]" title={emailAddress}>
              {emailAddress}
            </span>
          </div>

          {/* Search + Filter Bar */}
          <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-slate-950/40">
            <div className="relative group">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Search buyer, subject, listing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar">
              <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mr-0.5" />
              {(['all', 'sent', 'active', 'closed', 'awarded'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {s === 'sent' && <Send className="w-3 h-3 text-indigo-200" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Threads List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center h-full">
                <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Inbox className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-300 font-bold text-sm">
                    {statusFilter === 'sent' ? 'No sent emails found' : 'No buyer messages found'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1 max-w-[200px] mx-auto">
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
                    className={`p-3.5 cursor-pointer transition-all group relative ${
                      isSelected
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200 truncate flex-1 min-w-0">
                        <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'}`} />
                        <span className="truncate">{thread.buyerEmail}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hasOpened && (
                          <div className="flex h-2 w-2 relative" title="Telemetry Active - Email Opened">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </div>
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
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Thread Actions & Telemetry"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuThreadId === thread.threadId && (
                            <div
                              className="absolute right-0 top-7 z-30 w-40 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setTelemetryModalThread(thread);
                                  setActiveMenuThreadId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-indigo-300 hover:bg-indigo-600/20 hover:text-white rounded-lg font-bold transition-all text-left"
                              >
                                <Activity className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                <span>TELEMETRY</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <h4 className={`text-xs font-semibold truncate mb-1 ${isSelected ? 'text-indigo-200' : 'text-slate-300'}`}>
                      {thread.subject}
                    </h4>

                    {lastMsg && (
                      <p className="text-xs text-slate-400 line-clamp-1 mb-2 leading-relaxed">
                        {lastMsg.senderType === 'supplier' ? <span className="text-indigo-300 font-medium">You: </span> : ''}{lastMsg.body}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-medium pt-1.5 border-t border-slate-800/40">
                      <div className="flex items-center gap-1.5">
                        {thread.listingId && (
                          <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800/80 text-slate-400 rounded font-mono flex items-center gap-1 text-[10px]">
                            <Tag className="w-3 h-3 text-indigo-400" /> {thread.listingId}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 border rounded capitalize text-[10px] ${getStatusBadge(thread.status)}`}>
                          {thread.status}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
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

        {/* Right Main Thread Detail Panel */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800/80 rounded-xl flex flex-col overflow-hidden shadow-xl relative">
          {currentThread ? (
            <>
              {/* Thread Header: Clean & Un-congested, No inline Telemetry Box on Subject Line */}
              <div className="flex-shrink-0 bg-slate-950/80 border-b border-slate-800/80">
                <div className="p-4 px-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-base md:text-lg font-bold text-white truncate">{currentThread.subject}</h3>
                    <div className="flex items-center flex-wrap gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        To: <strong className="text-slate-200 font-mono">{currentThread.buyerEmail}</strong>
                      </span>
                      {currentThread.listingId && (
                        <span className="px-2.5 py-0.5 bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 rounded-lg font-mono text-[11px] font-semibold">
                          Listing #{currentThread.listingId}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 border rounded-lg text-[11px] font-bold capitalize ${getStatusBadge(currentThread.status)}`}>
                        {currentThread.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 3-Dot Action Menu to Open Telemetry Audit Modal */}
                    <button
                      type="button"
                      onClick={() => setTelemetryModalThread(currentThread)}
                      className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold"
                      title="Open Full TELEMETRY Audit"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {/* Close Thread Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedThreadId(null);
                        setCurrentThread(null);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold"
                      title="Close Thread View"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline Messages Scroll Area (Max Space Utilization) */}
              <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-950/20 to-slate-950/60 custom-scrollbar">
                {!currentThread.messages || currentThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 py-10">
                    <MessageSquare className="w-10 h-10 text-slate-700" />
                    <p className="text-xs font-medium">No messages in this thread yet.</p>
                  </div>
                ) : (
                  currentThread.messages.map((msg, idx) => {
                    const isSupplier = msg.senderType === 'supplier';
                    const isSystem = msg.senderType === 'system';
                    if (isSystem) {
                      return (
                        <div key={idx} className="flex justify-center my-4">
                          <span className="px-4 py-1 bg-slate-900/80 backdrop-blur text-slate-400 text-[11px] font-medium rounded-full border border-slate-700/50 shadow-sm">
                            {msg.body}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className={`flex flex-col ${isSupplier ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1.5`}>
                        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
                          <span className={`font-bold ${isSupplier ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {isSupplier ? `You (${msg.senderEmail})` : currentThread.buyerEmail}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span className="font-mono text-[11px]">{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] p-3.5 px-4 rounded-xl text-xs md:text-sm leading-relaxed shadow-md ${
                            isSupplier
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-tr-xs'
                              : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-xs'
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

              {/* Reply Status Strip */}
              {replyStatus && (
                <div
                  className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-t ${
                    replyStatus.type === 'success'
                      ? 'bg-emerald-950/80 border-emerald-900/50 text-emerald-400'
                      : 'bg-rose-950/80 border-rose-900/50 text-rose-400'
                  }`}
                >
                  {replyStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  {replyStatus.text}
                </div>
              )}

              {/* Reply Composer Form (Decreased Input Box Height for Max Reading Space) */}
              <form onSubmit={handleSendReply} className="p-3.5 px-4 border-t border-slate-800/80 bg-slate-950 flex-shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Reply
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 mr-1">Smart Insert:</span>
                    <button
                      type="button"
                      onClick={() => setReplyBody((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + '{{current_bid}}')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700/80 hover:border-indigo-500/50 rounded-lg text-[11px] font-bold transition-all"
                    >
                      + Bid
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyBody((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + '{{inventory_table}}')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700/80 hover:border-indigo-500/50 rounded-lg text-[11px] font-bold transition-all"
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
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl p-3 text-xs md:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all resize-none shadow-inner leading-relaxed"
                />

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800/80">
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    Secure SMTP Dispatch
                  </span>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyBody.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                  >
                    {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.12)]">
                <MessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Select a thread</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  Choose an email thread from the inbox to view the full buyer conversation history and live open telemetry.
                </p>
              </div>
              <button
                onClick={() => setShowSendEmailModal(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              >
                <Send className="w-3.5 h-3.5" />
                Send Direct Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
