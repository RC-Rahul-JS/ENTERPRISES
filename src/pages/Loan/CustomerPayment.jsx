import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  CreditCard, Search, Loader, CheckCircle, RefreshCw,
  BadgeIndianRupee, AlertTriangle, ArrowRight,
  Wallet, ShieldCheck, Calendar, Filter, XCircle, Info,
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

// ── Allocation Row ─────────────────────────────────────────────────────────
const AllocRow = ({ label, value, color = 'gray' }) => {
  const colors = { gray: 'text-gray-700', red: 'text-red-600', amber: 'text-amber-600', blue: 'text-blue-700', green: 'text-emerald-700' };
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${colors[color]}`}>₹{(value||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = {
    PAID:    { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-3 h-3" /> },
    PARTIAL: { bg: 'bg-amber-100 text-amber-700 border-amber-200',       icon: <Info className="w-3 h-3" /> },
    UNPAID:  { bg: 'bg-red-100 text-red-700 border-red-200',             icon: <XCircle className="w-3 h-3" /> },
  };
  const c = cfg[status] || cfg.UNPAID;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${c.bg}`}>
      {c.icon} {status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const CustomerPayment = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];

  // Search
  const [loanNumberInput, setLoanNumberInput] = useState('');
  const [searching, setSearching]             = useState(false);
  const [loan, setLoan]                       = useState(null);
  const [summary, setSummary]                 = useState(null);
  const [allEmis, setAllEmis]                 = useState([]);
  const [selectedEmi, setSelectedEmi]         = useState(null);

  // Filters
  const [showAll, setShowAll]       = useState(false);
  const [filterDate, setFilterDate] = useState('');

  // Payment fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode]     = useState('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate]     = useState(today);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  // Filtered EMI list
  const displayedEmis = allEmis.filter(e => {
    const statusOk = showAll ? true : (e.status === 'UNPAID' || e.status === 'PARTIAL');
    const dateOk   = filterDate ? e.due_date === filterDate : true;
    return statusOk && dateOk;
  });

  // Compute allocation
  const penaltyDue   = parseFloat(selectedEmi?.penalty_due || 0);
  const interestDue  = parseFloat(selectedEmi?.interest_due  || 0);
  const principalDue = parseFloat(selectedEmi?.principal_due || 0);
  const totalDue     = penaltyDue + interestDue + principalDue;
  const amount       = parseFloat(paymentAmount) || 0;

  let bal = amount;
  const penaltyPaid   = Math.min(bal, penaltyDue);   bal -= penaltyPaid;
  const interestPaid  = Math.min(bal, interestDue);  bal -= interestPaid;
  const principalPaid = Math.min(bal, principalDue); bal -= principalPaid;
  const excess        = bal;

  // Fetch loan + EMIs
  const handleSearch = async () => {
    if (!loanNumberInput.trim()) return toast.error('Enter a loan number');
    setSearching(true);
    setLoan(null);
    setAllEmis([]);
    setSelectedEmi(null);
    setResult(null);
    setPaymentAmount('');
    setFilterDate('');
    setShowAll(false);
    try {
      const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };
      const loanRes = await axios.get(`${BASE_URL}/loans`, { params: { loan_number: loanNumberInput.trim() }, headers });
      const data = loanRes.data?.data || loanRes.data;
      const found = Array.isArray(data) ? data.find(l => l.loan_number === loanNumberInput.trim()) : data;
      if (!found || !found.loan_number) {
        toast.error('Loan not found for this loan number');
        return;
      }

      let emiList = [];
      try {
        emiList = await loanService.getEmiDues(loanNumberInput.trim());
        if (!Array.isArray(emiList)) emiList = [];
      } catch (_) { emiList = []; }

      let sumData = null;
      try {
        const sumRes = await loanService.getCustomerLoanSummary(loanNumberInput.trim());
        sumData = sumRes.summary || null;
      } catch (_) {}

      setLoan(found);
      setSummary(sumData);
      setAllEmis(emiList);

      // Auto-select first UNPAID/PARTIAL and pre-fill amount
      const pending = emiList.find(e => e.status === 'UNPAID' || e.status === 'PARTIAL' || e.status === 'OVERDUE');
      if (pending) {
        setSelectedEmi(pending);
        const pen  = parseFloat(pending.penalty_due || 0);
        const intr = parseFloat(pending.interest_due || 0);
        const prin = parseFloat(pending.principal_due || 0);
        setPaymentAmount(String((pen + intr + prin).toFixed(2)));
      }

      if (emiList.length === 0) {
        toast.error('No EMI records found. Please generate an EMI due first from the \'Generate EMI Due\' section.');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to fetch loan details');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectEmi = (emi) => {
    if (emi.status === 'PAID') return;
    setSelectedEmi(emi);
    setResult(null);
    const pen  = parseFloat(emi.penalty_due || 0);
    const intr = parseFloat(emi.interest_due || 0);
    const prin = parseFloat(emi.principal_due || 0);
    setPaymentAmount(String((pen + intr + prin).toFixed(2)));
  };

  // Submit payment
  const handleSubmit = async () => {
    if (!loan)        return toast.error('Load a loan first');
    if (!selectedEmi) return toast.error('Select an EMI to pay');
    if (amount <= 0)  return toast.error('Enter a valid payment amount');
    if (excess > 0)   return toast.error(`Payment exceeds total due by ₹${excess.toFixed(2)}`);

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
        loan_number:    loan.loan_number,
        emi_number:     selectedEmi.emi_number,
        payment_amount: amount,
        payment_mode:   paymentMode,
        transaction_id: transactionId || undefined,
        payment_date:   paymentDate,
        created_by:     'admin',
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
    setLoan(null); setSummary(null); setAllEmis([]); setSelectedEmi(null); setLoanNumberInput('');
    setPaymentAmount(''); setPaymentMode('Cash'); setTransactionId('');
    setPaymentDate(today); setResult(null); setFilterDate(''); setShowAll(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-violet-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <Wallet className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Customer Payment</h1>
        </div>
        <p className="text-violet-100 text-sm">
          Search by Loan Number &rarr; Select EMI Due Date &rarr; Receive Payment
        </p>
      </div>

      {/* Success Banner */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-emerald-700">Payment Recorded Successfully</h2>
            {result.loan_status === 'CLOSED' && (
              <span className="ml-auto bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">LOAN CLOSED 🎉</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ['Payment Amount',      `₹${(result.payment_amount      || 0).toLocaleString()}`],
              ['Principal Paid',      `₹${(result.principal_paid      || 0).toLocaleString()}`],
              ['Interest Paid',       `₹${(result.interest_paid       || 0).toLocaleString()}`],
              ['Penalty Paid',        `₹${(result.penalty_paid        || 0).toLocaleString()}`],
              ['Remaining Principal', `₹${(result.remaining_principal || 0).toLocaleString()}`],
              ['Remaining Interest',  `₹${(result.remaining_interest  || 0).toLocaleString()}`],
              ['EMI Status',          result.emi_status],
              ['Voucher No.',         result.voucher_number],
            ].map(([k, v]) => (
              <div key={k} className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
                <p className="text-xs text-gray-400 uppercase font-medium">{k}</p>
                <p className="font-semibold text-gray-800">{v ?? '—'}</p>
              </div>
            ))}
          </div>
          <button onClick={handleReset} className="mt-4 text-sm text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 transition">
            <RefreshCw className="w-4 h-4" /> Process another payment
          </button>
        </div>
      )}

      {!result && (
        <>
          {/* Step 1: Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-500" />
              Step 1 — Find Loan by Loan Number
            </h2>
            <div className="flex gap-2">
              <input
                id="payment-loan-search"
                className={inputCls}
                placeholder="Enter loan number (e.g. LN-001)..."
                value={loanNumberInput}
                onChange={e => setLoanNumberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                id="payment-search-btn"
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {searching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
          </div>

          {loan && (
            <>
              {/* Loan Overview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-500" /> Loan Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Loan Number',          loan.loan_number],
                    ['Customer Name',        loan.customer_name || 'N/A'],
                    ['Loan Status',          loan.loan_status],
                    ['Installment',          `₹${parseFloat(loan.installment || 0).toLocaleString()}`],
                    ['Total Paid',           `₹${parseFloat(summary?.total_paid || 0).toLocaleString()}`],
                    ['Total Pending',        `₹${parseFloat(summary?.total_pending || 0).toLocaleString()}`],
                    ['Overdue EMIs',         summary?.overdue_emi || 0],
                    ['Unpaid EMIs',          summary?.unpaid_emi || 0],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 uppercase font-medium">{k}</p>
                      <p className="font-semibold text-gray-800 text-sm">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: EMI List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    Step 2 — Select EMI to Pay
                    <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-bold ml-1">
                      {allEmis.length} EMI{allEmis.length !== 1 ? 's' : ''} total
                    </span>
                  </h2>
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                      <Filter className="w-3.5 h-3.5 text-gray-400" />
                      <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Filter Due Date:</label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="text-xs border-none outline-none bg-transparent text-gray-700 font-medium"
                      />
                      {filterDate && (
                        <button onClick={() => setFilterDate('')} className="text-gray-400 hover:text-red-500 transition ml-1">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowAll(v => !v)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                        showAll
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {showAll ? 'Showing All' : 'Show Paid Also'}
                    </button>
                  </div>
                </div>

                {allEmis.length === 0 ? (
                  <div className="text-center py-10 bg-amber-50 border border-amber-200 rounded-xl">
                    <Calendar className="w-10 h-10 mx-auto text-amber-400 mb-3" />
                    <p className="font-bold text-amber-700">No EMI records found for this loan.</p>
                    <p className="text-sm mt-1 text-amber-600 max-w-md mx-auto">
                      Please generate an EMI due first using the <b>&ldquo;Generate EMI Due&rdquo;</b> section, then come back here.
                    </p>
                  </div>
                ) : displayedEmis.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="font-semibold text-gray-500">No EMIs match your filter.</p>
                    <button onClick={() => { setFilterDate(''); setShowAll(true); }} className="mt-2 text-sm text-violet-600 hover:underline">Clear filters</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-[#3B3C6E] text-white text-xs uppercase tracking-wider">
                        <tr>
                          {['Select', 'EMI #', 'Due Date', 'Installment', 'Principal Due', 'Interest Due', 'Penalty Due', 'Status'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {displayedEmis.map((emi, i) => {
                          const isSelected = selectedEmi?.emi_number === emi.emi_number;
                          const isPaid     = emi.status === 'PAID';
                          return (
                            <tr
                              key={i}
                              onClick={() => handleSelectEmi(emi)}
                              className={`transition-colors ${
                                isPaid
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                  : isSelected
                                  ? 'bg-violet-50 border-l-4 border-l-violet-500 cursor-pointer'
                                  : 'hover:bg-gray-50 cursor-pointer'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <input type="radio" readOnly checked={isSelected} disabled={isPaid} className="accent-violet-600 w-4 h-4" />
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-800">#{emi.emi_number}</td>
                              <td className="px-4 py-3 font-medium text-gray-700">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  {emi.due_date}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold">₹{(emi.installment || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-blue-700 font-semibold">₹{(emi.principal_due || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-amber-700 font-semibold">₹{(emi.interest_due || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-red-700 font-semibold">₹{(emi.penalty_due || 0).toLocaleString()}</td>
                              <td className="px-4 py-3"><StatusBadge status={emi.status} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 3: Payment Form */}
              {selectedEmi && (
                <div className="bg-white rounded-2xl shadow-sm border border-violet-200 p-5 mb-5">
                  <h2 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-2">
                    <BadgeIndianRupee className="w-4 h-4 text-violet-500" />
                    Step 3 — Payment for EMI #{selectedEmi.emi_number}
                  </h2>
                  <p className="text-xs text-gray-500 mb-4 flex items-center gap-2 flex-wrap">
                    Due Date: <span className="font-semibold text-gray-700">{selectedEmi.due_date}</span>
                    <span className="text-gray-300">|</span>
                    <StatusBadge status={selectedEmi.status} />
                  </p>

                  {/* Due Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: 'Penalty Due',   value: penaltyDue,   cls: 'bg-red-50 border-red-200 text-red-700' },
                      { label: 'Interest Due',  value: interestDue,  cls: 'bg-amber-50 border-amber-200 text-amber-700' },
                      { label: 'Principal Due', value: principalDue, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
                        <p className="text-xs font-semibold uppercase opacity-70">{label}</p>
                        <p className="text-lg font-bold mt-0.5">₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                    <Field label="Payment Amount" required>
                      <input
                        id="payment-amount"
                        type="number"
                        className={inputCls}
                        placeholder={`Total Due: ₹${totalDue.toFixed(2)}`}
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        min={0} max={totalDue} step="0.01"
                      />
                    </Field>
                    <Field label="Payment Mode" required>
                      <select id="payment-mode" className={inputCls} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </Field>
                    <Field label="Payment Date" required>
                      <input id="payment-date" type="date" className={inputCls} value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </Field>
                    <Field label="Transaction ID">
                      <input id="payment-txn-id" type="text" className={inputCls} placeholder="UTR / Reference (optional)" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
                    </Field>
                  </div>

                  {/* Allocation Preview */}
                  {amount > 0 && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-5">
                      <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">Payment Allocation Preview</h3>
                      <AllocRow label="Total Due"        value={totalDue}     color="gray" />
                      <AllocRow label="Amount Entered"   value={amount}       color="green" />
                      <div className="border-t border-violet-200 my-2" />
                      <AllocRow label="→ Penalty Paid"   value={penaltyPaid}   color="red" />
                      <AllocRow label="→ Interest Paid"  value={interestPaid}  color="amber" />
                      <AllocRow label="→ Principal Paid" value={principalPaid} color="blue" />
                      {excess > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          Excess ₹{excess.toFixed(2)} — please reduce the payment amount
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    <button onClick={handleReset} className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
                      Reset
                    </button>
                    <button
                      id="payment-submit-btn"
                      onClick={handleSubmit}
                      disabled={submitting || amount <= 0 || excess > 0}
                      className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-md"
                    >
                      {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      Receive Payment
                    </button>
                  </div>
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
