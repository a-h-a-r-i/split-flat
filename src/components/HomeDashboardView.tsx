import React from 'react';
import {
  Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Clock, Wallet, Check, ArrowRightLeft, MessageSquare,
  TrendingUp, Receipt, Settings
} from 'lucide-react';
import { User, Expense, Bill, RoomDeposit } from '../types';
import {
  UserBalanceSummary, RoomFundSummary, formatCurrency, formatExactCurrency
} from '../utils/calculations';
import { NavTab } from './BottomNavBar';
import { CategoryIcon } from './CategoryIcon';

interface HomeDashboardViewProps {
  userSummaries: UserBalanceSummary[];
  totalGroupSpending: number;
  expenses: Expense[];
  bills: Bill[];
  users: User[];
  currentUser: User;
  roomFundSummary: RoomFundSummary;
  deposits: RoomDeposit[];
  onOpenAddExpense: () => void;
  onOpenDepositModal: () => void;
  onNavigateToTab: (tab: NavTab) => void;
  onSelectExpense: (expense: Expense) => void;
  onOpenSettleModal: (fromId: string, toId: string, suggestedAmount: number) => void;
  onApproveExpense: (expenseId: string, reimburseFromRoomFund?: boolean) => void;
  onRejectExpense: (expenseId: string) => void;
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string) => void;
  onRequestContribution?: (deficitAmount: number, perPersonShare: number) => void;
  activeFlat?: any;
  onOpenSetCollectionModal?: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  userSummaries, totalGroupSpending, expenses, users, currentUser,
  roomFundSummary, deposits, onOpenAddExpense, onOpenDepositModal,
  onNavigateToTab, onSelectExpense,
  onApproveExpense, onRejectExpense, onApproveDeposit, onRejectDeposit,
  activeFlat, onOpenSetCollectionModal,
}) => {
  const isHost = currentUser.role === 'host';
  const isHostOrCoHost = isHost || currentUser.role === 'co-host';

  const currentSummary = userSummaries.find((u) => u.userId === currentUser.id) || {
    userId: currentUser.id, name: currentUser.name, email: currentUser.email,
    avatar: currentUser.avatar, role: currentUser.role,
    totalPaid: 0, totalOwed: 0, netBalance: 0, isCurrentUser: true,
  };

  const myContribution = roomFundSummary.userContributions[currentUser.id] || { approved: 0, pending: 0 };
  const myRoomBal = roomFundSummary.userRoomBalances[currentUser.id] || {
    userId: currentUser.id, userName: currentUser.name,
    depositedApproved: 0, spentShare: 0, availableRoomBalance: 0,
  };

  const collectionCall = activeFlat?.fundCollectionCall;
  const isCollectionActive = collectionCall?.active;
  const targetPerPerson = isCollectionActive ? (collectionCall?.amountPerPerson || 0) : 0;
  const depositedCount = users.filter((u) =>
    (roomFundSummary.userContributions[u.id]?.approved || 0) >= targetPerPerson && targetPerPerson > 0
  ).length;
  const hasCurrentUserMetGoal = targetPerPerson > 0 && myContribution.approved >= targetPerPerson;
  const myRemaining = targetPerPerson > 0 ? Math.max(0, targetPerPerson - myContribution.approved) : 0;

  const pendingDeposits = isHostOrCoHost
    ? deposits.filter((d) => d.status === 'pending_approval')
    : deposits.filter((d) => d.status === 'pending_approval' && d.userId === currentUser.id);

  const pendingExpenses = isHostOrCoHost
    ? expenses.filter((e) => e.status === 'pending_approval')
    : expenses.filter((e) => e.status === 'pending_approval' && e.paidById === currentUser.id);

  const totalPendingActions = pendingDeposits.length + pendingExpenses.length;
  const isNegative = currentSummary.netBalance < 0;
  const isPositive = currentSummary.netBalance > 0;

  const recentExpenses = expenses
    .filter((e) => e.status !== 'pending_approval' && e.status !== 'rejected')
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1280px] mx-auto pt-2">

      {/* ── Hero card ── */}
      <div className="app-card-teal p-5 rounded-3xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-teal-100 text-[12px] font-medium">Hi {currentUser.name.split(' ')[0]} 👋</p>
            <p className="text-[13px] text-teal-200 mt-0.5">Here's your flat summary</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Big balance */}
        <div className="mb-4">
          <p className="text-teal-200 text-[11px] uppercase tracking-wider font-semibold mb-1">Room Pool Balance</p>
          <h1 className="text-[40px] font-bold font-mono-numbers tracking-tight leading-none">
            {formatCurrency(roomFundSummary.availableBalance)}
          </h1>
          <p className="text-teal-300 text-[12px] mt-1">Available in flat common fund</p>
        </div>

        {/* Collected / Spent — shown once here only */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-teal-200 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Total Collected
            </p>
            <p className="text-white text-[20px] font-bold font-mono-numbers mt-1">
              {formatCurrency(roomFundSummary.totalCollected)}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-teal-200 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
              <Receipt className="w-3 h-3" /> Total Spent
            </p>
            <p className="text-white text-[20px] font-bold font-mono-numbers mt-1">
              {formatCurrency(roomFundSummary.totalSpent)}
            </p>
          </div>
        </div>

        {/* My contribution row */}
        <div className="bg-white/10 rounded-2xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-200 text-[10px] font-semibold uppercase">Your Deposit</p>
              <p className="text-white text-[16px] font-bold font-mono-numbers mt-0.5">
                {formatCurrency(myContribution.approved)}
                {myContribution.pending > 0 && (
                  <span className="text-amber-300 text-[12px] ml-2">+{formatCurrency(myContribution.pending)} pending</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-teal-200 text-[10px] font-semibold uppercase">Your Available</p>
              <p className={`text-[16px] font-bold font-mono-numbers mt-0.5 ${myRoomBal.availableRoomBalance < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {formatCurrency(myRoomBal.availableRoomBalance)}
              </p>
              {myRoomBal.spentShare > 0 && (
                <p className="text-teal-300 text-[10px] mt-0.5">-{formatCurrency(myRoomBal.spentShare)} spent</p>
              )}
            </div>
          </div>
          {targetPerPerson > 0 && (
            <div className="mt-2">
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (myContribution.approved / targetPerPerson) * 100)}%` }}
                />
              </div>
              <p className="text-teal-300 text-[10px] mt-1">
                Target: {formatCurrency(targetPerPerson)}/person · {myRemaining > 0 ? `${formatCurrency(myRemaining)} remaining` : '✓ Goal met'}
              </p>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2">
          <button onClick={onOpenDepositModal}
            className="flex-1 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer">
            <Wallet className="w-4 h-4" />
            {isHost ? 'Record Deposit' : 'Hand Over Money'}
          </button>
          {isHost && onOpenSetCollectionModal && (
            <button onClick={onOpenSetCollectionModal}
              className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-[0.98] cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Collection goal per-person tracker ── */}
      {isCollectionActive && targetPerPerson > 0 && (
        <div className="app-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[13px] font-bold text-slate-900">{collectionCall?.title || 'Fund Collection'}</p>
              <p className="text-[11px] text-slate-500">{formatCurrency(targetPerPerson)}/person · {depositedCount}/{users.length} paid</p>
            </div>
            {isHost && onOpenSetCollectionModal && (
              <button onClick={onOpenSetCollectionModal}
                className="text-[11px] text-teal-700 font-semibold hover:underline cursor-pointer">
                Edit
              </button>
            )}
          </div>

          <div className="space-y-2">
            {users.map((u) => {
              const contrib = roomFundSummary.userContributions[u.id] || { approved: 0, pending: 0 };
              const roomBal = roomFundSummary.userRoomBalances[u.id];
              const deposited = contrib.approved;
              const pending = contrib.pending;
              const spentShare = roomBal?.spentShare || 0;
              const availableBalance = roomBal?.availableRoomBalance ?? (deposited - spentShare);
              const remaining = targetPerPerson > 0 ? Math.max(0, targetPerPerson - deposited) : 0;
              const pct = targetPerPerson > 0 ? Math.min(100, Math.round((deposited / targetPerPerson) * 100)) : 0;
              const done = targetPerPerson > 0 && deposited >= targetPerPerson;

              return (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0f766e&color=fff`; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[12px] font-semibold text-slate-900 truncate">{u.name}</p>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {deposited > 0 ? (
                          <span className="text-[11px] font-semibold text-teal-700">
                            {formatCurrency(deposited)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">₹0</span>
                        )}
                        {remaining > 0 && (
                          <span className="text-[10px] text-rose-500 font-mono font-semibold">
                            -{formatCurrency(remaining)}
                          </span>
                        )}
                        {done && spentShare > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            = {formatCurrency(availableBalance)}
                          </span>
                        )}
                        {pending > 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold">+{formatCurrency(pending)}⏳</span>
                        )}
                      </div>
                    </div>
                    {targetPerPerson > 0 && (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${done ? 'bg-teal-600' : 'bg-teal-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── No goal set — host prompt ── */}
      {isHost && !isCollectionActive && onOpenSetCollectionModal && (
        <button onClick={onOpenSetCollectionModal}
          className="app-card p-4 rounded-2xl flex items-center justify-between w-full text-left hover:bg-slate-50 transition-colors cursor-pointer border-2 border-dashed border-slate-200">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Set a deposit goal</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tell roommates how much each person needs to contribute</p>
          </div>
          <Settings className="w-5 h-5 text-teal-600 shrink-0" />
        </button>
      )}

      {/* ── Personal Balance ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="app-card p-4 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">My Balance</p>
          <p className={`text-[22px] font-bold font-mono-numbers mt-1 ${isNegative ? 'text-rose-600' : isPositive ? 'text-teal-700' : 'text-slate-700'}`}>
            {isPositive ? `+${formatExactCurrency(currentSummary.netBalance)}` : formatExactCurrency(currentSummary.netBalance)}
          </p>
          <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isPositive ? 'bg-teal-50 text-teal-700 border border-teal-200'
            : isNegative ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownLeft className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            {isPositive ? 'Owed to you' : isNegative ? 'You owe' : 'Settled'}
          </span>
        </div>
        <div className="app-card p-4 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Group Spend</p>
          <p className="text-[22px] font-bold font-mono-numbers text-slate-900 mt-1">{formatCurrency(totalGroupSpending)}</p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[10px] text-slate-400 font-mono">You paid: {formatCurrency(currentSummary.totalPaid)}</p>
            <p className="text-[10px] text-slate-400 font-mono">Your share: {formatCurrency(currentSummary.totalOwed)}</p>
          </div>
        </div>
      </div>

      {/* ── Pending Approvals ── */}
      {totalPendingActions > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-amber-950">
                {isHostOrCoHost ? `Pending Approvals (${totalPendingActions})` : `Awaiting Approval (${totalPendingActions})`}
              </p>
              <p className="text-[11px] text-amber-700">{isHostOrCoHost ? 'Verify deposits & expenses' : 'Submitted — waiting for host'}</p>
            </div>
          </div>

          <div className="space-y-2">
            {pendingDeposits.map((dep) => (
              <div key={dep.id} className="bg-white rounded-xl border border-amber-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                      <img src={dep.userAvatar || ''} alt={dep.userName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{dep.userName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{dep.paymentMethod} · {dep.date}</p>
                      {dep.notes && <p className="text-[10px] text-slate-600 italic">"{dep.notes}"</p>}
                    </div>
                  </div>
                  <span className="text-[16px] font-bold font-mono-numbers text-teal-700">+{formatCurrency(dep.amount)}</span>
                </div>
                {isHostOrCoHost ? (
                  <div className="flex gap-2">
                    <button onClick={() => onRejectDeposit(dep.id)}
                      className="flex-1 py-2 rounded-xl border border-rose-200 text-rose-700 text-[12px] font-semibold hover:bg-rose-50 cursor-pointer transition-colors">
                      Decline
                    </button>
                    <button onClick={() => onApproveDeposit(dep.id)}
                      className="flex-1 py-2 rounded-xl bg-teal-700 text-white text-[12px] font-bold hover:bg-teal-800 cursor-pointer transition-colors flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 text-center bg-amber-50 p-1.5 rounded-lg">Pending host approval</p>
                )}
              </div>
            ))}

            {pendingExpenses.map((exp) => (
              <div key={exp.id} className="bg-white rounded-xl border border-amber-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <CategoryIcon category={exp.category} className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{exp.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono">by {exp.paidByName}</p>
                    </div>
                  </div>
                  <span className="text-[16px] font-bold font-mono-numbers text-slate-900">{formatCurrency(exp.amount)}</span>
                </div>
                {isHostOrCoHost ? (
                  <div className="flex gap-2">
                    <button onClick={() => onRejectExpense(exp.id)}
                      className="flex-1 py-2 rounded-xl border border-rose-200 text-rose-700 text-[12px] font-semibold hover:bg-rose-50 cursor-pointer transition-colors">
                      Decline
                    </button>
                    <button onClick={() => onApproveExpense(exp.id, false)}
                      className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 text-center bg-amber-50 p-1.5 rounded-lg">Pending host approval</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="app-card p-4 rounded-2xl">
        <p className="text-[13px] font-bold text-slate-900 mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onOpenAddExpense}
            className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-[0.97]">
            <Plus className="w-5 h-5" />
            <span className="text-[12px] font-semibold leading-tight">Add Expense</span>
          </button>
          <button onClick={onOpenDepositModal}
            className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 transition-colors cursor-pointer active:scale-[0.97]">
            <Wallet className="w-5 h-5" />
            <span className="text-[12px] font-semibold leading-tight">{isHost ? 'Record Deposit' : 'Hand Over'}</span>
          </button>
          <button onClick={() => onNavigateToTab('chats')}
            className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer active:scale-[0.97] border border-slate-200">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <span className="text-[12px] font-semibold">Chats</span>
          </button>
          <button onClick={() => onNavigateToTab('more')}
            className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer active:scale-[0.97] border border-slate-200">
            <ArrowRightLeft className="w-5 h-5 text-slate-600" />
            <span className="text-[12px] font-semibold">Settle Up</span>
          </button>
        </div>
      </div>

      {/* ── Recent Expenses ── */}
      {recentExpenses.length > 0 && (
        <div className="app-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-slate-900">Recent Expenses</p>
            <button onClick={() => onNavigateToTab('expenses')}
              className="text-[11px] text-teal-700 font-semibold cursor-pointer hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {recentExpenses.map((exp) => (
              <button key={exp.id} onClick={() => onSelectExpense(exp)}
                className="w-full flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-1 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <CategoryIcon category={exp.category} className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-slate-900 leading-tight">{exp.title}</p>
                    <p className="text-[10px] text-slate-400">{exp.date} · {exp.paidByName}</p>
                  </div>
                </div>
                <span className="text-[13px] font-bold font-mono-numbers text-slate-900">{formatCurrency(exp.amount)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
};
