
// src/pages/DynamicVoucherList.jsx
import moment from 'moment';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Reusable Modal Component
const VoucherDetailModal = ({ voucher, onClose }) => {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (num) => {
    return Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };


  const [expandedLedger, setExpandedLedger] = useState(null);

  const groupedEntries = voucher.entries
    .filter((e) => !e.grouping) // सिर्फ non-grouping entries
    .reduce((acc, entry) => {
      if (!acc[entry.ledger_name]) {
        acc[entry.ledger_name] = {
          ledger_name: entry.ledger_name,
          debit: 0,
          credit: 0,
          entries: [],
        };
      }
      acc[entry.ledger_name].debit += entry.debit || 0;
      acc[entry.ledger_name].credit += entry.credit || 0;
      acc[entry.ledger_name].entries.push(entry);
      return acc;
    }, {});
  const groupedArray = Object.values(groupedEntries);

  // -------- Entries with direct grouping --------
  const directGroupingEntries = voucher.entries.filter((e) => e.grouping);

  // -------- Final Combined Array --------
  const finalEntries = [
    ...groupedArray, // custom grouped
    ...directGroupingEntries, // already grouped
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Voucher Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Voucher Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <strong className="text-gray-600">Voucher No:</strong>
              <p className="font-mono text-blue-700">{voucher.voucher_number}</p>
            </div>
            <div>
              <strong className="text-gray-600">Type:</strong>
              <p>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    voucher.voucher_type === 'Receipt'
                      ? 'bg-green-100 text-green-800'
                      : voucher.voucher_type === 'Payment'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {voucher.voucher_type}
                </span>
              </p>
            </div>
            <div>
              <strong className="text-gray-600">Mode:</strong>
              <p>{voucher.voucher_mode}</p>
            </div>
            <div>
              <strong className="text-gray-600">Date:</strong>
              <p>{formatDate(voucher.date)}</p>
            </div>
            {voucher.Payment_id && (
              <div>
                <strong className="text-gray-600">Payment ID:</strong>
                <p className="font-mono text-xs">{voucher.Payment_id}</p>
              </div>
            )}
            <div>
              <strong className="text-gray-600">Created By:</strong>
              <p>{voucher.created_by}</p>
            </div>
            <div className="md:col-span-2">
              <strong className="text-gray-600">Narration:</strong>
              <p className="italic text-gray-700">{voucher.narration}</p>
            </div>
          </div>


 
<div className="mt-6">
      <h4 className="font-semibold text-gray-800 mb-3">Ledger Entries</h4>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 rounded-lg">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="px-4 py-2 text-left">Ledger Name</th>
              <th className="px-4 py-2 text-right">Debit (₹)</th>
              <th className="px-4 py-2 text-right">Credit (₹)</th>
              <th className="px-4 py-2 text-left">Entries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {finalEntries.map((entry, idx) => (
              <React.Fragment key={idx}>
                {/* Parent Row */}
                <tr
                  className={`hover:bg-gray-50 ${
                    entry.grouping || entry.entries?.length > 1
                      ? "cursor-pointer"
                      : ""
                  }`}
                  onClick={() =>
                    (entry.grouping || entry.entries?.length > 1) &&
                    setExpandedLedger(expandedLedger === idx ? null : idx)
                  }
                >
                  <td className="px-4 py-2 font-medium">{entry.ledger_name}</td>
                  <td className="px-4 py-2 text-right text-green-700">
                    {entry.debit > 0 ? entry.debit.toFixed(3) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right text-red-700">
                    {entry.credit > 0 ? entry.credit.toFixed(3) : "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-600 text-sm">
                    {entry.grouping
                      ? `${entry.grouping.length} entries`
                      : entry.entries?.length > 1
                      ? `${entry.entries.length} entries`
                      : entry.narration}
                  </td>
                </tr>

                {/* Expand rows for custom grouped entries */}
                {expandedLedger === idx &&
                  entry.entries &&
                  entry.entries.map((sub, sidx) => (
                    <tr
                      key={sidx}
                      className="bg-gray-50 text-sm border-t border-gray-200"
                    >
                      <td className="px-6 py-2">{sub.ledger_name}</td>
                      <td className="px-6 py-2 text-right text-green-600">
                        {sub.debit > 0 ? sub.debit.toFixed(3) : "-"}
                      </td>
                      <td className="px-6 py-2 text-right text-red-600">
                        {sub.credit > 0 ? sub.credit.toFixed(3) : "-"}
                      </td>
                      <td className="px-6 py-2 text-gray-500">
                        {sub.narration}
                      </td>
                    </tr>
                  ))}

                {/* Expand rows for direct grouping */}
                {expandedLedger === idx &&
                  entry.grouping &&
                  entry.grouping.map((g, gidx) => (
                    <tr
                      key={gidx}
                      className="bg-gray-50 text-sm border-t border-gray-200"
                    >
                      <td className="px-6 py-2">{g.ledger_name}</td>
                      <td className="px-6 py-2 text-right text-green-600">
                        {g.debit > 0 ? g.debit.toFixed(3) : "-"}
                      </td>
                      <td className="px-6 py-2 text-right text-red-600">
                        {g.credit > 0 ? g.credit.toFixed(3) : "-"}
                      </td>
                      <td className="px-6 py-2 text-gray-500">{g.narration}</td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>

         

          {/* Total Check */}
          <div className="text-right mt-4 text-sm text-gray-600">
            <strong>
              Total Debit: ₹{formatAmount(voucher.entries.reduce((sum, e) => sum + e.debit, 0))} | 
              Total Credit: ₹{formatAmount(voucher.entries.reduce((sum, e) => sum + e.credit, 0))}
            </strong>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DynamicVoucherList() {
  const [filters, setFilters] = useState({
    from_date: moment(new Date()).format('YYYY-MM-DD'),
    to_date: moment(new Date()).format('YYYY-MM-DD'),
    voucher_type: 'Receipt',
    voucher_mode: 'Bank',
  });

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null); // For modal

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { from_date, to_date, voucher_type, voucher_mode } = filters;

    if (!from_date || !to_date) {
      Swal.fire({ icon: 'warning', title: 'Missing Dates', text: 'Please select both dates.' });
      return;
    }

    if (new Date(from_date) > new Date(to_date)) {
      Swal.fire({ icon: 'error', title: 'Invalid Range', text: 'From Date cannot be after To Date.' });
      return;
    }

    setLoading(true);
    setVouchers([]);

    const params = new URLSearchParams({
      from_date,
      to_date,
      ...(voucher_type && { voucher_type }),
      ...(voucher_mode && { voucher_mode }),
    });

    const apiUrl = `${API_BASE_URL}/v1/vouchers?${params}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.vouchers || [];
      setVouchers(list);
      console.log(list)

      if (list.length === 0) {
        Swal.fire({ icon: 'info', title: 'No Results', text: 'No vouchers found.' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Load',
        text: 'Could not retrieve vouchers. Check your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (num) => {
    return Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      {/* <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Voucher List</h2>
      <p className="text-center text-gray-600 mb-8">Search and view financial vouchers with filters</p> */}

      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
          <input type="date" name="from_date" value={filters.from_date} onChange={handleChange} required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
          <input type="date" name="to_date" value={filters.to_date} onChange={handleChange} required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Voucher Type</label>
          <select name="voucher_type" value={filters.voucher_type} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-Select-</option>
            <option value="Receipt">Receipt</option>
            <option value="Payment">Payment</option>
            <option value="Journal">Journal</option>
            {/* <option value="Contra">Contra</option> */}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
          <select name="voucher_mode" value={filters.voucher_mode} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-Select-</option>
        { filters.voucher_type!=='Journal' &&  <> <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Online">Online</option></>}
          { filters.voucher_type==='Journal' &&<option value="Journal">Journal</option>}
          </select>
        </div>
        <div className="lg:col-span-4 flex justify-center mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Searching...
              </>
            ) : (
              '🔍 Search Vouchers'
            )}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full mr-3"></span>
          Loading...
        </div>
      )}

      {/* Results Table */}
      {!loading && vouchers.length > 0 && (
        <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-gray-800 uppercase text-sm">
                <th className="px-6 py-3 font-bold text-left">Company</th>
                <th className="px-6 py-3 font-bold text-left">Voucher No</th>
                <th className="px-6 py-3 font-bold text-left">Date</th>
                <th className="px-6 py-3 font-bold text-left">Type</th>
                <th className="px-6 py-3 font-bold text-left">Mode</th>
                <th className="px-6 py-3 font-bold text-right">Amount</th>
                {/* <th className="px-6 py-3 font-bold text-center">Status</th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vouchers.map((v) => {
                const totalDebit = v.entries?.reduce((sum, e) => sum + e.debit, 0) || 0;
                return (
                  <tr key={v._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedVoucher(v)}>
                    <td className="px-6 py-3 font-mono text-sm font-semibold">{v.company}</td>
                    <td className="px-6 py-3 font-mono text-sm text-blue-700 font-medium">{v.voucher_number}</td>
                    <td className="px-6 py-3 text-gray-600">{new Date(v.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          v.voucher_type === 'Receipt'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {v.voucher_type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{v.voucher_mode}</td>
                    <td className="px-6 py-3 text-right font-medium text-green-700">
                      ₹{formatAmount(totalDebit)}
                    </td>
                    {/* <td className="px-6 py-3 text-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No Results */}
      {!loading && vouchers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="h-12 w-12 mx-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No vouchers found. Adjust your filters and try again.</p>
        </div>
      )}

      {/* Summary */}
      {!loading && vouchers.length > 0 && (
        <div className="mt-6 text-right">
          <strong className="text-lg">
            Total: ₹{formatAmount(vouchers.reduce((sum, v) => {
              const total = v.entries?.reduce((s, e) => s + e.debit, 0) || 0;
              return sum + total;
            }, 0))}
          </strong> across {vouchers.length} voucher(s)
        </div>
      )}

      {/* Modal */}
      {selectedVoucher && (
        <VoucherDetailModal
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
}