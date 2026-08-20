// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  HiHome, HiUserGroup, HiCreditCard, HiChartBar,
  HiCog, HiLogout, HiX, HiCash,
  HiChevronDown, HiChevronRight,
} from 'react-icons/hi';
import { MdAccountTree } from 'react-icons/md';
import { Users, UserCog, GitBranch, Landmark } from 'lucide-react';

// ── Accordion group data ──────────────────────────────────────────────────────

const MEMBER_ITEMS = [
  { name: 'Create Member',   path: '/members/' },
  { name: 'Member Requests', path: '/members/member_requests' },
  { name: 'Member List',     path: '/members/member_list' },
];

const BRANCH_ITEMS = [
  { name: 'Create Branch', path: '/branch/' },
  { name: 'Branch List',   path: '/branch/branch_list' },
];

const LOAN_ITEMS = [
  { name: 'Loan Products',     path: '/loan/' },
  { name: 'Interest Slab',     path: '/loan/interest_slabs' },
  { name: 'Loan Calculator',   path: '/loan/loan_calculator' },
  { name: 'Apply Loan',        path: '/loan/apply_loan' },
  { name: 'Apply Wallet',      path: '/loan/apply_wallet' },
  { name: 'Wallet Payment',    path: '/loan/wallet_payment' },
  { name: 'Wallet Withdrawal', path: '/loan/wallet_withdrawal' },
  { name: 'Loan Requests',     path: '/loan/loan_requests' },
  { name: 'Loan Disbursement', path: '/loan/loan_disbursement' },
  { name: 'Interest Posting',  path: '/loan/interest_posting' },
  { name: 'Customer Payment',  path: '/loan/customer_payment' },
  { name: 'Penalty Posting',   path: '/loan/penalty_posting' },
];

const AGENT_ITEMS = [
  { name: 'Agent Designation', path: '/agents/' },
  { name: 'Create Agent',      path: '/agents/create_agent' },
  { name: 'Agent List',        path: '/agents/agent_list' },
];

// ── Color themes per group ────────────────────────────────────────────────────
const THEMES = {
  purple: {
    header:    'bg-purple-50 text-purple-800',
    activeHdr: 'bg-purple-100 text-purple-900 font-semibold shadow-sm',
    border:    'border-purple-200',
    dot:       'bg-purple-500',
    subActive: 'bg-purple-50 text-purple-700 font-semibold',
    subHover:  'text-gray-600 hover:bg-purple-50 hover:text-purple-700',
  },
  blue: {
    header:    'bg-blue-50 text-blue-800',
    activeHdr: 'bg-blue-100 text-blue-900 font-semibold shadow-sm',
    border:    'border-blue-200',
    dot:       'bg-blue-500',
    subActive: 'bg-blue-50 text-blue-700 font-semibold',
    subHover:  'text-gray-600 hover:bg-blue-50 hover:text-blue-700',
  },
  emerald: {
    header:    'bg-emerald-50 text-emerald-800',
    activeHdr: 'bg-emerald-100 text-emerald-900 font-semibold shadow-sm',
    border:    'border-emerald-200',
    dot:       'bg-emerald-500',
    subActive: 'bg-emerald-50 text-emerald-700 font-semibold',
    subHover:  'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700',
  },
  rose: {
    header:    'bg-rose-50 text-rose-800',
    activeHdr: 'bg-rose-100 text-rose-900 font-semibold shadow-sm',
    border:    'border-rose-200',
    dot:       'bg-rose-500',
    subActive: 'bg-rose-50 text-rose-700 font-semibold',
    subHover:  'text-gray-600 hover:bg-rose-50 hover:text-rose-700',
  },
};

// ── Reusable accordion ────────────────────────────────────────────────────────
const AccordionGroup = ({ label, icon: Icon, items, basePath, location, onClose, theme = 'purple' }) => {
  const t = THEMES[theme];
  const isAnyActive = location.pathname.startsWith(basePath);
  const [open, setOpen] = useState(isAnyActive);

  useEffect(() => {
    if (isAnyActive) setOpen(true);
  }, [isAnyActive]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
          isAnyActive ? t.activeHdr : `${t.header} hover:opacity-90`
        }`}
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {open
          ? <HiChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          : <HiChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />}
      </button>

      {/* Sub-items */}
      {open && (
        <div className={`border-t ${t.border} bg-white`}>
          {items.map(item => {
            const active = location.pathname === item.path ||
              (item.path.endsWith('/') && location.pathname === item.path.slice(0,-1));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-4 py-2 text-xs transition-all duration-150 ${
                  active ? t.subActive : t.subHover
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  active ? t.dot : 'bg-gray-300'
                }`} />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Sidebar ──────────────────────────────────────────────────────────────
const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  let permissions = null;
  try {
    const stored = localStorage.getItem('permissions');
    if (stored) permissions = JSON.parse(stored);
  } catch (e) { permissions = null; }

  const logintype = Cookies.get('logintype');

  const showLoan =
    logintype !== 'ca' &&
    (!permissions || permissions.length === 0 ||
      logintype === 'admin' ||
      permissions.includes('ALL') ||
      permissions.includes('Sidebar: Loan'));

  const logout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  const linkCls = (active) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
      active
        ? 'bg-gray-100 text-gray-900 font-semibold shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const otherItems = logintype === 'ca' ? [] : [
    { name: 'Accounting', path: '/accounting', icon: MdAccountTree },
    { name: 'Reports',    path: '/reports',    icon: HiChartBar },
    { name: 'Trade',      path: '/trade',      icon: HiCreditCard },
    { name: 'Settings',   path: '/settings',   icon: HiCog },
  ].filter(item => {
    if (!permissions || permissions.length === 0 || logintype === 'admin' || permissions.includes('ALL')) return true;
    return permissions.includes(`Sidebar: ${item.name}`);
  });

  return (
    <aside className="w-64 bg-white shadow-lg h-full flex flex-col border-r border-gray-200">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent leading-tight">
          Duniya Enterprises
        </h1>
        {onClose && (
          <button className="md:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100" onClick={onClose} aria-label="Close menu">
            <HiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-hide">

        {/* Dashboard */}
        <NavLink to="/" end onClick={onClose} className={({ isActive }) => linkCls(isActive)}>
          <HiHome className="w-4 h-4 flex-shrink-0 opacity-70" />
          Dashboard
        </NavLink>

        {/* Share Holders */}
        {logintype !== 'ca' && (
          <NavLink to="/staff" onClick={onClose} className={({ isActive }) => linkCls(isActive)}>
            <HiUserGroup className="w-4 h-4 flex-shrink-0 opacity-70" />
            Share Holders
          </NavLink>
        )}

        {/* ── Loan Management groups ─────────────────────────────────── */}
        {showLoan && (
          <div className="pt-2 space-y-1.5">
            <p className="px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-0.5">
              Loan Management
            </p>

            <AccordionGroup
              label="Members"
              icon={Users}
              items={MEMBER_ITEMS}
              basePath="/members"
              location={location}
              onClose={onClose}
              theme="purple"
            />

            <AccordionGroup
              label="Branch"
              icon={GitBranch}
              items={BRANCH_ITEMS}
              basePath="/branch"
              location={location}
              onClose={onClose}
              theme="blue"
            />

            <AccordionGroup
              label="Loan"
              icon={HiCash}
              items={LOAN_ITEMS}
              basePath="/loan"
              location={location}
              onClose={onClose}
              theme="emerald"
            />

            <AccordionGroup
              label="Agents"
              icon={UserCog}
              items={AGENT_ITEMS}
              basePath="/agents"
              location={location}
              onClose={onClose}
              theme="rose"
            />
          </div>
        )}

        {/* ── Other sections ─────────────────────────────────────────── */}
        {otherItems.length > 0 && (
          <div className="pt-3 space-y-1">
            <p className="px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-0.5">
              Finance
            </p>
            {otherItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => linkCls(isActive)}>
                  <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100 flex-shrink-0">
        <button
          onClick={logout}
          className="flex items-center w-full gap-3 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 font-medium text-sm"
        >
          <HiLogout className="w-4 h-4" />
          Log Out
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;