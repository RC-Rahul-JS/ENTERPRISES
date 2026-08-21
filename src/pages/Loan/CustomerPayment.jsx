import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  CreditCard, Search, Loader, CheckCircle, RefreshCw,
  BadgeIndianRupee, Hash, Calendar, AlertTriangle, ArrowRight,
  Wallet, ShieldCheck,
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
  const [emis, setEmis]                       = useState([]);
  const [selectedEmi, setSelectedEmi]         = useState(null);

  // Payment fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode]     = useState('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate]     = useState(today);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  // ── Compute allocation (mirrors backend logic) ───────────────────────────
  const penaltyDue   = parseFloat(loan?.penalty_outstanding || 0);
  const interestDue  = parseFloat(selectedEmi?.interest_due  || 0);
  const principalDue = parseFloat(selectedEmi?.principal_due || 0);
  const totalDue     = penaltyDue + interestDue + principalDue;
  const amount       = parseFloat(paymentAmount) || 0;

  let bal = amount;
  const penaltyPaid   = Math.min(bal, penaltyDue);   bal -= penaltyPaid;
  const interestPaid  = Math.min(bal, interestDue);  bal -= interestPaid;
  const principalPaid = Math.min(bal, principalDue); bal -= principalPaid;
  const excess        = bal;

  // ── Fetch loan + EMIs ────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!loanNumberInput.trim()) return toast.error('Enter a loan number');
    setSearching(true);
    setLoan(null);
    setEmis([]);
    setSelectedEmi(null);
    setResult(null);
    setPaymentAmount('');
    try {
      const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };

      // Fetch loan
      const loanRes = await axios.get(`${BASE_URL}/loans`, { params: { loan_number: loanNumberInput.trim() }, headers });
      const data = loanRes.data?.data || loanRes.data;
      const found = Array.isArray(data) ? data.find(l => l.loan_number === loanNumberInput.trim()) : data;
      if (!found) return toast.error('Loan not found');

      // Fetch EMI dues
      let emiList = [];
      try {
        emiList = await loanService.getEmiDues(loanNumberInput.trim());
        if (!Array.isArray(emiList)) emiList = [];
      } catch (_) { emiList = []; }

      setLoan(found);
      setEmis(emiList);

      // Auto-select first unpaid EMI
      const unpaid = emiList.find(e => e.status === 'UNPAID' || e.status === 'PARTIAL');
      if (unpaid) setSelectedEmi(unpaid);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to fetch loan');
    } finally {
      setSearching(false);
    }
  };

  // ── Submit payment ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!loan) return toast.error('Load a loan first');
    if (!selectedEmi) return toast.error('Select an EMI');
    if (amount <= 0) return toast.error('Enter a valid payment amount');
    if (excess > 0) return toast.error(`Payment exceeds total due by ₹${excess.toFixed(2)}`);

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
    setPaymentAmount(''); setPaymentMode('Cash'); setTransactionId(''); setPaymentDate(today); setResult(null);
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
              ['Payment Amount', `₹${(result.payment_amount||0).toLocaleString()}`],
              ['Principal Paid', `₹${(result.principal_paid||0).toLocaleString()}`],
              ['Interest Paid',  `₹${(result.interest_paid||0).toLocaleString()}`],
              ['Penalty Paid',   `₹${(result.penalty_paid||0).toLocaleString()}`],
              ['Remaining Principal', `₹${(result.remaining_principal||0).toLocaleString()}`],
              ['Remaining Interest',  `₹${(result.remaining_interest||0).toLocaleString()}`],
              ['EMI Status',   result.emi_status],
              ['Voucher No.',  result.voucher_number],
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
            <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Find Loan</h2>
            <div className="flex gap-2">
              <input
                id="payment-loan-search"
                className={inputCls}
                placeholder="Enter loan number..."
                value={loanNumberInput}
                onChange={e => setLoanNumberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                id="payment-search-btn"
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
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
                  <CreditCard className="w-4 h-4 text-violet-500" /> Loan Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Loan Number', loan.loan_number],
                    ['Outstanding Principal', `₹${parseFloat(loan.outstanding_principal||0).toLocaleString()}`],
                    ['Interest Outstanding',  `₹${parseFloat(loan.interest_outstanding||0).toLocaleString()}`],
                    ['Penalty Outstanding',   `₹${parseFloat(loan.penalty_outstanding||0).toLocaleString()}`],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400">{k}</p>
                      <p className="font-semibold text-gray-800 text-sm">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* EMI Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Select EMI</h2>
                {emis.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="font-semibold">No EMIs found for this loan.</p>
                    <p className="text-sm mt-1">Please ensure you have generated an EMI for this loan first using the 'Generate EMI Due' tab, or check if your backend '/emi-dues' route is working.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          {['Select','EMI #','Due Date','Installment','Principal','Interest','Status'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {emis.map((emi, i) => (
                          <tr
                            key={i}
                            onClick={() => emi.status !== 'PAID' && setSelectedEmi(emi)}
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
                            <td className="px-3 py-2">{emi.due_date}</td>
                            <td className="px-3 py-2">₹{(emi.installment||0).toLocaleString()}</td>
                            <td className="px-3 py-2">₹{(emi.principal_due||0).toLocaleString()}</td>
                            <td className="px-3 py-2">₹{(emi.interest_due||0).toLocaleString()}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                emi.status === 'PAID'    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                emi.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                           'bg-red-100 text-red-700 border-red-200'
                              }`}>{emi.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payment Form */}
              {selectedEmi && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
                  <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Payment Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                    <Field label="Payment Amount" required>
                      <input
                        id="payment-amount"
                        type="number"
                        className={inputCls}
                        placeholder={`Max: ₹${totalDue.toFixed(2)}`}
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        min={0} max={totalDue}
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
                      <input id="payment-txn-id" type="text" className={inputCls} placeholder="UTR / Reference" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
                    </Field>
                  </div>

                  {/* Allocation Breakdown */}
                  {amount > 0 && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">Payment Allocation</h3>
                      <AllocRow label="Total Due"        value={totalDue}    color="gray" />
                      <div className="border-t border-violet-200 my-2" />
                      <AllocRow label="→ Penalty Paid"   value={penaltyPaid}   color="red" />
                      <AllocRow label="→ Interest Paid"  value={interestPaid}  color="amber" />
                      <AllocRow label="→ Principal Paid" value={principalPaid} color="blue" />
                      {excess > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          Excess amount ₹{excess.toFixed(2)} — reduce payment
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
                    disabled={submitting || amount <= 0 || excess > 0}
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
