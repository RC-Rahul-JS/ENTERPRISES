// src/pages/DoctorLedgerPage.jsx
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import useApi from "../../api/useApi";
export default function DoctorLedgerPage() {
  const [formData, setFormData] = useState({
    doctorId: '67ee5e1bde4cb48c515073ee', // In future, make this a dropdown
    from: '2025-08-01',
    to: '2025-12-01',
  });
  const [DoctorList, setDoctorList] = useState([])
  const [DoctorId, setdoctorId] = useState('67ee5e1bde4cb48c515073ee')
 const { getData } = useApi();
   useEffect(() => {
  

    const doctor_list = async () => {
      try {
        const res = await getData(`/doctor_dropdown`);
        console.log(res)
        if (Array.isArray(res)) {
          setDoctorList(res);
        } else {
          setDoctorList([]);
        }
      } catch (error) {
        console.error("Failed to load appointments:", error);
        Swal.fire("Error", "Could not load Appointment data.", "error");
      }
    };
    doctor_list()
  }, []);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { doctorId, from, to } = formData;

    if (new Date(from) > new Date(to)) {
      Swal.fire('Invalid Range', 'Start date cannot be after end date.', 'error');
      return;
    }

    setLoading(true);
    setData(null);

    const url = `https://api.care2connect.in/v1/doctor/${DoctorId}?from=${from}&to=${to}`;

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);

      const result = await response.json();
      setData(result);

      console.log(result)

      if (result.transaction_count === 0) {
        Swal.fire('No Transactions', 'No fee records found for this period.', 'info');
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      Swal.fire('Connection Failed', 'Could not load doctor ledger. Try later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit',
    });

  const formatAmount = (num) => Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const abs = (n) => Math.abs(n);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Doctor Fee Ledger</h2>
      {/* <p className="text-center text-gray-600 mb-8">
        View earnings and payment history for Doctor : <strong>{DoctorId}</strong>
      </p> */}

      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
      >

        <div className="mb-4"> {/* Added mb-4 for spacing like the original */}
  <label htmlFor="doctorId" className="block text-sm font-semibold text-gray-700 mb-2">Doctor ID</label>
  <select
    id="doctorId"
    value={DoctorId}
    onChange={(e)=>setdoctorId(e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
  >
    <option value="" disabled>Select a Doctor ID</option> {/* Placeholder/Default option */}
    {DoctorList.map((id) => (
      <option key={id} value={id._id}>
        {`${id.name} ( ${id.secondaryId} )`}
      </option>
    ))}
  </select>
</div>
        {/* <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor ID</label>
          <input
            type="text"
            value={formData.doctorId}
            disabled
            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg"
          />
        </div> */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
          <input
            type="date"
            name="from"
            value={formData.from}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
          <input
            type="date"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-3 flex justify-center mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Loading...
              </>
            ) : (
              '🔍 Load Ledger'
            )}
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full mr-3"></span>
          Fetching doctor fee data...
        </div>
      )}

      {/* Ledger Data */}
      {!loading && data && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800">Opening Balance</h4>
              <p className="text-2xl font-bold mt-2">
                {data.opening_balance >= 0
                  ? `${formatAmount(data.opening_balance)} Dr`
                  : `${formatAmount(abs(data.opening_balance))} Cr`}
              </p>
            </div>

            <div className="bg-green-50 p-5 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-800">Fees Earned (Cr)</h4>
              <p className="text-2xl font-bold mt-2">₹{formatAmount(data.period_credit)}</p>
            </div>

            <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-800">Closing Balance</h4>
              <p className="text-2xl font-bold mt-2 text-purple-700">
                {data.closing_balance >= 0
                  ? `${formatAmount(data.closing_balance)} Dr`
                  : `${formatAmount(abs(data.closing_balance))} Cr`}
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100 text-gray-800 uppercase text-sm">
                  <th className="px-6 py-3 font-bold text-left">Date</th>
                  <th className="px-6 py-3 font-bold text-left">Voucher No</th>
                  <th className="px-6 py-3 font-bold text-left">Payment Id</th>
                  <th className="px-6 py-3 font-bold text-right">Debit (₹)</th>
                  <th className="px-6 py-3 font-bold text-right">Credit (₹)</th>
                  <th className="px-6 py-3 font-bold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Opening Balance row */}
                <tr className="bg-yellow-50 font-semibold">
                  <td colSpan="5" className="px-6 py-3 text-right">
                    Opening Balance
                  </td>
                  <td className="px-6 py-3 text-right">
                    {data.opening_balance >= 0
                      ? `${formatAmount(data.opening_balance)} Dr`
                      : `${formatAmount(abs(data.opening_balance))} Cr`}
                  </td>
                </tr>

                {data.transactions.length > 0 ? (
                  data.transactions.map((tx, idx) => {
                    // Calculate running balance
                    const previousBalance =
                      idx === 0 ? data.opening_balance : data.transactions[idx - 1].runningBalance;
                    tx.runningBalance = previousBalance + tx.credit - tx.debit;

                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-600">{formatDate(tx.date)}</td>
                        <td
                          className="px-6 py-3 font-mono text-sm text-blue-700 cursor-pointer hover:underline"
                          onClick={() => {
                            Swal.fire({
                              title: 'Voucher Details',
                              html: `
                                <div class="text-left">
                                  <p><strong>Voucher:</strong> ${tx.voucher_number}</p>
                                  <p><strong>Type:</strong> ${tx.voucher_type}</p>
                                  <p><strong>Mode:</strong> ${tx.voucher_mode}</p>
                                  <p><strong>Narration:</strong> ${tx.narration}</p>
                                  <p><strong>Credit:</strong> ₹${formatAmount(tx.credit)}</p>
                                  <p><strong>Debit:</strong> ₹${formatAmount(tx.debit)}</p>
                                </div>
                              `,
                              confirmButtonText: 'Close',
                            });
                          }}
                        >
                          {tx.voucher_number}
                        </td>
                        <td className="px-6 py-3">{tx.Payment_id}</td>
                        
                       
                        <td className="px-6 py-3 text-right text-red-700 font-medium">
                          ₹{formatAmount(tx.debit)}
                        </td>
                         <td className="px-6 py-3 text-right text-green-700 font-medium">
                          ₹{formatAmount(tx.credit)}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {tx.runningBalance >= 0
                            ? `${formatAmount(tx.runningBalance)} Cr`
                            : `${formatAmount(abs(tx.runningBalance))} Cr`}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No transactions in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Final Summary */}
          <div className="mt-6 text-right text-gray-600 font-semibold">
            Final Balance:{' '}
            {data.closing_balance >= 0
              ? `${formatAmount(data.closing_balance)} Dr`
              : `${formatAmount(abs(data.closing_balance))} Cr`}
          </div>
        </div>
      )}
    </div>
  );
}
