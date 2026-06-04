
// export default Register;
// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import AuthLayout from '../components/AuthLayout';
import useApi from '../api/useApi';
import { showErrorAlert, showSuccessAlert } from '../utils/alerts';

const Register = () => {
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [errors, setErrors] = useState({});
  const [resendEnabled, setResendEnabled] = useState(false);
  const [timer, setTimer] = useState(30);
  const { postData } = useApi();

  // OTP Resend Timer
  useEffect(() => {
    let interval;
    if (!resendEnabled && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setResendEnabled(true);
      setTimer(30);
    }
    return () => clearInterval(interval);
  }, [resendEnabled, timer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep1();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    try {
      await postData('/send-otp', { phone: contact });
      showSuccessAlert('OTP Sent!', `OTP sent to ${contact}`);
      setResendEnabled(false);
      setStep(2);
    } catch (err) {
      showErrorAlert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await postData('/verify-otp', { phone: contact, otp });
      if (res.success) {
        showSuccessAlert('OTP Verified!', 'Proceed to registration.');
        setStep(3);
      } else {
        showErrorAlert('Verification Failed', 'Invalid OTP. Please try again.');
      }
    } catch (err) {
     showErrorAlert('Verification Failed', 'Invalid OTP. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep3();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const newUser = {
      name,
      email,
      phone: contact,
      password: btoa(password),
      role,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const res = await postData('/register', newUser);
      showSuccessAlert('Registration Successful!', 'You can now log in.');
      console.log('New User:', newUser);
    } catch (err) {
      showErrorAlert('Registration Failed', 'Please try again.');
    }
  };

  const validateStep1 = () => {
    const errors = {};
    const phoneRegex = /^[0-9]{10}$/;
    if (!contact || !phoneRegex.test(contact)) {
      errors.contact = 'Please enter a valid 10-digit phone number';
    }
    return errors;
  };

  const validateStep3 = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name) errors.name = 'Name is required';
    if (!email || !emailRegex.test(email)) errors.email = 'Valid email is required';
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  return (
    <AuthLayout title="Register">
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter WhatsApp Number</label>
            <input
              type="text"
              placeholder="9876543210"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.contact ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Send OTP
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
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

          <div className="text-center">
            <button
              type="button"
              disabled={!resendEnabled}
              onClick={() => {
                setResendEnabled(false);
                setTimer(30);
              }}
              className={`text-sm ${
                resendEnabled ? 'text-purple-600' : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              Resend OTP in {timer}s
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="doctor">Doctor</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Register
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default Register;