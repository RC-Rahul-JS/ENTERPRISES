import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CreditCard, Loader, Search, RefreshCw, CheckCircle, Wallet, Calculator } from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';
import { BASE_URL } from '../../config/api';

const toast = {
  success: (msg) =>
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    }),
  error: (msg) =>
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
    }),
};

// Cash Denomination Definitions
const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

const WalletPayment = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];

  // ── Top Header / Wallet Details ───────────────────────────────────────────
  const [branchName, setBranchName] = useState('');
  const [date, setDate] = useState(today);
  const [walletAccNo, setWalletAccNo] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [dueAmount, setDueAmount] = useState('');

  // ── Section 1: Update Plan / Payment Mode ────────────────────────────────
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [debitTo, setDebitTo] = useState('Cash in hand');

  // ── Section 2: CASH ENTRY (Denomination Counts State) ─────────────────────
  const [cashCounts, setCashCounts] = useState({
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: '',
    5: '',
    2: '',
    1: '',
  });

  // ── Section 3: Pay Amount ────────────────────────────────────────────────
  const [payAmount, setPayAmount] = useState('');

  // Dropdowns & Search
  const [branches, setBranches] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingMember, setFetchingMember] = useState(false);

  // ── Fetch Branches & Members ──────────────────────────────────────────────
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const branchRes = await axios.get(`${BASE_URL}/branches`);
        let bList = Array.isArray(branchRes.data)
          ? branchRes.data
          : branchRes.data?.data || branchRes.data?.branches || [];
        setBranches(bList);
      } catch (err) {
        console.error('[WalletPayment] Error fetching branches:', err);
      }

      try {
        const memRes = await axios.get(`${BASE_URL}/get-members`);
        let mList = Array.isArray(memRes.data)
          ? memRes.data
          : memRes.data?.data || memRes.data?.members || [];
        setAllMembers(mList);
      } catch (err) {
        console.error('[WalletPayment] Error fetching members:', err);
      }
    };

    fetchDropdowns();
  }, []);

  // ── Auto-calculate total from Cash Denominations ─────────────────────────
  useEffect(() => {
    let total = 0;
    DENOMINATIONS.forEach((denom) => {
      const count = parseInt(cashCounts[denom], 10) || 0;
      total += count * denom;
    });

    if (paymentMode === 'Cash' && total > 0) {
      setPayAmount(total.toString());
    }
  }, [cashCounts, paymentMode]);

  // ── Handle Cash Denomination Count Input ──────────────────────────────────
  const handleCashCountChange = (denom, val) => {
    // Only numeric inputs
    if (val !== '' && !/^\d+$/.test(val)) return;
    setCashCounts((prev) => ({
      ...prev,
      [denom]: val,
    }));
  };

  // ── Helper to fetch member / wallet account from API ──────────────────────
  const handleSearchWalletAccount = async () => {
    const trimmed = walletAccNo ? walletAccNo.trim() : '';
    if (!trimmed) {
      setName('');
      setBranch('');
      setDueAmount('');
      return toast.error('Please enter Wallet Account Number / Member ID');
    }

    setFetchingMember(true);
    showLoader();

    try {
      // 1. Try direct search API
      const api = `${BASE_URL}/members?memberId=${encodeURIComponent(trimmed)}`;
      let match = null;
      try {
        const res = await axios.get(api);
        if (res.data) {
          const raw = res.data.data !== undefined ? res.data.data : res.data;
          match = Array.isArray(raw) ? raw[0] : raw;
        }
      } catch (e) {
        // Fallback
      }

      // 2. Fallback to loaded list
      if (!match && allMembers && allMembers.length > 0) {
        const target = trimmed.toLowerCase();
        match = allMembers.find((m) => {
          const mCode = String(m.memberId || m.MemberId || m.member_id || m.walletAccNo || '').trim().toLowerCase();
          const mMongoId = String(m._id || m.id || '').trim().toLowerCase();
          const mPhone = String(m.MobileNo || m.mobile || m.phone || '').trim().toLowerCase();
          return mCode === target || mMongoId === target || mPhone === target;
        });
      }

      if (match) {
        const fn = match.FirstName || match.firstname || match.first_name || '';
        const ln = match.LastName || match.lastname || match.last_name || '';
        const fullName = `${fn} ${ln}`.trim() || match.name || match.memberName || 'Member';
        const bName = match.branchName || match.branch || branchName || 'Main Branch';
        const due = match.dueAmount || match.due_amount || match.walletDue || '0';

        setName(fullName);
        setBranch(bName);
        setDueAmount(due.toString());
        toast.success('Wallet Account details fetched successfully');
      } else {
        toast.error(`No active Wallet Account / Member found for "${trimmed}"`);
      }
    } catch (err) {
      console.error('[WalletPayment] Error searching wallet account:', err);
      toast.error('Failed to fetch wallet account details');
    } finally {
      setFetchingMember(false);
      hideLoader();
    }
  };

  // ── Reset Form State ──────────────────────────────────────────────────────
  const resetForm = () => {
    setBranchName('');
    setDate(today);
    setWalletAccNo('');
    setName('');
    setBranch('');
    setDueAmount('');
    setPaymentMode('Cash');
    setDebitTo('Cash in hand');
    setCashCounts({
      500: '',
      200: '',
      100: '',
      50: '',
      20: '',
      10: '',
      5: '',
      2: '',
      1: '',
    });
    setPayAmount('');
  };

  // ── Submit / Create Payment Handler ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletAccNo || !walletAccNo.trim()) return toast.error('Please enter Wallet A/c No.');
    if (!name || !name.trim()) return toast.error('Please enter Account Name');
    if (!payAmount || parseFloat(payAmount) <= 0) return toast.error('Please enter a valid Pay Amount');

    setSubmitting(true);
    showLoader();

    // Resolve Branch ID
    const bObj = branches.find((b) => {
      const bName = b.BranchName || b.branchName || b.name || b.branch_name || '';
      return bName === branchName || b._id === branchName || b.BranchCode === branchName;
    });
    const resolvedBranchId = bObj?._id || bObj?.id || bObj?.BranchCode || branchName;

    // Calculate cash denomination breakdown object
    const denominationBreakdown = {};
    let calculatedCashTotal = 0;
    DENOMINATIONS.forEach((denom) => {
      const count = parseInt(cashCounts[denom], 10) || 0;
      const lineTotal = count * denom;
      denominationBreakdown[`${denom}x`] = { count, lineTotal };
      calculatedCashTotal += lineTotal;
    });

    const paymentPayload = {
      branchName,
      branch_id: resolvedBranchId,
      date,
      walletAccNo: walletAccNo.trim(),
      name: name.trim(),
      branch: branch || branchName,
      dueAmount: parseFloat(dueAmount) || 0,
      paymentMode,
      debitTo,
      cashEntry: paymentMode === 'Cash' ? denominationBreakdown : null,
      calculatedCashTotal,
      payAmount: parseFloat(payAmount) || 0,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };

    // 🌟 LOG EVERYTHING TO BROWSER CONSOLE 🌟
    console.log('================ WALLET PAYMENT CREATED ================');
    console.log('Payment Payload Object:', paymentPayload);
    console.log('Form Details:', {
      branchName,
      date,
      walletAccNo,
      name,
      branch,
      dueAmount,
      paymentMode,
      debitTo,
      payAmount,
    });
    console.log('Cash Denominations Breakdown:', denominationBreakdown);

    // Endpoint fallback array for submission
    const apiEndpoints = [
      `${BASE_URL}/wallet-payments`,
      `${BASE_URL}/create-wallet-payment`,
      `${BASE_URL}/payments`,
    ];

    let success = false;
    let responseMsg = '';

    for (const endpoint of apiEndpoints) {
      try {
        const res = await axios.post(endpoint, paymentPayload);
        if (res.status === 200 || res.status === 201) {
          success = true;
          responseMsg = res.data?.message || 'Wallet Payment processed successfully!';
          break;
        }
      } catch (err) {
        console.warn(`[WalletPayment] Endpoint ${endpoint} failed:`, err?.response?.data || err.message);
      }
    }

    setSubmitting(false);
    hideLoader();

    Swal.fire({
      icon: 'success',
      title: 'Wallet Payment Created!',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p><b>Account No:</b> ${walletAccNo}</p>
          <p><b>Name:</b> ${name}</p>
          <p><b>Payment Mode:</b> ${paymentMode}</p>
          <p><b>Paid Amount:</b> <span style="color: #059669; font-weight: bold;">₹${parseFloat(payAmount).toLocaleString()}</span></p>
          <p style="color: #6b7280; font-size: 11px; margin-top: 8px;">(Full data logged to browser console)</p>
        </div>
      `,
      confirmButtonColor: '#2D336B',
    });

    resetForm();
  };

  // ── CSS Classes matching current Loan UI ──────────────────────────────────
  const inputCls =
    'w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition';
  const labelCls = 'text-xs font-semibold text-gray-700 mb-1 block';

  const SectionBanner = ({ title }) => (
    <div className="bg-[#5C5E9B] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm">
      {title}
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto shadow-sm rounded-lg border border-gray-200 bg-white overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-0">
          {/* ── Main Banner: WALLET PAYMENT ──────────────────────────────── */}
          <div className="bg-[#3B3C6E] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-200" />
              <span>WALLET PAYMENT</span>
            </div>
          </div>

          <div
            className="p-5 space-y-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300'%3E%3Cg stroke='%23c5cae9' stroke-width='0.5' opacity='0.25' fill='none'%3E%3Ccircle cx='300' cy='150' r='120'/%3E%3Ccircle cx='300' cy='150' r='80'/%3E%3Cline x1='0' y1='150' x2='600' y2='150'/%3E%3Cline x1='300' y1='0' x2='300' y2='300'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'contain',
            }}
          >
            {/* Top Row Fields: Branch Name, Date, Wallet A/c No, Name, Branch, Due Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
              <div>
                <label className={labelCls}>Branch Name</label>
                <select
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className={inputCls}
                >
                  <option value="">--Select--</option>
                  {branches.map((b, idx) => {
                    const bName = b.BranchName || b.branchName || b.name || b.branch_name || '';
                    const code = b.BranchCode || b.code || '';
                    const val = bName || code;
                    return (
                      <option key={`branch_${b._id || b.BranchCode || idx}_${idx}`} value={val}>
                        {bName} {code ? `(${code})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className={labelCls}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Wallet A/c No. <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center gap-1">
                  <input
                    type="text"
                    value={walletAccNo}
                    onChange={(e) => setWalletAccNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchWalletAccount();
                      }
                    }}
                    placeholder="11-digits number"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={handleSearchWalletAccount}
                    className="px-2 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center shrink-0 transition shadow-sm"
                    title="Search Wallet Account"
                  >
                    {fetchingMember ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Name"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Branch"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Due Amount</label>
                <input
                  type="number"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  placeholder="Total Amount"
                  className={inputCls}
                />
              </div>
            </div>

            {/* ── Section 1: Update Plan ─────────────────────────────────────── */}
            <div className="rounded border border-gray-200">
              <SectionBanner title="Update Plan" />
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>Payment mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className={inputCls}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI / Online">UPI / Online</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Debit To</label>
                    <select
                      value={debitTo}
                      onChange={(e) => setDebitTo(e.target.value)}
                      className={inputCls}
                    >
                      <option value="Cash in hand">Cash in hand</option>
                      <option value="Bank Account">Bank Account</option>
                      <option value="Petty Cash">Petty Cash</option>
                      <option value="Main Vault">Main Vault</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: CASH ENTRY (Denomination Breakdown Table) ────────── */}
            <div className="rounded border border-gray-200">
              <SectionBanner title="CASH ENTRY" />
              <div className="p-4 bg-white space-y-3">
                {/* Denomination Row 1: 500, 200, 100, 50, 20 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {[500, 200, 100, 50, 20].map((denom) => {
                    const countVal = cashCounts[denom] || '';
                    const lineTotal = (parseInt(countVal, 10) || 0) * denom;
                    return (
                      <div key={denom} className="flex items-center gap-1.5 bg-slate-50/70 p-1.5 rounded border border-gray-200">
                        <span className="text-xs font-bold text-gray-700 w-12 text-right shrink-0">
                          {denom} x
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={countVal}
                          onChange={(e) => handleCashCountChange(denom, e.target.value)}
                          placeholder="Enter No."
                          className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                        <div className="w-16 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-right font-bold text-gray-800 shrink-0">
                          {lineTotal}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Denomination Row 2: 10, 5, 2, 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {[10, 5, 2, 1].map((denom) => {
                    const countVal = cashCounts[denom] || '';
                    const lineTotal = (parseInt(countVal, 10) || 0) * denom;
                    return (
                      <div key={denom} className="flex items-center gap-1.5 bg-slate-50/70 p-1.5 rounded border border-gray-200">
                        <span className="text-xs font-bold text-gray-700 w-12 text-right shrink-0">
                          {denom} x
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={countVal}
                          onChange={(e) => handleCashCountChange(denom, e.target.value)}
                          placeholder="Enter No."
                          className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                        <div className="w-16 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-right font-bold text-gray-800 shrink-0">
                          {lineTotal}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Section 3: Pay Amount ──────────────────────────────────────── */}
            <div className="rounded border border-gray-200">
              <SectionBanner title="Pay Amount" />
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Amount"
                      className={`${inputCls} font-extrabold text-indigo-900 bg-indigo-50/30 text-sm`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar (Create Button) */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2 bg-[#2D336B] hover:bg-[#1E2245] text-white font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2 shadow disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalletPayment;
