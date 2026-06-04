// src/pages/ViewLedger.jsx
import React, { useState } from 'react';
import Swal from 'sweetalert2';

// Mock Data
const initialGroupList = [
  { Pushkey: 'G001', GroupName: 'Sales', GroupType: 'Income' },
  { Pushkey: 'G002', GroupName: 'Rent Income', GroupType: 'Income' },
  { Pushkey: 'G003', GroupName: 'Furniture', GroupType: 'Assets' },
  { Pushkey: 'G004', GroupName: 'Cash', GroupType: 'Assets' },
  { Pushkey: 'G005', GroupName: 'Utilities', GroupType: 'Expenditure' },
];

const initialLedgerList = [
  { Pushkey: 'L001', LedgerName: 'ABC Customers', GroupName: 'Sales' },
  { Pushkey: 'L002', LedgerName: 'XYZ Rent', GroupName: 'Rent Income' },
  { Pushkey: 'L003', LedgerName: 'Office Chair', GroupName: 'Furniture' },
  { Pushkey: 'L004', LedgerName: 'Petty Cash', GroupName: 'Cash' },
  { Pushkey: 'L005', LedgerName: 'Electricity Bill', GroupName: 'Utilities' },
];

const initialTransactions = [
  { date: '2025-04-01', particular: 'To Balance b/d', dr_amt: 5000, cr_amt: 0 },
  { date: '2025-04-03', particular: 'By Sales', dr_amt: 0, cr_amt: 2000 },
  { date: '2025-04-05', particular: 'To Cash', dr_amt: 1500, cr_amt: 0 },
  { date: '2025-04-07', particular: 'By Customer Payment', dr_amt: 0, cr_amt: 3000 },
];

export default function ViewLedger() {
  const [formData, setFormData] = useState({
    grouptype: '',
    groupname: '',
    ledgername: '',
    fromdate: moment(new Date()).format('YYYY-MM-DD'),
    todate: moment(new Date()).format('YYYY-MM-DD'),
  });

  const [list, setList] = useState([]);
  const [grouplist] = useState(initialGroupList);
  const [ledger] = useState(initialLedgerList);

  // Filtered options
  const filteredGroups = grouplist.filter((g) => g.GroupType === formData.grouptype);
  const filteredLedgers = ledger.filter((l) => l.GroupName === grouplist.find(g => g.Pushkey === formData.groupname)?.GroupName);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Reset dependent fields
      if (name === 'grouptype') return { ...updated, groupname: '', ledgername: '' };
      if (name === 'groupname') return { ...updated, ledgername: '' };

      return updated;
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const { grouptype, groupname, ledgername, fromdate, todate } = formData;

    if (!grouptype || !groupname || !ledgername || !fromdate || !todate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill all fields to view the ledger.',
        confirmButtonText: 'Got it',
        confirmButtonColor: '#249CA2',
      });
      return;
    }

    if (new Date(fromdate) > new Date(todate)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Date Range',
        text: 'From Date cannot be after To Date.',
        confirmButtonText: 'Fix',
      });
      return;
    }

    // Simulate fetching transactions (replace with API call)
    // For demo: just use mock data with balance calculation
    let balance = 5000; // Opening balance
    const ledgerWithBalance = initialTransactions.map((item) => {
      balance = balance + item.dr_amt - item.cr_amt;
      return { ...item, balance };
    });
    

    setList(ledgerWithBalance);

    Swal.fire({
      icon: 'success',
      title: 'Ledger Loaded',
      text: 'Transaction data has been fetched successfully.',
      timer: 1500,
      showConfirmButton: false,
    });
  };




  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      {/* Page Title */}
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">VIEW LEDGER</h2>

      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-4 justify-between bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8"
      >
        {/* Group Type */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Group Type</label>
          <select
            name="grouptype"
            value={formData.grouptype}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            {[
              { label: 'Income', id: 'Income' },
              { label: 'Assets', id: 'Assets' },
              { label: 'Expenditure', id: 'Expenditure' },
              { label: 'Liabilities', id: 'Liabilities' },
            ].map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Group Name */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Group Name</label>
          <select
            name="groupname"
            value={formData.groupname}
            onChange={handleChange}
            disabled={!formData.grouptype}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !formData.grouptype ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="">{formData.grouptype ? 'Select Group' : 'Choose type first'}</option>
            {filteredGroups.map((item) => (
              <option key={item.Pushkey} value={item.Pushkey}>
                {item.GroupName}
              </option>
            ))}
          </select>
        </div>

        {/* Ledger Name */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Ledger Name</label>
          <select
            name="ledgername"
            value={formData.ledgername}
            onChange={handleChange}
            disabled={!formData.groupname}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !formData.groupname ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="">{formData.groupname ? 'Select Ledger' : 'Choose group first'}</option>
            {filteredLedgers.map((item) => (
              <option key={item.Pushkey} value={item.Pushkey}>
                {item.LedgerName}
              </option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">From Date</label>
          <input
            type="date"
            name="fromdate"
            value={formData.fromdate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* To Date */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">To Date</label>
          <input
            type="date"
            name="todate"
            value={formData.todate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Button */}
        <div className="w-full flex justify-center mt-6">
          <button
            type="submit"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition transform hover:scale-105"
          >
            SEARCH
          </button>
        </div>
      </form>

      {/* Ledger Table */}
      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full table-auto ">
          <thead>
            <tr className="bg-gray-100 text-gray-800 uppercase text-sm">
              <th className="px-6 py-3 font-bold">S No</th>
              <th className="px-6 py-3 font-bold">Date</th>
              <th className="px-6 py-3 font-bold">Particular</th>
              <th className="px-6 py-3 font-bold text-center">Dr</th>
              <th className="px-6 py-3 font-bold text-center">Cr</th>
              <th className="px-6 py-3 font-bold text-center">Balance</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.length > 0 ? (
              list.map((item, index) => {
                const balanceType = item.balance >= 0 ? 'Dr' : 'Cr';
                const absBalance = Math.abs(item.balance).toFixed(2);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700">{index + 1}</td>
                    <td className="px-6 py-3 text-gray-600">{item.date}</td>
                    <td className="px-6 py-3 font-medium">{item.particular}</td>
                    <td className="px-6 py-3 text-right text-green-700 font-medium">
                      {item.dr_amt > 0 ? item.dr_amt.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-3 text-right text-red-700 font-medium">
                      {item.cr_amt > 0 ? item.cr_amt.toFixed(2) : '-'}
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-bold ${
                        balanceType === 'Dr' ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {absBalance === '0.00' ? '0' : `${absBalance} ${balanceType}`}
                    </td>
                  </tr>
                );
              })
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
                    No transactions found. Try adjusting your search.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}