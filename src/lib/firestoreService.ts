import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  User, 
  Expense, 
  Bill, 
  RoomDeposit, 
  SettlementRecord, 
  AppNotification, 
  MemberInvite, 
  ChatMessage,
  FlatGroup
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_EXPENSES, 
  INITIAL_BILLS, 
  INITIAL_ROOM_DEPOSITS, 
  INITIAL_SETTLEMENTS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_INVITES, 
  INITIAL_CHAT_MESSAGES,
  INITIAL_FLATS
} from '../data/initialData';

// Firestore Collection Names
export const FLATS_COLLECTION = 'flats';
export const USERS_COLLECTION = 'users';
export const EXPENSES_COLLECTION = 'expenses';
export const BILLS_COLLECTION = 'bills';
export const DEPOSITS_COLLECTION = 'deposits';
export const SETTLEMENTS_COLLECTION = 'settlements';
export const NOTIFICATIONS_COLLECTION = 'notifications';
export const INVITES_COLLECTION = 'invites';
export const CHATS_COLLECTION = 'chat_messages';

/**
 * No-op — seeding removed. All data comes from real user input via Firestore.
 */
export async function seedInitialFirestoreData() {
  // Nothing to seed — app starts clean
}

// ---------------- Real-time Listeners ----------------

export function subscribeToFlats(onUpdate: (flats: FlatGroup[]) => void) {
  const q = collection(db, FLATS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const list: FlatGroup[] = [];
      snapshot.forEach((d) => list.push({ ...(d.data() as FlatGroup), id: d.id }));
      onUpdate(list);
    }
  }, (err) => console.error('Flats sub error:', err));
}

export function subscribeToUsers(onUpdate: (users: User[]) => void) {
  const q = collection(db, USERS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const list: User[] = [];
      snapshot.forEach((d) => list.push({ ...(d.data() as User), id: d.id }));
      onUpdate(list);
    }
  }, (err) => console.error('Users sub error:', err));
}

export function subscribeToExpenses(onUpdate: (expenses: Expense[]) => void) {
  const q = collection(db, EXPENSES_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const list: Expense[] = [];
    snapshot.forEach((d) => list.push({ ...(d.data() as Expense), id: d.id }));
    // Sort descending by date/createdAt
    list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    onUpdate(list);
  }, (err) => console.error('Expenses sub error:', err));
}

export function subscribeToDeposits(onUpdate: (deposits: RoomDeposit[]) => void) {
  const q = collection(db, DEPOSITS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const list: RoomDeposit[] = [];
    snapshot.forEach((d) => list.push({ ...(d.data() as RoomDeposit), id: d.id }));
    list.sort((a, b) => new Date(b.submittedAt || b.date).getTime() - new Date(a.submittedAt || a.date).getTime());
    onUpdate(list);
  }, (err) => console.error('Deposits sub error:', err));
}

export function subscribeToBills(onUpdate: (bills: Bill[]) => void) {
  const q = collection(db, BILLS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const list: Bill[] = [];
    snapshot.forEach((d) => list.push({ ...(d.data() as Bill), id: d.id }));
    onUpdate(list);
  }, (err) => console.error('Bills sub error:', err));
}

export function subscribeToSettlements(onUpdate: (settlements: SettlementRecord[]) => void) {
  const q = collection(db, SETTLEMENTS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const list: SettlementRecord[] = [];
    snapshot.forEach((d) => list.push({ ...(d.data() as SettlementRecord), id: d.id }));
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    onUpdate(list);
  }, (err) => console.error('Settlements sub error:', err));
}

export function subscribeToNotifications(onUpdate: (notifs: AppNotification[]) => void) {
  const q = collection(db, NOTIFICATIONS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const list: AppNotification[] = [];
    snapshot.forEach((d) => list.push({ ...(d.data() as AppNotification), id: d.id }));
    onUpdate(list);
  }, (err) => console.error('Notifications sub error:', err));
}

export function subscribeToInvites(onUpdate: (invites: MemberInvite[]) => void) {
  const q = collection(db, INVITES_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const list: MemberInvite[] = [];
    snapshot.forEach((d) => list.push({ ...(d.data() as MemberInvite), id: d.id }));
    onUpdate(list);
  }, (err) => console.error('Invites sub error:', err));
}

export function subscribeToChatMessages(onUpdate: (messages: ChatMessage[]) => void) {
  const q = collection(db, CHATS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const list: ChatMessage[] = [];
    snapshot.forEach((d) => list.push({ ...(d.data() as ChatMessage), id: d.id }));
    list.sort((a, b) => {
      const ta = a.createdAt || a.timestamp || '';
      const tb = b.createdAt || b.timestamp || '';
      return ta.localeCompare(tb);
    });
    // Always call onUpdate — even with empty array
    onUpdate(list);
  }, (err) => console.error('Chat sub error:', err));
}

// ---------------- Mutation Handlers ----------------

// Chat Messages
export async function sendChatMessageToDB(msg: Partial<ChatMessage>) {
  const id = msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date();

  // Build message without undefined fields
  const newMsg: Record<string, unknown> = {
    id,
    senderId:    msg.senderId    || 'unknown',
    senderName:  msg.senderName  || 'User',
    senderAvatar: msg.senderAvatar || '',
    recipientId: msg.recipientId || 'group',
    text:        msg.text        || '',
    timestamp:   msg.timestamp   || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt:   msg.createdAt   || now.toISOString(),
    type:        msg.type        || 'text',
    reactions:   msg.reactions   || {},
    deletedFor:  msg.deletedFor  || [],
    isDeletedForEveryone: false,
  };

  // Only include optional fields if they have actual values
  if (msg.amount     !== undefined) newMsg.amount     = msg.amount;
  if (msg.relatedId  !== undefined) newMsg.relatedId  = msg.relatedId;
  if (msg.seenBy     !== undefined) newMsg.seenBy     = msg.seenBy;

  await setDoc(doc(db, CHATS_COLLECTION, id), newMsg);
  return newMsg as unknown as ChatMessage;
}

export async function deleteMessageForEveryoneInDB(messageId: string) {
  const ref = doc(db, CHATS_COLLECTION, messageId);
  await updateDoc(ref, {
    isDeletedForEveryone: true,
    deletedAt: new Date().toISOString(),
    text: 'This message was deleted',
  });
}

export async function deleteMessageForMeInDB(messageId: string, currentUserId: string, currentDeletedFor: string[] = []) {
  const ref = doc(db, CHATS_COLLECTION, messageId);
  const updated = Array.from(new Set([...currentDeletedFor, currentUserId]));
  await updateDoc(ref, {
    deletedFor: updated,
  });
}

export async function markMessagesSeenInDB(messageIds: string[], userId: string) {
  if (!messageIds.length) return;
  const batch = writeBatch(db);
  for (const id of messageIds) {
    const ref = doc(db, CHATS_COLLECTION, id);
    batch.update(ref, { seenBy: [...new Set([userId])] });
  }
  await batch.commit().catch((err) => console.error('Mark seen DB error:', err));
}

export async function updateUserPresenceInDB(userId: string, data: { isOnline?: boolean; lastSeen?: string; typingInThread?: string | null }) {
  await updateDoc(doc(db, USERS_COLLECTION, userId), data).catch((err) => console.error('Presence update error:', err));
}

// Expenses
export async function saveExpenseToDB(expense: Expense) {
  await setDoc(doc(db, EXPENSES_COLLECTION, expense.id), expense);
}

export async function updateExpenseInDB(expenseId: string, data: Partial<Expense>) {
  await updateDoc(doc(db, EXPENSES_COLLECTION, expenseId), data);
}

export async function deleteExpenseFromDB(expenseId: string) {
  await deleteDoc(doc(db, EXPENSES_COLLECTION, expenseId));
}

// Room Deposits
export async function saveDepositToDB(deposit: RoomDeposit) {
  await setDoc(doc(db, DEPOSITS_COLLECTION, deposit.id), deposit);
}

export async function updateDepositInDB(depositId: string, data: Partial<RoomDeposit>) {
  await updateDoc(doc(db, DEPOSITS_COLLECTION, depositId), data);
}

// Bills
export async function saveBillToDB(bill: Bill) {
  await setDoc(doc(db, BILLS_COLLECTION, bill.id), bill);
}

export async function updateBillInDB(billId: string, data: Partial<Bill>) {
  await updateDoc(doc(db, BILLS_COLLECTION, billId), data);
}

// Settlements
export async function saveSettlementToDB(settlement: SettlementRecord) {
  await setDoc(doc(db, SETTLEMENTS_COLLECTION, settlement.id), settlement);
}

// Users
export async function saveUserToDB(user: User) {
  await setDoc(doc(db, USERS_COLLECTION, user.id), user);
}

export async function updateUserInDB(userId: string, data: Partial<User>) {
  await updateDoc(doc(db, USERS_COLLECTION, userId), data);
}

// Invites
export async function saveInviteToDB(invite: MemberInvite) {
  await setDoc(doc(db, INVITES_COLLECTION, invite.id), invite);
}

export async function updateInviteInDB(inviteId: string, data: Partial<MemberInvite>) {
  await updateDoc(doc(db, INVITES_COLLECTION, inviteId), data);
}

// Flats
export async function saveFlatToDB(flat: FlatGroup) {
  await setDoc(doc(db, FLATS_COLLECTION, flat.id), flat);
}

export async function updateFlatInDB(flatId: string, data: Partial<FlatGroup>) {
  await updateDoc(doc(db, FLATS_COLLECTION, flatId), data);
}

export async function addMemberEmailToFlat(flatId: string, email: string, currentEmails: string[] = []) {
  const normalized = email.trim().toLowerCase();
  if (!currentEmails.map((e) => e.toLowerCase()).includes(normalized)) {
    const updated = [...currentEmails, normalized];
    await updateDoc(doc(db, FLATS_COLLECTION, flatId), {
      memberEmails: updated,
    });
  }
}

// Notifications
export async function saveNotificationToDB(notif: AppNotification) {
  await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notif.id), notif);
}

export async function updateNotificationInDB(notifId: string, data: Partial<AppNotification>) {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notifId), data);
}
