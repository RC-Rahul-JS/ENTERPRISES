// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import useApi from '../api/useApi';
import { showSuccessAlert, showErrorAlert } from '../utils/alerts';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const Login = () => {
  const [step, setStep] = useState(1); // 1: login, 2: otp verification
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState(''); // Will be fetched from API after login
  const [errors, setErrors] = useState({});
  const { postData } = useApi();
  const navigate=useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault();


    // Cookies.set('token', 'testtoken', { expires: 1 }); // 1 day
    // navigate('/')


    const validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email) ) {
      validationErrors.email = 'Valid email is required';
    }
   

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (email==='superadmin@gmail.com') {

       if (password!=='123456') {
      validationErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

        Cookies.set('logintype', 'admin', { expires: 1 }); // 1 day
        Cookies.set('token', 'testtoken', { expires: 1 });
    navigate('/')
    }

    if (email==='ca@duniyape.in') {

       if (password!=='ca@123') {
      validationErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

        Cookies.set('logintype', 'ca', { expires: 1 }); // 1 day
        Cookies.set('token', 'testtoken', { expires: 1 });
    navigate('/')
    }

    // try {
    //   // Simulate API call to authenticate user
    //   const res = await postData('/login', { email, password:btoa(password) });
    //   // Assume API returns user data and phone
    //   if (res.success && res.user) {
    //     setPhone(res.user); // Save phone from response
    //     setStep(2); // Move to OTP step
    //     showSuccessAlert('OTP Sent!', `Check your phone: ${res.user}`);
    //   } else {
    //     showErrorAlert('Login Failed', 'Invalid credentials');
    //   }
    // } catch (err) {
    //   showErrorAlert('Error', 'Something went wrong. Please try again.');
    // }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      showErrorAlert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }
    try {
      const res = await postData('/verify-otp', { phone, otp });
        showSuccessAlert('Login Successful!', 'Redirecting to dashboard...');
        Cookies.set('token', res.token, { expires: 1 }); // 1 day
        console.log(res)
        setTimeout(() => {
          navigate('/'); // Redirect
        }, 1500);
    } catch (err) {
      showErrorAlert('Error', 'Verification failed. Please try again.');
    }
  };

  return (
    <AuthLayout title={step === 1 ? 'Login' : 'Verify OTP'}>
      {step === 1 ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="xyz@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Login
          </button>

          <div className="text-center text-sm">
            <p>
              Don't have an account?{' '}
              <a href="/register" className="text-purple-600 hover:underline">
                Register
              </a>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-gray-600">
              OTP has been sent to <strong>{phone}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Verify OTP
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default Login;