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
    <div className="fixed inset-0 z-50 bg-[hsl(var(--bg-card)_/_0.8)] backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_40px_rgba(0,0,0,0.2)] relative text-[hsl(var(--text-primary))] animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-card-hover))] rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br rounded-xl text-white shadow-[0_0_15px_hsl(var(--primary) / 0.4)]" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}>
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Send Direct Email</h3>
            <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Send an email message directly to a buyer or partner</p>
          </div>
        </div>

        {status && (
          <div
            className={`mb-5 p-4 rounded-xl border text-sm flex items-center justify-between shadow-lg ${ status.success ? 'bg-[hsl(var(--success) / 0.1)] border-[hsl(var(--success) / 0.3)] text-[hsl(var(--success) / 0.1)]' : 'bg-[hsl(var(--error) / 0.1)] border-[hsl(var(--error) / 0.3)] text-[hsl(var(--error))]' }`}
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
                className="px-3 py-1 rounded-lg text-xs font-bold transition-colors underline" style={{ backgroundColor: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success) / 0.1)' }}
              >
                Preview
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--secondary))' }}>From (Account Name & Email)</label>
            <div className="w-full border rounded-xl px-4 py-2.5 text-sm flex items-center justify-between shadow-inner" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}>
              <span className="font-semibold" style={{ color: 'hsl(var(--secondary))' }}>{accountName}</span>
              <span className="font-mono text-xs" style={{ color: 'hsl(var(--primary))' }}>{emailAddress}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="modal-send-to" className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--secondary))' }}>To (Recipient Email)</label>
            <input
              id="modal-send-to"
              type="email"
              required
              placeholder="buyer@retailchain.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border focus:border-[hsl(var(--primary))] focus:ring-1 focus:border-[hsl(var(--primary))] rounded-xl px-4 py-2.5 text-sm outline-none transition-all shadow-inner" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="modal-send-subject" className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--secondary))' }}>Subject Line</label>
            <input
              id="modal-send-subject"
              type="text"
              required
              placeholder="Enter email subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border focus:border-[hsl(var(--primary))] focus:ring-1 focus:border-[hsl(var(--primary))] rounded-xl px-4 py-2.5 text-sm outline-none transition-all shadow-inner" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="modal-send-body" className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--secondary))' }}>Message Body</label>
            <textarea
              id="modal-send-body"
              rows={5}
              required
              placeholder="Type your plain text message body here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border focus:border-[hsl(var(--primary))] focus:ring-1 focus:border-[hsl(var(--primary))] rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none shadow-inner" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors" style={{ backgroundColor: 'hsl(var(--bg-main))', color: 'hsl(var(--secondary))' }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r text-white rounded-xl text-sm font-bold shadow-lg shadow-[hsl(var(--primary)_/_0.3)] transition-all shadow-[hsl(var(--primary)_/_0.3)] hover:-translate-y-0.5 disabled:opacity-50" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
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
    <div className="fixed inset-0 z-50 bg-[hsl(var(--bg-card)_/_0.8)] backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" data-testid="telemetry-modal">
      <div className="border rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative animate-in zoom-in-95 duration-200 space-y-6" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 hover:text-white rounded-xl transition-colors" style={{ color: 'hsl(var(--text-muted))' }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 border-b pb-5" style={{ borderColor: 'hsl(var(--border-color))' }}>
          <div className="p-3 bg-gradient-to-br rounded-xl text-white shadow-lg" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Email Telemetry & Open Audit
            </h3>
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'hsl(var(--text-muted))' }}>
              Thread #{thread.threadId}
            </p>
          </div>
        </div>

        {/* Telemetry Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-xl space-y-1 shadow-inner" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
              <Eye className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} /> Total Opens
            </span>
            <p className="text-2xl font-black text-white">{thread.openCount}</p>
          </div>
          <div className="p-4 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-xl space-y-1 shadow-inner" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
              <Activity className="w-3.5 h-3.5" style={{ color: 'hsl(var(--success))' }} /> Tracking Status
            </span>
            <p className="text-sm font-bold flex items-center gap-1.5 mt-1" style={{ color: 'hsl(var(--success))' }}>
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }} /> Active Pixel 1x1
            </p>
          </div>
        </div>

        {/* Timestamps & Identity Details */}
        <div className="p-5 border rounded-xl space-y-3.5 text-xs shadow-inner" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))' }}>
          <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <span className="font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--text-muted))' }}>Recipient Email</span>
            <span className="font-mono font-semibold" style={{ color: 'hsl(var(--secondary))' }}>{thread.buyerEmail}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <span className="font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--text-muted))' }}>Subject Line</span>
            <span className="font-semibold truncate max-w-[280px]" style={{ color: 'hsl(var(--secondary))' }}>{thread.subject}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <span className="font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--text-muted))' }}>First Opened At</span>
            <span className="font-medium font-mono" style={{ color: 'hsl(var(--secondary))' }}>
              {thread.firstOpenedAt ? new Date(thread.firstOpenedAt).toLocaleString() : 'Not opened yet'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--text-muted))' }}>Last Opened At</span>
            <span className="font-medium font-mono" style={{ color: 'hsl(var(--secondary))' }}>
              {thread.lastOpenedAt ? new Date(thread.lastOpenedAt).toLocaleString() : 'Not opened yet'}
            </span>
          </div>
        </div>

        {/* Outbound Messages Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
            <Send className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} /> Messages Dispatched ({thread.messages?.length || 0})
          </h4>
          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-2">
            {thread.messages?.map((m, i) => (
              <div key={i} className="p-3 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-xl text-xs flex items-center justify-between" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <span className="font-semibold capitalize" style={{ color: 'hsl(var(--secondary))' }}>{m.senderType} ({m.senderEmail})</span>
                <span className="font-mono text-[11px]" style={{ color: 'hsl(var(--text-muted))' }}>{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'hsl(var(--border-color))' }}>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-white rounded-xl text-sm font-bold transition-colors" style={{ backgroundColor: 'hsl(var(--bg-main))' }}
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
  emailAddress: initialEmailAddress = 'noreply@spoileralert.com'
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
      active: 'bg-[hsl(var(--success)_/_0.1)] border-[hsl(var(--success)_/_0.3)] text-[hsl(var(--success))]',
      closed: 'bg-[hsl(var(--bg-card-hover))] border-[hsl(var(--border-color))] text-[hsl(var(--text-muted))]',
      awarded: 'bg-[hsl(var(--warning)_/_0.1)] border-[hsl(var(--warning)_/_0.3)] text-[hsl(var(--warning))]'
    };
    return map[status] || map.active;
  };

  return (
    <div className={embedded ? "space-y-3 text-[hsl(var(--text-primary))] font-sans h-full flex flex-col" : "p-3 md:p-4 w-full h-[calc(100vh-70px)] space-y-3 text-[hsl(var(--text-primary))] font-sans flex flex-col"}>
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
      <div className="bg-[hsl(var(--bg-card)_/_0.8)] border rounded-xl p-3 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 flex-shrink-0 shadow-md" style={{ borderColor: 'hsl(var(--border-color))' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br rounded-xl text-white shadow-md" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}>
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              Inbox Workspace
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
              Buyer inbox with real-time open telemetry, conversation history & direct email dispatch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Current Email Address & Account Name */}
          <div className="flex items-center gap-2.5 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-xl px-3 py-1.5 text-xs shadow-inner" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <div className="w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.3)', color: 'hsl(var(--primary))' }}>
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--text-muted))' }}>Account:</span>
                <span className="font-bold" style={{ color: 'hsl(var(--secondary))' }} data-testid="inbox-account-name">{accountName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--text-muted))' }}>Email:</span>
                <span className="font-mono text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }} data-testid="inbox-email-address">{emailAddress}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSendEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r to-[hsl(var(--secondary))] text-white rounded-xl text-xs font-bold shadow-md transition-all shadow-[hsl(var(--primary)_/_0.3)]" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
            >
              <Send className="w-3.5 h-3.5" />
              Send Email
            </button>
            <button
              onClick={() => fetchThreads()}
              className="p-2 rounded-xl border transition-colors shadow-sm" style={{ backgroundColor: 'hsl(var(--bg-main))', color: 'hsl(var(--secondary))', borderColor: 'hsl(var(--border-color))' }}
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
          <div className="px-3.5 py-2 bg-[hsl(var(--bg-card)_/_0.8)] border-b flex items-center justify-between text-xs" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <span className="font-semibold flex items-center gap-1.5" style={{ color: 'hsl(var(--secondary))' }}>
              <Mail className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
              Active Mailbox
            </span>
            <span className="font-mono text-[11px] truncate max-w-[200px]" style={{ color: 'hsl(var(--text-muted))' }} title={emailAddress}>
              {emailAddress}
            </span>
          </div>

          {/* Search + Filter Bar */}
          <div className="p-3 border-b space-y-2.5 bg-[hsl(var(--bg-card)_/_0.8)]" style={{ borderColor: 'hsl(var(--border-color))' }}>
            <div className="relative group">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 group-focus-within:text-[hsl(var(--primary))] transition-colors" style={{ color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                placeholder="Search buyer, subject, listing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border focus:border-[hsl(var(--primary))] focus:ring-1 focus:border-[hsl(var(--primary))] rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-all shadow-inner" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar">
              <Filter className="w-3.5 h-3.5 flex-shrink-0 mr-0.5" style={{ color: 'hsl(var(--text-muted))' }} />
              {(['all', 'sent', 'active', 'closed', 'awarded'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap flex items-center gap-1.5 ${ statusFilter === s ? 'bg-[hsl(var(--primary))] text-white shadow-md' : 'bg-[hsl(var(--bg-main))] text-[hsl(var(--text-muted))] text-[hsl(var(--text-primary))]' }`}
                >
                  {s === 'sent' && <Send className="w-3 h-3" style={{ color: 'hsl(var(--secondary))' }} />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Threads List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[hsl(var(--border-color))]">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center h-full">
                <div className="w-14 h-14 rounded-full border flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.3)' }}>
                  <Inbox className="w-7 h-7" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'hsl(var(--secondary))' }}>
                    {statusFilter === 'sent' ? 'No sent emails found' : 'No buyer messages found'}
                  </p>
                  <p className="text-xs mt-1 max-w-[200px] mx-auto" style={{ color: 'hsl(var(--text-muted))' }}>
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
                    className={`p-3.5 cursor-pointer transition-all group relative ${ isSelected ? 'bg-[hsl(var(--primary) / 0.1)] border-l-4 border-[hsl(var(--primary) / 0.3)]' : ' border-l-4 border-transparent' }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs truncate flex-1 min-w-0" style={{ color: 'hsl(var(--secondary))' }}>
                        <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--text-muted))] transition-colors'}`} />
                        <span className="truncate">{thread.buyerEmail}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hasOpened && (
                          <div className="flex h-2 w-2 relative" title="Telemetry Active - Email Opened">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'hsl(var(--success))' }}></span>
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}></span>
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
                            className="p-1 hover:text-white rounded-lg transition-colors" style={{ color: 'hsl(var(--text-muted))' }}
                            title="Thread Actions & Telemetry"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuThreadId === thread.threadId && (
                            <div
                              className="absolute right-0 top-7 z-30 w-40 border rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150 text-xs" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setTelemetryModalThread(thread);
                                  setActiveMenuThreadId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:text-white rounded-lg font-bold transition-all text-left" style={{ color: 'hsl(var(--secondary))' }}
                              >
                                <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                                <span>TELEMETRY</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <h4 className={`text-xs font-semibold truncate mb-1 ${isSelected ? 'text-[hsl(var(--secondary))]' : 'text-[hsl(var(--secondary))]'}`}>
                      {thread.subject}
                    </h4>

                    {lastMsg && (
                      <p className="text-xs line-clamp-1 mb-2 leading-relaxed" style={{ color: 'hsl(var(--text-muted))' }}>
                        {lastMsg.senderType === 'supplier' ? <span className="font-medium" style={{ color: 'hsl(var(--secondary))' }}>You: </span> : ''}{lastMsg.body}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-medium pt-1.5 border-t" style={{ borderColor: 'hsl(var(--border-color))' }}>
                      <div className="flex items-center gap-1.5">
                        {thread.listingId && (
                          <span className="px-1.5 py-0.5 border rounded font-mono flex items-center gap-1 text-[10px]" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                            <Tag className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} /> {thread.listingId}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 border rounded capitalize text-[10px] ${getStatusBadge(thread.status)}`}>
                          {thread.status}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>
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
        <div className="lg:col-span-8 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-xl flex flex-col overflow-hidden shadow-xl relative" style={{ borderColor: 'hsl(var(--border-color))' }}>
          {currentThread ? (
            <>
              {/* Thread Header: Clean & Un-congested, No inline Telemetry Box on Subject Line */}
              <div className="flex-shrink-0 bg-[hsl(var(--bg-card)_/_0.8)] border-b" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <div className="p-4 px-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-base md:text-lg font-bold text-white truncate">{currentThread.subject}</h3>
                    <div className="flex items-center flex-wrap gap-3 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                      <span className="flex items-center gap-1">
                        To: <strong className="font-mono" style={{ color: 'hsl(var(--secondary))' }}>{currentThread.buyerEmail}</strong>
                      </span>
                      {currentThread.listingId && (
                        <span className="px-2.5 py-0.5 border rounded-lg font-mono text-[11px] font-semibold" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--secondary))', borderColor: 'hsl(var(--primary) / 0.3)' }}>
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
                      className="p-2 rounded-xl border transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold" style={{ color: 'hsl(var(--text-muted))', borderColor: 'hsl(var(--border-color))' }}
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
                      className="p-2 text-[hsl(var(--error))] rounded-xl border transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold" style={{ color: 'hsl(var(--text-muted))', borderColor: 'hsl(var(--border-color))' }}
                      title="Close Thread View"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline Messages Scroll Area (Max Space Utilization) */}
              <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-4 bg-gradient-to-b custom-scrollbar">
                {!currentThread.messages || currentThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 py-10" style={{ color: 'hsl(var(--text-muted))' }}>
                    <MessageSquare className="w-10 h-10" style={{ color: 'hsl(var(--text-secondary))' }} />
                    <p className="text-xs font-medium">No messages in this thread yet.</p>
                  </div>
                ) : (
                  currentThread.messages.map((msg, idx) => {
                    const isSupplier = msg.senderType === 'supplier';
                    const isSystem = msg.senderType === 'system';
                    if (isSystem) {
                      return (
                        <div key={idx} className="flex justify-center my-4">
                          <span className="px-4 py-1 bg-[hsl(var(--bg-card)_/_0.8)] backdrop-blur text-[11px] font-medium rounded-full border shadow-sm" style={{ color: 'hsl(var(--text-muted))', borderColor: 'hsl(var(--border-color))' }}>
                            {msg.body}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className={`flex flex-col ${isSupplier ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1.5`}>
                        <div className="flex items-center gap-2 text-xs px-1" style={{ color: 'hsl(var(--text-muted))' }}>
                          <span className={`font-bold ${isSupplier ? 'text-[hsl(var(--secondary))]' : 'text-[hsl(var(--secondary))]'}`}>
                            {isSupplier ? `You (${msg.senderEmail})` : currentThread.buyerEmail}
                          </span>
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'hsl(var(--bg-card-hover))' }}></span>
                          <span className="font-mono text-[11px]">{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] p-3.5 px-4 rounded-xl text-xs md:text-sm leading-relaxed shadow-md ${ isSupplier ? 'bg-gradient-to-br bg-[linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))] text-white rounded-tr-xs' : 'bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-color))] text-[hsl(var(--secondary))] rounded-tl-xs' }`}
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
                  className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-t ${ replyStatus.type === 'success' ? 'bg-[hsl(var(--success) / 0.1)] border-[hsl(var(--success) / 0.3)] text-[hsl(var(--success))]' : 'bg-[hsl(var(--error) / 0.1)] border-[hsl(var(--error) / 0.3)] text-[hsl(var(--error))]' }`}
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
              <form onSubmit={handleSendReply} className="p-3.5 px-4 border-t flex-shrink-0 space-y-3" style={{ borderColor: 'hsl(var(--border-color))', backgroundColor: 'hsl(var(--bg-card))' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'hsl(var(--secondary))' }}>
                    <MessageSquare className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                    Reply
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium mr-1" style={{ color: 'hsl(var(--text-muted))' }}>Smart Insert:</span>
                    <button
                      type="button"
                      onClick={() => setReplyBody((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + '{{current_bid}}')}
                      className="px-2.5 py-1 border rounded-lg text-[11px] font-bold transition-all" style={{ backgroundColor: 'hsl(var(--bg-main))', color: 'hsl(var(--secondary))', borderColor: 'hsl(var(--border-color))' }}
                    >
                      + Bid
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyBody((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + '{{inventory_table}}')}
                      className="px-2.5 py-1 border rounded-lg text-[11px] font-bold transition-all" style={{ backgroundColor: 'hsl(var(--bg-main))', color: 'hsl(var(--secondary))', borderColor: 'hsl(var(--border-color))' }}
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
                  className="w-full border focus:border-[hsl(var(--primary))] focus:ring-1 focus:border-[hsl(var(--primary))] rounded-xl p-3 text-xs md:text-sm outline-none transition-all resize-none shadow-inner leading-relaxed" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}
                />

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] font-medium flex items-center gap-1.5 px-3 py-1 rounded-lg border" style={{ color: 'hsl(var(--text-muted))', backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))' }}>
                    <Activity className="w-3.5 h-3.5" style={{ color: 'hsl(var(--secondary))' }} />
                    Secure SMTP Dispatch
                  </span>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyBody.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r text-white rounded-xl text-xs font-bold shadow-md transition-all shadow-[hsl(var(--primary)_/_0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
                  >
                    {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full border flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary) / 0.12)]" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.3)' }}>
                <MessageSquare className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Select a thread</h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: 'hsl(var(--text-muted))' }}>
                  Choose an email thread from the inbox to view the full buyer conversation history and live open telemetry.
                </p>
              </div>
              <button
                onClick={() => setShowSendEmailModal(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 border rounded-xl text-xs font-bold transition-all hover:shadow-[0_0_20px_hsl(var(--primary) / 0.2)]" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--secondary))', borderColor: 'hsl(var(--primary) / 0.3)' }}
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
