import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Crown, 
  Shield, 
  Users, 
  Mail, 
  Phone, 
  QrCode, 
  Check, 
  Key, 
  Send,
  Edit3,
  Building,
  ChevronRight,
  Plus,
  Wallet,
  LogOut,
  Clock,
  ArrowUpRight,
  Camera,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Copy,
  ArrowRightLeft,
  Circle
} from 'lucide-react';
import { User, UserRole, RoomDeposit } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/calculations';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  viewingUser?: User | null;
  deposits?: RoomDeposit[];
  onOpenDepositModal: () => void;
  onUpdateProfile: (updatedData: Partial<User>) => void;
  onOpenInviteModal: () => void;
  onAddNewUser?: (userData: Partial<User>) => void;
  onSignOut?: () => void;
  onSelectUserToMessage?: (userId: string) => void;
  onOpenSettleModal?: (fromId: string, toId: string, suggestedAmount?: number) => void;
  onOpenPhotoViewer?: (user: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  viewingUser: initialViewingUser,
  deposits = [],
  onOpenDepositModal,
  onUpdateProfile,
  onOpenInviteModal,
  onAddNewUser,
  onSignOut,
  onSelectUserToMessage,
  onOpenSettleModal,
  onOpenPhotoViewer,
}) => {
  const [activeUserToDisplay, setActiveUserToDisplay] = useState<User>(
    initialViewingUser || currentUser
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // Profile edit fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

  // New member fields
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberUpi, setNewMemberUpi] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('member');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or viewing user changes
  useEffect(() => {
    if (isOpen) {
      const target = initialViewingUser || currentUser;
      setActiveUserToDisplay(target);
      setName(target.name);
      setEmail(target.email);
      setPhone(target.phone || '');
      setUpiId(target.upiId || '');
      setAvatar(target.avatar);
      setBio(target.bio || '');
      setIsEditing(false);
      setShowAvatarPicker(false);
      setIsAddingMember(false);
    }
  }, [isOpen, initialViewingUser, currentUser]);

  if (!isOpen) return null;

  const isCurrentViewingUser = activeUserToDisplay.id === currentUser.id;

  // Calculate active user's room fund contribution
  const userApprovedDeposits = deposits
    .filter((d) => d.userId === activeUserToDisplay.id && (d.status === 'approved' || !d.status))
    .reduce((sum, d) => sum + d.amount, 0);

  const userPendingDeposits = deposits
    .filter((d) => d.userId === activeUserToDisplay.id && d.status === 'pending_approval')
    .reduce((sum, d) => sum + d.amount, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
          if (!isEditing) {
            onUpdateProfile({ avatar: reader.result });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetAvatar = (url: string) => {
    setAvatar(url);
    if (!isEditing) {
      onUpdateProfile({ avatar: url });
    }
    setShowAvatarPicker(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: Partial<User> = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      upiId: upiId.trim() || undefined,
      avatar: avatar.trim(),
      bio: bio.trim() || undefined,
    };

    onUpdateProfile(updatedData);
    setActiveUserToDisplay((prev) => ({ ...prev, ...updatedData } as User));
    setIsEditing(false);
    setShowAvatarPicker(false);
  };

  const handleCreateNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    if (onAddNewUser) {
      onAddNewUser({
        name: newMemberName.trim(),
        phone: newMemberPhone.trim() || undefined,
        email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '')}@flat402.local`,
        upiId: newMemberUpi.trim() || undefined,
        role: newMemberRole,
        avatar: `https://images.unsplash.com/photo-${1535713875002 + allUsers.length}?w=150&auto=format&fit=crop&q=80`,
      });
    }

    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberEmail('');
    setNewMemberUpi('');
    setIsAddingMember(false);
  };

  const copyUpiToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'host':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            <Crown className="w-3 h-3 text-amber-700" /> Host (Admin)
          </span>
        );
      case 'co-host':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Shield className="w-3 h-3 text-slate-700" /> Co-Host
          </span>
        );
      case 'member':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Users className="w-3 h-3 text-slate-500" /> Member
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden file input for photo upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload} 
        />

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-[14px]">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 tracking-tight leading-tight">
                {isCurrentViewingUser ? 'My Profile & Room Wallet' : `${activeUserToDisplay.name}'s Profile`}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Flat 402 • Roommate Ledger</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {!isCurrentViewingUser && (
              <button
                onClick={() => setActiveUserToDisplay(currentUser)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Back to Me
              </button>
            )}
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* SECTION 1: Active User Profile Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-4">
            
            {/* User Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar: Clicking DP ONLY opens picture */}
                <div className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditing && onOpenPhotoViewer) {
                        onOpenPhotoViewer(activeUserToDisplay);
                      } else if (isCurrentViewingUser) {
                        setShowAvatarPicker((prev) => !prev);
                      }
                    }}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200 bg-slate-100 cursor-pointer block hover:ring-2 hover:ring-indigo-500 transition-all"
                    title={isEditing ? 'Change Profile Picture' : `Click to view ${activeUserToDisplay.name}'s Photo`}
                  >
                    <img 
                      src={isEditing ? avatar : activeUserToDisplay.avatar} 
                      alt={activeUserToDisplay.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                  </button>

                  {/* Online / Offline status badge */}
                  <div className="absolute -bottom-1 -right-1 flex items-center">
                    {activeUserToDisplay.isOnline ? (
                      <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs" title="Online" />
                    ) : (
                      <span className="w-3.5 h-3.5 bg-slate-400 rounded-full border-2 border-white shadow-xs" title="Offline" />
                    )}
                  </div>

                  {/* Picture change overlay button for Current User */}
                  {isCurrentViewingUser && (
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker((prev) => !prev)}
                      className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                      title="Change Profile Picture"
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Change</span>
                    </button>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[17px] sm:text-[18px] font-bold text-slate-900 truncate">
                      {activeUserToDisplay.name}
                    </h4>
                    {activeUserToDisplay.isOnline ? (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Online
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {activeUserToDisplay.lastSeen || 'Offline'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {getRoleBadge(activeUserToDisplay.role)}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-600 bg-white border border-slate-200">
                      <Building className="w-2.5 h-2.5 text-slate-500" /> Flat 402
                    </span>
                  </div>

                  {activeUserToDisplay.bio && (
                    <p className="text-xs text-slate-600 mt-1.5 italic">
                      "{activeUserToDisplay.bio}"
                    </p>
                  )}
                </div>
              </div>

              {/* Edit Button (for current user) or Message Button (for other roommates) */}
              {isCurrentViewingUser ? (
                !isEditing && (
                  <button
                    id="profile-edit-btn"
                    onClick={() => {
                      setName(currentUser.name);
                      setEmail(currentUser.email);
                      setPhone(currentUser.phone || '');
                      setUpiId(currentUser.upiId || '');
                      setAvatar(currentUser.avatar);
                      setBio(currentUser.bio || '');
                      setIsEditing(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[12px] font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Profile</span>
                  </button>
                )
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  {onSelectUserToMessage && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectUserToMessage(activeUserToDisplay.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile Picture Chooser Drawer / Modal Component */}
            {isCurrentViewingUser && (showAvatarPicker || isEditing) && (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    Change Profile Picture
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>

                {/* Upload Button */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo from Device</span>
                  </button>
                </div>

                {/* Preset Avatar Gallery */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold mb-1.5">
                    Or Choose from Avatar Presets:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(url)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                          avatar === url ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-11 object-cover rounded-lg" />
                        {avatar === url && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Image URL input */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold mb-1">
                    Or Enter Image URL:
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Room Money Handover / Contribution Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-mono tracking-wider text-slate-500 font-semibold block">
                    {isCurrentViewingUser ? 'Your Room Money Contribution' : `${activeUserToDisplay.name}'s Room Money Deposit`}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[24px] sm:text-[26px] font-bold font-mono text-slate-900 font-mono-numbers">
                      {formatCurrency(userApprovedDeposits)}
                    </span>
                    {userPendingDeposits > 0 && (
                      <span className="text-[11px] text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        + {formatCurrency(userPendingDeposits)} pending
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Total amount deposited into Flat 402 common pool fund
                  </p>
                </div>

                {isCurrentViewingUser && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDepositModal();
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] shadow-2xs transition-all active:scale-95 cursor-pointer border border-emerald-600 shrink-0"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Hand Over Money</span>
                  </button>
                )}
              </div>
            </div>

            {/* Read-Only Details List */}
            {!isEditing ? (
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                {/* Mobile Number */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-[13px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block leading-tight font-semibold">
                        Mobile Number
                      </span>
                      <span className="font-semibold text-slate-900 font-mono-numbers block truncate text-[13px]">
                        {activeUserToDisplay.phone || '+91 98765 43210'}
                      </span>
                    </div>
                  </div>
                  {activeUserToDisplay.phone && (
                    <a
                      href={`tel:${activeUserToDisplay.phone}`}
                      className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 hover:bg-emerald-100"
                    >
                      Call
                    </a>
                  )}
                </div>

                {/* Email Address */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-[13px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block leading-tight font-semibold">
                        Email Address
                      </span>
                      <span className="font-medium text-slate-800 block truncate text-[12px] sm:text-[13px]">
                        {activeUserToDisplay.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* UPI ID for Roommate Settlements */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-[13px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 border border-slate-200">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block leading-tight font-semibold">
                        UPI ID (Settlements)
                      </span>
                      <span className="font-semibold text-slate-900 font-mono block truncate text-[12px] sm:text-[13px]">
                        {activeUserToDisplay.upiId || 'harinadh@okaxis'}
                      </span>
                    </div>
                  </div>
                  {activeUserToDisplay.upiId && (
                    <button
                      type="button"
                      onClick={() => copyUpiToClipboard(activeUserToDisplay.upiId!)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 shrink-0 cursor-pointer"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                {/* Role Permissions Box */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-[12px] text-slate-700 leading-relaxed">
                  {activeUserToDisplay.role === 'host' && (
                    <div className="flex items-start gap-2">
                      <Crown className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-slate-900">Host Privileges:</strong> Deducts flat expenses from <strong>Room Money</strong> by default, verifies deposits, and manages roommate approvals.
                      </p>
                    </div>
                  )}
                  {activeUserToDisplay.role === 'co-host' && (
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-slate-900">Co-Host Role:</strong> Logs expenses and submits money handovers. The Host verifies and approves them into the official ledger.
                      </p>
                    </div>
                  )}
                  {activeUserToDisplay.role === 'member' && (
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-slate-900">Member Role:</strong> Views shared flat transactions, records money handovers to the Host, and participates in split expenses.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Inline Edit Form */
              <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold mb-1">
                      UPI ID (for settlements)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. name@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold mb-1">
                    Roommate Bio / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 1 occupant, manages internet & bills"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setShowAvatarPicker(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-[12px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-[12px] hover:bg-slate-800 shadow-xs border border-slate-800 transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
            {(currentUser.role === 'host' || currentUser.role === 'co-host') && (
              <button
                onClick={() => { onClose(); onOpenInviteModal(); }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </button>
            )}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="ml-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
