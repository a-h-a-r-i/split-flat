import { User, Expense, Bill, SettlementRecord, MemberInvite, RoomDeposit, FlatGroup } from '../types';
import { AppNotification } from '../types';
import { ChatMessage } from '../types';

export const ROOM_FUND_ID   = 'room_fund';
export const ROOM_FUND_NAME = 'Room Money (Flat Pool)';

// ── All collections start empty — data is loaded from Firestore ─────────────

export const INITIAL_FLATS: FlatGroup[]         = [];
export const INITIAL_USERS: User[]              = [];
export const INITIAL_EXPENSES: Expense[]        = [];
export const INITIAL_BILLS: Bill[]              = [];
export const INITIAL_ROOM_DEPOSITS: RoomDeposit[] = [];
export const INITIAL_SETTLEMENTS: SettlementRecord[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_INVITES: MemberInvite[]   = [];
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];
