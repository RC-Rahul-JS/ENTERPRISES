// src/components/AuthLayout.jsx
import React from 'react';

const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;