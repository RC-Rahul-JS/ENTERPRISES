// src/components/Pagination.jsx
import React from 'react';

const Pagination = () => {
  return (
    <div className="px-6 py-4 flex justify-center space-x-2">
      <button className="px-3 py-1 bg-purple-600 text-white rounded-md">←</button>
      <button className="px-3 py-1 bg-purple-600 text-white rounded-md">1</button>
      <button className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-100">2</button>
      <button className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-100">3</button>
      <button className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-100">→</button>
    </div>
  );
};

export default Pagination;