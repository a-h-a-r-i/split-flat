import React from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Calendar, 
  Receipt, 
  ArrowRightLeft, 
  TrendingUp, 
  Clock, 
  Crown,
  ChevronRight,
  PieChart,
  Wallet,
  ShieldCheck,
  Building,
  Check,
  X,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { User, Expense, Bill, RoomDeposit } from '../types';
import { 
  UserBalanceSummary, 
  RoomFundSummary, 
  formatCurrency, 
  formatExactCurrency 
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
  userSummaries,
  totalGroupSpending,
  expenses,
  bills,
  users,
  currentUser,
  roomFundSummary,
  deposits,
  onOpenAddExpense,
  onOpenDepositModal,
  onNavigateToTab,
  onSelectExpense,
  onOpenSettleModal,
  onApproveExpense,
  onRejectExpense,
  onApproveDeposit,
  onRejectDeposit,
  onRequestContribution,
  activeFlat,
  onOpenSetCollectionModal,
}) => {
  const isHost = currentUser.role === 'host';
  const isCoHost = currentUser.role === 'co-host';
  const isHostOrCoHost = isHost || isCoHost;

  const currentSummary = userSummaries.find((u) => u.userId === currentUser.id) || {
    userId: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar,
    role: currentUser.role,
    totalPaid: 0,
    totalOwed: 0,
    netBalance: 0,
    isCurrentUser: true,
  };

  const isPositive = currentSummary.netBalance > 0;
  const isNegative = currentSummary.netBalance < 0;
  const isSettled = currentSummary.netBalance === 0;

  // Personal Room Fund Handover Contribution
  const myContribution = roomFundSummary.userContributions[currentUser.id] || { approved: 0, pending: 0 };
  const myRoomBal = roomFundSummary.userRoomBalances[currentUser.id] || {
    userId: currentUser.id,
    userName: currentUser.name,
    depositedApproved: 0,
    spentShare: 0,
    availableRoomBalance: 0,
  };

  // Active Collection Goal
  const collectionCall = activeFlat?.fundCollectionCall;
  const isCollectionActive = collectionCall?.active;
  const targetPerPerson = collectionCall?.amountPerPerson || 5000;
  const depositedCount = users.filter((u) => (roomFundSummary.userContributions[u.id]?.approved || 0) >= targetPerPerson).length;
  const hasCurrentUserMetGoal = myContribution.approved >= targetPerPerson;

  // Pending Approvals: Host & Co-Host see all pending; Members only see their own pending submissions
  const pendingExpenses = isHostOrCoHost
    ? expenses.filter((e) => e.status === 'pending_approval')
    : expenses.filter((e) => e.status === 'pending_approval' && e.paidById === currentUser.id);

  const pendingDeposits = isHostOrCoHost
    ? deposits.filter((d) => d.status === 'pending_approval')
    : deposits.filter((d) => d.status === 'pending_approval' && d.userId === currentUser.id);

  const totalPendingActions = pendingExpenses.length + pendingDeposits.length;

  // Category breakdown calculation
  const approvedExpenses = expenses.filter(
    (e) => e.status !== 'pending_approval' && e.status !== 'rejected'
  );

  const categoryTotals: Record<string, number> = {};
  approvedExpenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const categoryList = Object.keys(categoryTotals)
    .map((cat) => {
      const amt = categoryTotals[cat] || 0;
      return {
        category: cat,
        amount: amt,
        percentage: totalGroupSpending > 0 ? (amt / totalGroupSpending) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const upcomingBills = bills.filter((b) => !b.isPaid).slice(0, 3);
  const recentApproved = approvedExpenses.slice(0, 5);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-[1280px] mx-auto pt-3 md:pt-4">
      
      {/* 0. Active Collection Goal Notice Banner */}
      {isCollectionActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900">
                  Active Collection Target
                </span>
                <span className="text-[12px] font-mono text-emerald-800 font-semibold">
                  {depositedCount}/{users.length} Roommates Deposited
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 mt-0.5">
                {collectionCall?.title || 'Room Money Collection'}: ₹{targetPerPerson.toLocaleString('en-IN')}/person (Target: ₹{(targetPerPerson * users.length).toLocaleString('en-IN')})
              </h3>
              <p className="text-[12px] text-slate-600">
                {collectionCall?.notes || 'Collect room fund deposit to spend on common flat groceries & expenses.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {isHost && onOpenSetCollectionModal && (
              <button
                onClick={onOpenSetCollectionModal}
                className="px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-semibold text-[12px] hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Edit Goal
              </button>
            )}

            {!hasCurrentUserMetGoal ? (
              <button
                onClick={onOpenDepositModal}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[12px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Hand Over ₹{targetPerPerson.toLocaleString('en-IN')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-[12px] font-bold border border-emerald-300">
                <Check className="w-4 h-4 text-emerald-700 stroke-[3]" /> You Deposited ₹{myContribution.approved.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 1. Hero Summary Grid: Room Money Fund & Personal Net Position */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Card A: Shared Room Money (Flat 402 Pool Fund) */}
        {(() => {
          const isDeficit = roomFundSummary.availableBalance < 0;
          const deficitAmt = Math.abs(roomFundSummary.availableBalance);
          const perPerson = Math.ceil(deficitAmt / Math.max(1, users.length));

          return (
            <div 
              className={`p-5 sm:p-6 rounded-3xl bg-white border shadow-xs flex flex-col justify-between relative overflow-hidden transition-all ${
                isDeficit
                  ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-200'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div 
                      className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider font-semibold ${
                        isDeficit ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      <Building className={`w-3.5 h-3.5 ${isDeficit ? 'text-rose-600' : 'text-emerald-600'}`} />
                      <span>Room Money (Flat Pool)</span>
                      {isDeficit ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Deficit
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </div>
                    <h2 
                      className={`text-[28px] sm:text-[34px] font-bold tracking-tight font-mono-numbers mt-1 ${
                        isDeficit ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {formatCurrency(roomFundSummary.availableBalance)}
                    </h2>
                    <p className={`text-[12px] font-medium ${isDeficit ? 'text-rose-700' : 'text-slate-500'}`}>
                      {isDeficit ? `Overspent by ${formatCurrency(deficitAmt)}` : 'Available in flat common fund'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={onOpenDepositModal}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-[12px] font-semibold shadow-xs transition-all active:scale-95 cursor-pointer border ${
                        isDeficit
                          ? 'bg-rose-600 hover:bg-rose-700 border-rose-600'
                          : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>{isHost ? '+ Record Deposit' : '+ Hand Over Money'}</span>
                    </button>

                    {isHost && onOpenSetCollectionModal && (
                      <button
                        onClick={onOpenSetCollectionModal}
                        className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-1 px-2 rounded-lg border border-slate-200 text-center transition-colors cursor-pointer"
                      >
                        Fix Collection Goal
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 text-[12px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Total Pool Collected</span>
                    <span className="text-[14px] font-bold font-mono text-slate-900 mt-0.5 block font-mono-numbers">
                      {formatCurrency(roomFundSummary.totalCollected)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Spent from Room Money</span>
                    <span className="text-[14px] font-bold font-mono text-slate-900 mt-0.5 block font-mono-numbers">
                      {formatCurrency(roomFundSummary.totalSpent)}
                    </span>
                  </div>
                </div>

                {/* Personal Room Money Breakdown */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 text-[12px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-950 font-semibold flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Your Room Money Account:
                    </span>
                    <span className="font-mono font-bold text-emerald-900 text-[13px]">
                      {formatCurrency(myRoomBal.availableRoomBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-800/90 font-mono">
                    <span>Deposited: {formatCurrency(myRoomBal.depositedApproved)}</span>
                    <span>Spent Share: -{formatCurrency(myRoomBal.spentShare)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card B: Personal Direct Net Position */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase font-mono">
                  Personal Out-of-Pocket Balance
                </span>
                <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight font-mono-numbers mt-1 text-slate-900">
                  {isPositive && `+${formatExactCurrency(currentSummary.netBalance)}`}
                  {isNegative && formatExactCurrency(currentSummary.netBalance)}
                  {isSettled && '₹0.00'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isNegative
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
                    {isNegative && <ArrowDownLeft className="w-3.5 h-3.5" />}
                    {isSettled && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isPositive ? 'You are owed in direct expenses' : isNegative ? 'You owe direct balances' : 'Direct expenses settled'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-mono font-semibold">
                  Group Total Spend
                </span>
                <span className="text-[16px] font-bold font-mono-numbers text-slate-800">
                  {formatCurrency(totalGroupSpending)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 text-[12px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-mono font-semibold">Direct Paid by You</span>
                <span className="text-[14px] font-bold font-mono text-slate-900 mt-0.5 block font-mono-numbers">
                  {formatCurrency(currentSummary.totalPaid)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-mono font-semibold">Your Direct Split Share</span>
                <span className="text-[14px] font-bold font-mono text-slate-900 mt-0.5 block font-mono-numbers">
                  {formatCurrency(currentSummary.totalOwed)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card C: Quick Actions */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">
              Quick Actions
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Log expenditures, deposit handovers & settlements
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={onOpenAddExpense}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[13px] border border-slate-800 transition-all cursor-pointer group shadow-sm active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span>{isHost ? 'Add Expense (Default: Room Money)' : 'Add New Expense'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={onOpenDepositModal}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-semibold text-[13px] border border-emerald-200 transition-all cursor-pointer group active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span>{isHost ? 'Record Room Deposit' : 'Hand Over Room Money'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateToTab('chats')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-950 font-semibold text-[13px] border border-indigo-200 transition-all cursor-pointer group active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>Roommate Chats & 1-on-1</span>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateToTab('more')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-[13px] border border-slate-200 transition-all cursor-pointer group active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <span>Record Settle Up</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Host Approvals Hub (Visible to Host or when pending submissions exist) */}
      {totalPendingActions > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-amber-950">
                  {isHost ? 'Pending Host Approvals Required' : 'Your Submissions Awaiting Host Approval'} ({totalPendingActions})
                </h4>
                <p className="text-[11px] text-amber-800 font-medium">
                  {isHost
                    ? 'Verify room money handovers and member-submitted expenses'
                    : 'Awaiting Host Harinadh to verify and add to official ledger'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Pending Money Handovers */}
            {pendingDeposits.map((dep) => (
              <div
                key={dep.id}
                className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-xs flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 shrink-0">
                      <img src={dep.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={dep.userName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-900">{dep.userName}</span>
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                          Room Handover
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {dep.paymentMethod} • {dep.date}
                      </p>
                      {dep.notes && (
                        <p className="text-[11px] text-slate-700 italic mt-0.5">"{dep.notes}"</p>
                      )}
                    </div>
                  </div>

                  <span className="text-[15px] font-bold font-mono text-emerald-700 shrink-0">
                    +{formatCurrency(dep.amount)}
                  </span>
                </div>

                {isHostOrCoHost ? (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => onRejectDeposit(dep.id)}
                      className="flex-1 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onApproveDeposit(dep.id)}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[12px] font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Handover</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-50 p-1.5 rounded-lg text-center font-medium">
                    Status: Pending Host Harinadh Approval
                  </span>
                )}
              </div>
            ))}

            {/* Pending Expenses & Reimbursement Requests */}
            {pendingExpenses.map((exp) => {
              const isReimbursement = exp.isReimbursementRequest;
              const splitUserCount = exp.splitShares?.length || 1;

              return (
                <div
                  key={exp.id}
                  className={`p-3.5 rounded-2xl bg-white border shadow-xs flex flex-col justify-between gap-2.5 ${
                    isReimbursement ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isReimbursement ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        <CategoryIcon category={exp.category} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-bold text-slate-900">{exp.title}</span>
                          {isReimbursement ? (
                            <span className="text-[10px] font-mono bg-indigo-100 text-indigo-900 border border-indigo-200 px-1.5 py-0.2 rounded font-bold">
                              Reimbursement Claim
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                              Expense
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Paid by {exp.paidByName} • Split among {splitUserCount} people
                        </p>
                        {exp.proofNote && (
                          <p className="text-[11px] text-indigo-900 bg-indigo-50/80 p-1.5 rounded-lg border border-indigo-100 italic mt-1 font-sans">
                            Proof / Note: "{exp.proofNote}"
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[15px] font-bold font-mono text-slate-900 shrink-0">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>

                  {isHostOrCoHost ? (
                    <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRejectExpense(exp.id)}
                          className="flex-1 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        
                        {isReimbursement && roomFundSummary.availableBalance >= exp.amount ? (
                          <button
                            onClick={() => onApproveExpense(exp.id, true)}
                            className="flex-2 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="Reimburse member directly from Room Money pool and reduce participants' pool shares"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Reimburse from Room Pool</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onApproveExpense(exp.id, false)}
                            className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Expense</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-amber-700 bg-amber-50 p-1.5 rounded-lg text-center font-medium">
                      Status: Pending Host Harinadh Verification
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Roommates Balances Matrix & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Roommates Balances Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">
                Roommates Balances & Room Pool Accounts
              </h3>
              <p className="text-[12px] text-slate-500">
                Direct out-of-pocket settlements and individual Room Money ledger
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('more')}
              className="text-[12px] font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              Simplified Debts →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userSummaries.map((summary) => {
              const isCred = summary.netBalance > 0;
              const isDeb = summary.netBalance < 0;
              const userContribution = roomFundSummary.userContributions[summary.userId] || { approved: 0, pending: 0 };
              const userRoomBal = roomFundSummary.userRoomBalances[summary.userId] || {
                userId: summary.userId,
                userName: summary.name,
                depositedApproved: userContribution.approved,
                spentShare: 0,
                availableRoomBalance: userContribution.approved,
              };

              return (
                <div
                  key={summary.userId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    summary.isCurrentUser
                      ? 'bg-slate-50 border-slate-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-300 shrink-0">
                        <img
                          src={summary.avatar}
                          alt={summary.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
                          {summary.name}
                          {summary.role === 'host' && (
                            <Crown className="w-3 h-3 text-amber-500" />
                          )}
                          {summary.isCurrentUser && (
                            <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-semibold">
                              You
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                          <span>Direct Paid: {formatCurrency(summary.totalPaid)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[15px] font-bold font-mono font-mono-numbers block ${
                          isCred
                            ? 'text-emerald-600'
                            : isDeb
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {isCred ? `+${formatExactCurrency(summary.netBalance)}` : formatExactCurrency(summary.netBalance)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isCred ? 'gets back' : isDeb ? 'owes direct' : 'direct settled'}
                      </span>
                    </div>
                  </div>

                  {/* Room Money Individual Account Matrix */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-mono">Room Pool Balance:</span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded border ${
                        userRoomBal.availableRoomBalance < 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {formatCurrency(userRoomBal.availableRoomBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Deposited: {formatCurrency(userRoomBal.depositedApproved)}</span>
                      <span>Spent: -{formatCurrency(userRoomBal.spentShare)}</span>
                    </div>
                  </div>

                  {!summary.isCurrentUser && isDeb && (
                    <button
                      onClick={() => onOpenSettleModal(summary.userId, currentUser.id, Math.abs(summary.netBalance))}
                      className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      Settle with {summary.name.split(' ')[0]}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Spending Breakdown (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-slate-700" /> Spending by Category
              </h3>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Breakdown of approved group expenses
            </p>
          </div>

          <div className="space-y-3 flex-1 pt-1">
            {categoryList.slice(0, 5).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="font-semibold text-slate-700">{cat.category}</span>
                  <span className="font-mono text-slate-900 font-bold font-mono-numbers">
                    {formatCurrency(cat.amount)}{' '}
                    <span className="text-slate-400 font-normal">({cat.percentage.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateToTab('expenses')}
            className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-[12px] font-semibold text-center transition-colors cursor-pointer"
          >
            View Full Expense Breakdown →
          </button>
        </div>
      </div>

      {/* 4. Upcoming Bills & Recent Ledger Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Recurring Bills */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" /> Upcoming Bills
              </h3>
              <p className="text-[12px] text-slate-500">
                Scheduled room subscriptions & utilities
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('bills')}
              className="text-[12px] font-semibold text-slate-900 hover:text-slate-700 cursor-pointer"
            >
              All Bills →
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingBills.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-[13px]">
                No pending bills. All scheduled payments are clear!
              </div>
            ) : (
              upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                      <CategoryIcon category={bill.category} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-900">{bill.title}</h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        Due {bill.dueDate} • {bill.recurring}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[15px] font-bold text-slate-900 font-mono-numbers block">
                      {formatCurrency(bill.amount)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ₹{(bill.amount / (users.length || 1)).toFixed(0)}/each
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Ledger Activity */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-700" /> Recent Transactions
              </h3>
              <p className="text-[12px] text-slate-500">
                Latest verified group entries
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('expenses')}
              className="text-[12px] font-semibold text-slate-900 hover:text-slate-700 cursor-pointer"
            >
              Full Ledger →
            </button>
          </div>

          <div className="space-y-2">
            {recentApproved.map((exp) => (
              <div
                key={exp.id}
                onClick={() => onSelectExpense(exp)}
                className="p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <CategoryIcon category={exp.category} iconName={exp.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900">{exp.title}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {exp.paidByName} • {exp.date}
                    </span>
                  </div>
                </div>

                <span className="text-[14px] font-bold text-slate-900 font-mono font-mono-numbers">
                  {formatCurrency(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
