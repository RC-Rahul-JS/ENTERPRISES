// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  HiHome,
  HiUserGroup,
  HiCreditCard,
  HiChartBar,
  HiCog,
  HiLogout,
  HiX,
  HiCash,
  HiChevronDown,
  HiChevronRight,
  HiCalculator,
  HiCollection,
} from 'react-icons/hi';
import { MdAccountTree } from 'react-icons/md';

// ── Sub-menu items for Loan section ───────────────────────────────────────────
const loanSubItems = [
  { name: 'Loan Home', path: '/loan/', exact: true },
  { name: 'Loan Calculator', path: '/loan/loan_calculator', icon: HiCalculator },
];

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isInLoan = location.pathname.startsWith('/loan');
  const [loanOpen, setLoanOpen] = useState(isInLoan);

  // Keep loan menu open whenever we're on a loan route
  useEffect(() => {
    if (isInLoan) setLoanOpen(true);
  }, [isInLoan]);

  const baseNavItems = [
    { name: 'Dashboard', path: '/', icon: HiHome },
    { name: 'Share Holders', path: '/staff', icon: HiUserGroup },
    { name: 'Accounting', path: '/accounting', icon: MdAccountTree },
    { name: 'Reports', path: '/reports', icon: HiChartBar },
    { name: 'Trade', path: '/trade', icon: HiCreditCard },
    { name: 'Settings', path: '/settings', icon: HiCog },
  ];

  let permissions = null;
  try {
    const stored = localStorage.getItem('permissions');
    if (stored) permissions = JSON.parse(stored);
  } catch (e) {
    permissions = null;
  }

  const logintype = Cookies.get('logintype');
  const navItems =
    logintype === 'ca'
      ? [{ name: 'Dashboard', path: '/', icon: HiHome }]
      : baseNavItems.filter((item) => {
          if (item.name === 'Dashboard') return true;
          if (!permissions || permissions.length === 0 || logintype === 'admin' || permissions.includes('ALL'))
            return true;
          return permissions.includes(`Sidebar: ${item.name}`);
        });

  const showLoan =
    logintype !== 'ca' &&
    (!permissions ||
      permissions.length === 0 ||
      logintype === 'admin' ||
      permissions.includes('ALL') ||
      permissions.includes('Sidebar: Loan'));

  const logout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  const linkCls = (active) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
      active
        ? 'bg-purple-100 text-purple-800 font-semibold shadow-sm'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <aside className="w-64 bg-white shadow-lg h-full flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl text-center font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Duniya Enterprises
        </h1>
        {onClose && (
          <button
            className="md:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={onClose}
            aria-label="Close menu"
          >
            <HiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {/* Regular nav items (Dashboard, etc.) — items before Loan */}
        <NavLink
          to="/"
          end
          className={({ isActive }) => linkCls(isActive)}
        >
          <HiHome className="w-5 h-5 opacity-80" />
          Dashboard
        </NavLink>

        <NavLink
          to="/staff"
          className={({ isActive }) => linkCls(isActive)}
        >
          <HiUserGroup className="w-5 h-5 opacity-80" />
          Share Holders
        </NavLink>

        {/* ── Loan (expandable) ───────────────────────────────────────────── */}
        {showLoan && (
          <div>
            {/* Parent Loan button */}
            <button
              onClick={() => setLoanOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                isInLoan
                  ? 'bg-purple-100 text-purple-800 font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <HiCash className="w-5 h-5 opacity-80" />
              <span className="flex-1 text-left">Loan</span>
              {loanOpen ? (
                <HiChevronDown className="w-4 h-4 opacity-60" />
              ) : (
                <HiChevronRight className="w-4 h-4 opacity-60" />
              )}
            </button>

            {/* Sub-items */}
            {loanOpen && (
              <div className="mt-1 ml-4 border-l-2 border-purple-100 pl-3 space-y-0.5">
                {/* Loan Home (all tabs) */}
                <NavLink
                  to="/loan/"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive && location.pathname === '/loan/'
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`
                  }
                >
                  <HiCollection className="w-4 h-4 opacity-70" />
                  Loan Management
                </NavLink>

                {/* Loan Calculator */}
                <NavLink
                  to="/loan/loan_calculator"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`
                  }
                >
                  <HiCalculator className="w-4 h-4 opacity-70" />
                  Loan Calculator
                </NavLink>

                {/* Apply Loan */}
                <NavLink
                  to="/loan/apply_loan"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`
                  }
                >
                  <HiCreditCard className="w-4 h-4 opacity-70" />
                  Apply Loan
                </NavLink>

                {/* Agent Designation */}
                <NavLink
                  to="/loan/agent_designation"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`
                  }
                >
                  <HiUserGroup className="w-4 h-4 opacity-70" />
                  Agent Designation
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Remaining nav items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => linkCls(isActive)}
            >
              <Icon className="w-5 h-5 opacity-80" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center w-full gap-3 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 font-medium text-sm"
        >
          <HiLogout className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;