import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Banknote, Search, CheckCircle, Loader, CreditCard,
  Building2, Hash, Calendar, FileText, Percent, ArrowRight,
  BadgeIndianRupee, RefreshCw,
} from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';
import { BASE_URL } from '../../config/api';
import loanService from '../../api/loanService';

// ── Toast helpers ─────────────────────────────────────────────────────────────
const toast = {
  success: (msg) =>
    Swal.fire({ icon: 'success', title: 'Success', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  error: (msg) =>
    Swal.fire({ icon: 'error', title: 'Error', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true }),
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = 'blue', icon: Icon }) => {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red:    'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colors[color]}`}>
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      <div>
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="text-lg font-bold">{value ?? '—'}</p>
      </div>
    </div>
  );
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, children, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

// ─────────────────────────────────────────────────────────────────────────────
const LoanDisbursement = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];

  // Search
  const [loanNumberInput, setLoanNumberInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [loan, setLoan] = useState(null);

  // Computed amounts
  const [gstRate, setGstRate] = useState(18);

  // Form fields
  const [disbursementDate, setDisbursementDate]   = useState(today);
  const [paymentMode, setPaymentMode]             = useState('Cash');
  const [transactionId, setTransactionId]         = useState('');
  const [bankName, setBankName]                   = useState('');
  const [accountNumber, setAccountNumber]         = useState('');
  const [ifscCode, setIfscCode]                   = useState('');
  const [remarks, setRemarks]                     = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  // ── Derived amounts ──────────────────────────────────────────────────────
  const loanAmount    = parseFloat(loan?.loan_amount   || 0);
  const processingFee = parseFloat(loan?.processing_fee || 0);
  const gstAmount     = Math.round((processingFee * gstRate / 100) * 100) / 100;
  const netDisb       = Math.round((loanAmount - processingFee - gstAmount) * 100) / 100;

  // ── Fetch loan ────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!loanNumberInput.trim()) return toast.error('Enter a loan number');
    setSearching(true);
    setLoan(null);
    setResult(null);
    try {
      const res = await axios.get(`${BASE_URL}/loans`, {
        params: { loan_number: loanNumberInput.trim() },
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      });
      const data = res.data?.data || res.data;
      const found = Array.isArray(data)
        ? data.find(l => l.loan_number === loanNumberInput.trim())
        : data;
      if (!found) return toast.error('Loan not found');
      setLoan(found);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to fetch loan');
    } finally {
      setSearching(false);
    }
  };

  // ── Submit disbursement ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!loan) return toast.error('Search and load a loan first');
    if (!disbursementDate) return toast.error('Disbursement date is required');
    if (netDisb < 0) return toast.error('Processing fee + GST exceeds loan amount');

    const confirm = await Swal.fire({
      title: 'Confirm Disbursement',
      html: `Disburse <b>₹${netDisb.toLocaleString()}</b> net to loan <b>${loan.loan_number}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Disburse',
      confirmButtonColor: '#2563eb',
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    showLoader();
    try {
      const payload = {
        loan_number: loan.loan_number,
        disbursement_date: disbursementDate,
        payment_mode: paymentMode,
        transaction_id: transactionId || undefined,
        bank_name: bankName || undefined,
        account_number: accountNumber || undefined,
        ifsc_code: ifscCode || undefined,
        remarks: remarks || undefined,
        gst_rate: gstRate,
        created_by: 'admin',
      };
      const data = await loanService.disburseLoan(payload);
      if (data.success === false) throw new Error(data.message);
      setResult(data);
      toast.success('Loan disbursed successfully!');
      setLoan(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Disbursement failed');
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handleReset = () => {
    setLoan(null);
    setLoanNumberInput('');
    setResult(null);
    setGstRate(18);
    setDisbursementDate(today);
    setPaymentMode('Cash');
    setTransactionId('');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setRemarks('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <Banknote className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Loan Disbursement</h1>
        </div>
        <p className="text-blue-100 text-sm">Disburse sanctioned loans and generate payment vouchers</p>
      </div>

      {/* ── Success Result Banner ── */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-emerald-700">Disbursement Successful</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Loan Number"    value={result.loan_number}    color="green" icon={Hash} />
            <StatCard label="Gross Amount"   value={`₹${(result.loan_amount||0).toLocaleString()}`}     color="blue"  icon={BadgeIndianRupee} />
            <StatCard label="Net Disbursed"  value={`₹${(result.net_disbursement||0).toLocaleString()}`} color="green" icon={Banknote} />
            <StatCard label="Voucher No."    value={result.voucher_number}  color="orange" icon={FileText} />
          </div>
          <button onClick={handleReset} className="mt-4 flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 font-medium">
            <RefreshCw className="w-4 h-4" /> Process another loan
          </button>
        </div>
      )}

      {/* ── Search ── */}
      {!result && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Find Loan</h2>
            <div className="flex gap-2">
              <input
                id="disburse-loan-search"
                className={`${inputCls} flex-1`}
                placeholder="Enter loan number..."
                value={loanNumberInput}
                onChange={e => setLoanNumberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                id="disburse-search-btn"
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {searching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
          </div>

          {/* ── Loan Summary ── */}
          {loan && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Loan Summary
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <StatCard label="Loan Number"    value={loan.loan_number}  color="blue"   icon={Hash} />
                  <StatCard label="Loan Amount"    value={`₹${loanAmount.toLocaleString()}`}       color="blue"   icon={BadgeIndianRupee} />
                  <StatCard label="Processing Fee" value={`₹${processingFee.toLocaleString()}`}    color="orange" icon={Percent} />
                  <StatCard label="Status"         value={loan.loan_status}  color="green"  icon={CheckCircle} />
                </div>

                {/* Amount breakdown */}
                <div className="bg-blue-50 rounded-xl p-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Loan Amount</span>
                    <span className="font-semibold">₹{loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-semibold text-orange-600">− ₹{processingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      GST
                      <input
                        type="number"
                        min={0} max={100}
                        className="w-14 ml-1 border border-gray-300 rounded px-1 py-0.5 text-xs"
                        value={gstRate}
                        onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
                      />
                      %
                    </span>
                    <span className="font-semibold text-orange-600">− ₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between">
                    <span className="font-bold text-blue-800">Net Disbursement</span>
                    <span className={`font-bold text-lg ${netDisb < 0 ? 'text-red-600' : 'text-blue-800'}`}>
                      ₹{netDisb.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Disbursement Form ── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" /> Disbursement Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Disbursement Date" required>
                    <input id="disburse-date" type="date" className={inputCls} value={disbursementDate} onChange={e => setDisbursementDate(e.target.value)} />
                  </Field>

                  <Field label="Payment Mode" required>
                    <select id="disburse-payment-mode" className={inputCls} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                    </select>
                  </Field>

                  <Field label="Transaction ID">
                    <input id="disburse-txn-id" type="text" className={inputCls} placeholder="Txn / UTR number" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
                  </Field>

                  {paymentMode === 'Bank' && (
                    <>
                      <Field label="Bank Name">
                        <input id="disburse-bank-name" type="text" className={inputCls} placeholder="Bank name" value={bankName} onChange={e => setBankName(e.target.value)} />
                      </Field>
                      <Field label="Account Number">
                        <input id="disburse-acc-num" type="text" className={inputCls} placeholder="Account number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                      </Field>
                      <Field label="IFSC Code">
                        <input id="disburse-ifsc" type="text" className={inputCls} placeholder="IFSC code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
                      </Field>
                    </>
                  )}

                  <Field label="Remarks">
                    <input id="disburse-remarks" type="text" className={`${inputCls} md:col-span-2`} placeholder="Optional remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
                  </Field>
                </div>
              </div>

              {/* ── Submit ── */}
              <div className="flex gap-3 justify-end">
                <button onClick={handleReset} className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                  Reset
                </button>
                <button
                  id="disburse-submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting || netDisb < 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Disburse Loan
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LoanDisbursement;
