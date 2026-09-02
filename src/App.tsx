/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ROOM_FUND_ID, 
  ROOM_FUND_NAME 
} from './data/initialData';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-rose-700">Something went wrong</h2>
            <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 overflow-auto max-h-48 border border-slate-200">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack?.slice(0, 600)}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="w-full py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { 
  User, 
  Expense, 
  Bill, 
  AppNotification, 
  SettlementRecord, 
  MemberInvite, 
  RoomDeposit, 
  UserRole, 
  ChatMessage,
  FlatGroup,
  FundCollectionCall
} from './types';
import { 
  seedInitialFirestoreData,
  subscribeToFlats,
  subscribeToUsers,
  subscribeToExpenses,
  subscribeToDeposits,
  subscribeToBills,
  subscribeToSettlements,
  subscribeToNotifications,
  subscribeToInvites,
  subscribeToChatMessages,
  sendChatMessageToDB,
  deleteMessageForEveryoneInDB,
  deleteMessageForMeInDB,
  markMessagesSeenInDB,
  updateUserPresenceInDB,
  saveExpenseToDB,
  updateExpenseInDB,
  deleteExpenseFromDB,
  saveDepositToDB,
  updateDepositInDB,
  saveBillToDB,
  updateBillInDB,
  saveSettlementToDB,
  saveUserToDB,
  updateUserInDB,
  saveInviteToDB,
  saveNotificationToDB,
  saveFlatToDB,
  updateFlatInDB,
  addMemberEmailToFlat
} from './lib/firestoreService';
import { TopAppBar } from './components/TopAppBar';
import { TopRoomBalanceBar } from './components/TopRoomBalanceBar';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { ExpensesView } from './components/ExpensesView';
import { HomeDashboardView } from './components/HomeDashboardView';
import { BillsView } from './components/BillsView';
import { ChatsView } from './components/ChatsView';
import { MoreView } from './components/MoreView';
import { ExpenseDetailModal } from './components/ExpenseDetailModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { DepositModal } from './components/DepositModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CustomDateModal } from './components/CustomDateModal';
import { ProfileModal } from './components/ProfileModal';
import { InviteModal } from './components/InviteModal';
import { RoommateMessengerModal } from './components/RoommateMessengerModal';
import { SendNotificationModal } from './components/SendNotificationModal';
import { ProfilePhotoViewerModal } from './components/ProfilePhotoViewerModal';
import { SwitchFlatModal } from './components/SwitchFlatModal';
import { LoginPage } from './components/LoginPage';
import { SetCollectionModal } from './components/SetCollectionModal';
import { 
  getStoredAuthUserId, 
  setStoredAuthSession, 
  clearStoredAuthSession 
} from './utils/auth';
import { signInWithGoogle, signOutFirebase, ensureFirebaseAuthUser } from './lib/firebase';
import { 
  calculateBalances, 
  calculateSimplifiedDebts, 
  calculateRoomFundSummary, 
  CURRENT_DATE_STRING 
} from './utils/calculations';

function AppInner() {
  // Flats state — all populated from Firestore
  const [flats, setFlats]           = useState<FlatGroup[]>([]);
  const [activeFlatId, setActiveFlatId] = useState<string>(() => {
    // Try to restore from session storage
    try {
      return localStorage.getItem('equityhub_active_flat') || '';
    } catch { return ''; }
  });
  const [isSwitchFlatOpen, setIsSwitchFlatOpen] = useState(false);

  // Keep a ref of the active user ID so Firestore listeners always use latest value
  const activeUserIdRef = useRef<string | null>(getStoredAuthUserId());

  // Auth state — restore from stored session if still valid (6-month persistence)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return getStoredAuthUserId() !== null;
  });

  // All app state starts empty — populated by Firestore real-time subscriptions
  const [users, setUsers]             = useState<User[]>([]);
  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [deposits, setDeposits]       = useState<RoomDeposit[]>([]);
  const [bills, setBills]             = useState<Bill[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [invites, setInvites]         = useState<MemberInvite[]>([]);

  // Active View Tab (Default: 'home' for Home Dashboard)
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Modals
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSetCollectionModalOpen, setIsSetCollectionModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileViewingUser, setProfileViewingUser] = useState<User | null>(null);
  const [isProfilePhotoViewerOpen, setIsProfilePhotoViewerOpen] = useState(false);
  const [photoViewerUser, setPhotoViewerUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);

  const [customDateRange, setCustomDateRange] = useState({
    start: '2026-08-01',
    end: CURRENT_DATE_STRING,
  });

  // Current active flat and computed logged in user
  const activeFlat = useMemo(
    () => flats.find((f) => f.id === activeFlatId) || flats[0] || null,
    [flats, activeFlatId]
  );

  const currentUser = useMemo(
    () => {
      const found = users.find((u) => u.isCurrentUser);
      if (found) return found;
      // Fallback: find by stored ID
      const storedId = activeUserIdRef.current || getStoredAuthUserId();
      if (storedId) return users.find((u) => u.id === storedId) || users[0] || null;
      return users[0] || null;
    },
    [users]
  );

  // Presence: mark current user online/offline and update lastSeen
  useEffect(() => {
    if (!currentUser?.id || !isAuthenticated) return;
    updateUserPresenceInDB(currentUser.id, { isOnline: true });
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        updateUserPresenceInDB(currentUser.id, {
          isOnline: false,
          lastSeen: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        updateUserPresenceInDB(currentUser.id, { isOnline: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      updateUserPresenceInDB(currentUser.id, {
        isOnline: false,
        lastSeen: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    };
  }, [currentUser?.id, isAuthenticated]);

  // Setup Firestore Real-time Subscriptions and Seed Initial Data
  useEffect(() => {
    seedInitialFirestoreData();

    // Ensure Firebase Auth session exists so Firestore writes work
    const storedEmail = (() => { try { const s = localStorage.getItem('equityhub_auth_session'); return s ? JSON.parse(s).email : null; } catch { return null; } })();
    ensureFirebaseAuthUser(storedEmail || 'anon@equityhub.app').catch(() => {});

    const storedId = getStoredAuthUserId();

    const unsubFlats = subscribeToFlats((freshFlats) => {
      if (freshFlats.length > 0) {
        setFlats(freshFlats);
        // If no activeFlatId set yet, use the first flat for this user
        setActiveFlatId((prev) => {
          if (prev) return prev;
          const uid = activeUserIdRef.current || getStoredAuthUserId();
          const match = freshFlats.find(
            (f) => f.memberEmails?.some((e) => e === uid) || f.createdByEmail === uid
          );
          return match?.id || freshFlats[0]?.id || prev;
        });
      }
    });

    const unsubUsers = subscribeToUsers((freshUsers) => {
      if (freshUsers.length > 0) {
        const latestId = activeUserIdRef.current || getStoredAuthUserId();
        setUsers(
          freshUsers.map((u) => ({
            ...u,
            isCurrentUser: latestId ? u.id === latestId : false,
          }))
        );
      }
    });

    const unsubExpenses = subscribeToExpenses((freshExpenses) => {
      if (freshExpenses.length > 0) setExpenses(freshExpenses);
    });

    const unsubDeposits = subscribeToDeposits((freshDeposits) => {
      if (freshDeposits.length > 0) setDeposits(freshDeposits);
    });

    const unsubBills = subscribeToBills((freshBills) => {
      if (freshBills.length > 0) setBills(freshBills);
    });

    const unsubSettlements = subscribeToSettlements((freshSettlements) => {
      if (freshSettlements.length > 0) setSettlements(freshSettlements);
    });

    const unsubNotifs = subscribeToNotifications((freshNotifs) => {
      if (freshNotifs.length > 0) setNotifications(freshNotifs);
    });

    const unsubInvites = subscribeToInvites((freshInvites) => {
      if (freshInvites.length > 0) setInvites(freshInvites);
    });

    const unsubChats = subscribeToChatMessages((freshChats) => {
      setMessages(freshChats);
    });

    return () => {
      unsubFlats();
      unsubUsers();
      unsubExpenses();
      unsubDeposits();
      unsubBills();
      unsubSettlements();
      unsubNotifs();
      unsubInvites();
      unsubChats();
    };
  }, []);

  // Computed financial summaries
  const { userSummaries, totalGroupSpending, currentUserNet } = useMemo(
    () => calculateBalances(users, expenses, settlements),
    [users, expenses, settlements]
  );

  // Room Money Pool summary (Total Collected vs Spent from Room Money)
  const roomFundSummary = useMemo(
    () => calculateRoomFundSummary(deposits, expenses, users),
    [deposits, expenses, users]
  );

  const debtTransfers = useMemo(
    () => calculateSimplifiedDebts(userSummaries),
    [userSummaries]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // User Switching & Profile Handlers
  const handleSwitchUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        isCurrentUser: u.id === userId,
      }))
    );
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? ({ ...u, ...updatedData } as User) : u
      )
    );
    if (currentUser.id) {
      updateUserInDB(currentUser.id, updatedData).catch((err) =>
        console.error('Update user DB error:', err)
      );
    }
  };

  // Sign In with email logic - checks which flat(s) the email belongs to
  const handleLoginWithEmail = (
    email: string,
    rememberSixMonths: boolean = true,
    selectedFlatId?: string
  ): { success: boolean; matchingFlats: FlatGroup[]; error?: string } => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      return { success: false, matchingFlats: [], error: 'Please enter a valid email address.' };
    }

    // Find all flats where user is creator or in memberEmails
    const matchingFlats = flats.filter(
      (f) =>
        f.memberEmails?.some((e) => e.toLowerCase() === normalizedEmail) ||
        f.createdByEmail?.toLowerCase() === normalizedEmail
    );

    // If a specific flat is selected or exactly 1 matching flat exists
    if (selectedFlatId || matchingFlats.length === 1) {
      const targetFlat = selectedFlatId
        ? flats.find((f) => f.id === selectedFlatId) || matchingFlats[0]
        : matchingFlats[0];

      if (targetFlat) {
        setActiveFlatId(targetFlat.id);
        try { localStorage.setItem('equityhub_active_flat', targetFlat.id); } catch {}
      }

      // Find or activate user in the users list
      let matchedUser = users.find(
        (u) => u.email.toLowerCase().trim() === normalizedEmail
      );

      if (!matchedUser) {
        // Check if there is an invite
        const matchedInvite = invites.find(
          (i) => i.email.toLowerCase().trim() === normalizedEmail
        );
        if (matchedInvite) {
          handleAcceptInvite(matchedInvite);
          matchedUser = {
            id: `u${users.length + 1}`,
            name: matchedInvite.name,
            email: matchedInvite.email,
            role: matchedInvite.role,
            avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            isCurrentUser: true,
            status: 'active',
          };
        } else {
          // Provision member user for this flat
          const isCreator = targetFlat?.createdByEmail?.toLowerCase() === normalizedEmail;
          const newU: User = {
            id: `u${Date.now()}`,
            name: normalizedEmail.split('@')[0],
            email: normalizedEmail,
            role: isCreator ? 'host' : 'member',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedEmail.split('@')[0])}&background=0f172a&color=fff&size=150`,
            isCurrentUser: true,
            status: 'active',
          };
          setUsers((prev) => prev.map((u) => ({ ...u, isCurrentUser: false })).concat(newU));
          saveUserToDB(newU).catch((err) => console.error('Save user DB error:', err));
          matchedUser = newU;
        }
      } else {
        handleSwitchUser(matchedUser.id);
      }

      if (matchedUser) {
        activeUserIdRef.current = matchedUser.id;
        setStoredAuthSession(matchedUser.id, matchedUser.email);
        // Ensure Firebase Auth token so Firestore writes work
        ensureFirebaseAuthUser(matchedUser.email).catch(() => {});
      }

      setIsAuthenticated(true);
      return { success: true, matchingFlats: targetFlat ? [targetFlat] : matchingFlats };
    }

    // If user belongs to multiple flats and hasn't chosen one yet
    if (matchingFlats.length > 1) {
      return { success: false, matchingFlats };
    }

    // If user not yet listed in flats, check pending invites
    const matchedInvite = invites.find(
      (i) => i.email.toLowerCase().trim() === normalizedEmail
    );
    if (matchedInvite) {
      handleAcceptInvite(matchedInvite);
      activeUserIdRef.current = matchedInvite.id;
      setStoredAuthSession(matchedInvite.id, matchedInvite.email);
      setIsAuthenticated(true);
      return { success: true, matchingFlats: activeFlat ? [activeFlat] : [] };
    }

    return { success: false, matchingFlats: [], error: 'Email not found in any flat. Ask your Host to invite you.' };
  };

  // Create new Account & new Flat / Apartment
  const handleCreateAccountAndFlat = (data: {
    userName: string;
    email: string;
    flatName: string;
    building?: string;
    rememberSixMonths?: boolean;
  }) => {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Prevent duplicate: if user with this email already exists locally, skip
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      handleSwitchUser(existing.id);
      activeUserIdRef.current = existing.id;
      setStoredAuthSession(existing.id, existing.email);
      setIsAuthenticated(true);
      return;
    }

    const flatId  = `flat-${Date.now()}`;
    const userId  = `u${Date.now()}`;

    const newFlat: FlatGroup = {
      id: flatId,
      name: data.flatName.trim(),
      code: `FLAT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      createdByEmail: normalizedEmail,
      createdByName: data.userName.trim(),
      createdAt: new Date().toISOString(),
      memberEmails: [normalizedEmail],
      ...(data.building?.trim() ? { building: data.building.trim() } : {}),
    };

    const newHostUser: User = {
      id: userId,
      name: data.userName.trim(),
      email: normalizedEmail,
      role: 'host',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.userName.trim())}&background=0f172a&color=fff&size=150`,
      isCurrentUser: true,
      status: 'active',
    };

    // Update local state first so currentUser + activeFlat resolve immediately
    setFlats([newFlat]);
    setUsers([newHostUser]);
    setActiveFlatId(flatId);
    try { localStorage.setItem('equityhub_active_flat', flatId); } catch {}
    activeUserIdRef.current = userId;
    setStoredAuthSession(userId, normalizedEmail);

    // Persist to Firestore in background — check for existing user first
    ensureFirebaseAuthUser(normalizedEmail).then(() => {
      saveFlatToDB(newFlat).catch((err) => console.error('Save flat DB error:', err));
      // Only save user if not already exists with same email
      saveUserToDB(newHostUser).catch((err) => console.error('Save user DB error:', err));
    }).catch(() => {
      saveFlatToDB(newFlat).catch((err) => console.error('Save flat DB error:', err));
      saveUserToDB(newHostUser).catch((err) => console.error('Save user DB error:', err));
    });

    // Authenticate last — by now local state is ready
    setIsAuthenticated(true);
  };

  const handleSelectFlat = (flatId: string) => {
    setActiveFlatId(flatId);
    try { localStorage.setItem('equityhub_active_flat', flatId); } catch {}
  };

  const handleCreateFlatFromSwitcher = (flatData: { name: string; building?: string; address?: string }) => {
    handleCreateAccountAndFlat({
      userName: currentUser.name,
      email: currentUser.email,
      flatName: flatData.name,
      building: flatData.building,
      rememberSixMonths: true,
    });
  };

  const handleSelectUserProfile = (userId: string, rememberSixMonths: boolean = true) => {
    const matched = users.find((u) => u.id === userId);
    if (rememberSixMonths && matched) {
      activeUserIdRef.current = matched.id;
      setStoredAuthSession(matched.id, matched.email);
    }
    handleSwitchUser(userId);
    setIsAuthenticated(true);
    };

  const handleGoogleSignIn = async (): Promise<{ success: boolean; email?: string; error?: string; needsFlat?: boolean }> => {
    try {
      const { email, name, photoURL } = await signInWithGoogle();
      if (!email) return { success: false, error: 'No email returned from Google.' };

      // Check if this Google email exists in any flat
      const result = handleLoginWithEmail(email, true);
      if (result.success) return { success: true, email };
      if (result.matchingFlats.length > 1) {
        // Multiple flats — handled by LoginPage flat-selector
        return { success: false, email, error: 'multiple_flats' };
      }

      // Email not in any flat — provision new user shell and ask to create a flat
      return { success: false, email, needsFlat: true };
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      return { success: false, error: err?.message || 'Google sign-in failed.' };
    }
  };

  const handleSignOut = () => {
    activeUserIdRef.current = null;
    clearStoredAuthSession();
    try { localStorage.removeItem('equityhub_active_flat'); } catch {}
    signOutFirebase().catch(console.error);
    setIsAuthenticated(false);
    setIsProfileModalOpen(false);
    };

  // Invite System Handlers - Only the host/roommates can add their roommates' emails
  const handleSendInvite = (email: string, name: string, role: UserRole) => {
    const normalizedEmail = email.trim().toLowerCase();
    const newInvite: MemberInvite = {
      id: `inv-${Date.now()}`,
      email: normalizedEmail,
      name: name.trim(),
      role,
      invitedBy: `${currentUser.name} (${currentUser.role === 'host' ? 'Host' : 'Co-Host'})`,
      invitedAt: new Date().toISOString(),
      code: `EQ-${activeFlat.code || 'FLAT'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      status: 'pending',
    };

    setInvites((prev) => [newInvite, ...prev]);
    saveInviteToDB(newInvite).catch((err) => console.error('Save invite DB error:', err));

    // Add email to current flat's memberEmails in DB
    addMemberEmailToFlat(activeFlat.id, normalizedEmail, activeFlat.memberEmails).catch((err) =>
      console.error('Add member to flat DB error:', err)
    );

    // Update local flat state
    setFlats((prev) =>
      prev.map((f) => {
        if (f.id === activeFlat.id) {
          const list = f.memberEmails || [];
          if (!list.map((e) => e.toLowerCase()).includes(normalizedEmail)) {
            return { ...f, memberEmails: [...list, normalizedEmail] };
          }
        }
        return f;
      })
    );

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Invitation Sent',
      message: `Invitation dispatched to ${newInvite.name} (${newInvite.email}) for ${activeFlat.name} as ${newInvite.role}.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'invite',
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
  };

  const handleRevokeInvite = (inviteId: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  };

  const handleAcceptInvite = (invite: MemberInvite) => {
    const existing = users.find(
      (u) => u.email.toLowerCase() === invite.email.toLowerCase()
    );
    if (existing) {
      handleSwitchUser(existing.id);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      return;
    }

    const newUser: User = {
      id: `u${users.length + 1}`,
      name: invite.name,
      email: invite.email,
      role: invite.role,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      isCurrentUser: true,
      status: 'active',
    };

    setUsers((prev) =>
      prev.map((u) => ({ ...u, isCurrentUser: false })).concat(newUser)
    );
    saveUserToDB(newUser).catch((err) => console.error('Save user DB error:', err));

    setInvites((prev) => prev.filter((i) => i.id !== invite.id));

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Welcome to Flat 402!',
      message: `${newUser.name} joined as ${newUser.role}. You can now view and log expenses.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'invite',
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
  };

  const handleAddUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: `u${users.length + 1}`,
      name: userData.name || 'New Roommate',
      email: userData.email || `member${users.length + 1}@flat402.local`,
      phone: userData.phone || '+91 98765 00000',
      upiId: userData.upiId,
      avatar: userData.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      role: userData.role || 'member',
      isCurrentUser: false,
      status: 'active',
    };

    setUsers((prev) => [...prev, newUser]);
    saveUserToDB(newUser).catch((err) => console.error('Save user DB error:', err));
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    updateUserInDB(userId, { role: newRole }).catch((err) => console.error('Update user role DB error:', err));

    const targetUser = users.find((u) => u.id === userId);
    const notif: AppNotification = {
      id: `notif-role-${Date.now()}`,
      title: 'Roommate Role Updated',
      message: `${targetUser?.name || 'Member'} is now assigned as ${newRole.toUpperCase()} in Flat 402.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'general',
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
  };

  // Messenger Chat Handlers - Fully synced to Firestore DB
  const handleSendMessage = (msgData: Partial<ChatMessage>) => {
    const now = new Date();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId:     msgData.senderId     || currentUser.id,
      senderName:   msgData.senderName   || currentUser.name,
      senderAvatar: msgData.senderAvatar || currentUser.avatar,
      recipientId:  msgData.recipientId  || 'group',
      text:         msgData.text         || '',
      timestamp:    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt:    now.toISOString(),
      type:         msgData.type         || 'text',
      reactions:    msgData.reactions    || {},
      // Only include amount/seenBy if defined — Firestore rejects undefined
      ...(msgData.amount  !== undefined ? { amount:  msgData.amount  } : {}),
      ...(msgData.seenBy  !== undefined ? { seenBy:  msgData.seenBy  } : {}),
    };

    setMessages((prev) => [...prev, newMsg].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')));
    sendChatMessageToDB(newMsg).catch((err) => console.error('Send message DB error:', err));
  };

  const handleDeleteMessageForMe = (messageId: string) => {
    const target = messages.find((m) => m.id === messageId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const currentDeleted = m.deletedFor || [];
          if (!currentDeleted.includes(currentUser.id)) {
            return { ...m, deletedFor: [...currentDeleted, currentUser.id] };
          }
        }
        return m;
      })
    );
    deleteMessageForMeInDB(messageId, currentUser.id, target?.deletedFor).catch((err) =>
      console.error('Delete message for me DB error:', err)
    );
  };

  const handleDeleteMessageForEveryone = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            isDeletedForEveryone: true,
            text: 'This message was deleted',
            deletedAt: new Date().toISOString(),
          };
        }
        return m;
      })
    );
    deleteMessageForEveryoneInDB(messageId).catch((err) =>
      console.error('Delete message for everyone DB error:', err)
    );
  };

  const handleOpenMemberProfile = (user: User) => {
    setProfileViewingUser(user);
    setIsProfileModalOpen(true);
  };

  const handleOpenProfilePhoto = (user: User) => {
    setPhotoViewerUser(user);
    setIsProfilePhotoViewerOpen(true);
  };

  // Custom Notification Broadcast Handler
  const handleSendCustomNotification = (
    notifData: Partial<AppNotification>,
    targetUserIds: string[]
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: notifData.title || 'Flat 402 Alert',
      message: notifData.message || '',
      timestamp: 'Just now',
      isRead: false,
      type: notifData.type || 'general',
    };

    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToDB(newNotif).catch((err) => console.error('Save custom notif DB error:', err));
  };

  // Deposit (Money Handover) Handlers
  const handleSaveDeposit = (depositData: Partial<RoomDeposit>) => {
    const isHost = currentUser.role === 'host';
    const newDeposit: RoomDeposit = {
      id: `dep-${Date.now()}`,
      userId: depositData.userId || currentUser.id,
      userName: depositData.userName || currentUser.name,
      userAvatar: depositData.userAvatar || currentUser.avatar,
      amount: depositData.amount || 0,
      date: depositData.date || CURRENT_DATE_STRING,
      paymentMethod: depositData.paymentMethod || 'UPI',
      notes: depositData.notes,
      status: isHost ? 'approved' : 'pending_approval',
      submittedAt: new Date().toISOString(),
      approvedBy: isHost ? currentUser.id : undefined,
      approvedAt: isHost ? new Date().toISOString() : undefined,
    };

    setDeposits((prev) => [newDeposit, ...prev]);
    saveDepositToDB(newDeposit).catch((err) => console.error('Save deposit DB error:', err));

    if (isHost) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Room Money Deposit Recorded',
        message: `Host recorded deposit of ₹${newDeposit.amount} from ${newDeposit.userName} into Flat 402 common fund.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'general',
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
    } else {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Room Money Handover Pending Host Approval',
        message: `${currentUser.name} handed over ₹${newDeposit.amount} via ${newDeposit.paymentMethod}. Awaiting Host Harinadh to confirm receipt.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'approval_request',
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
    }
  };

  const handleApproveDeposit = (depositId: string) => {
    setDeposits((prev) =>
      prev.map((d) => {
        if (d.id === depositId) {
          return {
            ...d,
            status: 'approved',
            approvedBy: currentUser.id,
            approvedAt: new Date().toISOString(),
          };
        }
        return d;
      })
    );
    updateDepositInDB(depositId, {
      status: 'approved',
      approvedBy: currentUser.id,
      approvedAt: new Date().toISOString(),
    }).catch((err) => console.error('Approve deposit DB error:', err));

    const approvedDep = deposits.find((d) => d.id === depositId);
    if (approvedDep) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Room Money Handover Approved!',
        message: `Host ${currentUser.name} confirmed receipt of ₹${approvedDep.amount} from ${approvedDep.userName}. Added to Room Pool!`,
        timestamp: 'Just now',
        isRead: false,
        type: 'approval_done',
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
    }
  };

  const handleRejectDeposit = (depositId: string) => {
    setDeposits((prev) =>
      prev.map((d) => (d.id === depositId ? { ...d, status: 'rejected' } : d))
    );
    updateDepositInDB(depositId, { status: 'rejected' }).catch((err) =>
      console.error('Reject deposit DB error:', err)
    );

    const rejectedDep = deposits.find((d) => d.id === depositId);
    if (rejectedDep) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Room Money Handover Declined',
        message: `Host declined handover proposal of ₹${rejectedDep.amount} from ${rejectedDep.userName}.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'general',
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
    }
  };

  // Expense Handlers
  const handleSaveExpense = (expenseData: Partial<Expense>) => {
    const isHost = currentUser.role === 'host';

    if (expenseData.id) {
      // Update existing
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseData.id ? ({ ...e, ...expenseData } as Expense) : e
        )
      );
      updateExpenseInDB(expenseData.id, expenseData).catch((err) =>
        console.error('Update expense DB error:', err)
      );
    } else {
      // Create new
      const isRoomFund = expenseData.paidById === ROOM_FUND_ID;
      const initialStatus = isHost ? 'approved' : 'pending_approval';

      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        title: expenseData.title || 'Untitled Expense',
        amount: expenseData.amount || 0,
        category: expenseData.category || 'Food',
        paidById: expenseData.paidById || (isHost ? ROOM_FUND_ID : currentUser.id),
        paidByName: isRoomFund
          ? ROOM_FUND_NAME
          : expenseData.paidByName || (users.find(u => u.id === expenseData.paidById)?.name || currentUser.name),
        splitType: expenseData.splitType || 'equal',
        splitShares: expenseData.splitShares || [],
        date: expenseData.date || CURRENT_DATE_STRING,
        notes: expenseData.notes,
        icon: expenseData.icon || 'shopping_cart',
        createdAt: new Date().toISOString(),
        status: initialStatus,
        approvedBy: isHost ? currentUser.id : undefined,
        approvedAt: isHost ? new Date().toISOString() : undefined,
      };

      setExpenses((prev) => [newExpense, ...prev]);
      saveExpenseToDB(newExpense).catch((err) => console.error('Save expense DB error:', err));

      if (isHost) {
        const notifsToAdd: AppNotification[] = [
          {
            id: `notif-${Date.now()}`,
            title: isRoomFund ? 'Room Money Expense Added' : 'New Expense Added',
            message: `${newExpense.paidByName} added "${newExpense.title}" for ₹${newExpense.amount}${isRoomFund ? ' (Deducted from Room Money)' : ''}`,
            timestamp: 'Just now',
            isRead: false,
            type: 'expense',
          }
        ];

        // Check if room pool entered deficit
        if (isRoomFund) {
          const newTotalSpent = roomFundSummary.totalSpent + newExpense.amount;
          if (newTotalSpent > roomFundSummary.totalCollected) {
            const deficit = newTotalSpent - roomFundSummary.totalCollected;
            const perHead = Math.ceil(deficit / Math.max(1, users.length));
            notifsToAdd.push({
              id: `notif-def-auto-${Date.now()}`,
              title: `⚠️ Room Money Deficit Alert: ₹${perHead.toLocaleString('en-IN')} Needed per Person`,
              message: `With "${newExpense.title}" (₹${newExpense.amount}), Room Money is overspent by -₹${deficit.toLocaleString('en-IN')}. Each of the ${users.length} flatmates should hand over ₹${perHead.toLocaleString('en-IN')} to balance the pool.`,
              timestamp: 'Just now',
              isRead: false,
              type: 'general',
            });
          }
        }

        setNotifications((prev) => [...notifsToAdd, ...prev]);
        notifsToAdd.forEach((n) => saveNotificationToDB(n).catch((err) => console.error('Save notif DB error:', err)));
      } else {
        const notif: AppNotification = {
          id: `notif-${Date.now()}`,
          title: `Pending Approval: ${currentUser.name} submitted an expense`,
          message: `"${newExpense.title}" (₹${newExpense.amount}) was submitted. Awaiting Host verification.`,
          timestamp: 'Just now',
          isRead: false,
          type: 'approval_request',
          actionExpenseId: newExpense.id,
        };
        setNotifications((prev) => [notif, ...prev]);
        saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
      }
    }
  };

  const handleSaveCollectionCall = (call: FundCollectionCall) => {
    const updatedFlat = {
      ...activeFlat,
      fundCollectionCall: call,
    };
    setFlats((prev) => prev.map((f) => (f.id === activeFlat.id ? updatedFlat : f)));
    saveFlatToDB(updatedFlat).catch((err) => console.error('Save flat collection call error:', err));

    if (call.active) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: `Room Collection Target: ₹${call.amountPerPerson.toLocaleString('en-IN')}/person`,
        message: `${currentUser.name} (Host) initiated collection for "${call.title}". Please hand over your deposit share.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'general',
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
    }
  };

  const handleApproveExpense = (expenseId: string, reimburseFromRoomFund: boolean = false) => {
    const targetExp = expenses.find((e) => e.id === expenseId);
    if (!targetExp) return;

    const updatedPaidById = reimburseFromRoomFund ? ROOM_FUND_ID : targetExp.paidById;
    const updatedPaidByName = reimburseFromRoomFund ? ROOM_FUND_NAME : targetExp.paidByName;
    const updatedReimbursementStatus = targetExp.isReimbursementRequest ? 'approved' : targetExp.reimbursementStatus;

    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === expenseId) {
          return {
            ...e,
            status: 'approved',
            paidById: updatedPaidById,
            paidByName: updatedPaidByName,
            reimbursementStatus: updatedReimbursementStatus,
            approvedBy: currentUser.id,
            approvedAt: new Date().toISOString(),
          };
        }
        return e;
      })
    );

    updateExpenseInDB(expenseId, {
      status: 'approved',
      paidById: updatedPaidById,
      paidByName: updatedPaidByName,
      reimbursementStatus: updatedReimbursementStatus,
      approvedBy: currentUser.id,
      approvedAt: new Date().toISOString(),
    }).catch((err) => console.error('Approve expense DB error:', err));

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: reimburseFromRoomFund ? 'Reimbursement Approved & Paid from Room Pool!' : 'Expense Proposal Approved!',
      message: reimburseFromRoomFund
        ? `Host ${currentUser.name} approved reimbursement of ₹${targetExp.amount} for "${targetExp.title}" directly from the Room Money common pool.`
        : `Host ${currentUser.name} approved "${targetExp.title}" (₹${targetExp.amount}). Recorded in group balances.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'approval_done',
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));

    if (selectedExpense?.id === expenseId) {
      setSelectedExpense((prev) =>
        prev
          ? {
              ...prev,
              status: 'approved',
              paidById: updatedPaidById,
              paidByName: updatedPaidByName,
              reimbursementStatus: updatedReimbursementStatus,
            }
          : null
      );
    }
  };

  const handleRejectExpense = (expenseId: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? { ...e, status: 'rejected' } : e))
    );
    updateExpenseInDB(expenseId, { status: 'rejected' }).catch((err) =>
      console.error('Reject expense DB error:', err)
    );

    const rejectedExp = expenses.find((e) => e.id === expenseId);
    if (rejectedExp) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Expense Proposal Declined',
        message: `Host declined "${rejectedExp.title}". It will not count toward group balances.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'general',
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
    }

    if (selectedExpense?.id === expenseId) {
      setSelectedExpense((prev) => prev ? { ...prev, status: 'rejected' } : null);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    deleteExpenseFromDB(expenseId).catch((err) => console.error('Delete expense DB error:', err));
    if (selectedExpense?.id === expenseId) {
      setSelectedExpense(null);
    }
  };

  // Bill Handlers
  const handleTogglePaidBill = (billId: string) => {
    const target = bills.find((b) => b.id === billId);
    const newPaid = !target?.isPaid;
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, isPaid: newPaid } : b))
    );
    updateBillInDB(billId, { isPaid: newPaid }).catch((err) =>
      console.error('Update bill DB error:', err)
    );
  };

  const handleAddBill = (billData: Partial<Bill>) => {
    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      title: billData.title || 'Untitled Bill',
      amount: billData.amount || 0,
      category: billData.category || 'Utility',
      dueDate: billData.dueDate || CURRENT_DATE_STRING,
      recurring: billData.recurring || 'monthly',
      isPaid: false,
      notes: billData.notes,
      splitWithIds: billData.splitWithIds || users.map((u) => u.id),
    };

    setBills((prev) => [newBill, ...prev]);
    saveBillToDB(newBill).catch((err) => console.error('Save bill DB error:', err));

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'New Shared Bill Added',
      message: `"${newBill.title}" (₹${newBill.amount}) due on ${newBill.dueDate}`,
      timestamp: 'Just now',
      isRead: false,
      type: 'bill',
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
  };

  const handleConvertBillToExpense = (bill: Bill) => {
    handleSaveExpense({
      title: bill.title,
      amount: bill.amount,
      category: bill.category,
      paidById: currentUser.role === 'host' ? ROOM_FUND_ID : currentUser.id,
      notes: `Settled scheduled bill due ${bill.dueDate}`,
      date: CURRENT_DATE_STRING,
    });

    handleTogglePaidBill(bill.id);
  };

  // Settlement Handlers
  const handleRecordSettlement = (settlementData: Partial<SettlementRecord>) => {
    const newSettlement: SettlementRecord = {
      id: `set-${Date.now()}`,
      fromUserId: settlementData.fromUserId || users[1]?.id || 'u2',
      toUserId: settlementData.toUserId || users[0]?.id || 'u1',
      amount: settlementData.amount || 0,
      date: settlementData.date || CURRENT_DATE_STRING,
      note: settlementData.note,
      paymentMethod: settlementData.paymentMethod || 'UPI',
    };

    setSettlements((prev) => [newSettlement, ...prev]);
    saveSettlementToDB(newSettlement).catch((err) => console.error('Save settlement DB error:', err));

    const fromName = users.find((u) => u.id === newSettlement.fromUserId)?.name || 'User';
    const toName = users.find((u) => u.id === newSettlement.toUserId)?.name || 'User';

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Settlement Payment Recorded',
      message: `${fromName} paid ₹${newSettlement.amount} to ${toName} via ${newSettlement.paymentMethod}`,
      timestamp: 'Just now',
      isRead: false,
      type: 'settlement',
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDB(notif).catch((err) => console.error('Save notif DB error:', err));
  };

  const handleDeleteSettlement = (id: string) => {
    setSettlements((prev) => prev.filter((s) => s.id !== id));
  };

  // Broadcast Room Money deficit alert notification to all roommates
  const handleRequestPoolContribution = (deficitAmount: number, perPersonShare: number) => {
    const newNotif: AppNotification = {
      id: `notif-deficit-${Date.now()}`,
      title: `⚠️ Room Money Deficit Alert: ₹${perPersonShare.toLocaleString('en-IN')} Needed per Member`,
      message: `Flat 402 Room Money is in deficit by -₹${deficitAmount.toLocaleString('en-IN')}. Split among all ${users.length} flatmates is ₹${perPersonShare.toLocaleString('en-IN')} each. Please hand over your share to replenish the common pool.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'general',
    };

    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToDB(newNotif).catch((err) => console.error('Save notif DB error:', err));
  };

  // If unauthenticated, prompt user to sign in or create an account
  if (!isAuthenticated) {
    return (
      <LoginPage
        flats={flats}
        onLoginWithEmail={handleLoginWithEmail}
        onGoogleSignIn={handleGoogleSignIn}
        onCreateAccountAndFlat={handleCreateAccountAndFlat}
      />
    );
  }

  if (!currentUser || !activeFlat) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white overflow-hidden">
      {/* Top Application Bar */}
      <TopAppBar
        currentUser={currentUser}
        unreadCount={unreadNotificationsCount}
        unreadMessagesCount={messages.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenProfilePhoto={() => handleOpenProfilePhoto(currentUser)}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        onOpenSwitchFlat={() => setIsSwitchFlatOpen(true)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        groupName={activeFlat.name}
      />

      {/* Main Content Canvas */}
      <main className={`flex-1 min-h-0 flex flex-col w-full max-w-[1280px] mx-auto ${
        activeTab === 'chats'
          ? 'px-0 sm:px-4 md:px-6 pt-[56px] md:pt-[60px] pb-[64px] md:pb-0 overflow-hidden'
          : 'px-3 sm:px-5 md:px-6 pt-[56px] md:pt-[60px] pb-[80px] md:pb-6 overflow-y-auto'
      }`}>
        {/* Top Room Balance Bar: Rendered only on Home tab */}
        {activeTab === 'home' && (
          <TopRoomBalanceBar
            roomFundSummary={roomFundSummary}
            currentUser={currentUser}
            activeUsersCount={users.length}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
            onRequestContribution={handleRequestPoolContribution}
            onNavigateToDashboard={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            users={users}
            currentUser={currentUser}
            onSelectExpense={(exp) => setSelectedExpense(exp)}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            onOpenCustomDateModal={() => setIsCustomDateModalOpen(true)}
            customDateRange={customDateRange}
            onApproveExpense={handleApproveExpense}
            onRejectExpense={handleRejectExpense}
          />
        )}

        {activeTab === 'home' && (
          <HomeDashboardView
            userSummaries={userSummaries}
            totalGroupSpending={totalGroupSpending}
            expenses={expenses}
            bills={bills}
            users={users}
            currentUser={currentUser}
            roomFundSummary={roomFundSummary}
            deposits={deposits}
            activeFlat={activeFlat}
            onOpenSetCollectionModal={() => setIsSetCollectionModalOpen(true)}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onSelectExpense={(exp) => setSelectedExpense(exp)}
            onOpenSettleModal={(fromId, toId, suggestedAmount) => {
              setActiveTab('more');
            }}
            onApproveExpense={handleApproveExpense}
            onRejectExpense={handleRejectExpense}
            onApproveDeposit={handleApproveDeposit}
            onRejectDeposit={handleRejectDeposit}
            onRequestContribution={handleRequestPoolContribution}
          />
        )}

        {activeTab === 'bills' && (
          <BillsView
            bills={bills}
            users={users}
            onTogglePaidBill={handleTogglePaidBill}
            onConvertBillToExpense={handleConvertBillToExpense}
            onAddBill={handleAddBill}
          />
        )}

        {activeTab === 'chats' && (
          <ChatsView
            users={users}
            currentUser={currentUser}
            messages={messages}
            debtTransfers={debtTransfers}
            onSendMessage={handleSendMessage}
            onDeleteMessageForMe={handleDeleteMessageForMe}
            onDeleteMessageForEveryone={handleDeleteMessageForEveryone}
            onOpenMemberProfile={handleOpenMemberProfile}
            onOpenPhotoViewer={handleOpenProfilePhoto}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
            onOpenSendNotification={() => setIsSendNotificationOpen(true)}
            onOpenSettleModal={() => setActiveTab('more')}
            onMarkSeen={(messageIds) => markMessagesSeenInDB(messageIds, currentUser.id)}
            onUpdateTyping={(recipientId, isTyping) =>
              updateUserPresenceInDB(currentUser.id, { typingInThread: isTyping ? recipientId : null })
            }
          />
        )}

        {activeTab === 'more' && (
          <MoreView
            users={users}
            currentUser={currentUser}
            userSummaries={userSummaries}
            debtTransfers={debtTransfers}
            expenses={expenses}
            settlements={settlements}
            invites={invites}
            messages={messages}
            onAddUser={handleAddUser}
            onRecordSettlement={handleRecordSettlement}
            onDeleteSettlement={handleDeleteSettlement}
            onOpenInviteModal={() => setIsInviteModalOpen(true)}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onOpenMessenger={() => setActiveTab('chats')}
            onOpenSendNotification={() => setIsSendNotificationOpen(true)}
            onOpenSetCollectionModal={() => setIsSetCollectionModalOpen(true)}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onUpdateUserRole={handleUpdateUserRole}
            onRevokeInvite={handleRevokeInvite}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsAddExpenseOpen(true);
        }}
        onOpenDepositModal={() => setIsDepositModalOpen(true)}
        onOpenAddBill={() => {
          setActiveTab('bills');
        }}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        unreadMessagesCount={messages.length}
      />

      {/* Roommate Messenger Modal (Group & Direct 1-on-1 Chats) */}
      <RoommateMessengerModal
        isOpen={isMessengerOpen}
        onClose={() => setIsMessengerOpen(false)}
        currentUser={currentUser}
        users={users}
        messages={messages}
        onSendMessage={handleSendMessage}
      />

      {/* Broadcast Notification Alert Modal */}
      <SendNotificationModal
        isOpen={isSendNotificationOpen}
        onClose={() => setIsSendNotificationOpen(false)}
        currentUser={currentUser}
        users={users}
        onSendNotification={handleSendCustomNotification}
      />

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedExpense(null)}
          onEdit={(exp) => {
            setEditingExpense(exp);
            setIsAddExpenseOpen(true);
          }}
          onDelete={handleDeleteExpense}
          onApprove={handleApproveExpense}
          onReject={handleRejectExpense}
        />
      )}

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSaveExpense={handleSaveExpense}
        users={users}
        currentUser={currentUser}
        editExpense={editingExpense}
      />

      {/* Room Money Handover / Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onSaveDeposit={handleSaveDeposit}
        collectionGoalAmount={activeFlat?.fundCollectionCall?.active ? activeFlat.fundCollectionCall.amountPerPerson : undefined}
      />

      {/* Set Collection Goal Modal (Host Only) */}
      <SetCollectionModal
        isOpen={isSetCollectionModalOpen}
        onClose={() => setIsSetCollectionModalOpen(false)}
        activeFlat={activeFlat}
        roommatesCount={users.length}
        onSaveCollectionCall={(call) => {
          if (call) handleSaveCollectionCall(call);
          else {
            const updated = { ...activeFlat, fundCollectionCall: undefined };
            setFlats((prev) => prev.map((f) => (f.id === activeFlat.id ? updated : f)));
            updateFlatInDB(activeFlat.id, { fundCollectionCall: undefined }).catch(console.error);
          }
        }}
      />

      {/* Profile & Room Wallet Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileViewingUser(null);
        }}
        currentUser={currentUser}
        viewingUser={profileViewingUser}
        allUsers={users}
        deposits={deposits}
        onOpenDepositModal={() => setIsDepositModalOpen(true)}
        onUpdateProfile={handleUpdateUser}
        onAddNewUser={handleAddUser}
        onOpenPhotoViewer={handleOpenProfilePhoto}
        onSelectUserToMessage={(userId) => {
          setIsProfileModalOpen(false);
          setProfileViewingUser(null);
          setActiveTab('chats');
        }}
        onOpenInviteModal={() => {
          setIsProfileModalOpen(false);
          setIsInviteModalOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* Profile Photo Viewer Modal (Opens ONLY when clicking DP) */}
      <ProfilePhotoViewerModal
        isOpen={isProfilePhotoViewerOpen}
        user={photoViewerUser}
        onClose={() => {
          setIsProfilePhotoViewerOpen(false);
          setPhotoViewerUser(null);
        }}
        onOpenProfileInfo={(user) => {
          setIsProfilePhotoViewerOpen(false);
          setPhotoViewerUser(null);
          setProfileViewingUser(user);
          setIsProfileModalOpen(true);
        }}
      />

      {/* Invite Member via Email Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        hostName={currentUser.name}
        flatName={activeFlat.name}
        onSendInvite={handleSendInvite}
      />

      {/* Switch Flat / Apartment Modal */}
      <SwitchFlatModal
        isOpen={isSwitchFlatOpen}
        onClose={() => setIsSwitchFlatOpen(false)}
        flats={flats}
        activeFlatId={activeFlat.id}
        onSelectFlat={handleSelectFlat}
        onCreateFlat={handleCreateFlatFromSwitcher}
        currentUser={currentUser}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }}
        pendingDeposits={deposits
          .filter((d) => d.status === 'pending_approval')
          .map((d) => ({ id: d.id, userName: d.userName, amount: d.amount, paymentMethod: d.paymentMethod }))}
        onApproveDeposit={(id) => { handleApproveDeposit(id); }}
        onRejectDeposit={(id) => { handleRejectDeposit(id); }}
        onSelectNotification={(notif) => {
          // Approval requests → close bell, go to home where pending section lives
          if (notif.type === 'approval_request') {
            setIsNotificationsOpen(false);
            setActiveTab('home');
            return;
          }
          if (notif.actionExpenseId) {
            const exp = expenses.find((e) => e.id === notif.actionExpenseId);
            if (exp) {
              setSelectedExpense(exp);
              setIsNotificationsOpen(false);
            }
          }
        }}
      />

      {/* Custom Date Range Modal */}
      <CustomDateModal
        isOpen={isCustomDateModalOpen}
        onClose={() => setIsCustomDateModalOpen(false)}
        startDate={customDateRange.start}
        endDate={customDateRange.end}
        onApplyRange={(start, end) => setCustomDateRange({ start, end })}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  );
}



