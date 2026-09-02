import React, { useState } from 'react';
import { Search, FileText, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import loanService from '../../api/loanService';
import Swal from 'sweetalert2';

export default function CustomerStatement() {
  const [loanSearch, setLoanSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // summary, emi, payments

  const fetchStatement = async (e) => {
    e?.preventDefault();
    if (!loanSearch.trim()) return;

    setLoading(true);
    try {
      const res = await loanService.getCustomerStatement(loanSearch.trim());
      if (res.success) {
        setStatementData(res);
        setActiveTab('summary');
      } else {
        Swal.fire('Error', res.message || 'Failed to fetch statement', 'error');
        setStatementData(null);
      }
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.message || 'Failed to fetch statement', 'error');
      setStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatAmt = (amt) => (amt || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle size={12} /> PAID</span>;
      case 'PARTIAL': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1"><Clock size={12} /> PARTIAL</span>;
      case 'OVERDUE': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1"><AlertCircle size={12} /> OVERDUE</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full flex items-center gap-1"><XCircle size={12} /> UNPAID</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-indigo-600" />
            Customer Loan Statement
          </h1>
          <p className="text-gray-500 text-sm mt-1">Search and view complete history of a loan</p>
        </div>

        <form onSubmit={fetchStatement} className="flex w-full md:w-auto relative">
          <input
            type="text"
            placeholder="Enter Loan Number..."
            className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={loanSearch}
            onChange={(e) => setLoanSearch(e.target.value.toUpperCase())}
            autoFocus
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <button
            type="submit"
            disabled={loading || !loanSearch}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-r-xl font-semibold transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {statementData && (
        <div className="space-y-6 animate-fade-in">
          {/* Tabs */}
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {['summary', 'emi', 'payments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-bold uppercase transition ${
                  activeTab === tab
                    ? 'bg-indigo-50 text-indigo-700 border-b-4 border-indigo-600'
                    : 'text-gray-500 hover:bg-gray-50 border-b-4 border-transparent'
                }`}
              >
                {tab === 'summary' ? 'Loan Summary' : tab === 'emi' ? 'EMI Schedule' : 'Payment History'}
              </button>
            ))}
          </div>

          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Detailed Loan Card */}
              <div className="col-span-1 lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Loan Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loan Number</span>
                    <span className="font-semibold text-indigo-700">{statementData.loan.loan_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer ID</span>
                    <span className="font-medium">{statementData.loan.customer_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loan Amount</span>
                    <span className="font-medium text-gray-900">{formatAmt(statementData.loan.loan_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Disbursed On</span>
                    <span className="font-medium">{formatDate(statementData.loan.disbursement_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Interest / Tenure</span>
                    <span className="font-medium">{statementData.loan.interest_rate}% ({statementData.loan.interest_type}) / {statementData.loan.tenure} {statementData.loan.frequency}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      statementData.loan.loan_status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {statementData.loan.loan_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Outstanding Card */}
              <div className="col-span-1 lg:col-span-1 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-6 shadow-sm border border-rose-100">
                <h3 className="text-lg font-bold text-rose-800 mb-4 border-b border-rose-200 pb-2">Outstanding Dues</h3>
                <div className="flex flex-col items-center mb-6">
                  <span className="text-gray-500 text-xs font-bold uppercase mb-1">Total Outstanding</span>
                  <span className="text-3xl font-black text-rose-600">{formatAmt(statementData.summary.total_outstanding)}</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Principal</span>
                    <span className="font-semibold">{formatAmt(statementData.summary.outstanding_principal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Interest</span>
                    <span className="font-semibold">{formatAmt(statementData.summary.outstanding_interest)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Penalty</span>
                    <span className="font-bold">{formatAmt(statementData.summary.outstanding_penalty)}</span>
                  </div>
                </div>
              </div>

              {/* Paid Status Card */}
              <div className="col-span-1 lg:col-span-1 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-sm border border-emerald-100">
                <h3 className="text-lg font-bold text-emerald-800 mb-4 border-b border-emerald-200 pb-2">Payments Received</h3>
                <div className="flex flex-col items-center mb-6">
                  <span className="text-gray-500 text-xs font-bold uppercase mb-1">Total Paid</span>
                  <span className="text-3xl font-black text-emerald-600">{formatAmt(statementData.summary.total_payment_received)}</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Principal Paid</span>
                    <span className="font-semibold">{formatAmt(statementData.summary.total_principal_paid)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Interest Paid</span>
                    <span className="font-semibold">{formatAmt(statementData.summary.total_interest_paid)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Penalty Paid</span>
                    <span className="font-bold">{formatAmt(statementData.summary.total_penalty_paid)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMI SCHEDULE */}
          {activeTab === 'emi' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-xl text-center">#</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Installment</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Prin. Due</th>
                    <th className="py-3 px-4 text-right">Prin. Paid</th>
                    <th className="py-3 px-4 text-right">Int. Due</th>
                    <th className="py-3 px-4 text-right">Int. Paid</th>
                    <th className="py-3 px-4 text-right text-rose-600">Pen. Due</th>
                    <th className="py-3 px-4 text-right text-emerald-600">Pen. Paid</th>
                    <th className="py-3 px-4 text-right rounded-tr-xl bg-indigo-50">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statementData.emi_schedule.length > 0 ? (
                    statementData.emi_schedule.map((emi) => (
                      <tr key={emi.emi_number} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-bold text-gray-500 text-center">{emi.emi_number}</td>
                        <td className="py-3 px-4 font-medium">{formatDate(emi.due_date)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-700">{formatAmt(emi.installment)}</td>
                        <td className="py-3 px-4">{getStatusBadge(emi.status)}</td>
                        <td className="py-3 px-4 text-right">{formatAmt(emi.principal_due)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">{formatAmt(emi.principal_paid)}</td>
                        <td className="py-3 px-4 text-right">{formatAmt(emi.interest_due)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">{formatAmt(emi.interest_paid)}</td>
                        <td className="py-3 px-4 text-right text-rose-600">{formatAmt(emi.penalty_due)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">{formatAmt(emi.penalty_paid)}</td>
                        <td className="py-3 px-4 text-right font-bold bg-indigo-50/50 text-indigo-700">{formatAmt(emi.pending_amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="11" className="text-center py-6 text-gray-500">No EMI schedule found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-xl text-center">EMI #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Txn ID / Voucher</th>
                    <th className="py-3 px-4 text-right">Debit</th>
                    <th className="py-3 px-4 text-right">Credit</th>
                    <th className="py-3 px-4 text-right rounded-tr-xl bg-orange-50">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statementData.payment_statement.length > 0 ? (
                    statementData.payment_statement.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-bold text-gray-500 text-center">{tx.emi_number || '-'}</td>
                        <td className="py-3 px-4 font-medium">{formatDate(tx.date)}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {tx.description}
                          {tx.principal_paid > 0 && <span className="block text-[10px] text-gray-400">PR: {tx.principal_paid}</span>}
                          {tx.interest_paid > 0 && <span className="block text-[10px] text-gray-400">INT: {tx.interest_paid}</span>}
                          {tx.penalty_paid > 0 && <span className="block text-[10px] text-rose-400">PEN: {tx.penalty_paid}</span>}
                        </td>
                        <td className="py-3 px-4 text-gray-500">{tx.payment_mode || tx.type}</td>
                        <td className="py-3 px-4 font-mono text-xs text-blue-600">
                          {tx.transaction_id || tx.voucher_number || '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">{tx.debit > 0 ? formatAmt(tx.debit) : '-'}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{tx.credit > 0 ? formatAmt(tx.credit) : '-'}</td>
                        <td className="py-3 px-4 text-right font-bold text-orange-600 bg-orange-50/50">{formatAmt(tx.total_balance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="text-center py-6 text-gray-500">No payment history found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
