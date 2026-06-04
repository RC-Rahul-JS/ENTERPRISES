// src/components/Layout.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';

const Layout = () => {
  const token = Cookies.get('token');
  if(!token) return <Navigate to="/login" />;
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;