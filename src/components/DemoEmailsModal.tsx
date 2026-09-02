import React, { useState } from 'react';
import {
  Mail,
  X,
  Check,
  Crown,
  Shield,
  User as UserIcon,
  Copy,
  ExternalLink,
  ChevronRight,
  Inbox,
  ArrowRight,
  Sparkles,
  Calendar,
  Send,
  Building,
} from 'lucide-react';
import { User, UserRole } from '../types';

export interface DemoEmail {
  id: string;
  role: UserRole;
  toName: string;
  toEmail: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  preview: string;
  date: string;
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'indigo' | 'purple' | 'blue';
  bodyHtml: {
    greeting: string;
    paragraphs: string[];
    actionButton?: {
      label: string;
      linkTab?: string;
    };
    highlightBox?: {
      title: string;
      rows: { label: string; value: string }[];
    };
    footerNote?: string;
  };
}

const DEMO_EMAILS: DemoEmail[] = [
  // 1. HOST EMAILS
  {
    id: 'mail-host-1',
    role: 'host',
    toName: 'Harinadh (Host)',
    toEmail: 'harinadh@flat402.equityhub.com',
    fromName: 'EquityHub System',
    fromEmail: 'notifications@equityhub.app',
    subject: 'Action Required: Rahul submitted ₹2,000 Room Money Handover',
    preview: 'Rahul has handed over ₹2,000 via Cash for Flat 402 Room Money pool. Please verify and approve.',
    date: 'Today, 10:45 AM',
    badge: 'Deposit Approval',
    badgeColor: 'emerald',
    bodyHtml: {
      greeting: 'Hi Harinadh,',
      paragraphs: [
        'A new room fund contribution has been submitted by Rahul for Flat 402.',
        'Rahul recorded handing over cash to you. Once you confirm receipt, approving this deposit will immediately credit the common room fund and increase Rahul’s personal room money balance.',
      ],
      highlightBox: {
        title: 'Deposit Handover Details',
        rows: [
          { label: 'Roommate', value: 'Rahul Sharma (Member)' },
          { label: 'Amount', value: '₹2,000.00' },
          { label: 'Payment Mode', value: 'Cash Handover' },
          { label: 'Target Pool', value: 'Flat 402 Common Fund' },
          { label: 'Notes', value: '"Handed over 4x500 notes for monthly grocery pool"' },
        ],
      },
      actionButton: {
        label: 'Open Dashboard to Approve Deposit',
        linkTab: 'home',
      },
      footerNote: 'You are receiving this because you are the Host of Flat 402.',
    },
  },
  {
    id: 'mail-host-2',
    role: 'host',
    toName: 'Harinadh (Host)',
    toEmail: 'harinadh@flat402.equityhub.com',
    fromName: 'EquityHub Reimbursements',
    fromEmail: 'reimbursements@equityhub.app',
    subject: 'Reimbursement Claim: Sai requested ₹840 for Kitchen Cleaning Supplies',
    preview: 'Sai paid out-of-pocket for common flat supplies and requested reimbursement from Room Money.',
    date: 'Yesterday, 6:30 PM',
    badge: 'Reimbursement Claim',
    badgeColor: 'amber',
    bodyHtml: {
      greeting: 'Hi Harinadh,',
      paragraphs: [
        'Sai spent personal money to purchase items for Flat 402 and raised a reimbursement claim.',
        'The expense was split equally among all 3 roommates (₹280 each). You can verify the receipt note and either reimburse Sai from the common Room Money pool or record it as a direct settlement.',
      ],
      highlightBox: {
        title: 'Reimbursement Breakdown',
        rows: [
          { label: 'Paid by', value: 'Sai (Co-Host)' },
          { label: 'Total Amount', value: '₹840.00' },
          { label: 'Category', value: 'Groceries & Household' },
          { label: 'Split Type', value: 'Equal (3 people @ ₹280 each)' },
          { label: 'Proof Note', value: '"Blinkit order #BK-9921 for dishwashing liquid & trash bags"' },
        ],
      },
      actionButton: {
        label: 'Verify & Reimburse from Room Pool',
        linkTab: 'home',
      },
      footerNote: 'Approving with reimbursement will deduct the ₹840 from Room Money and adjust each participant’s pool balance by ₹280.',
    },
  },
  {
    id: 'mail-host-3',
    role: 'host',
    toName: 'Harinadh (Host)',
    toEmail: 'harinadh@flat402.equityhub.com',
    fromName: 'EquityHub Financial Digest',
    fromEmail: 'digest@equityhub.app',
    subject: 'Monthly Flat 402 Audit Summary & Balance Overview',
    preview: 'Here is your monthly summary: ₹15,000 collected, ₹10,400 spent, Room Balance: ₹4,600.',
    date: 'Aug 28, 9:00 AM',
    badge: 'Monthly Digest',
    badgeColor: 'indigo',
    bodyHtml: {
      greeting: 'Dear Host Harinadh,',
      paragraphs: [
        'Here is the consolidated financial health report for Flat 402 for August 2026.',
        'All roommate balances and pending handovers are reconciled with no unresolved disputes.',
      ],
      highlightBox: {
        title: 'Flat 402 Financial Health',
        rows: [
          { label: 'Total Pool Collected', value: '₹15,000.00' },
          { label: 'Total Pool Spent', value: '₹10,400.00' },
          { label: 'Available Room Money', value: '₹4,600.00 (Healthy)' },
          { label: 'Active Collection Goal', value: '₹5,000/person' },
          { label: 'Active Roommates', value: '3 members' },
        ],
      },
      actionButton: {
        label: 'View Full Audit Report',
        linkTab: 'reports',
      },
      footerNote: 'Generated automatically by EquityHub Smart Flat Ledger.',
    },
  },

  // 2. CO-HOST EMAILS
  {
    id: 'mail-cohost-1',
    role: 'co-host',
    toName: 'Sai (Co-Host)',
    toEmail: 'sai@flat402.equityhub.com',
    fromName: 'EquityHub Roles',
    fromEmail: 'security@equityhub.app',
    subject: 'Co-Host Privileges Granted for Flat 402',
    preview: 'Host Harinadh has designated you as Co-Host with co-approval permissions.',
    date: 'Aug 25, 3:15 PM',
    badge: 'Role Update',
    badgeColor: 'purple',
    bodyHtml: {
      greeting: 'Hi Sai,',
      paragraphs: [
        'Harinadh has assigned you the Co-Host role for Flat 402.',
        'As Co-Host, you can approve member expenses, manage recurring bills (WiFi, Maid, Electricity), and record group payments alongside the Host.',
      ],
      highlightBox: {
        title: 'Your Co-Host Permissions',
        rows: [
          { label: 'Flat Assigned', value: 'Flat 402, Highrise Tower' },
          { label: 'Approve Expenses', value: 'Enabled' },
          { label: 'Invite Roommates', value: 'Enabled' },
          { label: 'Bill Reminders', value: 'Enabled' },
        ],
      },
      actionButton: {
        label: 'Go to Flat Management',
        linkTab: 'more',
      },
      footerNote: 'Contact host Harinadh if you have any questions regarding shared permissions.',
    },
  },
  {
    id: 'mail-cohost-2',
    role: 'co-host',
    toName: 'Sai (Co-Host)',
    toEmail: 'sai@flat402.equityhub.com',
    fromName: 'EquityHub Notifications',
    fromEmail: 'alerts@equityhub.app',
    subject: 'Bill Paid: Act Fibernet WiFi August Bill (₹1,199)',
    preview: 'WiFi bill paid via Room Money Pool. Next due date: Sept 20.',
    date: 'Aug 22, 11:00 AM',
    badge: 'Bill Paid',
    badgeColor: 'blue',
    bodyHtml: {
      greeting: 'Hi Sai,',
      paragraphs: [
        'The recurring utility bill for Act Fibernet Broadband has been marked as paid from the Room Money common pool.',
        'The expense of ₹1,199 has been recorded and split equally across all active roommates.',
      ],
      highlightBox: {
        title: 'Bill Payment Summary',
        rows: [
          { label: 'Utility Name', value: 'Act Fibernet High Speed WiFi' },
          { label: 'Amount Paid', value: '₹1,199.00' },
          { label: 'Paid From', value: 'Room Money Pool' },
          { label: 'Share per Roommate', value: '₹399.66' },
        ],
      },
      actionButton: {
        label: 'View Bills Ledger',
        linkTab: 'more',
      },
      footerNote: 'Automated utility notification from Flat 402.',
    },
  },

  // 3. MEMBER EMAILS
  {
    id: 'mail-member-1',
    role: 'member',
    toName: 'Rahul (Member)',
    toEmail: 'rahul@flat402.equityhub.com',
    fromName: 'Harinadh via EquityHub',
    fromEmail: 'invites@equityhub.app',
    subject: 'Invitation: Join Flat 402 Roommate Expense Hub',
    preview: 'Harinadh invited you to join Flat 402 on EquityHub for shared expenses and room money tracking.',
    date: 'Aug 20, 10:00 AM',
    badge: 'Invitation',
    badgeColor: 'emerald',
    bodyHtml: {
      greeting: 'Welcome Rahul!',
      paragraphs: [
        'Harinadh (Host) has invited you to join Flat 402 on EquityHub.',
        'With EquityHub, you can track your room money deposits, submit expenses with bills for reimbursement, and see simplified settlement balances with zero math headaches.',
      ],
      highlightBox: {
        title: 'Flat Invitation Details',
        rows: [
          { label: 'Apartment', value: 'Flat 402, Highrise Tower' },
          { label: 'Host', value: 'Harinadh' },
          { label: 'Your Role', value: 'Member' },
          { label: 'Flat Code', value: 'FLAT-402-A9X' },
        ],
      },
      actionButton: {
        label: 'Accept Invite & Open Flat 402',
        linkTab: 'home',
      },
      footerNote: 'You will stay signed in on this device for 6 months.',
    },
  },
  {
    id: 'mail-member-2',
    role: 'member',
    toName: 'Rahul (Member)',
    toEmail: 'rahul@flat402.equityhub.com',
    fromName: 'EquityHub Ledger',
    fromEmail: 'ledger@equityhub.app',
    subject: 'Deposit Verified: ₹5,000 credited to your Room Money balance',
    preview: 'Host Harinadh accepted your handover. Your personal room pool balance is now ₹5,000.',
    date: 'Aug 21, 2:30 PM',
    badge: 'Deposit Approved',
    badgeColor: 'emerald',
    bodyHtml: {
      greeting: 'Hi Rahul,',
      paragraphs: [
        'Good news! Host Harinadh has reviewed and accepted your ₹5,000 handover for the Flat 402 Room Money collection target.',
        'Your personal room money balance is active. Any groceries or common expenses paid using Room Money will now deduct from this deposit balance automatically.',
      ],
      highlightBox: {
        title: 'Your Room Pool Balance',
        rows: [
          { label: 'Amount Deposited', value: '₹5,000.00' },
          { label: 'Approved by', value: 'Harinadh (Host)' },
          { label: 'Your Available Room Balance', value: '₹5,000.00' },
          { label: 'Collection Goal Status', value: 'Target Met (₹5,000/₹5,000)' },
        ],
      },
      actionButton: {
        label: 'Check Your Balance in App',
        linkTab: 'home',
      },
      footerNote: 'Your money is tracked transparently in the Flat 402 common ledger.',
    },
  },
  {
    id: 'mail-member-3',
    role: 'member',
    toName: 'Rahul (Member)',
    toEmail: 'rahul@flat402.equityhub.com',
    fromName: 'EquityHub Reimbursements',
    fromEmail: 'reimbursements@equityhub.app',
    subject: 'Reimbursement Approved: ₹540 received for Kitchen Cleaning Supplies',
    preview: 'Host Harinadh approved your reimbursement claim. Funds released from Room Money.',
    date: 'Aug 24, 4:45 PM',
    badge: 'Reimbursement Paid',
    badgeColor: 'indigo',
    bodyHtml: {
      greeting: 'Hi Rahul,',
      paragraphs: [
        'Your expense claim of ₹540 for "Kitchen Cleaning & Dishwasher Gel" has been approved by Host Harinadh.',
        'The host approved reimbursement from the common Room Money fund. Your out-of-pocket payment has been reimbursed and the ₹540 was split among the selected participants.',
      ],
      highlightBox: {
        title: 'Reimbursement Summary',
        rows: [
          { label: 'Expense Title', value: 'Kitchen Cleaning & Dishwasher Gel' },
          { label: 'Total Reimbursed', value: '₹540.00' },
          { label: 'Your Share Deducted', value: '₹180.00 (from room pool)' },
          { label: 'Reimbursed Via', value: 'Room Money Common Fund' },
        ],
      },
      actionButton: {
        label: 'View Expense Record',
        linkTab: 'expenses',
      },
      footerNote: 'Keep adding bills anytime you buy common supplies.',
    },
  },
];

interface DemoEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSwitchUser?: (userId: string) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const DemoEmailsModal: React.FC<DemoEmailsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  onNavigateToTab,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('host');
  const [selectedEmailId, setSelectedEmailId] = useState<string>('mail-host-1');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredEmails = DEMO_EMAILS.filter((m) => m.role === selectedRole);
  const activeEmail = DEMO_EMAILS.find((m) => m.id === selectedEmailId) || filteredEmails[0] || DEMO_EMAILS[0];

  const handleCopyEmail = () => {
    const text = `Subject: ${activeEmail.subject}\nFrom: ${activeEmail.fromName} <${activeEmail.fromEmail}>\nTo: ${activeEmail.toName} <${activeEmail.toEmail}>\nDate: ${activeEmail.date}\n\n${activeEmail.bodyHtml.greeting}\n\n${activeEmail.bodyHtml.paragraphs.join('\n\n')}\n\n${activeEmail.bodyHtml.highlightBox ? activeEmail.bodyHtml.highlightBox.title + ':\n' + activeEmail.bodyHtml.highlightBox.rows.map(r => `• ${r.label}: ${r.value}`).join('\n') : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeBg = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'amber': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'indigo': return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'purple': return 'bg-purple-100 text-purple-900 border-purple-300';
      default: return 'bg-blue-100 text-blue-900 border-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-bold text-slate-900">Demo Emails Inbox</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                  Live Previews
                </span>
              </div>
              <p className="text-[12px] text-slate-500">
                Simulated email notifications sent to Host, Co-Host, and Member accounts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Filter Tabs */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedRole('host');
                const first = DEMO_EMAILS.find((m) => m.role === 'host');
                if (first) setSelectedEmailId(first.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'host'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Host View (Harinadh)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRole === 'host' ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-600'}`}>
                3
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedRole('co-host');
                const first = DEMO_EMAILS.find((m) => m.role === 'co-host');
                if (first) setSelectedEmailId(first.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'co-host'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Co-Host View (Sai)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRole === 'co-host' ? 'bg-purple-700 text-purple-100' : 'bg-slate-200 text-slate-600'}`}>
                2
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedRole('member');
                const first = DEMO_EMAILS.find((m) => m.role === 'member');
                if (first) setSelectedEmailId(first.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'member'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Member View (Rahul)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRole === 'member' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'}`}>
                3
              </span>
            </button>
          </div>

          <button
            onClick={handleCopyEmail}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Mail Body</span>
              </>
            )}
          </button>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden min-h-[400px]">
          {/* Email List Column (4 cols) */}
          <div className="md:col-span-5 border-r border-slate-200 bg-slate-50/70 overflow-y-auto p-2 space-y-1.5">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              <span>{selectedRole.toUpperCase()} INBOX ({filteredEmails.length})</span>
            </div>

            {filteredEmails.map((email) => {
              const isSelected = email.id === activeEmail.id;

              return (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmailId(email.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white border-indigo-400 shadow-sm ring-1 ring-indigo-200'
                      : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getBadgeBg(email.badgeColor)}`}>
                      {email.badge}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{email.date}</span>
                  </div>

                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight line-clamp-1">
                    {email.subject}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {email.preview}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Email Reader View (7 cols) */}
          <div className="md:col-span-7 bg-white overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Mail Meta Header */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[16px] font-bold text-slate-900 leading-snug">
                    {activeEmail.subject}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${getBadgeBg(activeEmail.badgeColor)}`}>
                    {activeEmail.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/70">
                  <div>
                    <span className="text-slate-500 block font-mono">FROM:</span>
                    <span className="font-semibold text-slate-900">{activeEmail.fromName}</span>{' '}
                    <span className="text-slate-500 font-mono">&lt;{activeEmail.fromEmail}&gt;</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-mono">TO:</span>
                    <span className="font-semibold text-slate-900">{activeEmail.toName}</span>{' '}
                    <span className="text-slate-500 font-mono">&lt;{activeEmail.toEmail}&gt;</span>
                  </div>
                </div>
              </div>

              {/* Mail Body Rendering */}
              <div className="space-y-3 text-[13px] text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900">{activeEmail.bodyHtml.greeting}</p>

                {activeEmail.bodyHtml.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-slate-700">{p}</p>
                ))}

                {/* Highlight Box */}
                {activeEmail.bodyHtml.highlightBox && (
                  <div className="my-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                    <h5 className="text-[12px] font-bold text-indigo-950 uppercase tracking-wider font-mono">
                      {activeEmail.bodyHtml.highlightBox.title}
                    </h5>
                    <div className="space-y-1.5 text-[12px]">
                      {activeEmail.bodyHtml.highlightBox.rows.map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center py-0.5 border-b border-indigo-100/80 last:border-0">
                          <span className="text-slate-600 font-medium">{row.label}:</span>
                          <span className="font-bold text-slate-900 font-mono">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action Button */}
                {activeEmail.bodyHtml.actionButton && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        if (activeEmail.bodyHtml.actionButton?.linkTab && onNavigateToTab) {
                          onNavigateToTab(activeEmail.bodyHtml.actionButton.linkTab);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] shadow-sm transition-all cursor-pointer"
                    >
                      <span>{activeEmail.bodyHtml.actionButton.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {activeEmail.bodyHtml.footerNote && (
                  <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
                    {activeEmail.bodyHtml.footerNote}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Quick Switch Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Viewing simulated email for <span className="font-semibold text-slate-800">{activeEmail.role}</span>
              </span>

              {onSwitchUser && (
                <button
                  onClick={() => {
                    const targetId = activeEmail.role === 'host' ? 'u1' : activeEmail.role === 'co-host' ? 'u2' : 'u3';
                    onSwitchUser(targetId);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Switch App to {activeEmail.toName.split(' ')[0]}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
