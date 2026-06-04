// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useApi from '../api/useApi';
import Cookies from 'js-cookie';
import CAWalcome from './Dashpage/CAWalcome';
import AdminWalcome from './Dashpage/AdminWalcome';
const Dashboard = () => {

  const{getData}=useApi()
  const [data, setdata] = useState({})

    // Fetch appointments
    useEffect(() => {
      const fetchdata = async () => {
        try {
          const res = await getData("/dashboard");
          console.log(res)
          setdata(res)
        } catch (error) {
          console.error("Failed to load data:", error);
          // Swal.fire("Error", "Could not Found", "error");
        }
      };
      fetchdata();
    }, []);
  // Reusable Stat Card Component for cleaner code
  const StatCard = ({ to, title, value, subtitle, color, icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block p-1 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-30 ${
          isActive ? 'focus:ring-blue-500' : 'focus:ring-gray-300'
        }`
      }
    >
      <div
        className={`bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg hover:border-${color}-200`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
            <p className={`mt-2 text-3xl font-bold text-${color}-600`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`text-4xl opacity-20 text-${color}-500`}>{icon}</div>
        </div>
      </div>
    </NavLink>
  );

  if (Cookies.get('logintype')==='ca') {
    return <CAWalcome/>
  }

  return (
    <AdminWalcome/>
    
  );
};

export default Dashboard;