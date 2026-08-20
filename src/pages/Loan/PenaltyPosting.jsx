import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  AlertOctagon, Search, Loader, Calendar, RefreshCw,
  CheckCircle, Hash, BadgeIndianRupee, FileText, Clock,
  Percent, ArrowRight,
} from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';
import loanService from '../../api/loanService';
import axios from 'axios';
import { BASE_URL } from '../../config/api';

// ── Toast ──────────────────────────────────────────────────────────────────
const toast = {
  success: (msg) =>
    Swal.fire({ icon: 'success', title: 'Success', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  error: (msg) =>
    Swal.fire({ icon: 'error', title: 'Error', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true }),
};

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white w-full";
const Field = ({ label, children, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const PenaltyPosting = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];

  // Search
  const [loanNumberInput, setLoanNumberInput] = useState('');
  const [searching, setSearching]             = useState(false);
  const [loan, setLoan]                       = useState(null);
  const [unpaidEmi, setUnpaidEmi]             = useState(null);

  // Form
  const [postingDate, setPostingDate]   = useState(today);
  const [penaltyType, setPenaltyType]   = useState('daily');
  const [penaltyValue, setPenaltyValue] = useState(100);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  // ── Derived: delay days + estimated penalty ────────────────────────────
  const dueDate   = unpaidEmi?.due_date;
  const delayDays = dueDate
    ? Math.max(0, Math.floor((new Date(postingDate) - new Date(dueDate)) / 86400000))
    : 0;

  const installment = parseFloat(unpaidEmi?.installment || 0);
  let estimatedPenalty = 0;
  if (penaltyType === 'daily')      estimatedPenalty = delayDays * penaltyValue;
  else if (penaltyType === 'percentage') estimatedPenalty = installment * penaltyValue / 100;
  estimatedPenalty = Math.round(estimatedPenalty * 100) / 100;

  // ── Fetch loan + unpaid EMI ────────────────────────────────────────────
  const handleSearch = async () => {
    if (!loanNumberInput.trim()) return toast.error('Enter a loan number');
    setSearching(true);
    setLoan(null);
    setUnpaidEmi(null);
    setResult(null);
    try {
      const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };
      const loanRes = await axios.get(`${BASE_URL}/loans`, { params: { loan_number: loanNumberInput.trim() }, headers });
      const data = loanRes.data?.data || loanRes.data;
      const found = Array.isArray(data) ? data.find(l => l.loan_number === loanNumberInput.trim()) : data;
      if (!found) return toast.error('Loan not found');

      // Fetch unpaid EMI
      let emiList = [];
      try {
        emiList = await loanService.getEmiDues(loanNumberInput.trim());
        if (!Array.isArray(emiList)) emiList = [];
      } catch (_) { emiList = []; }

      const unpaid = emiList.find(e => e.status === 'UNPAID' || e.status === 'PARTIAL');
      setLoan(found);
      setUnpaidEmi(unpaid || null);

      if (!unpaid) toast.error('No unpaid EMI found for this loan');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to fetch loan');
    } finally {
      setSearching(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!loan || !unpaidEmi) return toast.error('Load a loan with an unpaid EMI first');
    if (delayDays <= 0) return toast.error('Posting date must be after the EMI due date');
    if (estimatedPenalty <= 0) return toast.error('Penalty amount must be greater than zero');

    const confirm = await Swal.fire({
      title: 'Post Penalty?',
      html: `Post penalty of <b>₹${estimatedPenalty.toLocaleString()}</b> for loan <b>${loan.loan_number}</b>?<br/><small>${delayDays} day(s) overdue</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Post Penalty',
      confirmButtonColor: '#e11d48',
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    showLoader();
    try {
      const payload = {
        loan_number: loan.loan_number,
        posting_date: postingDate,
        penalty_type: penaltyType,
        penalty_value: penaltyValue,
        created_by: 'admin',
      };
      const data = await loanService.postPenalty(payload);
      if (data.success === false) throw new Error(data.message);
      setResult(data);
      toast.success('Penalty posted successfully!');
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Penalty posting failed');
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handleReset = () => {
    setLoan(null); setUnpaidEmi(null); setLoanNumberInput('');
    setPostingDate(today); setPenaltyType('daily'); setPenaltyValue(100); setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-700 to-rose-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <AlertOctagon className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Penalty Posting</h1>
        </div>
        <p className="text-rose-100 text-sm">Post late-payment penalties for overdue EMIs</p>
      </div>

      {/* Success Banner */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-emerald-700">Penalty Posted Successfully</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ['Loan Number',        result.loan_number],
              ['Due Date',           result.due_date],
              ['Delay Days',         `${result.delay_days} day(s)`],
              ['Penalty Amount',     `₹${(result.penalty_amount||0).toLocaleString()}`],
              ['Penalty Outstanding',`₹${(result.penalty_outstanding||0).toLocaleString()}`],
              ['Voucher No.',        result.voucher_number],
              ['Posting Date',       result.posting_date],
              ['Type',               result.penalty_type],
            ].map(([k, v]) => (
              <div key={k} className="bg-white rounded-lg p-3 border border-emerald-100">
                <p className="text-xs text-gray-400">{k}</p>
                <p className="font-semibold text-gray-800">{v ?? '—'}</p>
              </div>
            ))}
          </div>
          <button onClick={handleReset} className="mt-3 text-sm text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Post another penalty
          </button>
        </div>
      )}

      {!result && (
        <>
          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Find Loan</h2>
            <div className="flex gap-2">
              <input
                id="penalty-loan-search"
                className={inputCls}
                placeholder="Enter loan number..."
                value={loanNumberInput}
                onChange={e => setLoanNumberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                id="penalty-search-btn"
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {searching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
          </div>

          {/* Loan + EMI Info */}
          {loan && unpaidEmi && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-500" /> Unpaid EMI Details
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Loan Number',  loan.loan_number],
                    ['EMI #',        unpaidEmi.emi_number],
                    ['Due Date',     unpaidEmi.due_date],
                    ['Installment',  `₹${(unpaidEmi.installment||0).toLocaleString()}`],
                    ['Principal Due',`₹${(unpaidEmi.principal_due||0).toLocaleString()}`],
                    ['Interest Due', `₹${(unpaidEmi.interest_due||0).toLocaleString()}`],
                    ['Status',       unpaidEmi.status],
                    ['Penalty Outstanding', `₹${parseFloat(loan.penalty_outstanding||0).toLocaleString()}`],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                      <p className="text-xs text-gray-400">{k}</p>
                      <p className="font-semibold text-gray-800 text-sm">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Penalty Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Percent className="w-4 h-4 text-rose-500" /> Penalty Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <Field label="Posting Date" required>
                    <input
                      id="penalty-posting-date"
                      type="date"
                      className={inputCls}
                      value={postingDate}
                      onChange={e => setPostingDate(e.target.value)}
                    />
                  </Field>
                  <Field label="Penalty Type" required>
                    <select id="penalty-type" className={inputCls} value={penaltyType} onChange={e => setPenaltyType(e.target.value)}>
                      <option value="daily">Daily (flat per day)</option>
                      <option value="percentage">Percentage of installment</option>
                    </select>
                  </Field>
                  <Field label={penaltyType === 'daily' ? 'Amount per Day (₹)' : 'Percentage (%)'} required>
                    <input
                      id="penalty-value"
                      type="number"
                      className={inputCls}
                      min={0}
                      value={penaltyValue}
                      onChange={e => setPenaltyValue(parseFloat(e.target.value) || 0)}
                    />
                  </Field>
                </div>

                {/* Preview */}
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Due Date</span>
                    <span className="font-semibold">{dueDate || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Posting Date</span>
                    <span className="font-semibold">{postingDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Delay Days</span>
                    <span className={`font-semibold ${delayDays > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                      {delayDays > 0 ? `${delayDays} day(s)` : 'Not overdue'}
                    </span>
                  </div>
                  <div className="border-t border-rose-200 mt-2 pt-2 flex justify-between">
                    <span className="font-bold text-rose-700">Estimated Penalty</span>
                    <span className="font-bold text-lg text-rose-700">
                      {estimatedPenalty > 0 ? `₹${estimatedPenalty.toLocaleString()}` : '₹0'}
                    </span>
                  </div>
                  {penaltyType === 'daily' && (
                    <p className="text-xs text-gray-400 mt-1">{delayDays} day(s) × ₹{penaltyValue} = ₹{estimatedPenalty}</p>
                  )}
                  {penaltyType === 'percentage' && (
                    <p className="text-xs text-gray-400 mt-1">₹{installment} × {penaltyValue}% = ₹{estimatedPenalty}</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end">
                <button onClick={handleReset} className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                  Reset
                </button>
                <button
                  id="penalty-submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting || delayDays <= 0 || estimatedPenalty <= 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Post Penalty
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PenaltyPosting;
