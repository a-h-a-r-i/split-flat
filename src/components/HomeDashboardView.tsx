import React from 'react';
import {
  Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Clock, Crown, ChevronRight, Wallet, Check, ArrowRightLeft, MessageSquare, TrendingUp, Receipt
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
  userSummaries, totalGroupSpending, expenses, bills, users, currentUser,
  roomFundSummary, deposits, onOpenAddExpense, onOpenDepositModal,
  onNavigateToTab, onSelectExpense, onOpenSettleModal,
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
  const targetPerPerson = collectionCall?.amountPerPerson || 5000;
  const depositedCount = users.filter((u) => (roomFundSummary.userContributions[u.id]?.approved || 0) >= targetPerPerson).length;
  const hasCurrentUserMetGoal = myContribution.approved >= targetPerPerson;

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

      {/* ── Hero Header ── */}
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

        {/* Room Balance big number */}
        <div className="mb-4">
          <p className="text-teal-200 text-[11px] uppercase tracking-wider font-semibold mb-1">Remaining Room Balance</p>
          <h1 className="text-[38px] font-bold font-mono-numbers tracking-tight leading-none">
            {formatCurrency(roomFundSummary.availableBalance)}
          </h1>
          {isCollectionActive && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[11px] font-semibold">
              ⭐ Active Fund — {depositedCount}/{users.length} deposited
            </span>
          )}
        </div>

        {/* Collected / Spent row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-teal-200 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Total Collected
            </p>
            <p className="text-white text-[18px] font-bold font-mono-numbers mt-1">
              {formatCurrency(roomFundSummary.totalCollected)}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-teal-200 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
              <Receipt className="w-3 h-3" /> Total Spent
            </p>
            <p className="text-white text-[18px] font-bold font-mono-numbers mt-1">
              {formatCurrency(roomFundSummary.totalSpent)}
            </p>
          </div>
        </div>

        {/* Record Deposit CTA */}
        <button onClick={onOpenDepositModal}
          className="w-full py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer">
          <Wallet className="w-4 h-4" />
          {isHost ? '+ Record Deposit' : '+ Hand Over Room Money'}
        </button>
      </div>

      {/* ── Collection Goal Banner ── */}
      {isCollectionActive && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-teal-900">{collectionCall?.title || 'Room Fund Collection'}</p>
            <p className="text-[11px] text-teal-700 mt-0.5">
              ₹{targetPerPerson.toLocaleString('en-IN')}/person · {depositedCount}/{users.length} paid
            </p>
          </div>
          {!hasCurrentUserMetGoal ? (
            <button onClick={onOpenDepositModal}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-teal-700 text-white text-[12px] font-bold hover:bg-teal-800 transition-colors cursor-pointer">
              Pay Now
            </button>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200">
              <Check className="w-3.5 h-3.5" /> Paid ✓
            </span>
          )}
        </div>
      )}

      {/* ── Room Pool card ── */}
      <div className="app-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Room Money (Flat Pool)</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[22px] font-bold font-mono-numbers text-slate-900">
                {formatCurrency(roomFundSummary.availableBalance)}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 border border-teal-200">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Available in flat common fund</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <button onClick={onOpenDepositModal}
              className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[12px] font-semibold cursor-pointer transition-colors">
              + Deposit
            </button>
            {isHost && onOpenSetCollectionModal && (
              <button onClick={onOpenSetCollectionModal}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer transition-colors text-center">
                Fix Goal
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[12px] mb-3">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
            <p className="text-slate-500 text-[10px] font-semibold uppercase">Total Pool Collected</p>
            <p className="text-slate-900 font-bold font-mono-numbers text-[14px] mt-0.5">{formatCurrency(roomFundSummary.totalCollected)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
            <p className="text-slate-500 text-[10px] font-semibold uppercase">Spent from Room Money</p>
            <p className="text-slate-900 font-bold font-mono-numbers text-[14px] mt-0.5">{formatCurrency(roomFundSummary.totalSpent)}</p>
          </div>
        </div>

        <div className="rounded-xl bg-teal-50 border border-teal-100 p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal-800">Your Room Money Account</p>
            <p className="text-[10px] text-teal-600 font-mono mt-0.5">
              Deposited: {formatCurrency(myRoomBal.depositedApproved)} · Spent Share: -{formatCurrency(myRoomBal.spentShare)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-[15px] font-bold font-mono-numbers ${myRoomBal.availableRoomBalance < 0 ? 'text-rose-600' : 'text-teal-900'}`}>
              {formatCurrency(myRoomBal.availableRoomBalance)}
            </p>
            {myRoomBal.depositedApproved === 0 && myRoomBal.spentShare > 0 && (
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Not deposited yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Personal Balance ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="app-card p-4 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Personal Balance</p>
          <p className={`text-[22px] font-bold font-mono-numbers mt-1 ${isNegative ? 'text-rose-600' : isPositive ? 'text-teal-700' : 'text-slate-900'}`}>
            {isPositive ? `+${formatExactCurrency(currentSummary.netBalance)}` : formatExactCurrency(currentSummary.netBalance)}
          </p>
          <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isPositive ? 'bg-teal-50 text-teal-700 border border-teal-200'
            : isNegative ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownLeft className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            {isPositive ? 'You are owed' : isNegative ? 'You owe' : 'Settled'}
          </span>
        </div>
        <div className="app-card p-4 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Group Total Spend</p>
          <p className="text-[22px] font-bold font-mono-numbers text-slate-900 mt-1">{formatCurrency(totalGroupSpending)}</p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[10px] text-slate-400 font-mono">Paid: {formatCurrency(currentSummary.totalPaid)}</p>
            <p className="text-[10px] text-slate-400 font-mono">Share: {formatCurrency(currentSummary.totalOwed)}</p>
          </div>
        </div>
      </div>

      {/* ── Pending Approvals ── */}
      {totalPendingActions > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-amber-950">
                {isHostOrCoHost ? `Pending Approvals (${totalPendingActions})` : `Awaiting Approval (${totalPendingActions})`}
              </p>
              <p className="text-[11px] text-amber-700">{isHostOrCoHost ? 'Verify room money handovers' : 'Submitted — waiting for host'}</p>
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
                    </div>
                  </div>
                  <span className="text-[15px] font-bold font-mono-numbers text-teal-700">+{formatCurrency(dep.amount)}</span>
                </div>
                {isHostOrCoHost ? (
                  <div className="flex gap-2">
                    <button onClick={() => onRejectDeposit(dep.id)}
                      className="flex-1 py-1.5 rounded-xl border border-rose-200 text-rose-700 text-[12px] font-semibold hover:bg-rose-50 cursor-pointer transition-colors">
                      Decline
                    </button>
                    <button onClick={() => onApproveDeposit(dep.id)}
                      className="flex-1 py-1.5 rounded-xl bg-teal-700 text-white text-[12px] font-bold hover:bg-teal-800 cursor-pointer transition-colors flex items-center justify-center gap-1">
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
                  <span className="text-[15px] font-bold font-mono-numbers text-slate-900">{formatCurrency(exp.amount)}</span>
                </div>
                {isHostOrCoHost ? (
                  <div className="flex gap-2">
                    <button onClick={() => onRejectExpense(exp.id)}
                      className="flex-1 py-1.5 rounded-xl border border-rose-200 text-rose-700 text-[12px] font-semibold hover:bg-rose-50 cursor-pointer transition-colors">
                      Decline
                    </button>
                    <button onClick={() => onApproveExpense(exp.id, false)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-center gap-1">
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

      {/* ── Balances ── */}
      {userSummaries.length > 1 && (
        <div className="app-card p-4 rounded-2xl">
          <p className="text-[13px] font-bold text-slate-900 mb-3">Roommate Balances</p>
          <div className="space-y-3">
            {userSummaries.filter((u) => u.userId !== currentUser.id).map((u) => {
              const theirRoomBal = roomFundSummary.userRoomBalances[u.userId];
              const deposited = theirRoomBal?.depositedApproved || 0;
              const pending = theirRoomBal?.depositedPending || 0;
              return (
                <div key={u.userId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0f766e&color=fff`; }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {u.role === 'host' ? '👑 Host' : u.role === 'co-host' ? '🛡 Co-Host' : 'Member'}
                      </p>
                    </div>
                  </div>

                  {/* Right: room fund deposit + personal balance */}
                  <div className="text-right shrink-0 space-y-0.5">
                    {/* Room fund deposited */}
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[10px] text-slate-400">Pool:</span>
                      {deposited > 0 ? (
                        <span className="text-[12px] font-bold font-mono-numbers text-teal-700">
                          +{formatCurrency(deposited)}
                        </span>
                      ) : pending > 0 ? (
                        <span className="text-[11px] font-semibold text-amber-600">
                          ₹{pending.toLocaleString('en-IN')} pending
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">not deposited</span>
                      )}
                    </div>
                    {/* Personal expense balance */}
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[10px] text-slate-400">Balance:</span>
                      <span className={`text-[12px] font-bold font-mono-numbers ${
                        u.netBalance > 0 ? 'text-teal-700' : u.netBalance < 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {u.netBalance > 0 ? '+' : ''}{formatExactCurrency(u.netBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Also show current user's own room deposit for self-awareness */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-500 font-semibold">Your Room Deposit</p>
            <div className="flex items-center gap-1.5">
              {myContribution.approved > 0 ? (
                <span className="text-[13px] font-bold font-mono-numbers text-teal-700">
                  +{formatCurrency(myContribution.approved)} ✓
                </span>
              ) : myContribution.pending > 0 ? (
                <span className="text-[12px] font-semibold text-amber-600">
                  ₹{myContribution.pending.toLocaleString('en-IN')} pending
                </span>
              ) : (
                <button onClick={onOpenDepositModal}
                  className="px-2.5 py-1 rounded-lg bg-teal-700 text-white text-[11px] font-semibold cursor-pointer hover:bg-teal-800 transition-colors">
                  + Deposit now
                </button>
              )}
            </div>
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
            <span className="text-[12px] font-semibold text-center leading-tight">Add Expense</span>
          </button>
          <button onClick={onOpenDepositModal}
            className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 transition-colors cursor-pointer active:scale-[0.97]">
            <Wallet className="w-5 h-5" />
            <span className="text-[12px] font-semibold text-center leading-tight">{isHost ? 'Record Deposit' : 'Hand Over Money'}</span>
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
              className="text-[11px] text-teal-700 font-semibold hover:underline cursor-pointer">View all</button>
          </div>
          <div className="space-y-2">
            {recentExpenses.map((exp) => (
              <button key={exp.id} onClick={() => onSelectExpense(exp)}
                className="w-full flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-1 rounded-lg transition-colors cursor-pointer">
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
