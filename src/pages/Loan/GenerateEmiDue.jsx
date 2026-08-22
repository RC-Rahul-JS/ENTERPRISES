import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  CreditCard, Search, Loader, CheckCircle, RefreshCw,
  Calendar, FileText, Activity, ListChecks, BadgeIndianRupee,
} from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';
import loanService from '../../api/loanService';
import axios from 'axios';
import { BASE_URL } from '../../config/api';

const toast = {
  success: (msg) =>
    Swal.fire({ icon: 'success', title: 'Success', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  error: (msg) =>
    Swal.fire({ icon: 'error', title: 'Error', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true }),
};

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-full";
const Field = ({ label, children, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const GenerateEmiDue = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];

  const [loanNumberInput, setLoanNumberInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [loan, setLoan] = useState(null);

  const [dueDate, setDueDate] = useState(today);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch loan details
  const handleSearch = async () => {
    if (!loanNumberInput.trim()) return toast.error('Enter a loan number');
    setSearching(true);
    setLoan(null);
    setResult(null);
    try {
      const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };
      const loanRes = await axios.get(`${BASE_URL}/loans`, { params: { loan_number: loanNumberInput.trim() }, headers });
      const data = loanRes.data?.data || loanRes.data;
      const found = Array.isArray(data) ? data.find(l => l.loan_number === loanNumberInput.trim()) : data;
      if (!found || !found.loan_number) return toast.error('Loan not found');
      setLoan(found);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to fetch loan');
    } finally {
      setSearching(false);
    }
  };

  // Generate single EMI due via POST /generate-emi-due
  const handleGenerate = async () => {
    if (!loan) return toast.error('Load a loan first');
    if (!dueDate) return toast.error('Select due date');

    const confirm = await Swal.fire({
      title: 'Generate EMI Due',
      html: `Generate EMI for Loan <b>${loan.loan_number}</b><br/>Due on <b>${dueDate}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Generate',
      confirmButtonColor: '#3b82f6',
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    showLoader();
    try {
      const payload = {
        loan_number: loan.loan_number,
        due_date: dueDate,
      };
      const data = await loanService.generateEmiDue(payload);
      if (data.success === false) throw new Error(data.message);
      setResult(data);
      toast.success(`EMI Due generated successfully!`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to generate EMI');
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handleReset = () => {
    setLoan(null);
    setLoanNumberInput('');
    setDueDate(today);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <ListChecks className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Generate EMI Due</h1>
        </div>
        <p className="text-blue-100 text-sm">
          Search a disbursed loan &rarr; Set due date &rarr; Generate single EMI
        </p>
      </div>

      {/* Success: Single EMI Result */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-emerald-700">EMI Due Generated Successfully</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              ['Loan Number',  result.loan_number],
              ['EMI Number',   `#${result.emi_number || result.data?.emi_number || 'N/A'}`],
              ['Due Date',     result.due_date || result.data?.due_date || '—'],
              ['Installment',  `₹${parseFloat(result.installment || result.data?.installment || 0).toLocaleString()}`],
              ['Principal Due',`₹${parseFloat(result.principal_due || result.data?.principal_due || 0).toLocaleString()}`],
              ['Interest Due', `₹${parseFloat(result.interest_due || result.data?.interest_due || 0).toLocaleString()}`],
              ['Balance',      `₹${parseFloat(result.remaining_balance || result.data?.remaining_balance || 0).toLocaleString()}`],
              ['Status',       result.status || result.data?.status || 'unpaid'],
            ].map(([k, v]) => (
              <div key={k} className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
                <p className="text-xs text-gray-400 uppercase font-medium">{k}</p>
                <p className="font-bold text-gray-800">{v ?? '—'}</p>
              </div>
            ))}
          </div>

          <button onClick={handleReset} className="text-sm text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 transition">
            <RefreshCw className="w-4 h-4" /> Generate another EMI
          </button>
        </div>
      )}

      {!result && (
        <>
          {/* Step 1: Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              Step 1 &mdash; Find Loan
            </h2>
            <div className="flex gap-2">
              <input
                id="emi-loan-search"
                className={inputCls}
                placeholder="Enter loan number (e.g. LN-001)..."
                value={loanNumberInput}
                onChange={e => setLoanNumberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                id="emi-search-btn"
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
              >
                {searching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
          </div>

          {loan && (
            <>
              {/* Loan Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Loan Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Loan Number',          loan.loan_number],
                    ['Customer Name',          loan.customer_name || 'N/A'],
                    ['Loan Status',            loan.loan_status],
                    ['Installment',            `₹${parseFloat(loan.installment || 0).toLocaleString()}`],
                    ['Outstanding Principal',  `₹${parseFloat(loan.outstanding_principal || 0).toLocaleString()}`],
                    ['Interest Outstanding',   `₹${parseFloat(loan.interest_outstanding || 0).toLocaleString()}`],
                    ['Tenure',                 `${loan.tenure} installments`],
                    ['Frequency',              loan.frequency || 'N/A'],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 font-medium uppercase">{k}</p>
                      <p className="font-bold text-gray-800 text-sm">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Date + Generate */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Step 2 &mdash; Set Due Date
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                  <Field label="Due Date" required>
                    <input
                      type="date"
                      className={inputCls}
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </Field>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  This will generate <b>1</b> EMI due on <b>{dueDate}</b>. Ensure interest has been posted for this period first!
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button onClick={handleReset} className="px-5 py-2.5 text-sm font-bold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition shadow-sm">
                  Reset
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate EMI
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GenerateEmiDue;
