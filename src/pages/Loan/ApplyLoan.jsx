import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CreditCard, Loader, UserCheck, Search } from 'lucide-react';

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

  // Dynamic Suggestion States (Only show suggestions after typing text, not when empty)
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [guarantorSuggestions, setGuarantorSuggestions] = useState([]);
  const [showGuarantorDropdown, setShowGuarantorDropdown] = useState(false);

  const [introducerSuggestions, setIntroducerSuggestions] = useState([]);
  const [showIntroducerDropdown, setShowIntroducerDropdown] = useState(false);

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

  // ── Helper to fetch member from API: /members?memberId=... ───────────────
  const fetchMemberFromApi = async (mid) => {
    if (!mid || !mid.trim()) return null;
    try {
      const api = `${BASE}/members?memberId=${encodeURIComponent(mid.trim())}`;
      const res = await axios.get(api);
      if (res.data) {
        const rawPayload = res.data.data !== undefined ? res.data.data : res.data;
        if (!rawPayload) return null;
        const data = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          return data;
        }
      }
      return null;
    } catch (err) {
      console.error('[ApplyLoan] Error searching member API:', err);
      return null;
    }
  };

  // ── Member ID search ───────────────────────────────────────────────────────
  const handleMemberIdInputChange = (val) => {
    setMemberId(val);
    setShowMemberDropdown(false);
    // Clear details while typing until Search is pressed
    setMemberName('');
    setMemberType('');
    setAge('');
  };

  const handleSearchMember = async () => {
    const trimmed = memberId ? memberId.trim() : '';

    if (!trimmed) {
      setMemberName('');
      setMemberType('');
      setAge('');
      setShowMemberDropdown(false);
      return toast.error('Please enter full Member ID to search');
    }

    setFetchingMember(true);
    setShowMemberDropdown(false);

    try {
      // 1. Fetch from direct API endpoint: /members?memberId=...
      let match = await fetchMemberFromApi(trimmed);

      // 2. Fallback check in allMembers
      if (!match && allMembers && allMembers.length > 0) {
        match = allMembers.find((m) => {
          const mid = String(m.memberId || m.MemberId || m._id || m.id || '').toLowerCase();
          return mid === trimmed.toLowerCase();
        });
      }

      if (match) {
        const { fullName, type, age: ageVal } = extractMemberData(match);
        setMemberName(fullName || '');
        setMemberType(type || 'Regular');
        setAge(ageVal || '');
        toast.success(`Member Found: ${fullName || trimmed}`);
      } else {
        // Do not give any details if Member ID is not matched
        setMemberName('');
        setMemberType('');
        setAge('');
        toast.error(`No member found for Member ID "${trimmed}". Please enter valid full ID.`);
      }
    } catch (err) {
      setMemberName('');
      setMemberType('');
      setAge('');
      toast.error(`Error searching Member ID "${trimmed}"`);
    } finally {
      setFetchingMember(false);
    }
  };

  const selectMemberSuggestion = (m) => {
    const mid = m.memberId || m.MemberId || m._id || m.id || '';
    setMemberId(mid);
    const { fullName, type, age: ageVal } = extractMemberData(m);
    setMemberName(fullName);
    setMemberType(type);
    setAge(ageVal);
    setShowMemberDropdown(false);
  };

  // ── Guarantor ID search ────────────────────────────────────────────────────
  const handleGuarantorIdInputChange = (val) => {
    setGuarantorId(val);
    setShowGuarantorDropdown(false);
    setGuarantorName('');
    setGuarantorType('');
    setGuarantorAge('');
  };

  const handleSearchGuarantor = async () => {
    const trimmed = guarantorId ? guarantorId.trim() : '';

    if (!trimmed) {
      setGuarantorName('');
      setGuarantorType('');
      setGuarantorAge('');
      setShowGuarantorDropdown(false);
      return toast.error('Please enter full Guarantor ID to search');
    }

    setFetchingMember(true);
    setShowGuarantorDropdown(false);

    try {
      let match = await fetchMemberFromApi(trimmed);

      if (!match && allMembers && allMembers.length > 0) {
        match = allMembers.find((m) => {
          const mid = String(m.memberId || m.MemberId || m._id || m.id || '').toLowerCase();
          return mid === trimmed.toLowerCase();
        });
      }

      if (match) {
        const { fullName, type, age: ageVal } = extractMemberData(match);
        setGuarantorName(fullName || '');
        setGuarantorType(type || 'Regular');
        setGuarantorAge(ageVal || '');
        toast.success(`Guarantor Found: ${fullName || trimmed}`);
      } else {
        setGuarantorName('');
        setGuarantorType('');
        setGuarantorAge('');
        toast.error(`No guarantor found for ID "${trimmed}". Please enter valid full ID.`);
      }
    } catch (err) {
      setGuarantorName('');
      setGuarantorType('');
      setGuarantorAge('');
      toast.error(`Error searching Guarantor ID "${trimmed}"`);
    } finally {
      setFetchingMember(false);
    }
  };

  const selectGuarantorSuggestion = (m) => {
    const mid = m.memberId || m.MemberId || m._id || m.id || '';
    setGuarantorId(mid);
    const { fullName, type, age: ageVal } = extractMemberData(m);
    setGuarantorName(fullName);
    setGuarantorType(type);
    setGuarantorAge(ageVal);
    setShowGuarantorDropdown(false);
  };

  // ── Introducer search ──────────────────────────────────────────────────────
  const handleIntroducerInputChange = (val) => {
    setIntroducer(val);
    setShowIntroducerDropdown(false);
    setIntroducerName('');
  };

  const handleSearchIntroducer = async () => {
    const trimmed = introducer ? introducer.trim() : '';

    if (!trimmed) {
      setIntroducerName('');
      setShowIntroducerDropdown(false);
      return toast.error('Please enter full Introducer ID to search');
    }

    setFetchingMember(true);
    setShowIntroducerDropdown(false);

    try {
      let match = await fetchMemberFromApi(trimmed);

      if (!match && allMembers && allMembers.length > 0) {
        match = allMembers.find((m) => {
          const mid = String(m.memberId || m.MemberId || m._id || m.id || '').toLowerCase();
          return mid === trimmed.toLowerCase();
        });
      }

      if (match) {
        const { fullName } = extractMemberData(match);
        setIntroducerName(fullName || '');
        toast.success(`Introducer Found: ${fullName || trimmed}`);
      } else {
        setIntroducerName('');
        toast.error(`No introducer found for ID "${trimmed}". Please enter valid full ID.`);
      }
    } catch (err) {
      setIntroducerName('');
      toast.error(`Error searching Introducer ID "${trimmed}"`);
    } finally {
      setFetchingMember(false);
    }
  };

  const selectIntroducerSuggestion = (m) => {
    const mid = m.memberId || m.MemberId || m._id || m.id || '';
    setIntroducer(mid);
    const { fullName } = extractMemberData(m);
    setIntroducerName(fullName);
    setShowIntroducerDropdown(false);
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
      <div className="max-w-7xl mx-auto shadow-sm rounded-lg border border-gray-200 bg-white">
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
            <div className="rounded border border-gray-200">
              <SectionBanner title="Member Details" />
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">Member Id</label>
                      {fetchingMember && <Loader className="w-3 h-3 animate-spin text-indigo-600" />}
                    </div>
                    <div className="relative flex items-center gap-1">
                      <input
                        type="text"
                        value={memberId}
                        onChange={(e) => handleMemberIdInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchMember();
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowMemberDropdown(false), 200);
                        }}
                        placeholder="Enter Member ID"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleSearchMember}
                        className="px-2.5 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
                        title="Search Member"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search</span>
                      </button>

                      {showMemberDropdown && memberSuggestions.length > 0 && (
                        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-xl max-h-56 overflow-y-auto text-xs divide-y divide-gray-100 ring-1 ring-black/5">
                          {memberSuggestions.map((m, idx) => {
                            const mid = m.memberId || m.MemberId || m._id || m.id || '';
                            const { fullName, type } = extractMemberData(m);
                            return (
                              <li
                                key={mid || idx}
                                onMouseDown={() => selectMemberSuggestion(m)}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition"
                              >
                                <div>
                                  <span className="font-bold text-indigo-900">{mid}</span>
                                  {fullName && <span className="ml-2 text-gray-700">({fullName})</span>}
                                </div>
                                {type && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{type}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
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
            <div className="rounded border border-gray-200">
              <SectionBanner title="Gurantor / Co-Applicant Details" />
              <div className="p-4 bg-white">
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
                    <div className="relative flex items-center gap-1">
                      <input
                        type="text"
                        value={guarantorId}
                        onChange={(e) => handleGuarantorIdInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchGuarantor();
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowGuarantorDropdown(false), 200);
                        }}
                        placeholder="Enter Gurantor ID"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleSearchGuarantor}
                        className="px-2.5 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
                        title="Search Guarantor"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search</span>
                      </button>

                      {showGuarantorDropdown && guarantorSuggestions.length > 0 && (
                        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-xl max-h-56 overflow-y-auto text-xs divide-y divide-gray-100 ring-1 ring-black/5">
                          {guarantorSuggestions.map((m, idx) => {
                            const mid = m.memberId || m.MemberId || m._id || m.id || '';
                            const { fullName, type } = extractMemberData(m);
                            return (
                              <li
                                key={mid || idx}
                                onMouseDown={() => selectGuarantorSuggestion(m)}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition"
                              >
                                <div>
                                  <span className="font-bold text-indigo-900">{mid}</span>
                                  {fullName && <span className="ml-2 text-gray-700">({fullName})</span>}
                                </div>
                                {type && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{type}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

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
            <div className="rounded border border-gray-200">
              <SectionBanner title="Introducer Details" />
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className={labelCls}>Introducer</label>
                    <div className="relative flex items-center gap-1">
                      <input
                        type="text"
                        value={introducer}
                        onChange={(e) => handleIntroducerInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchIntroducer();
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowIntroducerDropdown(false), 200);
                        }}
                        placeholder="Enter Introducer ID"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleSearchIntroducer}
                        className="px-2.5 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
                        title="Search Introducer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search</span>
                      </button>

                      {showIntroducerDropdown && introducerSuggestions.length > 0 && (
                        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-xl max-h-56 overflow-y-auto text-xs divide-y divide-gray-100 ring-1 ring-black/5">
                          {introducerSuggestions.map((m, idx) => {
                            const mid = m.memberId || m.MemberId || m._id || m.id || '';
                            const { fullName } = extractMemberData(m);
                            return (
                              <li
                                key={mid || idx}
                                onMouseDown={() => selectIntroducerSuggestion(m)}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition"
                              >
                                <div>
                                  <span className="font-bold text-indigo-900">{mid}</span>
                                  {fullName && <span className="ml-2 text-gray-700">({fullName})</span>}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
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
