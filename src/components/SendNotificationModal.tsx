import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Bell, 
  AlertTriangle, 
  Wallet, 
  Calendar, 
  Sparkles, 
  Users, 
  MessageSquare, 
  Crown, 
  CheckCircle2, 
  Zap,
  ArrowRightLeft
} from 'lucide-react';
import { User, AppNotification, UserRole } from '../types';

interface SendNotificationModalProps {
  isOpen: boolean;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onSendNotification: (notification: Partial<AppNotification>, targetUserIds: string[]) => void;
  onPostToChat?: (text: string, type?: 'announcement' | 'nudge' | 'payment_reminder') => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  users,
  currentUser,
  onClose,
  onSendNotification,
  onPostToChat,
}) => {
  const [targetAudience, setTargetAudience] = useState<string>('all'); // 'all' or userId
  const [notificationType, setNotificationType] = useState<AppNotification['type']>('general');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alsoPostToGroupChat, setAlsoPostToGroupChat] = useState(true);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const isHostOrCoHost = currentUser.role === 'host' || currentUser.role === 'co-host';

  const quickTemplates = [
    {
      label: '🚨 Deficit Warning',
      type: 'general' as const,
      title: '⚠️ Room Money Deficit Alert',
      message: 'Room pool fund is running low! Please hand over your monthly share of ₹500 so we can pay upcoming groceries and maintenance.',
    },
    {
      label: '💰 Room Handover Due',
      type: 'approval_request' as const,
      title: 'Room Money Contribution Reminder',
      message: `Friendly reminder from ${currentUser.name}: please deposit your pending flat contribution to keep our shared fund active.`,
    },
    {
      label: '📅 Rent & WiFi Due',
      type: 'bill' as const,
      title: 'Upcoming Rent & WiFi Bill Reminder',
      message: 'Monthly Rent and High-Speed WiFi bills are due in 2 days. Please ensure your balance is ready for clearing.',
    },
    {
      label: '🧹 House Duty Notice',
      type: 'general' as const,
      title: 'Flat 402 Cleaning & Maintenance',
      message: 'Maid will be doing deep kitchen cleaning tomorrow morning. Please keep kitchen counter and common spaces clear.',
    },
    {
      label: '💸 Settle Balances',
      type: 'settlement' as const,
      title: 'Please Settle Out-of-Pocket Dues',
      message: 'Please review the Ledger and settle your direct pending dues via UPI or Cash.',
    },
  ];

  const handleApplyTemplate = (tmpl: typeof quickTemplates[0]) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setNotificationType(tmpl.type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const targetUserIds = targetAudience === 'all' 
      ? users.map((u) => u.id) 
      : [targetAudience];

    onSendNotification(
      {
        title: title.trim(),
        message: message.trim(),
        type: notificationType,
        timestamp: 'Just now',
        isRead: false,
      },
      targetUserIds
    );

    if (alsoPostToGroupChat && onPostToChat) {
      onPostToChat(`📢 [BROADCAST] ${title.trim()}: ${message.trim()}`, 'announcement');
    }

    setSentSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
                  Broadcast Notification
                </h3>
                {isHostOrCoHost && (
                  <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" /> Host Broadcast
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500">
                Send push notifications & alerts to all flatmates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-[13px]">
          {sentSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-[18px] font-bold text-slate-900">Notification Broadcasted!</h4>
              <p className="text-[13px] text-slate-600">
                Dispatched instantly to all selected room members and logged into group feed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Template Chips */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  1-Tap Quick Templates
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 rounded-xl text-[12px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-all active:scale-95 cursor-pointer"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                  Send To (Recipients) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('all')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      targetAudience === 'all'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span className="text-[12px]">All Roommates</span>
                    </div>
                    <span className={`text-[10px] block mt-0.5 ${targetAudience === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                      Flat 402 ({users.length} members)
                    </span>
                  </button>

                  {users
                    .filter((u) => u.id !== currentUser.id)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setTargetAudience(u.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          targetAudience === u.id
                            ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[12px] truncate">{u.name}</span>
                        </div>
                        <span className={`text-[10px] block mt-0.5 ${targetAudience === u.id ? 'text-slate-300' : 'text-slate-400'} truncate`}>
                          {u.role}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Notification Category */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                  Notification Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'general', label: '📢 Announcement' },
                    { id: 'approval_request', label: '💰 Handover Due' },
                    { id: 'bill', label: '📅 Bill Due' },
                    { id: 'settlement', label: '💸 Settle Up' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNotificationType(cat.id as AppNotification['type'])}
                      className={`py-2 px-2.5 rounded-xl text-[12px] font-medium border text-center transition-all cursor-pointer ${
                        notificationType === cat.id
                          ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ⚠️ Room Money Deficit Alert, WiFi Bill Due"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-900 outline-none text-[13px] font-semibold"
                />
              </div>

              {/* Message Body Field */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">
                  Message Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the notification message to broadcast to everyone..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl p-3 text-slate-900 outline-none text-[13px] resize-none"
                />
              </div>

              {/* Also Post to Group Chat Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="text-[12px] font-bold text-slate-900 block leading-tight">
                      Post to Flat 402 Group Chat
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Also pin this notice in the Roommate Messenger
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={alsoPostToGroupChat}
                  onChange={(e) => setAlsoPostToGroupChat(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[13px] shadow-sm shadow-slate-900/20 transition-all active:scale-95 cursor-pointer border border-slate-800"
                >
                  <Send className="w-4 h-4" /> Send Notification
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
