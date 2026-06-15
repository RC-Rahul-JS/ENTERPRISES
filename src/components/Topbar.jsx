// src/components/Header.tsx
import React from 'react';
import { HiMenu } from 'react-icons/hi';

const Topbar = ({ onMenuClick }) => {
  return (
    <header className="bg-white shadow p-3 md:p-5 flex justify-between items-center gap-2">
      {/* Hamburger button - mobile only */}
      <button
        className="md:hidden flex-shrink-0 p-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <HiMenu className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-xs md:w-64">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>
      <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">Good Morning</p>
          <p className="text-gray-500 text-sm">Duniya Enterprises</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md flex-shrink-0">
          DT
        </div>
      </div>
    </header>
  );
};

export default Topbar;