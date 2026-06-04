// src/components/Header.tsx
import React from 'react';


const Topbar = () => {
  return (
    <header className="bg-white shadow p-5 flex justify-between items-center">
      <div className="relative w-64">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-medium">Good Morning</p>
          <p className="text-gray-500 text-sm">Duniya Enterprises</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
          DT
        </div>
      </div>
    </header>
  );
};

export default Topbar;