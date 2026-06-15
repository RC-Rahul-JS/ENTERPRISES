// src/pages/Login.jsx
import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import useApi from '../api/useApi';
import { showSuccessAlert, showErrorAlert } from '../utils/alerts';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const Login = () => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { postData, getData } = useApi();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // — Validation —
    const validationErrors = {};
    if (!empId.trim()) {
      validationErrors.empId = 'Employee ID is required';
    }
    if (!password) {
      validationErrors.password = 'Password is required';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await postData('/trade/login', {
        empId: empId.trim(),
        password,
      });

      // API returns: { success: true, user: { role, empID, name, designation, ... } }
      if (res && res.success === true && res.user) {
        const user = res.user;
        // Role from user object (normalize to lowercase)
        const role = (user.role || user.logintype || 'staff').toLowerCase();
        
        // Fetch permissions for this user's designation
        let permissions = [];
        try {
          const designationsList = await getData('/trade/designations');
          const userDesig = designationsList.find(d => d._id === user.designation);
          if (userDesig && userDesig.permissions) {
            permissions = userDesig.permissions;
          } else if (role === 'admin' || role === 'ca') {
            permissions = ['ALL']; // Superadmin fallback
          }
        } catch (e) {
          console.error("Failed to fetch permissions during login:", e);
        }

        // Use empID as the session identifier (no JWT token returned by API)
        Cookies.set('token', user.empID || user._id || 'session', { expires: 1 });
        Cookies.set('logintype', role, { expires: 1 });
        // Store name for display in topbar etc.
        Cookies.set('userName', user.name || user.empID || '', { expires: 1 });
        localStorage.setItem('permissions', JSON.stringify(permissions));

        showSuccessAlert('Login Successful!', `Welcome ${user.name?.trim() || user.empID}! Role: ${role}`);
        navigate('/');
      } else {
        showErrorAlert('Login Failed', res?.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      showErrorAlert(
        'Login Failed',
        err?.message || err?.error || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Staff Login">
      <form onSubmit={handleLogin} className="space-y-5">
        {/* Employee ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID
          </label>
          <input
            type="text"
            placeholder="Enter your Employee ID"
            value={empId}
            autoComplete="username"
            onChange={(e) => setEmpId(e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
              errors.empId ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.empId && (
            <p className="text-red-500 text-xs mt-1">{errors.empId}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
              errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-purple-400 flex items-center justify-center gap-2 font-semibold text-sm"
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;