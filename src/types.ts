export interface FundCollectionCall {
  active: boolean;
  amountPerPerson: number;
  totalTarget?: number;
  title: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface FlatGroup {
  id: string;
  name: string;
  code: string;
  building?: string;
  address?: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: string;
  memberEmails: string[];
  fundCollectionCall?: FundCollectionCall;
}

export interface RoomDeposit {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer';
  notes?: string;
  status: 'approved' | 'pending_approval' | 'rejected';
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export type CategoryType = 
  | 'Food'
  | 'Groceries'
  | 'Utility'
  | 'Rent'
  | 'Household'
  | 'Travel'
  | 'Entertainment'
  | 'Shopping'
  | 'Health'
  | 'Other';

export type UserRole = 'host' | 'co-host' | 'member';

export type SplitType = 'equal' | 'exact' | 'percentage';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: UserRole;
  upiId?: string;
  phone?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
  isCurrentUser?: boolean;
  status?: 'active' | 'invited';
  typingInThread?: string | null; // recipientId they're currently typing in
}

export interface SplitShare {
  userId: string;
  amount: number;
  percentage?: number;
}

export type ExpenseStatus = 'approved' | 'pending_approval' | 'rejected';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: CategoryType;
  paidById: string; // 'room_fund' or user id
  paidByName?: string;
  splitType: SplitType;
  splitShares: SplitShare[];
  date: string; // YYYY-MM-DD
  notes?: string;
  icon?: string;
  createdAt: string;
  status?: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  isReimbursementRequest?: boolean;
  reimbursementStatus?: 'pending' | 'reimbursed_from_pool' | 'settled_direct';
  proofNote?: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  category: CategoryType;
  dueDate: string; // YYYY-MM-DD
  recurring: 'monthly' | 'weekly' | 'yearly' | 'none';
  paidById?: string;
  isPaid: boolean;
  notes?: string;
  splitWithIds: string[];
}

export interface SettlementRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: string;
  note?: string;
  paymentMethod: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
}

export interface MemberInvite {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: string;
  code: string;
  status: 'pending' | 'accepted';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'approval_request' | 'approval_done' | 'invite' | 'settlement' | 'bill' | 'expense' | 'general';
  actionExpenseId?: string;
}

// Alias for backward compatibility
export type NotificationItem = AppNotification;

export interface DebtTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  text: string;
  timestamp: string;   // display string e.g. "2:30 PM"
  createdAt: string;   // ISO string for reliable sorting
  type?: 'text' | 'announcement' | 'nudge' | 'payment_reminder' | 'expense_share';
  amount?: number;
  relatedId?: string;
  reactions?: Record<string, string[]>;
  deletedFor?: string[];
  isDeletedForEveryone?: boolean;
  deletedAt?: string;
  seenBy?: string[];   // user IDs who have seen this message
}
