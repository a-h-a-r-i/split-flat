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
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [reactionMap, setReactionMap] = useState<Record<string, Record<string, string[]>>>({});

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

      return {
        ...prev,
        [msgId]: {
          ...currentMsgReactions,
          [emoji]: newList,
        },
      };
    });
    setShowEmojiPickerFor(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl h-[90vh] sm:h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT SIDEBAR: Threads & Contacts list */}
        <div className="w-full md:w-80 bg-slate-50/90 border-r border-slate-200 flex flex-col shrink-0 h-44 md:h-full">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
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

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y md:divide-y-0 divide-slate-100 flex md:flex-col overflow-x-auto md:overflow-x-hidden">
            {/* 1. Flat 402 Group Thread */}
            <button
              onClick={() => setActiveRecipientId('group')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer shrink-0 md:shrink ${
                activeRecipientId === 'group'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white md:bg-transparent text-slate-800 hover:bg-slate-100/80'
              }`}
            >
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white shrink-0 shadow-xs border border-slate-600">
                <Users className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-[13px] font-bold truncate ${activeRecipientId === 'group' ? 'text-white' : 'text-slate-900'}`}>
                    Flat 402 Group
                  </span>
                  <span className={`text-[10px] font-mono ${activeRecipientId === 'group' ? 'text-slate-300' : 'text-slate-400'}`}>
                    {users.length} members
                  </span>
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${activeRecipientId === 'group' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Shared fund, chores & updates
                </p>
              </div>
            </button>

            {/* Section Divider */}
            <div className="hidden md:block pt-3 pb-1 px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                1-on-1 Direct Chats
              </span>
            </div>

            {/* 2. Roommates Direct Chats */}
            {users
              .filter((u) => u.id !== currentUser.id)
              .map((u) => {
                const isSelected = activeRecipientId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setActiveRecipientId(u.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer shrink-0 md:shrink ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white md:bg-transparent text-slate-800 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-300 shrink-0">
                      <img 
                        src={u.avatar} 
                        alt={u.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[13px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {u.name}
                        </span>
                        {getRoleBadge(u.role)}
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {u.upiId || u.phone || 'Tap to chat'}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* RIGHT AREA: Active Chat Conversation Stream */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden h-full">
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-2xs shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {activeRecipientId === 'group' ? (
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <img src={activeChatUser?.avatar} alt={activeChatUser?.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[15px] font-bold text-slate-900 truncate">
                    {activeRecipientId === 'group' ? 'Flat 402 Roommates' : activeChatUser?.name}
                  </h4>
                  {activeChatUser && getRoleBadge(activeChatUser.role)}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {activeRecipientId === 'group' 
                    ? `Public thread with all ${users.length} flatmates` 
                    : `Direct 1-on-1 private chat • ${activeChatUser?.phone || activeChatUser?.email}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeRecipientId !== 'group' && debtWithActiveUser && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-mono font-bold border border-slate-200">
                  <span>Balance:</span>
                  <span className={debtWithActiveUser.from === currentUser.id ? 'text-rose-600' : 'text-emerald-600'}>
                    {debtWithActiveUser.from === currentUser.id ? `You owe ₹${debtWithActiveUser.amount}` : `Owes you ₹${debtWithActiveUser.amount}`}
                  </span>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Nudges Bar (Above messages) */}
          <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-1.5 overflow-x-auto text-[11px] font-medium shrink-0">
            <span className="text-slate-400 text-[10px] font-mono uppercase font-bold shrink-0">
              Quick Nudges:
            </span>
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
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/40">
            {currentThreadMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-[14px] font-medium text-slate-600">No messages yet in this conversation</p>
                <p className="text-[12px] text-slate-400 max-w-xs">
                  Say hello or send a quick nudge to get the discussion started!
                </p>
              </div>
            ) : (
              currentThreadMessages.map((msg) => {
                const isSentByMe = msg.senderId === currentUser.id;
                const sender = users.find((u) => u.id === msg.senderId);
                const reactions = { ...(msg.reactions || {}), ...(reactionMap[msg.id] || {}) };

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'} group`}
                  >
                    {/* Sender Label (in group chat) */}
                    {!isSentByMe && activeRecipientId === 'group' && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1 text-[11px] text-slate-600 font-bold">
                        <img 
                          src={sender?.avatar || msg.senderAvatar} 
                          alt={msg.senderName} 
                          className="w-4 h-4 rounded-full object-cover" 
                        />
                        <span>{msg.senderName}</span>
                        {sender && getRoleBadge(sender.role)}
                      </div>
                    )}

                    {/* Message Bubble Card */}
                    <div
                      className={`relative max-w-[85%] sm:max-w-md p-3 sm:p-3.5 rounded-2xl text-[13px] shadow-2xs ${
                        isSentByMe
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : msg.type === 'announcement'
                          ? 'bg-amber-50 border border-amber-200 text-slate-900 rounded-tl-xs'
                          : msg.type === 'payment_reminder'
                          ? 'bg-emerald-50 border border-emerald-200 text-slate-900 rounded-tl-xs'
                          : 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs'
                      }`}
                    >
                      {/* Special Types Header */}
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

                      {/* Embedded Amount Badge */}
                      {msg.amount && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/10 font-mono font-bold text-[12px]">
                          <span>Amount:</span>
                          <span>{formatCurrency(msg.amount)}</span>
                        </div>
                      )}

                      {/* Timestamp & Seen Tick */}
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono ${isSentByMe ? 'text-slate-400' : 'text-slate-400'}`}>
                        <span>{msg.timestamp}</span>
                        {isSentByMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>

                    {/* Reactions Display */}
                    {Object.entries(reactions as Record<string, string[]>).some(([_, users]) => Array.isArray(users) && users.length > 0) && (
                      <div className="flex items-center gap-1 mt-1 ml-1 flex-wrap">
                        {Object.entries(reactions as Record<string, string[]>).map(([emoji, userList]) => {
                          if (!Array.isArray(userList) || userList.length === 0) return null;
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] shadow-2xs hover:bg-slate-50 transition-colors"
                              title={userList.join(', ')}
                            >
                              <span>{emoji}</span>
                              <span className="text-[10px] font-bold text-slate-600 font-mono">
                                {userList.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Reaction Button on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5 px-1">
                      {['👍', '❤️', '💸', '🔥'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="text-[12px] hover:scale-125 transition-transform p-0.5 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

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
