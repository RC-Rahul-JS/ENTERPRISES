import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import Swal from "sweetalert2";

const JournalVoucher = () => {
  const accounts = [
    { id: 1, name: "Cash" },
    { id: 2, name: "Bank" },
    { id: 3, name: "Sales" },
    { id: 4, name: "Purchase" },
    { id: 5, name: "Capital" },
  ];

  const [form, setForm] = useState({
    date: "",
    debitAccount: "",
    creditAccount: "",
    amount: "",
    narration: "",
  });

  const [vouchers, setVouchers] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.debitAccount || !form.creditAccount || !form.amount) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "All fields except narration are required",
        confirmButtonColor: "#249CA2",
      });
      return;
    }

    if (form.debitAccount === form.creditAccount) {
      Swal.fire({
        icon: "error",
        title: "Invalid Accounts",
        text: "Debit and Credit accounts cannot be the same",
      });
      return;
    }

    if (editingId) {
      setVouchers(
        vouchers.map((v) => (v.id === editingId ? { ...form, id: editingId } : v))
      );
      Swal.fire("Updated", "Journal Voucher updated successfully", "success");
      setEditingId(null);
    } else {
      setVouchers([...vouchers, { ...form, id: Date.now() }]);
      Swal.fire("Added", "Journal Voucher added successfully", "success");
    }

    setForm({
      date: "",
      debitAccount: "",
      creditAccount: "",
      amount: "",
      narration: "",
    });
  };

  const handleEdit = (voucher) => {
    setForm(voucher);
    setEditingId(voucher.id);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      {/* Page Title */}
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        JOURNAL VOUCHER MANAGEMENT
      </h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-4 justify-between bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8"
      >
        {/* Date */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Debit Account */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Debit Account</label>
          <select
            name="debitAccount"
            value={form.debitAccount}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Debit</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.name}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Credit Account */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Credit Account</label>
          <select
            name="creditAccount"
            value={form.creditAccount}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Credit</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.name}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount"
          />
        </div>

        {/* Narration */}
        <div className="w-full">
          <label className="block font-semibold text-gray-700 mb-2">Narration</label>
          <textarea
            name="narration"
            value={form.narration}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional narration"
            rows="2"
          />
        </div>

        {/* Submit Button */}
        <div className="w-full flex justify-center mt-6">
          <button
            type="submit"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition transform hover:scale-105"
          >
            {editingId ? "UPDATE VOUCHER" : "ADD VOUCHER"}
          </button>
        </div>
      </form>

      {/* Vouchers Table */}
      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 text-gray-800 uppercase text-sm">
              <th className="px-6 py-3 font-bold">Date</th>
              <th className="px-6 py-3 font-bold">Debit Account</th>
              <th className="px-6 py-3 font-bold">Credit Account</th>
              <th className="px-6 py-3 font-bold text-center">Amount</th>
              <th className="px-6 py-3 font-bold">Narration</th>
              <th className="px-6 py-3 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vouchers.length > 0 ? (
              vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{v.date}</td>
                  <td className="px-6 py-3 text-green-700 font-medium">
                    {v.debitAccount}
                  </td>
                  <td className="px-6 py-3 text-red-700 font-medium">
                    {v.creditAccount}
                  </td>
                  <td className="px-6 py-3 text-center font-semibold">
                    ₹{v.amount}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{v.narration}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleEdit(v)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    No vouchers found. Try adding a new one.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JournalVoucher;
