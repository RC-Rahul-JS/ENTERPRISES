import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  CreditCard, Search, Loader, CheckCircle, RefreshCw,
  BadgeIndianRupee, Hash, Calendar, AlertTriangle, ArrowRight,
  Wallet, ShieldCheck, Clock, AlertCircle, TrendingDown,
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

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white w-full";

const Field = ({ label, children, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

// ── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = 'gray', sub }) => {
  const colors = {
    gray:   'bg-gray-50 border-gray-200 text-gray-800',
    violet: 'bg-violet-50 border-violet-200 text-violet-800',
    red:    'bg-red-50 border-red-200 text-red-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`rounded-xl p-3 border ${colors[color]}`}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`font-bold text-sm ${colors[color].split(' ').pop()}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
};

// ── Allocation Row ─────────────────────────────────────────────────────────
const AllocRow = ({ label, value, color = 'gray' }) => {
  const colors = { gray: 'text-gray-700', red: 'text-red-600', amber: 'text-amber-600', blue: 'text-blue-700', green: 'text-emerald-700' };
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${colors[color]}`}>₹{(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    </div>
  );
};

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ─────────────────────────────────────────────────────────────────────────────
const CustomerPayment = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];

  // Search
  const [loanNumberInput, setLoanNumberInput] = useState('');
  const [searching, setSearching]             = useState(false);

  // API Response state
  const [summaryData, setSummaryData]   = useState(null);   // full response
  const [loan, setLoan]                 = useState(null);   // derived loan info
  const [emis, setEmis]                 = useState([]);
  const [selectedEmi, setSelectedEmi]   = useState(null);
  const [nextPayment, setNextPayment]   = useState(null);   // next_payment block

  // Payment fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode]     = useState('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate]     = useState(today);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  // ── Persistent penalty rate memory ────────────────────────────────────────
  // Once we see a valid (> 0) penalty_rate from the API, remember it forever.
  // Some date ranges make the backend return 0; we use this ref as fallback.
  const penaltyRateRef = useRef(0);

  /** Scan ALL fields in the API response for a non-zero penalty_rate */
  const extractBestPenaltyRate = (data) => {
    const candidates = [
      data?.penalty_rate,
      data?.next_payment?.penalty_rate,
      ...(data?.schedule || []).map(e => e?.penalty_rate),
    ].filter(r => typeof r === 'number' && r > 0);
    const found = candidates[0] ?? 0;
    if (found > 0) penaltyRateRef.current = found;   // update memory
    return found > 0 ? found : penaltyRateRef.current; // use memory as fallback
  };

  // ── Compute allocation ────────────────────────────────────────────────────
  const penaltyDue   = parseFloat(selectedEmi?.penalty_amount || 0);
  const interestDue  = parseFloat(selectedEmi?.interest_due   || 0);
  const principalDue = parseFloat(selectedEmi?.principal_due  || 0);
  const totalPayable = parseFloat(selectedEmi?.total_payable  || (penaltyDue + interestDue + principalDue));
  const amount       = parseFloat(paymentAmount) || 0;

  // Allocate: Penalty → Interest → Principal
  let bal = amount;
  const penaltyPaid   = Math.min(bal, penaltyDue);   bal -= penaltyPaid;
  const interestPaid  = Math.min(bal, interestDue);  bal -= interestPaid;
  const principalPaid = Math.min(bal, principalDue); bal -= principalPaid;
  // Excess = amount beyond total_payable (authoritative cap from API)
  const excess = parseFloat(Math.max(0, amount - totalPayable).toFixed(2));

  // ── Parse API response ────────────────────────────────────────────────────
  const parseResponse = (data) => {
    // Use the best available penalty_rate (incl. ref memory from past responses)
    const penaltyRate = extractBestPenaltyRate(data);
    return {
      loan_number:           data.loan_number,
      loan_status:           data.loan_status,
      penalty_rate:          penaltyRate,
      outstanding_principal: data.summary?.principal_pending ?? 0,
      interest_outstanding:  data.summary?.interest_pending  ?? 0,
      penalty_outstanding:   data.summary?.penalty_pending   ?? 0,
      total_due:             data.summary?.total_due         ?? 0,
      total_paid:            data.summary?.total_paid        ?? 0,
      total_pending:         data.summary?.total_pending     ?? 0,
      loan_amount:           data.summary?.loan_amount       ?? 0,
      paid_emi:              data.summary?.paid_emi          ?? 0,
      overdue_emi:           data.summary?.overdue_emi       ?? 0,
      unpaid_emi:            data.summary?.unpaid_emi        ?? 0,
      partial_emi:           data.summary?.partial_emi       ?? 0,
    };
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Days between two date strings (ISO). Positive = pmtDate is AFTER dueDate */
  const daysDiff = (dueDate, pmtDate) => {
    if (!dueDate || !pmtDate) return 0;
    const due = new Date(dueDate);
    const pmt = new Date(pmtDate);
    return Math.max(0, Math.floor((pmt - due) / 86400000));
  };

  /**
   * Enrich raw API data with frontend-computed delay & penalty when the API
   * returns zeros (happens when payment_date is before due date window or
   * backend does not recalculate for very late dates).
   *
   * Formula confirmed from backend sample:
   *   penalty = installment × (penalty_rate / 100) × delay_days
   *
   * penaltyRateRef holds the last non-zero rate ever seen — used as fallback.
   */
  const computeEffectiveData = (data, pmtDate) => {
    const np = data.next_payment;
    // Always call extractBestPenaltyRate so ref gets updated if new data has rate
    const penaltyRate = extractBestPenaltyRate(data);

    const enrichEmi = (emi) => {
      const computed = daysDiff(emi.due_date, pmtDate);
      // Use API delay if > 0, else compute from actual dates
      const effectiveDelay = (emi.delay_days ?? 0) > 0 ? emi.delay_days : computed;
      const installment    = emi.installment ?? 0;
      // Use emi-level rate, then global rate, then ref memory — never 0 if we ever saw the real rate
      const emiPenaltyRate = (emi.penalty_rate > 0 ? emi.penalty_rate : null)
                              ?? (penaltyRate > 0 ? penaltyRate : null)
                              ?? penaltyRateRef.current
                              ?? 0;

      // Use API penalty if > 0, else compute with best available rate
      const effectivePenalty =
        (emi.penalty_amount ?? 0) > 0
          ? emi.penalty_amount
          : effectiveDelay > 0 && emiPenaltyRate > 0
            ? parseFloat((installment * (emiPenaltyRate / 100) * effectiveDelay).toFixed(2))
            : 0;

      const effectiveTotal = effectiveDelay > 0
        ? parseFloat((installment + effectivePenalty).toFixed(2))
        : (emi.total_payable ?? installment);

      return {
        ...emi,
        delay_days:     effectiveDelay,
        penalty_amount: effectivePenalty,
        penalty_rate:   emiPenaltyRate,
        total_payable:  effectiveTotal,
        pending_amount: effectiveTotal,
        status:         emi.status === 'PAID' ? 'PAID'
                        : effectiveDelay > 0  ? 'OVERDUE' : emi.status,
      };
    };

    return {
      enrichNextPayment: np ? enrichEmi({
        emi_number:     np.emi_number,
        due_date:       np.due_date,
        installment:    np.installment ?? np.amount ?? 0,
        paid_amount:    np.paid_amount ?? 0,
        penalty_amount: np.penalty_amount ?? 0,
        penalty_rate:   np.penalty_rate ?? penaltyRate,
        total_payable:  np.total_payable ?? np.amount ?? 0,
        delay_days:     np.delay_days ?? 0,
        status:         'UNPAID',
      }) : null,
      enrichedSchedule: (data.schedule || []).map(enrichEmi),
    };
  };

  // ── Build EMI list: schedule first, else synthesise from next_payment ─────
  const buildEmiList = (data, pmtDate) => {
    const { enrichNextPayment, enrichedSchedule } = computeEffectiveData(data, pmtDate);

    // If real schedule exists, use enriched version
    if (enrichedSchedule.length > 0) return enrichedSchedule;

    // No schedule — build synthetic row from (enriched) next_payment
    const np         = data.next_payment;
    const enp        = enrichNextPayment;
    if (!np || !enp) return [];

    const summaryInterest  = data.summary?.interest_pending  ?? 0;
    const summaryPrincipal = data.summary?.principal_pending ?? 0;

    return [{
      emi_number:     enp.emi_number,
      due_date:       enp.due_date,
      installment:    enp.installment,
      interest_due:   np.interest_due  ?? summaryInterest,
      interest_paid:  0,
      paid_amount:    enp.paid_amount,
      penalty_amount: enp.penalty_amount,
      penalty_paid:   0,
      penalty_rate:   enp.penalty_rate,
      pending_amount: enp.total_payable,
      principal_due:  np.principal_due ?? summaryPrincipal,
      principal_paid: 0,
      remaining_emi:  enp.installment,
      delay_days:     enp.delay_days,
      total_payable:  enp.total_payable,
      status:         enp.delay_days > 0 ? 'OVERDUE' : 'UNPAID',
    }];
  };

  // ── Fetch loan + EMIs ─────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!loanNumberInput.trim()) return toast.error('Enter a loan number');
    setSearching(true);
    setLoan(null);
    setEmis([]);
    setSelectedEmi(null);
    setNextPayment(null);
    setSummaryData(null);
    setResult(null);
    setPaymentAmount('');
    try {
      const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };
      const res = await axios.get(
        `${BASE_URL}/customer-loan-summary/${loanNumberInput.trim()}?payment_date=${paymentDate}`,
        { headers }
      );
      const data = res.data;
      if (!data.success) return toast.error('Loan not found or failed to fetch summary');

      const { enrichNextPayment } = computeEffectiveData(data, paymentDate);

      setSummaryData(data);
      setLoan(parseResponse(data));
      setNextPayment(enrichNextPayment);         // ← enriched with computed delay/penalty

      const emiList = buildEmiList(data, paymentDate);
      setEmis(emiList);

      // Auto-select EMI matching next_payment or first unpaid
      const target  = data.next_payment?.emi_number;
      const autoEmi = target
        ? emiList.find(e => e.emi_number === target)
        : emiList.find(e => e.status !== 'PAID');
      if (autoEmi) {
        setSelectedEmi(autoEmi);
        setPaymentAmount((autoEmi.total_payable || 0).toFixed(2));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to fetch loan');
    } finally {
      setSearching(false);
    }
  };

  // ── Refresh when paymentDate changes ──────────────────────────────────────
  React.useEffect(() => {
    if (loan && loanNumberInput.trim()) {
      const refreshData = async () => {
        try {
          const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };
          const res = await axios.get(
            `${BASE_URL}/customer-loan-summary/${loanNumberInput.trim()}?payment_date=${paymentDate}`,
            { headers }
          );
          if (res.data.success) {
            const data = res.data;
            const { enrichNextPayment } = computeEffectiveData(data, paymentDate);

            setSummaryData(data);
            setLoan(parseResponse(data));
            setNextPayment(enrichNextPayment);    // ← enriched

            const emiList = buildEmiList(data, paymentDate);
            setEmis(emiList);

            if (selectedEmi) {
              const updated = emiList.find(e => e.emi_number === selectedEmi.emi_number);
              if (updated) {
                setSelectedEmi(updated);
                setPaymentAmount((updated.total_payable || 0).toFixed(2));
              }
            }
          }
        } catch (e) {
          console.error('Failed to update summary on date change', e);
        }
      };
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentDate]);

  // ── Submit payment ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!loan) return toast.error('Load a loan first');
    if (!selectedEmi) return toast.error('Select an EMI');
    if (amount <= 0) return toast.error('Enter a valid payment amount');
    if (excess > 0.01) return toast.error(`Payment exceeds total payable by ₹${excess.toFixed(2)}`);

    const confirm = await Swal.fire({
      title: 'Confirm Payment',
      html: `Receive <b>₹${amount.toLocaleString()}</b> for loan <b>${loan.loan_number}</b>, EMI #${selectedEmi.emi_number}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      confirmButtonColor: '#7c3aed',
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    showLoader();
    try {
      const payload = {
        loan_number: loan.loan_number,
        emi_number: selectedEmi.emi_number,
        payment_amount: amount,
        payment_mode: paymentMode,
        transaction_id: transactionId || undefined,
        payment_date: paymentDate,
        created_by: 'admin',
      };
      const data = await loanService.receiveCustomerPayment(payload);
      if (data.success === false) throw new Error(data.message);
      setResult(data);
      toast.success('Payment received successfully!');
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handleReset = () => {
    setLoan(null); setEmis([]); setSelectedEmi(null); setLoanNumberInput('');
    setPaymentAmount(''); setPaymentMode('Cash'); setTransactionId('');
    setPaymentDate(today); setResult(null); setSummaryData(null); setNextPayment(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-violet-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <Wallet className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Customer Payment</h1>
        </div>
        <p className="text-violet-100 text-sm">Receive EMI payments with automatic Penalty → Interest → Principal allocation</p>
      </div>

      {/* Success Banner */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-emerald-700">Payment Recorded</h2>
            {result.loan_status === 'CLOSED' && (
              <span className="ml-auto bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">LOAN CLOSED 🎉</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ['Payment Amount',      `₹${(result.payment_amount || 0).toLocaleString()}`],
              ['Principal Paid',      `₹${(result.principal_paid || 0).toLocaleString()}`],
              ['Interest Paid',       `₹${(result.interest_paid  || 0).toLocaleString()}`],
              ['Penalty Paid',        `₹${(result.penalty_paid   || 0).toLocaleString()}`],
              ['Remaining Principal', `₹${(result.remaining_principal || 0).toLocaleString()}`],
              ['Remaining Interest',  `₹${(result.remaining_interest  || 0).toLocaleString()}`],
              ['EMI Status',  result.emi_status],
              ['Voucher No.', result.voucher_number],
            ].map(([k, v]) => (
              <div key={k} className="bg-white rounded-lg p-3 border border-emerald-100">
                <p className="text-xs text-gray-400">{k}</p>
                <p className="font-semibold text-gray-800">{v ?? '—'}</p>
              </div>
            ))}
          </div>
          <button onClick={handleReset} className="mt-3 text-sm text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Process another payment
          </button>
        </div>
      )}

      {!result && (
        <>
          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-500" /> Search Loan
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Step 1 — Payment Date */}
              <div className="w-full sm:w-56">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-bold">1</span>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Payment Date <span className="text-red-500">*</span>
                  </span>
                </div>
                <input
                  id="global-payment-date"
                  type="date"
                  className={inputCls}
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {loan ? '📅 Date changed → data will refresh automatically' : 'Select date first, then search'}
                </p>
              </div>

              {/* Divider arrow */}
              <div className="hidden sm:flex items-center pb-6 text-gray-300">
                <ArrowRight className="w-5 h-5" />
              </div>

              {/* Step 2 — Loan Number */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-bold">2</span>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Loan Number</span>
                </div>
                <div className="flex gap-2">
                  <input
                    id="payment-loan-search"
                    className={inputCls}
                    placeholder="Enter loan number e.g. LN000009"
                    value={loanNumberInput}
                    onChange={e => setLoanNumberInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    id="payment-search-btn"
                    onClick={handleSearch}
                    disabled={searching || !paymentDate}
                    className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {searching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </div>
                {paymentDate && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ✓ Will fetch data for: <b>{paymentDate}</b>
                  </p>
                )}
              </div>
            </div>
          </div>

          {loan && (
            <>
              {/* ── Loan Overview ─────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-500" /> Loan Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <StatCard label="Loan Number"   value={loan.loan_number}  color="violet" />
                  <StatCard label="Loan Amount"   value={fmt(loan.loan_amount)} />
                  <StatCard label="Loan Status"   value={loan.loan_status}
                    color={loan.loan_status === 'DISBURSED' ? 'blue' : loan.loan_status === 'CLOSED' ? 'green' : 'amber'} />
                  <StatCard label="Penalty Rate"  value={`${loan.penalty_rate ?? 0}% / month`} color="red" />
                  <StatCard label="Total Pending" value={fmt(loan.total_pending)} color="red" />
                </div>

                {/* Summary rows */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <StatCard label="Principal Pending" value={fmt(loan.outstanding_principal)} color="blue" />
                  <StatCard label="Interest Pending"  value={fmt(loan.interest_outstanding)}  color="amber" />
                  <StatCard label="Penalty Pending"   value={fmt(loan.penalty_outstanding)}   color="red" />
                </div>

                {/* EMI counters */}
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <StatCard label="Paid EMIs"     value={loan.paid_emi ?? 0}    color="green" />
                  <StatCard label="Overdue EMIs"  value={loan.overdue_emi ?? 0} color="red" />
                  <StatCard label="Partial EMIs"  value={loan.partial_emi ?? 0} color="amber" />
                  <StatCard label="Unpaid EMIs"   value={loan.unpaid_emi ?? 0} />
                </div>
              </div>

              {/* ── Next Payment Due ──────────────────────────────────────── */}
              {nextPayment && (
                <div className={`rounded-2xl border-2 p-5 mb-5 ${
                  (nextPayment.delay_days ?? 0) > 0
                    ? 'bg-red-50 border-red-300'
                    : 'bg-amber-50 border-amber-300'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {(nextPayment.delay_days ?? 0) > 0
                      ? <AlertCircle className="w-5 h-5 text-red-600" />
                      : <Clock className="w-5 h-5 text-amber-600" />}
                    <h2 className={`text-sm font-bold uppercase tracking-wide ${
                      (nextPayment.delay_days ?? 0) > 0 ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {(nextPayment.delay_days ?? 0) > 0
                        ? `⚠ Overdue Payment — ${nextPayment.delay_days} day(s) late`
                        : 'Next Payment Due'}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <StatCard label="EMI #"
                      value={`# ${nextPayment.emi_number ?? '—'}`} />
                    <StatCard label="Due Date"
                      value={nextPayment.due_date ?? '—'}
                      color={(nextPayment.delay_days ?? 0) > 0 ? 'red' : 'amber'} />
                    <StatCard label="Delay Days"
                      value={`${nextPayment.delay_days ?? 0} day(s)`}
                      color={(nextPayment.delay_days ?? 0) > 0 ? 'red' : 'green'} />
                    <StatCard label="Installment"
                      value={fmt(nextPayment.installment ?? nextPayment.amount ?? 0)} />
                    <StatCard label="Penalty"
                      value={fmt(nextPayment.penalty_amount ?? 0)}
                      sub={`@ ${nextPayment.penalty_rate ?? loan?.penalty_rate ?? 0}%`}
                      color={(nextPayment.penalty_amount ?? 0) > 0 ? 'red' : 'green'} />
                    <StatCard label="Paid So Far"
                      value={fmt(nextPayment.paid_amount ?? 0)} color="green" />
                    <StatCard label="Total Payable"
                      value={fmt(nextPayment.total_payable ?? nextPayment.amount ?? 0)}
                      color="violet" />
                  </div>
                </div>
              )}

              {/* ── EMI Schedule ──────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">EMI Schedule</h2>
                {emis.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="font-semibold">No EMIs found for this loan.</p>
                    <p className="text-sm mt-1">Please check if the schedule has been generated.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          {['Sel', 'EMI #', 'Due Date', 'Delay', 'Installment', 'Principal', 'Interest', 'Penalty', 'Paid', 'Total Payable', 'Status'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {emis.map((emi, i) => (
                          <tr
                            key={i}
                            onClick={() => emi.status !== 'PAID' && (setSelectedEmi(emi), setPaymentAmount(emi.total_payable?.toFixed(2) || ''))}
                            className={`cursor-pointer transition-colors ${
                              selectedEmi?.emi_number === emi.emi_number
                                ? 'bg-violet-50 border-l-4 border-violet-500'
                                : emi.status === 'PAID' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-3 py-2">
                              <input type="radio" readOnly checked={selectedEmi?.emi_number === emi.emi_number} className="accent-violet-600" disabled={emi.status === 'PAID'} />
                            </td>
                            <td className="px-3 py-2 font-medium">{emi.emi_number}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{emi.due_date}</td>
                            <td className="px-3 py-2">
                              {emi.delay_days > 0
                                ? <span className="text-red-600 font-semibold">{emi.delay_days}d</span>
                                : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-2">{fmt(emi.installment)}</td>
                            <td className="px-3 py-2">{fmt(emi.principal_due)}</td>
                            <td className="px-3 py-2">{fmt(emi.interest_due)}</td>
                            <td className="px-3 py-2 text-red-600 font-medium">
                              {emi.penalty_amount > 0 ? fmt(emi.penalty_amount) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-2 text-emerald-700">{fmt(emi.paid_amount)}</td>
                            <td className="px-3 py-2 font-semibold text-violet-700">{fmt(emi.total_payable)}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                emi.status === 'PAID'    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                emi.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                emi.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border-red-200' :
                                                           'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>{emi.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Payment Form ──────────────────────────────────────────── */}
              {selectedEmi && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                  <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Payment Details — EMI #{selectedEmi.emi_number}</h2>

                  {/* Selected EMI quick info */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5 p-3 bg-violet-50 rounded-xl border border-violet-100">
                    <StatCard label="Due Date"     value={selectedEmi.due_date} color="violet" />
                    <StatCard label="Installment"  value={fmt(selectedEmi.installment)} />
                    <StatCard label="Penalty"      value={fmt(selectedEmi.penalty_amount)}
                      sub={`${selectedEmi.delay_days > 0 ? selectedEmi.delay_days + 'd late' : 'No delay'}`}
                      color={selectedEmi.penalty_amount > 0 ? 'red' : 'green'} />
                    <StatCard label="Paid Amount"  value={fmt(selectedEmi.paid_amount)} color="green" />
                    <StatCard label="Total Payable" value={fmt(selectedEmi.total_payable)} color="violet" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                    <Field label="Payment Amount" required>
                      <input
                        id="payment-amount"
                        type="number"
                        className={inputCls}
                        placeholder={`Max: ${fmt(totalPayable)}`}
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        min={0}
                        max={totalPayable}
                      />
                    </Field>
                    <Field label="Payment Mode" required>
                      <select id="payment-mode" className={inputCls} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </Field>
                    <Field label="Transaction ID">
                      <input id="payment-txn-id" type="text" className={inputCls} placeholder="UTR / Reference" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
                    </Field>
                  </div>

                  {/* Allocation Preview */}
                  {amount > 0 && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">Payment Allocation Preview</h3>
                      <AllocRow label="Total Payable"    value={totalPayable}  color="gray" />
                      <div className="border-t border-violet-200 my-2" />
                      <AllocRow label="→ Penalty Paid"   value={penaltyPaid}   color="red" />
                      <AllocRow label="→ Interest Paid"  value={interestPaid}  color="amber" />
                      <AllocRow label="→ Principal Paid" value={principalPaid} color="blue" />
                      <div className="border-t border-violet-200 my-2" />
                      <AllocRow label="Amount Entered"   value={amount}        color="gray" />
                      {excess > 0.01 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          Excess ₹{excess.toFixed(2)} — reduce payment to ₹{totalPayable.toFixed(2)} or less
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              {selectedEmi && (
                <div className="flex gap-3 justify-end">
                  <button onClick={handleReset} className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                    Reset
                  </button>
                  <button
                    id="payment-submit-btn"
                    onClick={handleSubmit}
                    disabled={submitting || amount <= 0 || excess > 0.01}
                    className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-md"
                  >
                    {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Receive Payment
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerPayment;
