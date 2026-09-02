import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Users, 
  User as UserIcon, 
  Smile, 
  Sparkles, 
  Crown, 
  Shield, 
  Check, 
  CheckCheck, 
  Paperclip, 
  Wallet, 
  ArrowRightLeft, 
  QrCode, 
  Plus, 
  Bell, 
  Phone,
  AlertCircle
} from 'lucide-react';
import { User, ChatMessage, UserRole, DebtTransfer } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/calculations';

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

export const RoommateMessengerModal: React.FC<RoommateMessengerModalProps> = ({
  isOpen,
  users,
  currentUser,
  messages,
  debtTransfers = [],
  onClose,
  onSendMessage,
  onOpenDepositModal,
  onOpenAddExpense,
  onOpenSendNotification,
}) => {
  // 'group' or specific userId ('u1', 'u2', 'u3', 'u4')
  const [activeRecipientId, setActiveRecipientId] = useState<string>('group');
  const [inputText, setInputText] = useState('');
  const [reactionMap, setReactionMap] = useState<Record<string, Record<string, string[]>>>({});
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeRecipientId]);

  // Filter messages for current thread
  const currentThreadMessages = messages.filter((m) => {
    if (activeRecipientId === 'group') {
      return m.recipientId === 'group';
    }
    // 1-on-1: messages between currentUser and activeRecipientId
    return (
      (m.senderId === currentUser.id && m.recipientId === activeRecipientId) ||
      (m.senderId === activeRecipientId && m.recipientId === currentUser.id)
    );
  });

  const activeChatUser = users.find((u) => u.id === activeRecipientId);

  // Check debt relationship with active 1-on-1 user
  const debtWithActiveUser = debtTransfers.find(
    (t) =>
      (t.from === currentUser.id && t.to === activeRecipientId) ||
      (t.from === activeRecipientId && t.to === currentUser.id)
  );

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');
    const now = new Date();

    onSendMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId: activeRecipientId,
      text: textToSend,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString(),
      type: 'text',
    });

    // Realistic roommate auto-reply simulation for testing
    if (activeRecipientId !== 'group') {
      const recipient = users.find((u) => u.id === activeRecipientId);
      if (recipient) {
        setTimeout(() => {
          const autoReplies = [
            `Got it ${currentUser.name}! Checking this right now.`,
            `Thanks for the update! Done 👍`,
            `Sounds good! Let's settle it over UPI.`,
            `Noted! I'll update my records too.`,
          ];
          const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
          const replyNow = new Date();
          onSendMessage({
            senderId: recipient.id,
            senderName: recipient.name,
            senderAvatar: recipient.avatar,
            recipientId: currentUser.id,
            text: randomReply,
            timestamp: replyNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: replyNow.toISOString(),
            type: 'text',
          });
        }, 1200);
      }
    }
  };

  const handleSendQuickNudge = (nudgeText: string, type: ChatMessage['type'] = 'nudge') => {
    const now = new Date();
    onSendMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId: activeRecipientId,
      text: nudgeText,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString(),
      type: type,
    });
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setReactionMap((prev) => {
      const currentMsgReactions = prev[msgId] || {};
      const currentList = currentMsgReactions[emoji] || [];
      const hasReacted = currentList.includes(currentUser.name);
      const newList = hasReacted
        ? currentList.filter((name) => name !== currentUser.name)
        : [...currentList, currentUser.name];
      return { ...prev, [msgId]: { ...currentMsgReactions, [emoji]: newList } };
    });
    setContextMenu(null);
  };

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent, msgId: string) => {
    const touch = 'touches' in e ? e.touches[0] : e as React.MouseEvent;
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ msgId, x, y });
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setContextMenu(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'host':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Crown className="w-2.5 h-2.5 text-amber-600" /> Host
          </span>
        );
      case 'co-host':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Shield className="w-2.5 h-2.5 text-slate-700" /> Co-Host
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:items-center md:justify-center md:p-4 md:bg-slate-900/60 md:backdrop-blur-sm">
      <div className="w-full h-[100dvh] md:h-[85vh] md:max-w-4xl bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-2xl flex flex-col md:flex-row overflow-hidden">

        {/* LEFT SIDEBAR: on mobile = horizontal avatar strip, on desktop = full sidebar */}
        <div className="w-full md:w-80 bg-slate-50/90 md:border-r border-slate-200 flex flex-col shrink-0 md:h-full">
          {/* Header — desktop only */}
          <div className="hidden md:flex p-3.5 sm:p-4 border-b border-slate-200/80 items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
                  Roommate Messenger
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">Flat 402 Live Chat</span>
              </div>
            </div>
            {onOpenSendNotification && (
              <button
                onClick={onOpenSendNotification}
                title="Broadcast Push Alert"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
              >
                <Bell className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile: horizontal avatar row */}
          <div className="md:hidden flex items-center gap-3 px-3 py-2 border-b border-slate-200 bg-white overflow-x-auto no-scrollbar shrink-0">
            {/* Group */}
            <button
              onClick={() => setActiveRecipientId('group')}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs border ${
                activeRecipientId === 'group'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <Users className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <span className={`text-[10px] font-bold truncate max-w-[44px] ${activeRecipientId === 'group' ? 'text-slate-900' : 'text-slate-500'}`}>
                Group
              </span>
            </button>
            {/* Individual users */}
            {users.filter((u) => u.id !== currentUser.id).map((u) => {
              const isSelected = activeRecipientId === u.id;
              return (
                <button key={u.id} onClick={() => setActiveRecipientId(u.id)} className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`relative w-11 h-11 rounded-full overflow-hidden border-2 ${isSelected ? 'border-slate-900' : 'border-slate-200'}`}>
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'; }}
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <span className={`text-[10px] font-bold truncate max-w-[44px] ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                    {u.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop: full threads list */}
          <div className="hidden md:flex flex-1 overflow-y-auto p-2 space-y-1 flex-col">
            <button
              onClick={() => setActiveRecipientId('group')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                activeRecipientId === 'group' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800 hover:bg-slate-100/80'
              }`}
            >
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white shrink-0 shadow-xs border border-slate-600">
                <Users className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-[13px] font-bold truncate ${activeRecipientId === 'group' ? 'text-white' : 'text-slate-900'}`}>Flat 402 Group</span>
                  <span className={`text-[10px] font-mono ${activeRecipientId === 'group' ? 'text-slate-300' : 'text-slate-400'}`}>{users.length} members</span>
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${activeRecipientId === 'group' ? 'text-slate-300' : 'text-slate-500'}`}>Shared fund, chores & updates</p>
              </div>
            </button>
            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">1-on-1 Direct Chats</span>
            </div>
            {users.filter((u) => u.id !== currentUser.id).map((u) => {
              const isSelected = activeRecipientId === u.id;
              return (
                <button key={u.id} onClick={() => setActiveRecipientId(u.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-300 shrink-0">
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'; }}
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{u.name}</span>
                      {getRoleBadge(u.role)}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{u.upiId || u.phone || 'Tap to chat'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT AREA: Active Chat Conversation Stream */}
        <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
          {/* Chat Header */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white shadow-2xs shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {activeRecipientId === 'group' ? (
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <img src={activeChatUser?.avatar} alt={activeChatUser?.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[14px] font-bold text-slate-900 truncate">
                    {activeRecipientId === 'group' ? 'Flat 402 Roommates' : activeChatUser?.name}
                  </h4>
                  {activeChatUser && getRoleBadge(activeChatUser.role)}
                </div>
                <p className="text-[10px] text-emerald-500 font-semibold">Online</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeRecipientId !== 'group' && debtWithActiveUser && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-mono font-bold border border-slate-200">
                  <span className={debtWithActiveUser.from === currentUser.id ? 'text-rose-600' : 'text-emerald-600'}>
                    {debtWithActiveUser.from === currentUser.id ? `You owe ₹${debtWithActiveUser.amount}` : `Owes you ₹${debtWithActiveUser.amount}`}
                  </span>
                </div>
              )}
              {onOpenSendNotification && (
                <button onClick={onOpenSendNotification} title="Broadcast Push Alert"
                  className="md:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 transition-colors cursor-pointer border border-slate-200">
                  <Bell className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Nudges Bar */}
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-medium shrink-0">
            <span className="text-slate-400 text-[10px] font-mono uppercase font-bold shrink-0">Quick:</span>
            {activeRecipientId === 'group' ? (
              <>
                <button
                  onClick={() => handleSendQuickNudge('📢 Room Fund Reminder: Please contribute to the shared monthly pool!', 'announcement')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 transition-colors cursor-pointer"
                >
                  💰 Room Pool Deposit
                </button>
                <button
                  onClick={() => handleSendQuickNudge('🍕 Ordering dinner / snacks! Who is in?', 'text')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 transition-colors cursor-pointer"
                >
                  🍕 Food Order Split
                </button>
                <button
                  onClick={() => handleSendQuickNudge('🧹 Maid is coming tomorrow morning. Please keep rooms and kitchen tidy.', 'text')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 transition-colors cursor-pointer"
                >
                  🧹 Cleaning Reminder
                </button>
                <button
                  onClick={() => handleSendQuickNudge('⚡ Monthly power & utility bills have been updated in Ledger.', 'announcement')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 transition-colors cursor-pointer"
                >
                  ⚡ Utility Notice
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSendQuickNudge(`Hey ${activeChatUser?.name}, please check the ledger and clear pending balance via UPI!`, 'payment_reminder')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 transition-colors cursor-pointer"
                >
                  💸 Settle UPI Dues
                </button>
                <button
                  onClick={() => handleSendQuickNudge(`Hey ${activeChatUser?.name}, did you deposit the monthly room fund share?`, 'text')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 transition-colors cursor-pointer"
                >
                  💳 Room Fund Check
                </button>
                <button
                  onClick={() => handleSendQuickNudge(`Shared the receipt for our recent split. Thanks!`, 'text')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 transition-colors cursor-pointer"
                >
                  🧾 Receipt Shared
                </button>
              </>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-slate-50/40" onClick={() => setContextMenu(null)}>
            {currentThreadMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-[14px] font-medium text-slate-600">No messages yet in this conversation</p>
                <p className="text-[12px] text-slate-400 max-w-xs">Say hello or send a quick nudge to get the discussion started!</p>
              </div>
            ) : (
              currentThreadMessages.map((msg) => {
                const isSentByMe = msg.senderId === currentUser.id;
                const sender = users.find((u) => u.id === msg.senderId);
                // Merge DB reactions with local reaction map
                const mergedReactions: Record<string, string[]> = {};
                const dbReactions = (msg.reactions || {}) as Record<string, string[]>;
                const localReactions = reactionMap[msg.id] || {};
                const allEmojis = new Set([...Object.keys(dbReactions), ...Object.keys(localReactions)]);
                allEmojis.forEach((emoji) => {
                  const dbList = Array.isArray(dbReactions[emoji]) ? dbReactions[emoji] : [];
                  const localList = Array.isArray(localReactions[emoji]) ? localReactions[emoji] : [];
                  const merged = Array.from(new Set([...dbList, ...localList]));
                  if (merged.length > 0) mergedReactions[emoji] = merged;
                });

                return (
                  <div key={msg.id} className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender label in group chat */}
                    {!isSentByMe && activeRecipientId === 'group' && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1 text-[11px] text-slate-600 font-bold">
                        <img src={sender?.avatar || msg.senderAvatar} alt={msg.senderName} className="w-4 h-4 rounded-full object-cover" />
                        <span>{msg.senderName}</span>
                        {sender && getRoleBadge(sender.role)}
                      </div>
                    )}

                    {/* Bubble with long-press */}
                    <div
                      onTouchStart={(e) => handleLongPressStart(e, msg.id)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchMove={handleLongPressEnd}
                      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY }); }}
                      className={`relative max-w-[85%] sm:max-w-md p-3 rounded-2xl text-[13px] shadow-2xs select-none cursor-pointer active:scale-[0.98] transition-transform ${
                        isSentByMe
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : msg.type === 'announcement'
                          ? 'bg-amber-50 border border-amber-200 text-slate-900 rounded-tl-xs'
                          : msg.type === 'payment_reminder'
                          ? 'bg-emerald-50 border border-emerald-200 text-slate-900 rounded-tl-xs'
                          : 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs'
                      }`}
                    >
                      {msg.type === 'announcement' && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-amber-800 mb-1">
                          <Crown className="w-3 h-3 text-amber-600" /> Host Announcement
                        </div>
                      )}
                      {msg.type === 'payment_reminder' && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-emerald-800 mb-1">
                          <Wallet className="w-3 h-3 text-emerald-600" /> Settlement Reminder
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      {msg.amount && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/10 font-mono font-bold text-[12px]">
                          <span>Amount:</span><span>{formatCurrency(msg.amount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-mono text-slate-400">
                        <span>{msg.timestamp}</span>
                        {isSentByMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>

                    {/* Reactions row — always rendered when there are reactions */}
                    {Object.keys(mergedReactions).length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {Object.entries(mergedReactions).map(([emoji, userList]) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border transition-colors ${
                              userList.includes(currentUser.name)
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                            title={userList.join(', ')}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-bold font-mono">{userList.length}</span>
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

          {/* Context Menu (long-press / right-click) */}
          {contextMenu && (() => {
            const msg = currentThreadMessages.find((m) => m.id === contextMenu.msgId);
            if (!msg) return null;
            const isMine = msg.senderId === currentUser.id;
            // Position menu so it doesn't go off screen
            const menuW = 180;
            const menuH = 220;
            const left = Math.min(contextMenu.x, window.innerWidth - menuW - 8);
            const top = Math.min(contextMenu.y, window.innerHeight - menuH - 8);
            return (
              <div
                className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-44"
                style={{ left, top }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Quick react row */}
                <div className="flex items-center justify-around px-2 py-2 border-b border-slate-100">
                  {['👍', '❤️', '😂', '💸', '🔥', '👏'].map((emoji) => (
                    <button key={emoji} onClick={() => handleToggleReaction(contextMenu.msgId, emoji)}
                      className="text-[18px] hover:scale-125 transition-transform p-0.5 cursor-pointer">
                      {emoji}
                    </button>
                  ))}
                </div>
                <button onClick={() => handleCopyMessage(msg.text)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                  📋 Copy
                </button>
                <button onClick={() => { handleToggleReaction(contextMenu.msgId, '👍'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                  👍 React
                </button>
                {isMine && (
                  <button onClick={() => { setContextMenu(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-t border-slate-100">
                    🗑️ Delete
                  </button>
                )}
                <button onClick={() => setContextMenu(null)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer border-t border-slate-100">
                  ✕ Cancel
                </button>
              </div>
            );
          })()}

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            {/* Quick Action Shortcuts */}
            {onOpenDepositModal && (
              <button
                type="button"
                onClick={onOpenDepositModal}
                title="Hand Over Room Money"
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200 shrink-0"
              >
                <Wallet className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              placeholder={activeRecipientId === 'group' ? 'Message Flat 402 roommates...' : `Message ${activeChatUser?.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-2xl px-4 py-2.5 text-slate-900 outline-none text-[13px] transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
