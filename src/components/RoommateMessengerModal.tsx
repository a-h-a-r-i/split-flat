import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, MessageSquare, Users, Crown, Shield,
  CheckCheck, Wallet, Bell, Copy, Trash2, Trash, Reply
} from 'lucide-react';
import { User, ChatMessage, UserRole, DebtTransfer } from '../types';
import { formatCurrency } from '../utils/calculations';

// ── Long-press bubble wrapper ─────────────────────────────────────────────────
interface BubbleProps {
  onLongPress: (x: number, y: number) => void;
  onContextMenu: (x: number, y: number) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const Bubble: React.FC<BubbleProps> = ({ onLongPress, onContextMenu, className, style, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      fired.current = false;
      const t = e.touches[0];
      startPos.current = { x: t.clientX, y: t.clientY };
      timer.current = setTimeout(() => {
        fired.current = true;
        if (navigator.vibrate) navigator.vibrate(40);
        onLongPress(t.clientX, t.clientY);
      }, 500);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - startPos.current.x);
      const dy = Math.abs(t.clientY - startPos.current.y);
      // Cancel if user scrolls more than 8px
      if (dx > 8 || dy > 8) {
        if (timer.current) clearTimeout(timer.current);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (timer.current) clearTimeout(timer.current);
      // If long-press fired, swallow the tap so it doesn't dismiss the menu
      if (fired.current) {
        e.preventDefault();
        fired.current = false;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onLongPress]);

  return (
    <div
      ref={ref}
      style={style}
      className={className}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e.clientX, e.clientY); }}
    >
      {children}
    </div>
  );
};

interface RoommateMessengerModalProps {
  isOpen: boolean;
  users: User[];
  currentUser: User;
  messages: ChatMessage[];
  debtTransfers?: DebtTransfer[];
  onClose: () => void;
  onSendMessage: (msg: Partial<ChatMessage>) => void;
  onOpenDepositModal?: () => void;
  onOpenAddExpense?: () => void;
  onOpenSendNotification?: () => void;
}

interface ContextMenu {
  msgId: string;
  x: number;
  y: number;
}

const QUICK_EMOJIS = ['❤️', '😂', '👍', '🔥', '💸', '👏'];

export const RoommateMessengerModal: React.FC<RoommateMessengerModalProps> = ({
  isOpen, users, currentUser, messages, debtTransfers = [],
  onClose, onSendMessage, onOpenDepositModal, onOpenSendNotification,
}) => {
  const [activeRecipientId, setActiveRecipientId] = useState<string>('group');
  const [inputText, setInputText] = useState('');
  const [reactionMap, setReactionMap] = useState<Record<string, Record<string, string[]>>>({});
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [deletedForMe, setDeletedForMe] = useState<Set<string>>(new Set());
  const [deletedForEveryone, setDeletedForEveryone] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRecipientId]);

  const handleScroll = useCallback(() => setContextMenu(null), []);

  if (!isOpen) return null;

  const currentThreadMessages = messages.filter((m) => {
    if (deletedForMe.has(m.id)) return false;
    if (activeRecipientId === 'group') return m.recipientId === 'group';
    return (
      (m.senderId === currentUser.id && m.recipientId === activeRecipientId) ||
      (m.senderId === activeRecipientId && m.recipientId === currentUser.id)
    );
  });

  const activeChatUser = users.find((u) => u.id === activeRecipientId);
  const debtWithActiveUser = debtTransfers.find(
    (t) =>
      (t.from === currentUser.id && t.to === activeRecipientId) ||
      (t.from === activeRecipientId && t.to === currentUser.id)
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    const now = new Date();
    onSendMessage({
      senderId: currentUser.id, senderName: currentUser.name,
      senderAvatar: currentUser.avatar, recipientId: activeRecipientId,
      text: replyTo ? `↩ ${replyTo.senderName}: "${replyTo.text.slice(0, 40)}"\n${inputText.trim()}` : inputText.trim(),
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString(), type: 'text',
    });
    setInputText('');
    setReplyTo(null);

    if (activeRecipientId !== 'group') {
      const recipient = users.find((u) => u.id === activeRecipientId);
      if (recipient) {
        setTimeout(() => {
          const replies = [
            `Got it ${currentUser.name}! Checking this right now.`,
            `Thanks for the update! Done 👍`,
            `Sounds good! Let's settle it over UPI.`,
            `Noted! I'll update my records too.`,
          ];
          const replyNow = new Date();
          onSendMessage({
            senderId: recipient.id, senderName: recipient.name,
            senderAvatar: recipient.avatar, recipientId: currentUser.id,
            text: replies[Math.floor(Math.random() * replies.length)],
            timestamp: replyNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: replyNow.toISOString(), type: 'text',
          });
        }, 1200);
      }
    }
  };

  const handleSendQuickNudge = (nudgeText: string, type: ChatMessage['type'] = 'nudge') => {
    const now = new Date();
    onSendMessage({
      senderId: currentUser.id, senderName: currentUser.name,
      senderAvatar: currentUser.avatar, recipientId: activeRecipientId,
      text: nudgeText,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString(), type,
    });
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setReactionMap((prev) => {
      const msgReactions = prev[msgId] || {};
      const list = msgReactions[emoji] || [];
      const has = list.includes(currentUser.name);
      return {
        ...prev,
        [msgId]: {
          ...msgReactions,
          [emoji]: has ? list.filter((n) => n !== currentUser.name) : [...list, currentUser.name],
        },
      };
    });
    setContextMenu(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setContextMenu(null);
  };

  const handleDeleteForMe = (msgId: string) => {
    setDeletedForMe((prev) => new Set([...prev, msgId]));
    setContextMenu(null);
  };

  const handleDeleteForEveryone = (msgId: string) => {
    setDeletedForEveryone((prev) => new Set([...prev, msgId]));
    setContextMenu(null);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getRoleBadge = (role: UserRole) => {
    if (role === 'host') return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <Crown className="w-2.5 h-2.5 text-amber-600" /> Host
      </span>
    );
    if (role === 'co-host') return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
        <Shield className="w-2.5 h-2.5 text-slate-700" /> Co-Host
      </span>
    );
    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:items-center md:justify-center md:p-4 md:bg-slate-900/60 md:backdrop-blur-sm"
      onClick={() => setContextMenu(null)}>
      <div className="w-full h-[100dvh] md:h-[85vh] md:max-w-4xl bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-2xl flex flex-col md:flex-row overflow-hidden">

        {/* ── LEFT: contact list ─────────────────────────────────────────── */}
        <div className="w-full md:w-80 bg-slate-50/90 md:border-r border-slate-200 flex flex-col shrink-0 md:h-full">
          {/* Desktop header */}
          <div className="hidden md:flex p-3.5 border-b border-slate-200/80 items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 leading-tight">Roommate Messenger</h3>
                <span className="text-[11px] text-slate-500 font-mono">Live Chat</span>
              </div>
            </div>
            {onOpenSendNotification && (
              <button onClick={onOpenSendNotification} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200">
                <Bell className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile: horizontal avatar strip */}
          <div className="md:hidden flex items-center gap-3 px-3 py-2 border-b border-slate-200 bg-white overflow-x-auto no-scrollbar shrink-0">
            <button onClick={() => setActiveRecipientId('group')} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center border ${activeRecipientId === 'group' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                <Users className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <span className={`text-[10px] font-bold truncate max-w-[44px] ${activeRecipientId === 'group' ? 'text-slate-900' : 'text-slate-500'}`}>Group</span>
            </button>
            {users.filter((u) => u.id !== currentUser.id).map((u) => (
              <button key={u.id} onClick={() => setActiveRecipientId(u.id)} className="flex flex-col items-center gap-1 shrink-0">
                <div className={`relative w-11 h-11 rounded-full overflow-hidden border-2 ${activeRecipientId === u.id ? 'border-slate-900' : 'border-slate-200'}`}>
                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name) + '&background=0f172a&color=fff'; }} />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <span className={`text-[10px] font-bold truncate max-w-[44px] ${activeRecipientId === u.id ? 'text-slate-900' : 'text-slate-500'}`}>{u.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Desktop: full list */}
          <div className="hidden md:flex flex-1 overflow-y-auto p-2 space-y-1 flex-col">
            <button onClick={() => setActiveRecipientId('group')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${activeRecipientId === 'group' ? 'bg-slate-900 text-white' : 'text-slate-800 hover:bg-slate-100/80'}`}>
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white shrink-0 border border-slate-600">
                <Users className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[13px] font-bold ${activeRecipientId === 'group' ? 'text-white' : 'text-slate-900'}`}>Flat Group</span>
                <p className={`text-[11px] truncate mt-0.5 ${activeRecipientId === 'group' ? 'text-slate-300' : 'text-slate-500'}`}>Shared fund, chores & updates</p>
              </div>
            </button>
            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Direct Chats</span>
            </div>
            {users.filter((u) => u.id !== currentUser.id).map((u) => (
              <button key={u.id} onClick={() => setActiveRecipientId(u.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${activeRecipientId === u.id ? 'bg-slate-900 text-white' : 'text-slate-800 hover:bg-slate-100/80'}`}>
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-300 shrink-0">
                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name) + '&background=0f172a&color=fff'; }} />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] font-bold truncate ${activeRecipientId === u.id ? 'text-white' : 'text-slate-900'}`}>{u.name}</span>
                    {getRoleBadge(u.role)}
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${activeRecipientId === u.id ? 'text-slate-300' : 'text-slate-500'}`}>{u.upiId || u.phone || 'Tap to chat'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: chat area ───────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">

          {/* Header */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {activeRecipientId === 'group' ? (
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Users className="w-4 h-4" /></div>
              ) : (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <img src={activeChatUser?.avatar} alt={activeChatUser?.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[14px] font-bold text-slate-900 truncate">
                    {activeRecipientId === 'group' ? 'Flat Roommates' : activeChatUser?.name}
                  </h4>
                  {activeChatUser && getRoleBadge(activeChatUser.role)}
                </div>
                <p className="text-[10px] text-emerald-500 font-semibold">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeRecipientId !== 'group' && debtWithActiveUser && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-[11px] font-mono font-bold border border-slate-200">
                  <span className={debtWithActiveUser.from === currentUser.id ? 'text-rose-600' : 'text-emerald-600'}>
                    {debtWithActiveUser.from === currentUser.id ? `You owe ₹${debtWithActiveUser.amount}` : `Owes you ₹${debtWithActiveUser.amount}`}
                  </span>
                </div>
              )}
              {onOpenSendNotification && (
                <button onClick={onOpenSendNotification} className="md:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 cursor-pointer border border-slate-200">
                  <Bell className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick nudges */}
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] shrink-0">
            <span className="text-slate-400 text-[10px] font-mono uppercase font-bold shrink-0">Quick:</span>
            {activeRecipientId === 'group' ? (
              <>
                <button onClick={() => handleSendQuickNudge('📢 Room Fund Reminder: Please contribute to the shared monthly pool!', 'announcement')} className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shrink-0 cursor-pointer">💰 Room Pool</button>
                <button onClick={() => handleSendQuickNudge('🍕 Ordering dinner! Who is in?', 'text')} className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shrink-0 cursor-pointer">🍕 Food Split</button>
                <button onClick={() => handleSendQuickNudge('🧹 Maid coming tomorrow. Please keep rooms tidy.', 'text')} className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shrink-0 cursor-pointer">🧹 Cleaning</button>
                <button onClick={() => handleSendQuickNudge('⚡ Monthly utility bills updated in Ledger.', 'announcement')} className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shrink-0 cursor-pointer">⚡ Utility</button>
              </>
            ) : (
              <>
                <button onClick={() => handleSendQuickNudge(`Hey ${activeChatUser?.name}, please clear pending balance via UPI!`, 'payment_reminder')} className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shrink-0 cursor-pointer">💸 Settle UPI</button>
                <button onClick={() => handleSendQuickNudge(`Hey ${activeChatUser?.name}, did you deposit the monthly fund share?`, 'text')} className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shrink-0 cursor-pointer">💳 Fund Check</button>
                <button onClick={() => handleSendQuickNudge('Shared the receipt for our recent split. Thanks!', 'text')} className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shrink-0 cursor-pointer">🧾 Receipt</button>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-slate-50/40" onScroll={handleScroll}>
            {currentThreadMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-[14px] font-medium text-slate-600">No messages yet</p>
                <p className="text-[12px] text-slate-400 max-w-xs">Say hello or send a quick nudge!</p>
              </div>
            ) : (
              currentThreadMessages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                const sender = users.find((u) => u.id === msg.senderId);
                const isDeleted = deletedForEveryone.has(msg.id);

                // Merge DB + local reactions
                const mergedReactions: Record<string, string[]> = {};
                const dbR = (msg.reactions || {}) as Record<string, string[]>;
                const localR = reactionMap[msg.id] || {};
                [...new Set([...Object.keys(dbR), ...Object.keys(localR)])].forEach((emoji) => {
                  const merged = Array.from(new Set([
                    ...(Array.isArray(dbR[emoji]) ? dbR[emoji] : []),
                    ...(Array.isArray(localR[emoji]) ? localR[emoji] : []),
                  ]));
                  if (merged.length) mergedReactions[emoji] = merged;
                });

                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {/* Sender label in group */}
                    {!isMine && activeRecipientId === 'group' && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1 text-[11px] text-slate-600 font-bold">
                        <img src={sender?.avatar || msg.senderAvatar} alt={msg.senderName} className="w-4 h-4 rounded-full object-cover" />
                        <span>{msg.senderName}</span>
                        {sender && getRoleBadge(sender.role)}
                      </div>
                    )}

                    {/* Bubble */}
                    <Bubble
                      onLongPress={(x, y) => setContextMenu({ msgId: msg.id, x, y })}
                      onContextMenu={(x, y) => setContextMenu({ msgId: msg.id, x, y })}
                      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
                      className={`relative max-w-[82%] sm:max-w-md p-3 rounded-2xl text-[13px] shadow-sm
                        ${contextMenu?.msgId === msg.id ? 'scale-[0.97] brightness-90' : ''}
                        transition-all duration-150
                        ${isDeleted ? 'opacity-50 italic' : ''}
                        ${isMine
                          ? 'bg-slate-900 text-white rounded-tr-sm'
                          : msg.type === 'announcement'
                          ? 'bg-amber-50 border border-amber-200 text-slate-900 rounded-tl-sm'
                          : msg.type === 'payment_reminder'
                          ? 'bg-emerald-50 border border-emerald-200 text-slate-900 rounded-tl-sm'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm'
                        }`}
                    >
                      {msg.type === 'announcement' && !isDeleted && (
                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-amber-800 mb-1">
                          <Crown className="w-3 h-3 text-amber-600" /> Host Announcement
                        </div>
                      )}
                      {msg.type === 'payment_reminder' && !isDeleted && (
                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-emerald-800 mb-1">
                          <Wallet className="w-3 h-3 text-emerald-600" /> Settlement Reminder
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {isDeleted ? '🚫 This message was deleted' : msg.text}
                      </p>
                      {msg.amount && !isDeleted && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/10 font-mono font-bold text-[12px]">
                          Amount: {formatCurrency(msg.amount)}
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-mono opacity-60">
                        <span>{msg.timestamp}</span>
                        {isMine && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </Bubble>

                    {/* Reactions */}
                    {Object.keys(mergedReactions).length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {Object.entries(mergedReactions).map(([emoji, list]) => (
                          <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] border transition-colors ${
                              list.includes(currentUser.name) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`} title={list.join(', ')}>
                            {emoji} <span className="text-[10px] font-bold font-mono">{list.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Context menu ── */}
          {contextMenu && (() => {
            const msg = currentThreadMessages.find((m) => m.id === contextMenu.msgId);
            if (!msg) return null;
            const isMine = msg.senderId === currentUser.id;
            const menuW = 200;
            const menuH = 300;
            const left = Math.min(contextMenu.x, window.innerWidth - menuW - 12);
            const top = contextMenu.y + menuH > window.innerHeight
              ? contextMenu.y - menuH
              : contextMenu.y;
            return (
              <div
                className="fixed z-[200] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                style={{ left, top, width: menuW, minWidth: menuW }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Emoji row */}
                <div className="flex items-center justify-around px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                  {QUICK_EMOJIS.map((emoji) => {
                    const isReacted = (reactionMap[contextMenu.msgId]?.[emoji] || []).includes(currentUser.name);
                    return (
                      <button key={emoji} onClick={() => handleToggleReaction(contextMenu.msgId, emoji)}
                        className={`text-[20px] transition-transform active:scale-110 p-0.5 rounded-lg ${isReacted ? 'bg-slate-200' : ''}`}>
                        {emoji}
                      </button>
                    );
                  })}
                </div>

                {/* Reply */}
                <button onClick={() => { setReplyTo(msg); setContextMenu(null); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                  <Reply className="w-4 h-4 text-slate-500" /> Reply
                </button>

                {/* Copy */}
                <button onClick={() => handleCopy(msg.text)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border-t border-slate-100">
                  <Copy className="w-4 h-4 text-slate-500" /> Copy text
                </button>

                {/* Delete for me — always available */}
                <button onClick={() => handleDeleteForMe(msg.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border-t border-slate-100">
                  <Trash className="w-4 h-4 text-slate-500" /> Delete for me
                </button>

                {/* Delete for everyone — only sender */}
                {isMine && (
                  <button onClick={() => handleDeleteForEveryone(msg.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-t border-slate-100">
                    <Trash2 className="w-4 h-4" /> Delete for everyone
                  </button>
                )}
              </div>
            );
          })()}

          {/* Reply preview */}
          {replyTo && (
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
              <div className="flex-1 min-w-0 border-l-2 border-slate-900 pl-2">
                <p className="text-[11px] font-bold text-slate-700">{replyTo.senderName}</p>
                <p className="text-[11px] text-slate-500 truncate">{replyTo.text}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            {onOpenDepositModal && (
              <button type="button" onClick={onOpenDepositModal}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200 shrink-0">
                <Wallet className="w-4 h-4" />
              </button>
            )}
            <input
              type="text"
              placeholder={activeRecipientId === 'group' ? 'Message roommates...' : `Message ${activeChatUser?.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-2xl px-4 py-2.5 text-slate-900 outline-none text-[13px] transition-all"
            />
            <button type="submit" disabled={!inputText.trim()}
              className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
