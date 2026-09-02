import React from 'react';
import {
  Bell, Crown, Shield, Users, ChevronDown,
  UserPlus, Receipt, LayoutDashboard, Calendar,
  ArrowRightLeft, MessageSquare, Building,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { NavTab } from './BottomNavBar';

interface TopAppBarProps {
  currentUser: User;
  unreadCount: number;
  unreadMessagesCount?: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenProfilePhoto?: () => void;
  onOpenInvite?: () => void;
  onOpenSwitchFlat?: () => void;
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  groupName?: string;
  totalMembersCount?: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentUser,
  unreadCount,
  unreadMessagesCount = 0,
  onOpenNotifications,
  onOpenProfile,
  onOpenProfilePhoto,
  onOpenInvite,
  onOpenSwitchFlat,
  activeTab,
  onTabChange,
  groupName = 'Flat 402',
}) => {
  const isHostOrCoHost = currentUser.role === 'host' || currentUser.role === 'co-host';

  const roleTag = (role: UserRole) => {
    if (role === 'host') return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Crown className="w-2.5 h-2.5" /> Host
      </span>
    );
    if (role === 'co-host') return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <Shield className="w-2.5 h-2.5" /> Co-Host
      </span>
    );
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
        <Users className="w-2.5 h-2.5" /> Member
      </span>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* ── Single row, 52px tall on mobile / 56px on desktop ── */}
      <div className="h-[56px] md:h-[60px] max-w-[1280px] mx-auto px-3 md:px-6 flex items-center gap-2 md:gap-4">

        {/* ── LEFT: Brand + flat switcher ── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Logo dot + name */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shrink-0" />
            <span className="text-[15px] md:text-[17px] font-black text-slate-900 tracking-tight">EquityHub</span>
          </div>

          {/* Flat switcher pill */}
          <button
            onClick={onOpenSwitchFlat}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer max-w-[90px] md:max-w-[140px]"
          >
            <Building className="w-3 h-3 shrink-0 text-slate-500" />
            <span className="truncate">{groupName}</span>
            <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" />
          </button>
        </div>

        {/* ── CENTER: Desktop nav tabs (hidden on mobile) ── */}
        {onTabChange && (
          <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200/70 mx-2">
            {([
              { id: 'expenses', icon: Receipt,         label: 'Ledger'          },
              { id: 'home',     icon: LayoutDashboard, label: 'Dashboard'       },
              { id: 'bills',    icon: Calendar,        label: 'Bills'           },
              { id: 'chats',    icon: MessageSquare,   label: 'Chats'           },
              { id: 'more',     icon: ArrowRightLeft,  label: 'Balances & More' },
            ] as { id: NavTab; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => onTabChange(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap relative ${
                  activeTab === id ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
                {id === 'chats' && unreadMessagesCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </nav>
        )}

        {/* Spacer on mobile to push right icons to the right */}
        <div className="flex-1 md:hidden" />

        {/* ── RIGHT: action icons ── */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">

          {/* Invite — host/co-host desktop only */}
          {isHostOrCoHost && onOpenInvite && (
            <button onClick={onOpenInvite}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[12px] font-semibold transition-all cursor-pointer">
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </button>
          )}

          {/* Profile — desktop shows full pill, mobile shows avatar only */}
          <button onClick={onOpenProfile}
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer group transition-all">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 shrink-0"
              onClick={(e) => { if (onOpenProfilePhoto) { e.stopPropagation(); onOpenProfilePhoto(); } }}>
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'; }} />
            </div>
            <span className="text-[12px] font-semibold text-slate-800 max-w-[100px] truncate">{currentUser.name}</span>
            {roleTag(currentUser.role)}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Mobile avatar */}
          <button onClick={onOpenProfile}
            className="md:hidden flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 cursor-pointer active:scale-95">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 shrink-0"
              onClick={(e) => { if (onOpenProfilePhoto) { e.stopPropagation(); onOpenProfilePhoto(); } }}>
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'; }} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 max-w-[60px] truncate">{currentUser.name.split(' ')[0]}</span>
          </button>

          {/* Notifications */}
          <button onClick={onOpenNotifications}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer transition-all active:scale-95">
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
