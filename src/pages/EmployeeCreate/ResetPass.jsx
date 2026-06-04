import React, { useState } from "react";

const SetPassword = () => {
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [validationMessage, setValidationMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationMessage("");
    setSuccessMessage("");

    if (form.newPassword.length < 6) {
      setValidationMessage("Password must be at least 6 characters long.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setValidationMessage("Passwords do not match.");
      return;
    }

    setSuccessMessage("Password has been successfully updated!");
    setForm({
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 font-sans p-28">
      <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-md relative">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Set Your Password</h2>

        {validationMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {validationMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium text-sm mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium text-sm mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
            >
              Set Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
