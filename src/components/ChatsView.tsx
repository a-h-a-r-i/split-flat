import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send, MessageSquare, Users, Crown, Shield, CheckCheck,
  ArrowRightLeft, Bell, AlertCircle, Search, ChevronLeft,
  Info, Trash2, MoreVertical, Copy, Ban, IndianRupee,
} from 'lucide-react';
import { User, ChatMessage, UserRole, DebtTransfer } from '../types';
import { formatExactCurrency } from '../utils/calculations';

interface ChatsViewProps {
  users: User[];
  currentUser: User;
  messages: ChatMessage[];
  debtTransfers?: DebtTransfer[];
  onSendMessage: (msg: Partial<ChatMessage>) => void;
  onDeleteMessageForMe?: (messageId: string) => void;
  onDeleteMessageForEveryone?: (messageId: string) => void;
  onOpenMemberProfile?: (user: User) => void;
  onOpenPhotoViewer?: (user: User) => void;
  onOpenDepositModal?: () => void;
  onOpenSendNotification?: () => void;
  onOpenSettleModal?: (fromId: string, toId: string, suggestedAmount?: number) => void;
  onMarkSeen?: (messageIds: string[]) => void;
  onUpdateTyping?: (recipientId: string, isTyping: boolean) => void;
}

const EMOJI_QUICK = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '💸'];

function groupMessages(msgs: ChatMessage[]) {
  return msgs.map((msg, i) => ({
    msg,
    isFirst: !msgs[i - 1] || msgs[i - 1].senderId !== msg.senderId,
    isLast: !msgs[i + 1] || msgs[i + 1].senderId !== msg.senderId,
  }));
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  users, currentUser, messages, debtTransfers = [],
  onSendMessage, onDeleteMessageForMe, onDeleteMessageForEveryone,
  onOpenMemberProfile, onOpenPhotoViewer, onOpenDepositModal,
  onOpenSendNotification, onOpenSettleModal, onMarkSeen, onUpdateTyping,
}) => {
  const [activeRecipientId, setActiveRecipientId] = useState('group');
  const [threadOpened, setThreadOpened] = useState(false); // true only after user clicks a thread
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [emojiDrawerOpen, setEmojiDrawerOpen] = useState(false);
  const [reactionMap, setReactionMap] = useState<Record<string, Record<string, string[]>>>({});
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [deletedForMe, setDeletedForMe] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const prevCount    = useRef(0);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef  = useRef(false);

  // ── Mark messages as seen ONLY when the thread is actually open ─────────
  useEffect(() => {
    // Must have explicitly opened a thread (clicked it)
    if (!threadOpened) return;
    // On mobile, also need the thread panel to be open
    const isMobile = window.innerWidth < 768;
    if (isMobile && !mobileThreadOpen) return;

    const unseenIds = messages
      .filter((m) => {
        if (m.senderId === currentUser.id) return false;
        if (m.seenBy?.includes(currentUser.id)) return false;
        if (activeRecipientId === 'group') return m.recipientId === 'group';
        return (
          (m.senderId === activeRecipientId && m.recipientId === currentUser.id) ||
          (m.senderId === currentUser.id && m.recipientId === activeRecipientId)
        );
      })
      .map((m) => m.id);
    if (unseenIds.length > 0) onMarkSeen?.(unseenIds);
  }, [messages, activeRecipientId, mobileThreadOpen, threadOpened, currentUser.id, onMarkSeen]);

  // ── Scroll ───────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((force = false) => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (force || nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  // Force scroll to bottom when thread changes or view opens
  useEffect(() => {
    // Small timeout so the DOM has rendered the messages first
    const t = setTimeout(() => scrollToBottom(true), 50);
    return () => clearTimeout(t);
  }, [activeRecipientId, mobileThreadOpen]);

  // Scroll on new messages (smooth if already near bottom, force if new msg)
  useEffect(() => {
    const isNew = messages.length !== prevCount.current;
    prevCount.current = messages.length;
    if (isNew) scrollToBottom(true);
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  // Close menus on outside click
  useEffect(() => {
    const h = () => { setCtxMenu(null); setEmojiPickerFor(null); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  // ── Thread filter ────────────────────────────────────────────────────────
  const threadMsgs = useMemo(() => messages.filter((m) => {
    if (deletedForMe[m.id] || m.deletedFor?.includes(currentUser.id)) return false;
    if (activeRecipientId === 'group') return m.recipientId === 'group';
    return (
      (m.senderId === currentUser.id    && m.recipientId === activeRecipientId) ||
      (m.senderId === activeRecipientId && m.recipientId === currentUser.id)
    );
  }), [messages, activeRecipientId, currentUser.id, deletedForMe]);

  const displayMsgs = useMemo(() => {
    if (!searchQuery.trim()) return threadMsgs;
    const q = searchQuery.toLowerCase();
    return threadMsgs.filter((m) => m.text.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q));
  }, [threadMsgs, searchQuery]);

  const grouped = useMemo(() => groupMessages(displayMsgs), [displayMsgs]);

  const activeChatUser = users.find((u) => u.id === activeRecipientId);
  const onlineCount    = useMemo(() => users.filter((u) => u.isOnline).length, [users]);

  // Who is typing in the current thread
  const whoIsTyping = useMemo(() =>
    users.find(
      (u) => u.id !== currentUser.id && u.typingInThread === activeRecipientId ||
             (activeRecipientId === 'group' && u.typingInThread === 'group')
    ),
  [users, currentUser.id, activeRecipientId]);

  const debtWithActive = useMemo(() => debtTransfers.find(
    (t) => (t.from === currentUser.id && t.to === activeRecipientId) ||
            (t.from === activeRecipientId && t.to === currentUser.id)
  ), [debtTransfers, currentUser.id, activeRecipientId]);

  // Unread counts per DM thread
  const unreadCounts = useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((m) => {
      if (
        m.senderId !== currentUser.id &&
        m.recipientId === currentUser.id &&
        m.senderId !== activeRecipientId &&
        !m.seenBy?.includes(currentUser.id) &&
        !m.deletedFor?.includes(currentUser.id)
      ) {
        map[m.senderId] = (map[m.senderId] || 0) + 1;
      }
    });
    return map;
  }, [messages, currentUser.id, activeRecipientId]);

  // ── Typing indicator: fires to DB with debounce ──────────────────────────
  const handleTypingStart = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onUpdateTyping?.(activeRecipientId, true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      onUpdateTyping?.(activeRecipientId, false);
    }, 2000);
  };

  const handleTypingStop = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onUpdateTyping?.(activeRecipientId, false);
    }
  };

  // Stop typing when switching thread
  useEffect(() => {
    handleTypingStop();
  }, [activeRecipientId]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const send = useCallback((
    e?: React.FormEvent,
    customText?: string,
    customType?: ChatMessage['type'],
    customAmount?: number,
  ) => {
    if (e) e.preventDefault();
    const text = customText !== undefined ? customText : inputText.trim();
    if (!text && !customAmount) return;

    if (customText === undefined) {
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
    handleTypingStop();

    const now = new Date();
    onSendMessage({
      senderId:     currentUser.id,
      senderName:   currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId:  activeRecipientId,
      text,
      timestamp:    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt:    now.toISOString(),
      type:         customType || 'text',
      amount:       customAmount,
      reactions:    {},
      seenBy:       [currentUser.id],
    });

    setEmojiDrawerOpen(false);
    scrollToBottom(true);
  }, [inputText, activeRecipientId, currentUser, onSendMessage, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Message actions ──────────────────────────────────────────────────────
  const deleteForMe  = (id: string) => { setDeletedForMe((p) => ({ ...p, [id]: true })); onDeleteMessageForMe?.(id); setCtxMenu(null); };
  const deleteForAll = (id: string) => { onDeleteMessageForEveryone?.(id); setCtxMenu(null); };
  const copyText     = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id); setTimeout(() => setCopiedId(null), 1500);
    setCtxMenu(null);
  };
  const toggleReaction = (msgId: string, emoji: string) => {
    setReactionMap((p) => {
      const cur = p[msgId]?.[emoji] || [];
      const has = cur.includes(currentUser.name);
      return { ...p, [msgId]: { ...(p[msgId] || {}), [emoji]: has ? cur.filter((n) => n !== currentUser.name) : [...cur, currentUser.name] } };
    });
    setEmojiPickerFor(null);
  };
  const openCtxMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault(); e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCtxMenu({ msgId, x: r.left, y: r.top });
    setEmojiPickerFor(null);
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === 'host') return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Crown className="w-2.5 h-2.5" /> Host
      </span>
    );
    if (role === 'co-host') return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Shield className="w-2.5 h-2.5" /> Co-Host
      </span>
    );
    return null;
  };

  // ── Tick logic: grey = sent, grey double = delivered, blue double = seen ─
  const getTickIcon = (msg: ChatMessage) => {
    if (msg.senderId !== currentUser.id) return null;
    if (msg.isDeletedForEveryone) return null;
    // Seen = recipient has it in their seenBy
    const recipientId = msg.recipientId;
    const isSeen = recipientId === 'group'
      ? (msg.seenBy?.length || 0) > 1
      : msg.seenBy?.includes(recipientId);
    if (isSeen) return <CheckCheck className="w-3.5 h-3.5 text-sky-300" />;
    return <CheckCheck className="w-3.5 h-3.5 text-white/40" />;
  };

  const groupQuickReplies  = ['🛒 Need groceries', '🧹 Cleaned hall', '💧 Water ordered', '⚡ Bill paid', '🍕 Order dinner?'];
  const directQuickReplies = ['👍 Got it!', '💸 Sent on UPI', '🤝 Settled, thanks!', '📞 Call me', '✅ Done!'];

  // ── SIDEBAR ───────────────────────────────────────────────────────────────
  const sidebar = (
    <div className={`flex flex-col bg-white border-r border-slate-200 h-full min-h-0 md:col-span-4 ${mobileThreadOpen ? 'hidden md:flex' : 'flex'}`}>
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-sm">Chats</span>
        </div>
        {onOpenSendNotification && (currentUser.role === 'host' || currentUser.role === 'co-host') && (
          <button onClick={onOpenSendNotification} className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
            <Bell className="w-3 h-3 text-amber-300" /> Broadcast
          </button>
        )}
      </div>

      <div className="px-3 py-2 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group */}
        <button onClick={() => { setActiveRecipientId('group'); setMobileThreadOpen(true); setThreadOpened(true); }}
          className={`w-full px-4 py-3 flex items-center gap-3 text-left cursor-pointer border-l-[3px] transition-colors ${activeRecipientId === 'group' ? 'bg-slate-100 border-slate-900' : 'hover:bg-slate-50 border-transparent'}`}>
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-sm"><Users className="w-5 h-5" /></div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900">Flat 402 Group</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-slate-400">{[...messages].reverse().find((m) => m.recipientId === 'group')?.timestamp || ''}</span>
                {(() => {
                  const groupUnread = messages.filter(
                    (m) => m.recipientId === 'group' && m.senderId !== currentUser.id && !m.seenBy?.includes(currentUser.id)
                  ).length;
                  return groupUnread > 0 ? (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {groupUnread > 9 ? '9+' : groupUnread}
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {[...messages].reverse().find((m) => m.recipientId === 'group')?.text || '📢 Shared notices & chores'}
            </p>
          </div>
        </button>

        <div className="px-4 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-y border-slate-100">
          Direct Messages
        </div>

        {users.filter((u) => u.id !== currentUser.id).sort((a, b) => {
          // Sort by latest message timestamp — most recent at top
          const lastA = [...messages].reverse().find(
            (m) => (m.senderId === currentUser.id && m.recipientId === a.id) ||
                   (m.senderId === a.id && m.recipientId === currentUser.id)
          );
          const lastB = [...messages].reverse().find(
            (m) => (m.senderId === currentUser.id && m.recipientId === b.id) ||
                   (m.senderId === b.id && m.recipientId === currentUser.id)
          );
          const timeA = lastA?.createdAt || '0';
          const timeB = lastB?.createdAt || '0';
          return timeB.localeCompare(timeA);
        }).map((user) => {
          const isActive    = activeRecipientId === user.id;
          const lastDm      = [...messages].reverse().find(
            (m) => (m.senderId === currentUser.id && m.recipientId === user.id) ||
                   (m.senderId === user.id         && m.recipientId === currentUser.id)
          );
          const debt        = debtTransfers.find((t) => (t.from === currentUser.id && t.to === user.id) || (t.from === user.id && t.to === currentUser.id));
          const unreadCount = unreadCounts[user.id] || 0;
          const isTypingNow = user.typingInThread === currentUser.id || (activeRecipientId === 'group' && user.typingInThread === 'group');

          return (
            <button key={user.id} onClick={() => { setActiveRecipientId(user.id); setMobileThreadOpen(true); setThreadOpened(true); }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left cursor-pointer border-l-[3px] transition-colors ${isActive ? 'bg-slate-100 border-indigo-600' : 'hover:bg-slate-50 border-transparent'}`}>
              <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); if (onOpenPhotoViewer) onOpenPhotoViewer(user); else if (onOpenMemberProfile) onOpenMemberProfile(user); }}>
                <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200 cursor-pointer">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'; }} />
                </div>
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-sm text-slate-900 truncate">{user.name}</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400">{lastDm?.timestamp || ''}</span>
                    {unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-0.5 gap-2">
                  <p className="text-[11px] truncate">
                    {isTypingNow
                      ? <span className="text-emerald-600 font-semibold italic">typing…</span>
                      : lastDm?.isDeletedForEveryone
                        ? <span className="italic text-slate-400">Message deleted</span>
                        : <span className="text-slate-500">{lastDm?.text || 'Tap to message'}</span>}
                  </p>
                  {debt && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${debt.from === currentUser.id ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {debt.from === currentUser.id ? `-₹${Math.round(debt.amount)}` : `+₹${Math.round(debt.amount)}`}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── CHAT AREA ─────────────────────────────────────────────────────────────
  const chatArea = (
    <div className={`flex flex-col bg-[#f0f2f5] h-full min-h-0 md:col-span-8 ${!mobileThreadOpen ? 'hidden md:flex' : 'flex'}`}>

      {/* Header */}
      <div className="px-3 py-2.5 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0 shadow-sm">
        <button onClick={() => setMobileThreadOpen(false)} className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button onClick={() => { if (activeRecipientId !== 'group' && activeChatUser) { if (onOpenPhotoViewer) onOpenPhotoViewer(activeChatUser); else if (onOpenMemberProfile) onOpenMemberProfile(activeChatUser); } }}
          className="relative shrink-0 cursor-pointer">
          {activeRecipientId === 'group'
            ? <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center"><Users className="w-4 h-4" /></div>
            : <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200">
                <img src={activeChatUser?.avatar} alt={activeChatUser?.name} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'; }} />
              </div>}
          {activeRecipientId !== 'group' && (
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${activeChatUser?.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          )}
        </button>

        <button className="flex-1 min-w-0 text-left cursor-pointer"
          onClick={() => { if (activeChatUser && onOpenMemberProfile) onOpenMemberProfile(activeChatUser); }}>
          <p className="font-semibold text-sm text-slate-900 truncate">
            {activeRecipientId === 'group' ? 'Flat 402 Roommates' : activeChatUser?.name}
          </p>
          <p className="text-[11px] truncate">
            {activeRecipientId === 'group'
              ? <span className="text-slate-500">{users.length} members • {onlineCount} online</span>
              : whoIsTyping && whoIsTyping.id === activeChatUser?.id
                ? <span className="text-emerald-600 font-semibold">typing…</span>
                : activeChatUser?.isOnline
                  ? <span className="text-emerald-600 font-medium">Online</span>
                  : <span className="text-slate-400">{activeChatUser?.lastSeen ? `Last seen ${activeChatUser.lastSeen}` : 'Offline'}</span>}
          </p>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {activeRecipientId !== 'group' && debtWithActive && (
            debtWithActive.from === currentUser.id
              ? <button onClick={() => onOpenSettleModal?.(currentUser.id, activeRecipientId, debtWithActive.amount)}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Pay ₹{Math.round(debtWithActive.amount)}
                </button>
              : <button onClick={() => send(undefined, `🔔 Reminder: ₹${Math.round(debtWithActive.amount)} pending. UPI: ${currentUser.upiId || 'GPay'}`, 'payment_reminder', debtWithActive.amount)}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer">
                  <Bell className="w-3.5 h-3.5 text-amber-300" /> Remind
                </button>
          )}
          {activeRecipientId !== 'group' && activeChatUser && onOpenMemberProfile && (
            <button onClick={() => onOpenMemberProfile(activeChatUser)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Debt bar */}
      {activeRecipientId !== 'group' && debtWithActive && (
        <div className={`px-4 py-2 text-xs font-medium flex items-center justify-between border-b shrink-0 ${debtWithActive.from === currentUser.id ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {debtWithActive.from === currentUser.id
                ? `You owe ${activeChatUser?.name} ${formatExactCurrency(debtWithActive.amount)}`
                : `${activeChatUser?.name} owes you ${formatExactCurrency(debtWithActive.amount)}`}
            </span>
          </div>
          {activeChatUser?.upiId && debtWithActive.from === currentUser.id && (
            <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border shrink-0 ml-2 border-rose-200 text-slate-800">{activeChatUser.upiId}</span>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-0.5"
        onClick={() => { setCtxMenu(null); setEmojiPickerFor(null); }}>

        <div className="flex items-center justify-center mb-4">
          <span className="px-3 py-1 rounded-full bg-white/80 text-slate-500 text-[11px] font-medium shadow-sm border border-slate-200/80">Today</span>
        </div>

        {displayMsgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">
              {activeRecipientId === 'group' ? 'Be the first to say something!' : `Start a conversation with ${activeChatUser?.name}`}
            </p>
          </div>
        )}

        {grouped.map(({ msg, isFirst, isLast }, idx) => {
          const isMe       = msg.senderId === currentUser.id;
          const isDeleted  = msg.isDeletedForEveryone;
          const senderUser = users.find((u) => u.id === msg.senderId);
          const reactions  = { ...(reactionMap[msg.id] || {}), ...(msg.reactions || {}) };

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirst && idx > 0 ? 'mt-3' : 'mt-0.5'}`}>

              {/* Sender name in group */}
              {!isMe && isFirst && activeRecipientId === 'group' && (
                <button onClick={() => senderUser && onOpenMemberProfile?.(senderUser)}
                  className="text-[11px] font-semibold text-indigo-600 ml-9 mb-0.5 hover:underline cursor-pointer">
                  {msg.senderName}
                </button>
              )}

              <div className={`flex items-end gap-1.5 max-w-[82%] sm:max-w-[68%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {!isMe && (
                  <div className="w-7 h-7 shrink-0 mb-1">
                    {isLast ? (
                      <button onClick={(e) => { e.stopPropagation(); if (senderUser) { if (onOpenPhotoViewer) onOpenPhotoViewer(senderUser); else if (onOpenMemberProfile) onOpenMemberProfile(senderUser); } }}
                        className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all">
                        <img src={msg.senderAvatar || ''} alt={msg.senderName} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'; }} />
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Bubble */}
                <div className="group relative">
                  <div onContextMenu={(e) => openCtxMenu(e, msg.id)}
                    className={`relative px-3.5 py-2 shadow-sm select-text cursor-default
                      ${isDeleted ? 'bg-slate-100 text-slate-400 border border-slate-200 italic rounded-2xl'
                        : isMe ? `bg-[#005c4b] text-white ${isFirst ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
                        : msg.type === 'announcement' ? `bg-amber-50 border border-amber-200 text-amber-950 ${isFirst ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
                        : msg.type === 'payment_reminder' ? `bg-indigo-50 border border-indigo-200 text-indigo-950 ${isFirst ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
                        : `bg-white text-slate-900 border border-slate-100 ${isFirst ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
                      }`}>
                    {isDeleted ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400"><Ban className="w-3.5 h-3.5" /><span>This message was deleted</span></div>
                    ) : (
                      <>
                        {msg.type === 'announcement' && (
                          <div className="flex items-center gap-1 text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-1"><Bell className="w-3 h-3 fill-amber-500" /> Flat Notice</div>
                        )}
                        {msg.type === 'payment_reminder' && (
                          <div className="flex items-center gap-1 text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-1"><IndianRupee className="w-3 h-3" /> Payment Nudge</div>
                        )}
                        <p className="text-[13px] leading-[1.45] whitespace-pre-wrap break-words">{msg.text}</p>
                        {msg.amount && (
                          <div className={`mt-2 p-2 rounded-xl flex items-center justify-between gap-2 ${isMe ? 'bg-white/10' : 'bg-black/5 border border-black/10'}`}>
                            <span className={`text-xs font-semibold ${isMe ? 'text-white/90' : 'text-slate-800'}`}>₹{Math.round(msg.amount)} pending</span>
                            {!isMe && <button onClick={() => onOpenSettleModal?.(currentUser.id, msg.senderId, msg.amount)}
                              className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer">Settle</button>}
                          </div>
                        )}
                        {/* Time + tick */}
                        <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                          <span className="text-[10px]">{msg.timestamp}</span>
                          {getTickIcon(msg)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Hover actions */}
                  {!isDeleted && (
                    <div className={`absolute top-1 ${isMe ? 'right-full mr-1' : 'left-full ml-1'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}>
                      <button onClick={(e) => { e.stopPropagation(); setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id); setCtxMenu(null); }}
                        className="p-1 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 cursor-pointer text-xs">😊</button>
                      <button onClick={(e) => openCtxMenu(e, msg.id)}
                        className="p-1 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500 cursor-pointer">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Emoji picker */}
                  {emojiPickerFor === msg.id && (
                    <div onClick={(e) => e.stopPropagation()}
                      className={`absolute z-30 bottom-full mb-2 flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-full shadow-xl ${isMe ? 'right-0' : 'left-0'}`}>
                      {EMOJI_QUICK.map((em) => (
                        <button key={em} onClick={() => toggleReaction(msg.id, em)}
                          className="text-base hover:scale-125 transition-transform p-0.5 cursor-pointer rounded-full hover:bg-slate-100">{em}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reactions */}
              {!isDeleted && Object.entries(reactions).some(([, l]) => Array.isArray(l) && (l as string[]).length > 0) && (
                <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end pr-1' : 'justify-start pl-9'}`}>
                  {Object.entries(reactions).map(([em, list]) => {
                    const l = list as string[];
                    if (!Array.isArray(l) || l.length === 0) return null;
                    return (
                      <button key={em} onClick={() => toggleReaction(msg.id, em)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-xs shadow-xs hover:bg-slate-50 cursor-pointer" title={l.join(', ')}>
                        {em} <span className="text-[10px] font-bold text-slate-600">{l.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator — shows when the other person is actually typing */}
        {whoIsTyping && (
          <div className="flex items-end gap-1.5 mt-3 animate-fadeIn">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 shrink-0">
              <img src={whoIsTyping.avatar} alt={whoIsTyping.name} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'; }} />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Quick replies */}
      <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">Quick:</span>
        {(activeRecipientId === 'group' ? groupQuickReplies : directQuickReplies).map((r, i) => (
          <button key={i} onClick={() => send(undefined, r)}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer shrink-0 active:scale-95 transition-all">{r}</button>
        ))}
      </div>

      {/* Emoji drawer */}
      {emojiDrawerOpen && (
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {['👍','❤️','👏','💰','💸','😂','🔥','🙌','⚡','🎉','🤝','🍕','🛒','🧹','☕','🥂'].map((em) => (
            <button key={em} onClick={() => { setInputText((p) => p + em); textareaRef.current?.focus(); }}
              className="text-xl hover:scale-125 transition-transform cursor-pointer p-1 rounded-lg hover:bg-slate-100">{em}</button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form onSubmit={send} className="px-3 py-2.5 bg-white border-t border-slate-200 flex items-end gap-2 shrink-0">
        <button type="button" onClick={() => setEmojiDrawerOpen((p) => !p)}
          className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${emojiDrawerOpen ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
          <span className="text-xl leading-none">😊</span>
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            resizeTextarea();
            if (e.target.value.trim()) handleTypingStart();
            else handleTypingStop();
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleTypingStop}
          placeholder={activeRecipientId === 'group' ? 'Message Flat 402…' : `Message ${activeChatUser?.name || 'roommate'}…`}
          className="flex-1 resize-none overflow-hidden px-4 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 focus:bg-white transition-all leading-snug"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button type="submit" disabled={!inputText.trim()}
          className="w-10 h-10 rounded-full bg-[#005c4b] hover:bg-[#00483b] disabled:bg-slate-300 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0 shadow-sm">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  const ctxMsg  = ctxMenu ? messages.find((m) => m.id === ctxMenu.msgId) || null : null;
  const ctxIsMe = ctxMsg?.senderId === currentUser.id;

  return (
    <div className="flex flex-col min-h-0 h-full w-full">
      {/* Chat panel — fills full remaining height */}
      <div className="flex-1 min-h-0 bg-white md:rounded-2xl md:border border-slate-200 shadow-sm overflow-hidden flex flex-col md:grid md:grid-cols-12">
        {sidebar}
        {chatArea}
      </div>

      {/* Context menu */}
      {ctxMenu && ctxMsg && (
        <div className="fixed z-50 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1 overflow-hidden"
          style={{ top: Math.min(ctxMenu.y, window.innerHeight - 160), left: Math.min(ctxMenu.x, window.innerWidth - 200) }}
          onClick={(e) => e.stopPropagation()}>
          <button onClick={() => copyText(ctxMsg.text, ctxMsg.id)}
            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer text-sm">
            <Copy className="w-4 h-4 text-slate-400" />{copiedId === ctxMsg.id ? 'Copied!' : 'Copy Text'}
          </button>
          <button onClick={() => deleteForMe(ctxMsg.id)}
            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer text-sm">
            <Trash2 className="w-4 h-4 text-slate-400" />Delete for Me
          </button>
          {(ctxIsMe || currentUser.role === 'host') && (
            <>
              <div className="border-t border-slate-100 my-0.5" />
              <button onClick={() => deleteForAll(ctxMsg.id)}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-rose-50 text-rose-600 font-semibold cursor-pointer text-sm">
                <Ban className="w-4 h-4 text-rose-400" />Delete for Everyone
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
