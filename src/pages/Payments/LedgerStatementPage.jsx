// src/pages/LedgerStatementPage.jsx
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import useApi from '../../api/useApi';
import moment from 'moment';
const API_BASE_URL = import.meta.env.VITE_API_URL;
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FileSpreadsheet } from 'lucide-react';
export default function LedgerStatementPage() {
  const [formData, setFormData] = useState({
    grouptype: '',
    groupname: '',
    subgroupname: '', 
    ledgerId: 'A1',
    from: moment(new Date()).format('YYYY-MM-DD'),
    to: moment(new Date()).format('YYYY-MM-DD'),
  });
  const { getData } = useApi();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [grouplist, setgrouplist] = useState([]);
  const [ledger, setledgerlist] = useState([]);
  const [subgrouplist, setsubgrouplist] = useState([]);

  const fetchdata = async () => {
    try {
      const res = await getData('/groups');
      const res2 = await getData('/ledgers');
      const res3 = await getData('/subgroups');
      if (Array.isArray(res) && Array.isArray(res2)&& Array.isArray(res3)) {
        setgrouplist(res);
        setledgerlist(res2);
        setsubgrouplist(res3);
      }
    } catch (error) {
      console.error('Failed to load Data:', error);
      Swal.fire('Error', 'Could not load Data. Please try again.', 'error');
    }
  };

  useEffect(() => {
    fetchdata();
  }, []);

  // Filtered options
  const filteredGroups = grouplist.filter((g) => g.GroupType === formData.grouptype);
  // const filteredLedgers = ledger.filter((l) => l.Group_id === formData.groupname);
  const filteredSubGroups = subgrouplist.filter(
  (s) => s.Group_id === formData.groupname
);

const filteredLedgers =formData.subgroupname!==''? ledger.filter(
  (l) =>
    l.Group_id === formData.groupname &&
    l.subgroupname === formData.subgroupname
):ledger.filter((l) => l.Group_id === formData.groupname);

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => {
    if (name === 'grouptype')
      return { ...prev, grouptype: value, groupname: '', subgroupname: '', ledgerId: '' };

    if (name === 'groupname')
      return { ...prev, groupname: value, subgroupname: '', ledgerId: '' };

    if (name === 'subgroupname')
      return { ...prev, subgroupname: value, ledgerId: '' };

    return { ...prev, [name]: value };
  });
};




  const exportToExcel = () => {
  if (!data || data.transactions.length === 0) {
    Swal.fire("No Data", "Nothing to export", "warning");
    return;
  }

  const excelData = data.transactions.map((tx, index) => {
    const runningBalance =
      index === 0
        ? data.opening_balance + tx.debit - tx.credit
        : data.transactions[index - 1].runningBalance + tx.debit - tx.credit;

    data.transactions[index].runningBalance = runningBalance;

    return {
      Date: formatDate(tx.date),
      Company: tx.company,
      Voucher_No: tx.voucher_number,
      Type: tx.voucher_type,
      Narration: tx.narration,
      Debit: tx.debit,
      Credit: tx.credit,
      Balance:
        runningBalance >= 0
          ? `${runningBalance} Dr`
          : `${Math.abs(runningBalance)} Cr`,
    };
  });

  // Add Opening Balance on top
  excelData.unshift({
    Date: "",
    Company: "",
    Voucher_No: "",
    Type: "Opening Balance",
    Narration: "",
    Debit: "",
    Credit: "",
    Balance: data.opening_balance,
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const fileData = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  saveAs(fileData, `Ledger_${formData.ledgerId}.xlsx`);
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    const { ledgerId, from, to } = formData;
    if (new Date(from) > new Date(to)) {
      Swal.fire('Invalid Range', 'Start date cannot be after end date.', 'error');
      return;
    }

    setLoading(true);
    setData(null);

    const url = `${API_BASE_URL}/v1/ledger/${ledgerId}?from=${from}&to=${moment(to).add(1, 'days').format('YYYY-MM-DD')}`;

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const result = await response.json();
      setData(result);

      console.log(result)

      if (result.transaction_count === 0) {
        Swal.fire('No Transactions', 'No entries found in this period.', 'info');
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      Swal.fire('Connection Failed', 'Could not load ledger data. Try later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const DrCr=(b)=>{
    if (parseFloat(b)===0&&formData.grouptype==='Income') {
return 'Cr'
    }else if (parseFloat(b)===0&&formData.grouptype==='Liabilities') {
return 'Cr'
    }else if (parseFloat(b)===0&&formData.grouptype==='Expenditure') {
      return 'Dr'
    }else if (parseFloat(b)===0&&formData.grouptype==='Assets') {
      return 'Dr'
    }
    return 'Dr'
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatAmount = (num) =>
    Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const formatSide = (debit, credit) => {
    if (debit > 0) return { amount: formatAmount(debit), type: 'Dr', color: 'text-green-700' };
    if (credit > 0) return { amount: formatAmount(credit), type: 'Cr', color: 'text-red-700' };
    return { amount: '0.00', type: '', color: 'text-gray-600' };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Ledger Statement</h2>
      <p className="text-center text-gray-600 mb-8">
        View transaction history for ledger ID: <strong>{formData.ledgerId}</strong>
      </p>

      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
      >
        {/* Group Type */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Head</label>
          <select
            name="grouptype"
            value={formData.grouptype}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            {['Income', 'Assets', 'Expenditure', 'Liabilities'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Group Name */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Group Name</label>
          <select
            name="groupname"
            value={formData.groupname}
            onChange={handleChange}
            disabled={!formData.grouptype}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              !formData.grouptype ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="">{formData.grouptype ? 'Select Group' : 'Choose type first'}</option>
            {filteredGroups.map((item) => (
              <option key={item._id} value={item._id}>
                {item.GroupName}
              </option>
            ))}
          </select>
        </div>

        <div>
  <label className="block font-semibold text-gray-700 mb-2">Sub Group</label>
  <select
    name="subgroupname"
    value={formData.subgroupname}
    onChange={handleChange}
    disabled={!formData.groupname}
    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
      !formData.groupname ? 'bg-gray-100 cursor-not-allowed' : ''
    }`}
  >
    <option value="">Select Sub Group</option>
    {filteredSubGroups.map((item) => (
      <option key={item._id} value={item.subgroupname}>
        {item.subgroupname}
      </option>
    ))}
  </select>
</div>

        {/* Ledger Name */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Ledger Name</label>
          <select
            name="ledgerId"
            value={formData.ledgerId}
            onChange={handleChange}
            disabled={!formData.groupname}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              !formData.groupname ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="">{formData.groupname ? 'Select Ledger' : 'Choose group first'}</option>
            {filteredLedgers.map((item) => (
              <option key={item.Code} value={item.Code}>
                {item.LedgerName}
              </option>
            ))}
          </select>
        </div>

        {/* From & To Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
          <input
            type="date"
            name="from"
            value={formData.from}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              '🔍 Load Statement'
            )}
          </button>
        </div>
      </form>

       {!loading && data && (
          <div className="px-6 py-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 shadow-inner">
            <div className="flex items-center gap-6">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Transactions</span>
                  <span className="text-sm font-black text-gray-800">{data.transaction_count}</span>
               </div>
               <div className="h-10 w-[1px] bg-gray-200"></div>
              
            </div>

            <button
              onClick={exportToExcel}
              className="flex text-xs items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 group"
            >
              <FileSpreadsheet size={15} className="group-hover:rotate-12 transition-transform" />
              Download Excel Report
            </button>
          </div>
        )}

      {/* Ledger Data */}
      {!loading && data && (
        <div>
          {/* Summary */}
          {/* <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-8"> */}
            {/* <h3 className="text-lg font-semibold text-blue-800">Account Summary</h3> */}
            {/* <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm"> */}
              {/* <div>
                <strong>Ledger Name:</strong> {data.transactions[0]?.ledger_name || 'Unknown'}
              </div> */}
              {/* <div>
                <strong>Opening Balance:</strong> {formatAmount(data.opening_balance)} Dr
              </div> */}
              {/* <div>
                <strong>Total Transactions:</strong> {data.transaction_count}
              </div> */}


              
            {/* </div> */}
          {/* </div> */}

          {/* Transactions Table */}
          <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100 text-gray-800 uppercase text-xs">
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Company</th>
                  <th className="px-6 py-3 text-left">Voucher No</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Narration</th>
                  <th className="px-6 py-3 text-right">Debit (₹)</th>
                  <th className="px-6 py-3 text-right">Credit (₹)</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Opening Balance Row */}
                <tr className="bg-yellow-50 font-semibold">
                  <td colSpan="7" className="px-6 py-3 text-right text-xs">
                    Opening Balance
                  </td>
                  <td className="px-6 py-3 text-right">
                    {data.opening_balance >= 0
                      ? `${formatAmount(data.opening_balance)} ${DrCr(data.opening_balance)}`
                      : `${formatAmount(Math.abs(data.opening_balance))} Cr`}
                  </td>
                </tr>

                {/* Transactions */}
                {data.transactions.length > 0 ? (
                  data.transactions.map((tx, idx) => {
                    if (idx === 0) {
                      tx.runningBalance = data.opening_balance + tx.debit - tx.credit;
                    } else {
                      tx.runningBalance =
                        data.transactions[idx - 1].runningBalance + tx.debit - tx.credit;
                    }

                    const debitInfo = formatSide(tx.debit, 0);
                    const creditInfo = formatSide(0, tx.credit);

                    return (
                      <tr key={idx} className="hover:bg-gray-50 text-xs">
                        <td className="px-6 py-3 text-gray-600">{formatDate(tx.date)}</td>
                        <td className="px-6 py-3 text-gray-600 font-semibold">{tx.company}</td>
                        <td
                          className="px-6 py-3 font-mono text-xs text-blue-700 cursor-pointer hover:underline"
                          onClick={() => {
                            Swal.fire({
                              title: 'Voucher Details',
                              html: `
                                <p><strong>Voucher:</strong> ${tx.voucher_number}</p>
                                <p><strong>Type:</strong> ${tx.voucher_type}</p>
                                <p><strong>Mode:</strong> ${tx.voucher_mode}</p>
                                <p><strong>Narration:</strong> ${tx.narration}</p>
                                <p><strong>Debit:</strong> ₹${formatAmount(tx.debit)}</p>
                                <p><strong>Credit:</strong> ₹${formatAmount(tx.credit)}</p>
                              `,
                              confirmButtonText: 'Close',
                            });
                          }}
                        >
                          {tx.voucher_number}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              tx.voucher_type === 'Receipt'
                                ? 'bg-green-100 text-green-800'
                                : tx.voucher_type === 'Payment'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {tx.voucher_type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-700 text-xs">{tx.narration}</td>
                        <td className={`px-6 py-3 text-right font-medium ${debitInfo.color}`}>
                          {tx.debit > 0 ? debitInfo.amount : '-'}
                        </td>
                        <td className={`px-6 py-3 text-right font-medium ${creditInfo.color}`}>
                          {tx.credit > 0 ? creditInfo.amount : '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {tx.runningBalance >= 0
                            ? `${formatAmount(tx.runningBalance)} Dr`
                            : `${formatAmount(Math.abs(tx.runningBalance))} Cr`}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No transactions found in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Final Balance */}
          <div className="mt-6 text-right text-gray-600 font-semibold">
            Final Balance:{' '}
            {data.transactions.reduce((bal, tx) => bal + tx.debit - tx.credit, data.opening_balance) >=
            0
              ? 'Dr'
              : 'Cr'}{' '}
            ₹
            {formatAmount(
              Math.abs(
                data.transactions.reduce(
                  (bal, tx) => bal + tx.debit - tx.credit,
                  data.opening_balance
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
