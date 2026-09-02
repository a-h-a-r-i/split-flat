import { Expense, User, SettlementRecord, DebtTransfer, RoomDeposit } from '../types';

export const CURRENT_DATE_STRING = '2026-08-25';

export interface UserRoomFundBalance {
  userId: string;
  depositedApproved: number;
  depositedPending: number;
  spentShare: number; // What this user consumed from room fund expenses
  availableRoomBalance: number; // depositedApproved - spentShare
}

export interface RoomFundSummary {
  totalCollected: number;
  totalSpent: number;
  availableBalance: number;
  userContributions: Record<string, { approved: number; pending: number }>;
  userRoomBalances: Record<string, UserRoomFundBalance>;
  pendingDepositsCount: number;
  pendingDepositsTotal: number;
}

export function calculateRoomFundSummary(
  deposits: RoomDeposit[],
  expenses: Expense[],
  users: User[]
): RoomFundSummary {
  const userContributions: Record<string, { approved: number; pending: number }> = {};
  const userRoomBalances: Record<string, UserRoomFundBalance> = {};

  users.forEach((u) => {
    userContributions[u.id] = { approved: 0, pending: 0 };
    userRoomBalances[u.id] = {
      userId: u.id,
      depositedApproved: 0,
      depositedPending: 0,
      spentShare: 0,
      availableRoomBalance: 0,
    };
  });

  let totalCollected = 0;
  let pendingDepositsCount = 0;
  let pendingDepositsTotal = 0;

  // 1. Process all deposits
  deposits.forEach((dep) => {
    if (!userContributions[dep.userId]) {
      userContributions[dep.userId] = { approved: 0, pending: 0 };
    }
    if (!userRoomBalances[dep.userId]) {
      userRoomBalances[dep.userId] = {
        userId: dep.userId,
        depositedApproved: 0,
        depositedPending: 0,
        spentShare: 0,
        availableRoomBalance: 0,
      };
    }

    if (dep.status === 'approved' || !dep.status) {
      totalCollected += dep.amount;
      userContributions[dep.userId].approved += dep.amount;
      userRoomBalances[dep.userId].depositedApproved += dep.amount;
    } else if (dep.status === 'pending_approval') {
      pendingDepositsCount++;
      pendingDepositsTotal += dep.amount;
      userContributions[dep.userId].pending += dep.amount;
      userRoomBalances[dep.userId].depositedPending += dep.amount;
    }
  });

  // 2. Process all approved expenses paid from Room Fund
  let totalSpent = 0;
  expenses.forEach((e) => {
    const isApproved = e.status === 'approved' || !e.status;
    if (!isApproved) return;

    if (e.paidById === 'room_fund') {
      totalSpent += e.amount;

      // Deduct from each participant's individual room fund share
      if (e.splitShares && e.splitShares.length > 0) {
        e.splitShares.forEach((share) => {
          if (!userRoomBalances[share.userId]) {
            userRoomBalances[share.userId] = {
              userId: share.userId,
              depositedApproved: 0,
              depositedPending: 0,
              spentShare: 0,
              availableRoomBalance: 0,
            };
          }
          userRoomBalances[share.userId].spentShare += share.amount;
        });
      } else {
        // Equal split among all users if no specific split shares
        const perPerson = e.amount / Math.max(1, users.length);
        users.forEach((u) => {
          userRoomBalances[u.id].spentShare += perPerson;
        });
      }
    }
  });

  // 3. Compute available room balance per user = depositedApproved - spentShare
  Object.keys(userRoomBalances).forEach((uid) => {
    const uBal = userRoomBalances[uid];
    uBal.availableRoomBalance = Math.round((uBal.depositedApproved - uBal.spentShare) * 100) / 100;
  });

  const availableBalance = Math.round((totalCollected - totalSpent) * 100) / 100;

  return {
    totalCollected,
    totalSpent,
    availableBalance,
    userContributions,
    userRoomBalances,
    pendingDepositsCount,
    pendingDepositsTotal,
  };
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded < 0) {
    return `-₹${Math.abs(rounded).toLocaleString('en-IN')}`;
  }
  return `₹${rounded.toLocaleString('en-IN')}`;
}

export function formatExactCurrency(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(amount);
  const formatted = Number.isInteger(abs)
    ? abs.toLocaleString('en-IN')
    : abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNeg ? `-₹${formatted}` : `₹${formatted}`;
}

export function formatDateHeading(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const formatDateHeader = formatDateHeading;

export interface GroupedExpenses {
  date: string;
  expenses: Expense[];
  total: number;
}

export function groupExpensesByDate(expenses: Expense[]): GroupedExpenses[] {
  const map: Record<string, Expense[]> = {};

  expenses.forEach((exp) => {
    if (!map[exp.date]) {
      map[exp.date] = [];
    }
    map[exp.date].push(exp);
  });

  // Sort dates descending
  const sortedDates = Object.keys(map).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return sortedDates.map((date) => {
    const dateExpenses = map[date];
    const total = dateExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    return {
      date,
      expenses: dateExpenses,
      total,
    };
  });
}

export interface UserBalanceSummary {
  userId: string;
  name: string;
  avatar: string;
  email: string;
  role: 'host' | 'co-host' | 'member';
  isCurrentUser: boolean;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // Positive = user is owed money (creditor), Negative = user owes money (debtor)
}

/**
 * Calculates net balance for every member in the group taking into account:
 * - ONLY approved expenses (pending approval expenses do not count towards balance until Host accepts)
 * - All expenses paid by the user
 * - All shares owed by the user
 * - All settled payments
 */
export function calculateBalances(
  users: User[],
  expenses: Expense[],
  settlements: SettlementRecord[]
): {
  userSummaries: UserBalanceSummary[];
  totalGroupSpending: number;
  currentUserNet: number;
  pendingApprovalCount: number;
  pendingApprovalTotal: number;
} {
  const paidMap: Record<string, number> = {};
  const owedMap: Record<string, number> = {};
  let totalGroupSpending = 0;
  let pendingApprovalCount = 0;
  let pendingApprovalTotal = 0;

  users.forEach((u) => {
    paidMap[u.id] = 0;
    owedMap[u.id] = 0;
  });

  // Tally expenses
  expenses.forEach((exp) => {
    // Only count approved expenses in the official balance
    const isApproved = exp.status === 'approved' || !exp.status;

    if (!isApproved) {
      if (exp.status === 'pending_approval') {
        pendingApprovalCount++;
        pendingApprovalTotal += exp.amount;
      }
      return;
    }

    totalGroupSpending += exp.amount;

    // If paid by a specific user (not room fund)
    if (exp.paidById !== 'room_fund') {
      paidMap[exp.paidById] = (paidMap[exp.paidById] || 0) + exp.amount;
    }

    if (exp.splitShares && exp.splitShares.length > 0) {
      exp.splitShares.forEach((share) => {
        owedMap[share.userId] = (owedMap[share.userId] || 0) + share.amount;
      });
    } else {
      // Equal fallback
      const sharePerUser = exp.amount / (users.length || 1);
      users.forEach((u) => {
        owedMap[u.id] = (owedMap[u.id] || 0) + sharePerUser;
      });
    }
  });

  // Tally settlements
  settlements.forEach((st) => {
    paidMap[st.fromUserId] = (paidMap[st.fromUserId] || 0) + st.amount;
    owedMap[st.toUserId] = (owedMap[st.toUserId] || 0) + st.amount;
  });

  const userSummaries: UserBalanceSummary[] = users.map((u) => {
    const totalPaid = paidMap[u.id] || 0;
    const totalOwed = owedMap[u.id] || 0;
    const netBalance = Math.round((totalPaid - totalOwed) * 100) / 100;
    return {
      userId: u.id,
      name: u.name,
      avatar: u.avatar,
      email: u.email,
      role: u.role || 'member',
      isCurrentUser: !!u.isCurrentUser,
      totalPaid,
      totalOwed,
      netBalance,
    };
  });

  const currentUser = userSummaries.find((u) => u.isCurrentUser) || userSummaries[0];
  const currentUserNet = currentUser ? currentUser.netBalance : 0;

  return {
    userSummaries,
    totalGroupSpending,
    currentUserNet,
    pendingApprovalCount,
    pendingApprovalTotal,
  };
}

/**
 * Computes minimal transactions to settle all debts (Greedy settlement algorithm)
 */
export function calculateSimplifiedDebts(userSummaries: UserBalanceSummary[]): DebtTransfer[] {
  interface Account {
    userId: string;
    balance: number;
  }

  const debtors: Account[] = [];
  const creditors: Account[] = [];

  userSummaries.forEach((u) => {
    const rounded = Math.round(u.netBalance * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ userId: u.userId, balance: -rounded });
    } else if (rounded > 0.01) {
      creditors.push({ userId: u.userId, balance: rounded });
    }
  });

  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const transfers: DebtTransfer[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = Math.min(debtor.balance, creditor.balance);
    if (amount > 0.01) {
      transfers.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance < 0.01) dIdx++;
    if (creditor.balance < 0.01) cIdx++;
  }

  return transfers;
}

export function filterExpensesByDateRange(
  expenses: Expense[],
  filterType: 'this-month' | 'last-month' | 'custom' | 'all' | 'Today' | 'Week' | 'Month' | 'Custom',
  customStart?: string,
  customEnd?: string,
  referenceDate: string = CURRENT_DATE_STRING
): Expense[] {
  const ref = new Date(referenceDate);

  return expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    if (isNaN(expDate.getTime())) return true;

    if (filterType === 'all') return true;

    if (filterType === 'Today') {
      return exp.date === referenceDate;
    }

    if (filterType === 'Week') {
      const weekStart = new Date(ref);
      weekStart.setDate(ref.getDate() - 6);
      return expDate >= weekStart && expDate <= ref;
    }

    if (filterType === 'Month' || filterType === 'this-month') {
      return (
        expDate.getFullYear() === ref.getFullYear() &&
        expDate.getMonth() === ref.getMonth()
      );
    }

    if (filterType === 'last-month') {
      const lastMonth = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      return (
        expDate.getFullYear() === lastMonth.getFullYear() &&
        expDate.getMonth() === lastMonth.getMonth()
      );
    }

    if (filterType === 'Custom' || filterType === 'custom') {
      if (customStart && customEnd) {
        return exp.date >= customStart && exp.date <= customEnd;
      }
      if (customStart) {
        return exp.date >= customStart;
      }
      if (customEnd) {
        return exp.date <= customEnd;
      }
      return true;
    }

    return true;
  });
}
