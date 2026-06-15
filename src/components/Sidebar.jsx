

// src/components/Sidebar.jsx
import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  HiCalendar,
  HiHome,
  HiOfficeBuilding,
  HiUserGroup,
  HiCreditCard,
  HiChartBar,
  HiCog,
  HiLogout,
  HiX,
} from 'react-icons/hi';
import { MdAccountTree } from "react-icons/md";

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();

  // Define nav items with icons and paths
    const baseNavItems = [
      { name: 'Dashboard', path: '/', icon: HiHome },
      { name: 'Share Holders', path: '/staff', icon: HiUserGroup },
      { name: 'Accounting', path: '/accounting', icon: MdAccountTree  },  
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
    const navItems = logintype === 'ca' 
      ? [{ name: 'Dashboard', path: '/', icon: HiHome }] 
      : baseNavItems.filter(item => {
          if (item.name === 'Dashboard') return true;
          // Fallback: If no permissions are set yet (existing session), or if admin/superadmin, give full access
          if (!permissions || permissions.length === 0 || logintype === 'admin' || permissions.includes('ALL')) return true;
          return permissions.includes(`Sidebar: ${item.name}`);
        });

  const logout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  

  return (
    <aside className="w-64 bg-white shadow-lg h-full flex flex-col border-r border-gray-200">
      {/* Logo Section */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* <div className="text-2xl">DT</div> */}
          <h1 className="text-xl text-center font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Duniya Enterprises
          </h1>
        </div>
        {/* Close button - mobile only */}
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
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 transform ${
                  isActive
                    ? 'bg-purple-100 text-purple-800 font-semibold scale-102 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 opacity-80" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Section */}
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