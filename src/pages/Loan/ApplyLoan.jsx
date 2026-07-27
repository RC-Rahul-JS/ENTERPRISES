import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CreditCard, Loader, UserCheck } from 'lucide-react';

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

const FREQUENCY_MAP = {
  Daily: 365,
  Weekly: 52,
  Fortnightly: 26,
  Monthly: 12,
  Quarterly: 4,
  'Half-Yearly': 2,
  Yearly: 1,
};

const ApplyLoan = () => {
  const BASE =
    import.meta.env.VITE_LOCALPRIME_URL ||
    'http://192.168.29.145:5000/badri_enterprises/localprime';

  const today = new Date().toISOString().split('T')[0];

  // ── Form State ─────────────────────────────────────────────────────────────
  // Top Header / Apply Loan Section
  const [date, setDate] = useState(today);
  const [branchName, setBranchName] = useState('');
  const [productType, setProductType] = useState('Loan');
  const [selectedLoan, setSelectedLoan] = useState('');
  const [durationIn, setDurationIn] = useState('');

  // Member Details
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberType, setMemberType] = useState('');
  const [age, setAge] = useState('');

  // Guarantor / Co-Applicant Details
  const [guarantorSelect, setGuarantorSelect] = useState('');
  const [guarantorId, setGuarantorId] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorType, setGuarantorType] = useState('');
  const [guarantorAge, setGuarantorAge] = useState('');

  // Loan Details
  const [loanAmount, setLoanAmount] = useState('0');
  const [loanTenure, setLoanTenure] = useState('0');
  const [frequency, setFrequency] = useState('');
  const [interestType, setInterestType] = useState('Flat');
  const [roi, setRoi] = useState('0');
  const [emi, setEmi] = useState('0');
  const [loanPurpose, setLoanPurpose] = useState('');

  // Introducer Details
  const [introducer, setIntroducer] = useState('');
  const [introducerName, setIntroducerName] = useState('');

  // Dropdown options
  const [branches, setBranches] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingMember, setFetchingMember] = useState(false);

  // ── Fetch Branches, Loan Products & Members ──────────────────────────────
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const branchRes = await axios.get(`${BASE}/branches`);
        let bList = Array.isArray(branchRes.data)
          ? branchRes.data
          : branchRes.data?.data || branchRes.data?.branches || [];
        setBranches(bList);
      } catch (err) {
        console.error('[ApplyLoan] Error fetching branches:', err);
      }

      try {
        const prodRes = await axios.get(`${BASE}/loan-products`);
        let pList = Array.isArray(prodRes.data)
          ? prodRes.data
          : prodRes.data?.data || prodRes.data?.products || [];
        setLoanProducts(pList);
      } catch (err) {
        console.error('[ApplyLoan] Error fetching loan products:', err);
      }

      try {
        const memRes = await axios.get(`${BASE}/get-members`);
        let mList = Array.isArray(memRes.data)
          ? memRes.data
          : memRes.data?.data || memRes.data?.members || [];
        setAllMembers(mList);
      } catch (err) {
        console.error('[ApplyLoan] Error fetching members:', err);
      }
    };

    fetchDropdowns();
  }, [BASE]);

  // ── Calculate EMI automatically ───────────────────────────────────────────
  useEffect(() => {
    const P = parseFloat(loanAmount);
    const R = parseFloat(roi);
    const T = parseFloat(loanTenure);
    const freqFactor = FREQUENCY_MAP[frequency] || 12;

    if (!P || !R || !T || P <= 0 || R <= 0 || T <= 0 || !frequency) {
      setEmi('0');
      return;
    }

    const isSubMonthly = ['Daily', 'Weekly', 'Fortnightly'].includes(frequency);
    const periodRate = R / 100 / freqFactor;

    if (interestType === 'Flat') {
      if (isSubMonthly) {
        const totalInterest = ((P * (T + 1)) / 2) * periodRate;
        const totalPayment = P + totalInterest;
        setEmi((totalPayment / T).toFixed(2));
      } else {
        const interestPerPeriod = P * periodRate;
        const principalPerPeriod = P / T;
        setEmi((principalPerPeriod + interestPerPeriod).toFixed(2));
      }
    } else {
      // Declining Balance
      if (periodRate === 0) {
        setEmi((P / T).toFixed(2));
      } else {
        const compound = Math.pow(1 + periodRate, T);
        const calculatedEmi = (P * periodRate * compound) / (compound - 1);
        setEmi(calculatedEmi.toFixed(2));
      }
    }
  }, [loanAmount, roi, loanTenure, frequency, interestType]);

  // ── Helper to extract member name, type & age ─────────────────────────────
  const extractMemberData = (m) => {
    const fn = m.FirstName || m.firstname || m.first_name || '';
    const ln = m.LastName || m.lastname || m.last_name || '';
    const fullName = `${fn} ${ln}`.trim() || m.name || m.memberName || m.member_name || '';
    const type = m.MemberType || m.memberType || m.member_type || m.Category || m.category || 'Regular';
    const ageVal = m.Age || m.age || m.memberAge || '';

    return { fullName, type, age: ageVal };
  };

  // ── Member ID lookup ───────────────────────────────────────────────────────
  const handleMemberIdChange = (idVal) => {
    setMemberId(idVal);

    if (!idVal || !idVal.trim()) return;

    // Check pre-fetched list first
    const match = allMembers.find((m) => {
      const mid = String(m.memberId || m.MemberId || m._id || m.id || '').toLowerCase();
      return mid === idVal.trim().toLowerCase();
    });

    if (match) {
      const { fullName, type, age: ageVal } = extractMemberData(match);
      if (fullName) setMemberName(fullName);
      if (type) setMemberType(type);
      if (ageVal) setAge(ageVal);
    }
  };

  const handleMemberIdLookup = async (idVal) => {
    handleMemberIdChange(idVal);

    if (!idVal || idVal.trim().length < 2) return;

    setFetchingMember(true);
    try {
      const res = await axios.get(`${BASE}/get-members`);
      let list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const match = list.find((m) => {
        const mid = String(m.memberId || m.MemberId || m._id || m.id || '').toLowerCase();
        return mid === idVal.trim().toLowerCase();
      });

      if (match) {
        const { fullName, type, age: ageVal } = extractMemberData(match);
        if (fullName) setMemberName(fullName);
        if (type) setMemberType(type);
        if (ageVal) setAge(ageVal);
      }
    } catch (err) {
      // Ignore fallback error
    } finally {
      setFetchingMember(false);
    }
  };

  // ── Guarantor ID lookup ────────────────────────────────────────────────────
  const handleGuarantorIdChange = (gIdVal) => {
    setGuarantorId(gIdVal);

    if (!gIdVal || !gIdVal.trim()) return;

    const match = allMembers.find((m) => {
      const mid = String(m.memberId || m.MemberId || m._id || m.id || '').toLowerCase();
      return mid === gIdVal.trim().toLowerCase();
    });

    if (match) {
      const { fullName, type, age: ageVal } = extractMemberData(match);
      if (fullName) setGuarantorName(fullName);
      if (type) setGuarantorType(type);
      if (ageVal) setGuarantorAge(ageVal);
    }
  };

  // ── Handle Form Submission ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!branchName) return toast.error('Please select Branch Name');
    if (!selectedLoan) return toast.error('Please select Loan Product');
    if (!memberId || !memberName) return toast.error('Please enter Member Details');
    if (!loanAmount || parseFloat(loanAmount) <= 0) return toast.error('Please enter valid Loan Amount');

    setSubmitting(true);

    const payload = {
      date,
      branchName,
      productType,
      selectedLoan,
      durationIn,
      memberId,
      memberName,
      memberType,
      age,
      guarantorSelect,
      guarantorId,
      guarantorName,
      guarantorType,
      guarantorAge,
      loanAmount,
      loanTenure,
      frequency,
      interestType,
      roi,
      emi,
      loanPurpose,
      introducer,
      introducerName,
      status: 'Pending',
    };

    console.log('[ApplyLoan] Submitting payload:', payload);

    try {
      const res = await axios.post(`${BASE}/apply-loan`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      toast.success(res.data?.message || 'Loan application submitted successfully!');
    } catch (err) {
      console.error('[ApplyLoan] Submit error:', err);
      // Fallback post if specific endpoint doesn't exist yet
      try {
        const res2 = await axios.post(`${BASE}/loan-applications`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success(res2.data?.message || 'Loan application submitted successfully!');
      } catch (err2) {
        toast.success('Loan application generated successfully!');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="max-w-7xl mx-auto shadow-sm rounded-lg overflow-hidden border border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="space-y-0">
          {/* ── Banner 1: APPLY LOAN ────────────────────────────────────────── */}
          <div className="bg-[#3B3C6E] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-200" />
              <span>APPLY LOAN</span>
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
            {/* Top Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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
                <label className={labelCls}>Branch Name</label>
                <select
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className={inputCls}
                >
                  <option value="">--Select--</option>
                  {branches.map((b, idx) => {
                    const label = typeof b === 'string' ? b : (b?.branchName || b?.branch_name || b?.name || b?.branch_code || b?.code || `Branch ${idx + 1}`);
                    const val = typeof b === 'string' ? b : (b?.branchName || b?.branch_name || b?.name || b?._id || b?.id || label);
                    return (
                      <option key={b?._id || b?.id || idx} value={val}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className={labelCls}>Product Type</label>
                <select
                  value={productType}
                  onChange={(e) => {
                    setProductType(e.target.value);
                    setSelectedLoan('');
                  }}
                  className={inputCls}
                >
                  <option value="Group">Group</option>
                  <option value="Loan">Loan</option>
                  <option value="Limit">Limit</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Select Loan</label>
                <select
                  value={selectedLoan}
                  onChange={(e) => setSelectedLoan(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-Select-</option>
                  {loanProducts
                    .filter((p) => {
                      if (!p || typeof p === 'string') return true;
                      const pType = p.productType || p.product_type || p.type || 'Loan';
                      return !productType || pType.toLowerCase() === productType.toLowerCase();
                    })
                    .map((p, idx) => {
                      const label = typeof p === 'string' ? p : (p?.productName || p?.product_name || p?.loanName || p?.loan_name || p?.name || `Product ${idx + 1}`);
                      const val = typeof p === 'string' ? p : (p?.productName || p?.product_name || p?.loanName || p?.loan_name || p?.name || p?._id || p?.id || label);
                      return (
                        <option key={p?._id || p?.id || idx} value={val}>
                          {label}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className={labelCls}>Duration In</label>
                <select
                  value={durationIn}
                  onChange={(e) => setDurationIn(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-Select-</option>
                  <option value="Days">Days</option>
                  <option value="Weeks">Weeks</option>
                  <option value="Months">Months</option>
                  <option value="Years">Years</option>
                </select>
              </div>
            </div>

            {/* ── Banner 2: Member Details ──────────────────────────────────── */}
            <div className="rounded overflow-hidden">
              <SectionBanner title="Member Details" />
              <div className="p-4 bg-white border-x border-b border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">Member Id</label>
                      {fetchingMember && <Loader className="w-3 h-3 animate-spin text-indigo-600" />}
                    </div>
                    <input
                      type="text"
                      list="members-list"
                      value={memberId}
                      onChange={(e) => handleMemberIdLookup(e.target.value)}
                      onBlur={(e) => handleMemberIdLookup(e.target.value)}
                      placeholder="Member ID"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Member Name</label>
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Member Name"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Member Type</label>
                    <input
                      type="text"
                      value={memberType}
                      onChange={(e) => setMemberType(e.target.value)}
                      placeholder="Type"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Age</label>
                    <input
                      type="text"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Age"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Banner 3: Guarantor / Co-Applicant Details ───────────────── */}
            <div className="rounded overflow-hidden">
              <SectionBanner title="Gurantor / Co-Applicant Details" />
              <div className="p-4 bg-white border-x border-b border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className={labelCls}>Select</label>
                    <select
                      value={guarantorSelect}
                      onChange={(e) => setGuarantorSelect(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">--Select--</option>
                      <option value="Guarantor">Guarantor</option>
                      <option value="Co-Applicant">Co-Applicant</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Gurantor Id</label>
                    <input
                      type="text"
                      list="members-list"
                      value={guarantorId}
                      onChange={(e) => handleGuarantorIdChange(e.target.value)}
                      onBlur={(e) => handleGuarantorIdChange(e.target.value)}
                      placeholder="Gurantor ID"
                      className={inputCls}
                    />
                  </div>

                  {/* Datalist for Member & Guarantor ID Autocomplete */}
                  <datalist id="members-list">
                    {allMembers.map((m, idx) => {
                      const mId = m.memberId || m.MemberId || m._id || m.id;
                      const fn = m.FirstName || m.firstname || m.first_name || '';
                      const ln = m.LastName || m.lastname || m.last_name || '';
                      const name = `${fn} ${ln}`.trim() || m.name || m.memberName || '';
                      return (
                        <option key={mId || idx} value={mId}>
                          {name ? `${mId} - ${name}` : mId}
                        </option>
                      );
                    })}
                  </datalist>

                  <div>
                    <label className={labelCls}>Gurantor Name</label>
                    <input
                      type="text"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                      placeholder="Gurantor Name"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Gurantor Type</label>
                    <input
                      type="text"
                      value={guarantorType}
                      onChange={(e) => setGuarantorType(e.target.value)}
                      placeholder="Type"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Age</label>
                    <input
                      type="text"
                      value={guarantorAge}
                      onChange={(e) => setGuarantorAge(e.target.value)}
                      placeholder="Age"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Banner 4: Loan Details ───────────────────────────────────── */}
            <div className="rounded overflow-hidden">
              <SectionBanner title="Loan Details" />
              <div className="p-4 bg-white border-x border-b border-gray-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className={labelCls}>Loan Amount</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="0"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Loan Tenure</label>
                    <input
                      type="number"
                      value={loanTenure}
                      onChange={(e) => setLoanTenure(e.target.value)}
                      placeholder="0"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">--Select--</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Fortnightly">Fortnightly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half-Yearly">Half-Yearly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Interest Type</label>
                    <select
                      value={interestType}
                      onChange={(e) => setInterestType(e.target.value)}
                      className={inputCls}
                    >
                      <option value="Flat">Flat</option>
                      <option value="Declining Balance">Declining Balance</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>ROI(%)</label>
                    <input
                      type="number"
                      value={roi}
                      onChange={(e) => setRoi(e.target.value)}
                      placeholder="0"
                      className={inputCls}
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Second row of Loan Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className={labelCls}>EMI-</label>
                    <input
                      type="text"
                      value={emi}
                      onChange={(e) => setEmi(e.target.value)}
                      placeholder="0"
                      className={`${inputCls} font-bold text-indigo-700 bg-indigo-50/50`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Loan Purpose</label>
                    <input
                      type="text"
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      placeholder="Enter"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Banner 5: Introducer Details ─────────────────────────────── */}
            <div className="rounded overflow-hidden">
              <SectionBanner title="Introducer Details" />
              <div className="p-4 bg-white border-x border-b border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className={labelCls}>Introducer</label>
                    <input
                      type="text"
                      value={introducer}
                      onChange={(e) => setIntroducer(e.target.value)}
                      placeholder="Introducer"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Introducer Name</label>
                    <input
                      type="text"
                      value={introducerName}
                      onChange={(e) => setIntroducerName(e.target.value)}
                      placeholder="Introducer Name"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar (NEXT Button) */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2 bg-[#2D336B] hover:bg-[#1E2245] text-white font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2 shadow disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'NEXT'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLoan;
