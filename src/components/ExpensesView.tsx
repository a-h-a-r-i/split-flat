import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  SlidersHorizontal,
  ArrowUpRight,
  Sparkles,
  Users,
  Check,
  X
} from 'lucide-react';
import { Expense, User, CategoryType } from '../types';
import { 
  formatCurrency, 
  formatExactCurrency, 
  groupExpensesByDate, 
  formatDateHeader, 
  filterExpensesByDateRange 
} from '../utils/calculations';
import { CategoryIcon } from './CategoryIcon';

interface ExpensesViewProps {
  expenses: Expense[];
  users: User[];
  currentUser: User;
  onSelectExpense: (expense: Expense) => void;
  onOpenAddExpense: () => void;
  onOpenCustomDateModal: () => void;
  customDateRange: { start: string; end: string };
  onApproveExpense?: (expenseId: string) => void;
  onRejectExpense?: (expenseId: string) => void;
}

const CATEGORIES: (CategoryType | 'All')[] = [
  'All',
  'Food',
  'Groceries',
  'Household',
  'Utility',
  'Rent',
  'Entertainment',
  'Shopping',
  'Travel',
  'Health',
  'Other',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  users,
  currentUser,
  onSelectExpense,
  onOpenAddExpense,
  onOpenCustomDateModal,
  customDateRange,
  onApproveExpense,
  onRejectExpense,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [dateFilter, setDateFilter] = useState<'this-month' | 'last-month' | 'custom' | 'all'>('this-month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isHost = currentUser.role === 'host';
  const isCoHost = currentUser.role === 'co-host';
  const isHostOrCoHost = isHost || isCoHost;

  // 1. Filter by Date
  const dateFiltered = useMemo(() => {
    return filterExpensesByDateRange(
      expenses,
      dateFilter,
      customDateRange.start,
      customDateRange.end
    );
  }, [expenses, dateFilter, customDateRange]);

  // 2. Filter by Category, Search, & Status
  const filteredExpenses = useMemo(() => {
    return dateFiltered.filter((exp) => {
      // Category check
      if (selectedCategory !== 'All' && exp.category !== selectedCategory) {
        return false;
      }
      // Status check
      if (statusFilter === 'approved' && exp.status === 'pending_approval') {
        return false;
      }
      if (statusFilter === 'pending' && exp.status !== 'pending_approval') {
        return false;
      }
      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = exp.title.toLowerCase().includes(q);
        const payerMatch = (exp.paidByName || '').toLowerCase().includes(q);
        const noteMatch = (exp.notes || '').toLowerCase().includes(q);
        const catMatch = exp.category.toLowerCase().includes(q);
        return titleMatch || payerMatch || noteMatch || catMatch;
      }
      return true;
    });
  }, [dateFiltered, selectedCategory, statusFilter, searchQuery]);

  // Group filtered expenses by date
  const groupedExpenses = useMemo(() => {
    return groupExpensesByDate(filteredExpenses);
  }, [filteredExpenses]);

  // Metrics for active view
  const totalApprovedSum = useMemo(() => {
    return dateFiltered
      .filter((e) => e.status !== 'pending_approval' && e.status !== 'rejected')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [dateFiltered]);

  const pendingApprovalList = useMemo(() => {
    return expenses.filter((e) => e.status === 'pending_approval');
  }, [expenses]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Host Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Declined
          </span>
        );
      case 'approved':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
          </span>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Food':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Groceries':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Utility':
        return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'Rent':
      case 'Household':
        return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'Entertainment':
        return 'bg-pink-50 text-pink-600 border-pink-100';
      case 'Shopping':
        return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'Travel':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full max-w-[1280px] mx-auto pt-3 md:pt-4">
      {/* 1. Host Approval Alert Banner (If items are awaiting review) */}
      {pendingApprovalList.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-[13px] sm:text-[14px] font-bold text-amber-900">
                {pendingApprovalList.length} Expense{pendingApprovalList.length > 1 ? 's' : ''} Awaiting Host Approval
              </h4>
              <p className="text-[11px] sm:text-[12px] text-amber-700 mt-0.5">
                {isHost
                  ? 'As Host, review submitted expenses to verify receipts and include them in the shared ledger.'
                  : 'Your roommates have submitted expense proposals awaiting Host verification.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-semibold text-[11px] sm:text-[12px] hover:bg-amber-100/60 transition-all shadow-xs shrink-0 self-end sm:self-auto cursor-pointer"
          >
            {statusFilter === 'pending' ? 'Show All' : 'Review Proposals →'}
          </button>
        </div>
      )}

      {/* 2. Top Header & Metrics Strip */}
      <div className="flex flex-row justify-between items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Group Expense Ledger
          </span>
          <h2 className="text-[18px] sm:text-[22px] font-bold text-slate-900 tracking-tight truncate">
            Flat 402 Transactions
          </h2>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 truncate">
            Total Spend: <span className="font-bold text-slate-900 font-mono-numbers">{formatCurrency(totalApprovedSum)}</span> ({filteredExpenses.length})
          </p>
        </div>

        <div className="shrink-0">
          <button
            id="add-expense-header-btn"
            onClick={onOpenAddExpense}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[12px] sm:text-[13px] shadow-sm shadow-slate-900/20 transition-all active:scale-95 cursor-pointer border border-slate-800"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Add Expense</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* 3. Search & Multi-level Filter Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Search & Date Preset Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses, roommates, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl pl-9.5 pr-4 py-2 text-[12px] sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-mono cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Date Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setDateFilter('this-month')}
              className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                dateFilter === 'this-month'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('last-month')}
              className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                dateFilter === 'last-month'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => {
                setDateFilter('custom');
                onOpenCustomDateModal();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                dateFilter === 'custom'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>
        </div>

        {/* Status & Category Chips Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending</span>
              {pendingApprovalList.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {pendingApprovalList.length}
                </span>
              )}
            </button>
          </div>

          {/* Category Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Grouped Transactions List */}
      <div className="space-y-6">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-800">No expenses found</h3>
            <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
              No transactions match your current filters. Try changing your category or date range.
            </p>
            <button
              onClick={onOpenAddExpense}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add First Expense
            </button>
          </div>
        ) : (
          groupedExpenses.map((group) => (
            <div key={group.date} className="space-y-2.5">
              {/* Date Section Header */}
              <div className="flex justify-between items-center px-1">
                <span className="text-[13px] font-bold text-slate-700">
                  {formatDateHeader(group.date)}
                </span>
                <span className="text-[12px] font-mono text-slate-500 font-semibold">
                  Day Total: {formatCurrency(group.total)}
                </span>
              </div>

              {/* Transactions Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
                {group.expenses.map((expense) => {
                  const isPending = expense.status === 'pending_approval';
                  const isDeclined = expense.status === 'rejected';

                  return (
                    <div
                      key={expense.id}
                      onClick={() => onSelectExpense(expense)}
                      className={`p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                        isPending ? 'bg-amber-50/30' : isDeclined ? 'bg-rose-50/30 opacity-70' : ''
                      }`}
                    >
                      {/* Left: Category Icon & Title Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getCategoryColor(
                            expense.category
                          )}`}
                        >
                          <CategoryIcon category={expense.category} iconName={expense.icon} className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-[14px] font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
                              {expense.title}
                            </h4>
                            {isPending && getStatusBadge('pending_approval')}
                            {isDeclined && getStatusBadge('rejected')}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[12px] text-slate-500 flex-wrap">
                            <span className="font-medium text-slate-700">
                              Paid by <strong className="text-slate-900 font-semibold">{expense.paidByName || 'Member'}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {expense.category}
                            </span>
                            {expense.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px] italic text-slate-400">"{expense.notes}"</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Quick Host Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-[16px] font-bold font-mono font-mono-numbers block ${
                              isDeclined
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {formatCurrency(expense.amount)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            ₹{(expense.amount / (users.length || 1)).toFixed(0)}/person
                          </span>
                        </div>

                        {/* Quick 1-Click Host / Co-Host Approval Buttons */}
                        {isHostOrCoHost && isPending && onApproveExpense && onRejectExpense && (
                          <div
                            className="hidden sm:flex items-center gap-1 ml-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onApproveExpense(expense.id)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all"
                              title="Approve expense"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onRejectExpense(expense.id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all"
                              title="Decline expense"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
