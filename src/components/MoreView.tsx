import React, { useState } from 'react';
import { 
  Users, 
  ArrowRightLeft, 
  Download, 
  Plus, 
  Printer, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  Mail, 
  Send, 
  Crown, 
  Shield, 
  Key, 
  QrCode,
  MessageSquare,
  Bell,
  CheckCheck,
  AlertTriangle,
  Settings,
  ChevronRight,
  UserPlus,
  Wallet,
  ShieldCheck,
  BadgeAlert,
  Zap,
  Info
} from 'lucide-react';
import { User, Expense, SettlementRecord, DebtTransfer, MemberInvite, UserRole, ChatMessage } from '../types';
import { 
  UserBalanceSummary, 
  formatCurrency, 
  formatExactCurrency, 
  CURRENT_DATE_STRING 
} from '../utils/calculations';

interface MoreViewProps {
  users: User[];
  currentUser: User;
  userSummaries: UserBalanceSummary[];
  debtTransfers: DebtTransfer[];
  expenses: Expense[];
  settlements: SettlementRecord[];
  invites?: MemberInvite[];
  messages?: ChatMessage[];
  unreadMessagesCount?: number;
  onAddUser: (user: Partial<User>) => void;
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
  onRecordSettlement: (settlement: Partial<SettlementRecord>) => void;
  onDeleteSettlement?: (id: string) => void;
  onOpenInviteModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenMessenger?: () => void;
  onOpenSendNotification?: () => void;
  onOpenNotifications?: () => void;
  onOpenDepositModal?: () => void;
  onOpenSetCollectionModal?: () => void;
  onRevokeInvite?: (id: string) => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  users,
  currentUser,
  userSummaries,
  debtTransfers,
  expenses,
  settlements,
  invites = [],
  messages = [],
  unreadMessagesCount = 0,
  onAddUser,
  onUpdateUserRole,
  onRecordSettlement,
  onDeleteSettlement,
  onOpenInviteModal,
  onOpenProfileModal,
  onOpenMessenger,
  onOpenSendNotification,
  onOpenNotifications,
  onOpenDepositModal,
  onOpenSetCollectionModal,
  onRevokeInvite,
}) => {
  const [activeMenuTab, setActiveMenuTab] = useState<'all' | 'host_hub' | 'messenger' | 'settlements' | 'members'>('all');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [fromUser, setFromUser] = useState(users[1]?.id || 'u2');
  const [toUser, setToUser] = useState(users[0]?.id || 'u1');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');
  const [settleNote, setSettleNote] = useState('');

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('member');

  // Role Management State
  const [selectedUserForRole, setSelectedUserForRole] = useState<string | null>(null);

  const isHost = currentUser.role === 'host';
  const isCoHost = currentUser.role === 'co-host';
  const isHostOrCoHost = isHost || isCoHost;

  const pendingApprovalsCount = expenses.filter(e => e.status === 'pending_approval').length;

  // Handle Quick Settle
  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0 || fromUser === toUser) {
      alert('Please enter a valid settlement amount between two different members.');
      return;
    }

    onRecordSettlement({
      fromUserId: fromUser,
      toUserId: toUser,
      amount: amt,
      date: CURRENT_DATE_STRING,
      paymentMethod: settleMethod,
      note: settleNote.trim() || undefined,
    });

    setSettleAmount('');
    setSettleNote('');
    setShowSettleModal(false);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    onAddUser({
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '')}@flat402.local`,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      role: newMemberRole,
    });

    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('member');
    setShowAddMemberModal(false);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Category', 'Paid By', 'Amount (INR)', 'Status', 'Notes'];
    const rows = expenses.map((exp) => [
      exp.date,
      `"${exp.title.replace(/"/g, '""')}"`,
      exp.category,
      exp.paidByName || 'Member',
      exp.amount,
      exp.status || 'approved',
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EquityHub_Flat402_Ledger_${CURRENT_DATE_STRING}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'host':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Crown className="w-3 h-3 text-amber-600" /> Host
          </span>
        );
      case 'co-host':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Shield className="w-3 h-3 text-slate-700" /> Co-Host
          </span>
        );
      case 'member':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Users className="w-3 h-3 text-slate-500" /> Member
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-[1280px] mx-auto pt-3 md:pt-4">
      {/* 0. Top Category Segment Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => setActiveMenuTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeMenuTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Menu Options
        </button>

        {isHostOrCoHost && (
          <button
            onClick={() => setActiveMenuTab('host_hub')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeMenuTab === 'host_hub'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Host & Co-Host Controls
            {pendingApprovalsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
        )}

        <button
          onClick={() => setActiveMenuTab('messenger')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeMenuTab === 'messenger'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Roommate Messenger
        </button>

        <button
          onClick={() => setActiveMenuTab('settlements')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeMenuTab === 'settlements'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Settlements & Debt Simplifier
        </button>

        <button
          onClick={() => setActiveMenuTab('members')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeMenuTab === 'members'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Roommates & Roles
        </button>
      </div>

      {/* 1. FEATURED ACTIONS HERO BANNER (Messenger & Broadcast Notifications) */}
      {(activeMenuTab === 'all' || activeMenuTab === 'messenger') && (
        <div className={`grid grid-cols-1 ${isHostOrCoHost ? 'md:grid-cols-2' : ''} gap-4`}>
          {/* Roommate Messenger Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-sm border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-emerald-400 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Roommate Chat
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Flat 402 Channel
                </span>
              </div>
              <h3 className="text-[18px] sm:text-[20px] font-bold text-white leading-tight">
                Roommate Messenger
              </h3>
              <p className="text-[13px] text-slate-300">
                Send group messages to all flatmates or start direct 1-on-1 private chats with instant UPI payment & room fund nudges.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {onOpenMessenger && (
                <button
                  onClick={onOpenMessenger}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-[13px] transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" /> Open Group & Direct Chats
                </button>
              )}
            </div>
          </div>

          {/* Send Push Notification Card - ONLY for Host & Co-Host */}
          {isHostOrCoHost && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 bg-white shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                    <Bell className="w-3.5 h-3.5 text-amber-700" />
                    Broadcast Center
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {users.length} flatmates reachable
                  </span>
                </div>
                <h3 className="text-[18px] sm:text-[20px] font-bold text-slate-900 leading-tight">
                  Send Notification to Roommates
                </h3>
                <p className="text-[13px] text-slate-600">
                  Broadcast instant push alerts, deficit reminders, utility bill deadlines, or house maintenance notices to everyone.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {onOpenSendNotification && (
                  <button
                    onClick={onOpenSendNotification}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] transition-all active:scale-95 cursor-pointer shadow-xs border border-slate-800"
                  >
                    <Send className="w-4 h-4" /> Send Push Notification
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. DEDICATED HOST & CO-HOST CONTROLS PANEL - ONLY for Host & Co-Host */}
      {isHostOrCoHost && (activeMenuTab === 'all' || activeMenuTab === 'host_hub') && (
        <section className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-amber-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] font-bold text-slate-900 leading-tight">
                    Host & Co-Host Control Hub
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Administrative Rights
                  </span>
                </div>
                <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">
                  Exclusive management tools for Flat 402 Host ({users.find(u => u.role === 'host')?.name}) and Co-Hosts
                </p>
              </div>
            </div>

            {onOpenSendNotification && (
              <button
                onClick={onOpenSendNotification}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12px] sm:text-[13px] shadow-xs cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Host Alert Broadcast
              </button>
            )}
          </div>

          {/* Quick Admin Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Pending Approvals */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                  Pending Approvals
                </span>
                {pendingApprovalsCount > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingApprovalsCount}
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                    ✓
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-slate-900">
                  {pendingApprovalsCount > 0 ? `${pendingApprovalsCount} items pending` : 'All verified'}
                </h4>
                <p className="text-[12px] text-slate-500">Room fund handovers & member expenses</p>
              </div>
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  className="text-left text-[12px] font-bold text-slate-900 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                >
                  Review Approvals <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Room Fund Safety Policy */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                  Room Pool Safety
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-slate-900">Auto-Deficit Guard</h4>
                <p className="text-[12px] text-slate-500">Alerts roommates when common balance goes below zero</p>
              </div>
              {onOpenDepositModal && (
                <button
                  onClick={onOpenDepositModal}
                  className="text-left text-[12px] font-bold text-slate-900 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                >
                  Record Handover <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 3. Member Role Assignments */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                  Access Levels
                </span>
                <Users className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-slate-900">Role Manager</h4>
                <p className="text-[12px] text-slate-500">Promote to Co-Host or reassign Host</p>
              </div>
              <button
                onClick={() => setActiveMenuTab('members')}
                className="text-left text-[12px] font-bold text-slate-900 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
              >
                Manage Permissions <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4. Fix Room Collection Target (Host Only) */}
            {onOpenSetCollectionModal && isHost && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-amber-800 font-bold">
                    Room Fund Goal
                  </span>
                  <Crown className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900">Fix Collection Amount</h4>
                  <p className="text-[12px] text-slate-600">Set target amount per roommate to collect into Room Money</p>
                </div>
                <button
                  onClick={onOpenSetCollectionModal}
                  className="text-left text-[12px] font-bold text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                >
                  Set Collection Goal <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 5. Role Demo Emails Showcase */}
          </div>

          {/* Quick Role Elevation Matrix */}
          <div className="border border-amber-200/60 rounded-2xl p-4 bg-amber-50/40 space-y-3">
            <h4 className="text-[13px] font-bold text-amber-950 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-700" /> Member Role Controls (Host & Co-Host Action)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-white rounded-xl border border-amber-200/80 flex flex-col justify-between space-y-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                    <div className="min-w-0">
                      <span className="text-[13px] font-bold text-slate-900 block truncate">{u.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 capitalize">{u.role}</span>
                    </div>
                  </div>

                  {onUpdateUserRole && isHost && u.id !== currentUser.id && (
                    <div className="flex items-center gap-1 pt-1">
                      {u.role === 'member' && (
                        <button
                          onClick={() => onUpdateUserRole(u.id, 'co-host')}
                          className="w-full py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          + Make Co-Host
                        </button>
                      )}
                      {u.role === 'co-host' && (
                        <button
                          onClick={() => onUpdateUserRole(u.id, 'member')}
                          className="w-full py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Demote to Member
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. SMART DEBT SIMPLIFICATION ENGINE */}
      {(activeMenuTab === 'all' || activeMenuTab === 'settlements') && (
        <section className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5 sm:space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-900 leading-tight">
                  Smart Debt Simplification
                </h3>
                <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">
                  Balances group debts with minimum direct transfers
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettleModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[12px] sm:text-[13px] shadow-sm shadow-slate-900/20 transition-all active:scale-95 cursor-pointer border border-slate-800"
            >
              <ArrowRightLeft className="w-4 h-4" /> Record Settlement
            </button>
          </div>

          {/* Minimal Transfer Flow list */}
          <div className="mt-4 border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden divide-y divide-slate-100">
            {debtTransfers.length === 0 ? (
              <div className="p-8 text-center text-[14px] text-emerald-700 bg-emerald-50/60 font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Everyone is 100% squared up! No debts pending.
              </div>
            ) : (
              debtTransfers.map((t, idx) => {
                const fromUser = users.find((u) => u.id === t.from);
                const toUser = users.find((u) => u.id === t.to);

                return (
                  <div
                    key={idx}
                    className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 shrink-0">
                        <img src={fromUser?.avatar} alt={fromUser?.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-slate-900">
                          <span className="text-slate-900">{fromUser?.name}</span>{' '}
                          <span className="text-slate-500 font-normal">pays</span>{' '}
                          <span className="text-slate-900 font-bold underline decoration-slate-300">{toUser?.name}</span>
                        </p>
                        <span className="text-[11px] font-mono text-slate-500">
                          Direct transfer via UPI ({toUser?.upiId || 'UPI'}) / Cash
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="font-mono text-[18px] font-bold text-slate-900 font-mono-numbers">
                        {formatExactCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => {
                          setFromUser(t.from);
                          setToUser(t.to);
                          setSettleAmount(t.amount.toString());
                          setShowSettleModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        Settle Now
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* 4. GROUP MEMBERS DIRECTORY & ACCESS CONTROL */}
      {(activeMenuTab === 'all' || activeMenuTab === 'members') && (
        <section className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-700" /> Roommates & Access Control
              </h3>
              <p className="text-[13px] text-slate-500">
                {isHost
                  ? 'Host Harinadh manages roles, member profiles, and approves handovers.'
                  : isCoHost
                  ? 'Co-Host privileges: invite flatmates, broadcast notices, and record ledger items.'
                  : 'Flat 402 roommate directory and individual net balances.'}
              </p>
            </div>

            {isHostOrCoHost && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onOpenInviteModal && (
                  <button
                    onClick={onOpenInviteModal}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-[13px] font-semibold transition-colors cursor-pointer border border-slate-800"
                  >
                    <Send className="w-3.5 h-3.5" /> Invite via Email
                  </button>
                )}

                {isHost && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[13px] font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Member Balances Matrix */}
          <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden divide-y divide-slate-100">
            {userSummaries.map((summary) => {
              const isCred = summary.netBalance > 0;
              const isDeb = summary.netBalance < 0;

              return (
                <div
                  key={summary.userId}
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 shrink-0">
                      <img
                        src={summary.avatar}
                        alt={summary.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                        {summary.name}
                        {getRoleBadge(summary.role)}
                        {summary.isCurrentUser && (
                          <span className="text-[10px] font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded font-semibold">
                            You
                          </span>
                        )}
                      </h4>
                      <span className="text-[12px] font-mono text-slate-500">
                        {summary.email} • Paid: {formatCurrency(summary.totalPaid)} • Share: {formatCurrency(summary.totalOwed)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right self-end sm:self-auto">
                    <span
                      className={`font-mono text-[16px] font-bold font-mono-numbers ${
                        isCred
                          ? 'text-emerald-600'
                          : isDeb
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {isCred ? `+${formatExactCurrency(summary.netBalance)}` : formatExactCurrency(summary.netBalance)}
                    </span>
                    <span className="block text-[11px] font-mono text-slate-500">
                      {isCred ? 'gets back' : isDeb ? 'owes in total' : 'settled up'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Pending Invitations List - ONLY for Host & Co-Host */}
          {isHostOrCoHost && invites.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[13px] font-mono uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5 font-semibold">
                <Mail className="w-3.5 h-3.5 text-slate-700" /> Active Email Invitations ({invites.length})
              </h4>
              <div className="border border-slate-200 rounded-2xl bg-slate-50/60 divide-y divide-slate-200/60">
                {invites.map((inv) => (
                  <div key={inv.id} className="p-3.5 flex justify-between items-center text-[13px] bg-white">
                    <div>
                      <span className="font-bold text-slate-900">{inv.name}</span>
                      <span className="ml-2 font-mono text-[11px] text-slate-500">({inv.email})</span>
                      <span className="ml-2 font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                        {inv.role}
                      </span>
                    </div>
                    {onRevokeInvite && (
                      <button
                        onClick={() => onRevokeInvite(inv.id)}
                        className="text-slate-400 hover:text-rose-600 text-[11px] font-mono font-medium cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. RECENT SETTLEMENT PAYMENT HISTORY */}
      {(activeMenuTab === 'all' || activeMenuTab === 'settlements') && settlements.length > 0 && (
        <section className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-slate-700" /> Settlement Payment History
          </h3>

          <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden divide-y divide-slate-100">
            {settlements.map((st) => {
              const fromUser = users.find((u) => u.id === st.fromUserId);
              const toUser = users.find((u) => u.id === st.toUserId);

              return (
                <div key={st.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-[14px] text-slate-900">
                      <span className="font-bold text-slate-900">{fromUser?.name}</span> paid{' '}
                      <span className="font-bold text-slate-900 underline decoration-slate-300">{toUser?.name}</span>
                    </p>
                    <span className="text-[11px] font-mono text-slate-500">
                      {st.paymentMethod} • {st.date} {st.note && `• ${st.note}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-600 text-[15px] font-mono-numbers">
                      {formatExactCurrency(st.amount)}
                    </span>
                    {onDeleteSettlement && (
                      <button
                        onClick={() => onDeleteSettlement(st.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Delete settlement record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. EXPORT & UTILITIES */}
      {(activeMenuTab === 'all') && (
        <section className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-700" /> Account & Ledger Utilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Export to CSV</h4>
                <p className="text-[12px] text-slate-500">Download Excel spreadsheet</p>
              </div>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
            >
              <Printer className="w-6 h-6 text-slate-700 shrink-0" />
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Print Ledger</h4>
                <p className="text-[12px] text-slate-500">Print balance summary</p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Record Settlement Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-[18px] font-bold text-slate-900">Record Settlement</h3>
            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                    Who paid?
                  </label>
                  <select
                    value={fromUser}
                    onChange={(e) => setFromUser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none text-[13px]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                    To Whom?
                  </label>
                  <select
                    value={toUser}
                    onChange={(e) => setToUser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none text-[13px]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-4 py-2.5 text-slate-900 font-mono text-[20px] font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Cash', 'Bank Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettleMethod(m)}
                      className={`py-2 rounded-xl text-[12px] font-mono font-medium border transition-all ${
                        settleMethod === m
                          ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared GPay for electric bill"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 shadow-sm border border-slate-800 cursor-pointer"
                >
                  Save Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Roommate Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-[18px] font-bold text-slate-900">Add Roommate Profile</h3>
            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma, Sneha Reddy"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none font-mono text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMemberRole('member')}
                    className={`py-2 px-3 rounded-xl border text-[13px] font-medium text-left transition-all ${
                      newMemberRole === 'member'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👥 Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMemberRole('co-host')}
                    className={`py-2 px-3 rounded-xl border text-[13px] font-medium text-left transition-all ${
                      newMemberRole === 'co-host'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🛡️ Co-Host
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 shadow-sm border border-slate-800 cursor-pointer"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


