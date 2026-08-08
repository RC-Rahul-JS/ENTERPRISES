import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Wallet,
  Loader,
  Search,
  FileText,
  Trash2,
  PlusCircle,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  RefreshCw,
  Users,
  X,
  Filter,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

// Initial Mock/Dummy Data for Wallet Applications List
const INITIAL_DUMMY_WALLET_REQUESTS = [
  {
    id: 'WAL-2026-001',
    date: '2026-08-05',
    memberId: '0010006',
    member_id: '64a0e101',
    memberName: 'Rahul Sharma',
    memberType: 'Regular',
    age: '29',
    branchName: 'Main Bhopal Branch',
    branch_id: 'BR-01',
    walletAmount: 15000,
    remarks: 'Monthly business working capital top-up',
    status: 'Pending',
    createdAt: '2026-08-05 10:30 AM',
  },
  {
    id: 'WAL-2026-002',
    date: '2026-08-04',
    memberId: '0010004',
    member_id: '64a0e102',
    memberName: 'Priya Verma',
    memberType: 'Associate',
    age: '34',
    branchName: 'Indore Central',
    branch_id: 'BR-02',
    walletAmount: 25000,
    remarks: 'Emergency wallet balance request',
    status: 'Approved',
    createdAt: '2026-08-04 02:15 PM',
  },
  {
    id: 'WAL-2026-003',
    date: '2026-08-03',
    memberId: '0010009',
    member_id: '64a0e103',
    memberName: 'Amitabh Patel',
    memberType: 'Agent',
    age: '42',
    branchName: 'Jabalpur Branch',
    branch_id: 'BR-03',
    walletAmount: 50000,
    remarks: 'Agent commission wallet deposit',
    status: 'Approved',
    createdAt: '2026-08-03 11:45 AM',
  },
  {
    id: 'WAL-2026-004',
    date: '2026-08-02',
    memberId: '0010012',
    member_id: '64a0e104',
    memberName: 'Suresh Kumar',
    memberType: 'Ordinary',
    age: '50',
    branchName: 'Gwalior Main',
    branch_id: 'BR-04',
    walletAmount: 8000,
    remarks: 'Personal wallet addition',
    status: 'Rejected',
    createdAt: '2026-08-02 04:00 PM',
  },
];

const ApplyWallet = () => {
  const navigate = useNavigate();
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];

  // ── Step Navigation State (1: Wallet Form, 2: Wallet Applications List) ───
  const [step, setStep] = useState(1);

  // ── Top Header / Branch Section ───────────────────────────────────────────
  const [date, setDate] = useState(today);
  const [branchName, setBranchName] = useState('');

  // ── Member Details ────────────────────────────────────────────────────────
  const [memberId, setMemberId] = useState('');
  const [memberMongoId, setMemberMongoId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberType, setMemberType] = useState('');
  const [age, setAge] = useState('');

  // ── Wallet Details ────────────────────────────────────────────────────────
  const [walletAmount, setWalletAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Dropdown & Search options
  const [branches, setBranches] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingMember, setFetchingMember] = useState(false);

  // ── Wallet Requests List State (Mock DB) ─────────────────────────────────
  const [walletRequests, setWalletRequests] = useState(INITIAL_DUMMY_WALLET_REQUESTS);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null); // For View Modal

  // ── Log list data on mount and whenever list updates ────────────────────
  useEffect(() => {
    console.log('================ CURRENT WALLET REQUESTS LIST DATA ================');
    console.log('Total Items:', walletRequests.length);
    console.log('List Items:', walletRequests);
  }, [walletRequests]);

  // ── Fetch Branches & Members from API ─────────────────────────────────────
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const branchRes = await axios.get(`${BASE_URL}/branches`);
        let bList = Array.isArray(branchRes.data)
          ? branchRes.data
          : branchRes.data?.data || branchRes.data?.branches || [];
        setBranches(bList);
      } catch (err) {
        console.error('[ApplyWallet] Error fetching branches:', err);
      }

      try {
        const memRes = await axios.get(`${BASE_URL}/get-members`);
        let mList = Array.isArray(memRes.data)
          ? memRes.data
          : memRes.data?.data || memRes.data?.members || [];
        setAllMembers(mList);
      } catch (err) {
        console.error('[ApplyWallet] Error fetching members:', err);
      }
    };

    fetchDropdowns();
  }, []);

  // ── Helper to extract member data ─────────────────────────────────────────
  const extractMemberData = (m) => {
    const fn = m.FirstName || m.firstname || m.first_name || '';
    const ln = m.LastName || m.lastname || m.last_name || '';
    const fullName = `${fn} ${ln}`.trim() || m.name || m.memberName || m.member_name || '';
    const type = m.MemberType || m.memberType || m.member_type || m.Category || m.category || 'Regular';
    const ageVal = m.Age || m.age || m.memberAge || '';

    return { fullName, type, age: ageVal };
  };

  // ── Helper to fetch member from direct API endpoint ─────────────────────
  const fetchMemberFromApi = async (mid) => {
    if (!mid || !mid.trim()) return null;
    try {
      const api = `${BASE_URL}/members?memberId=${encodeURIComponent(mid.trim())}`;
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
      console.warn('[ApplyWallet] Direct member search fallback:', err?.message);
      return null;
    }
  };

  // ── Member ID Input & Search ─────────────────────────────────────────────
  const handleMemberIdInputChange = (val) => {
    setMemberId(val);
    setMemberName('');
    setMemberType('');
    setAge('');
    setMemberMongoId('');
  };

  const handleSearchMember = async () => {
    const trimmed = memberId ? memberId.trim() : '';

    if (!trimmed) {
      setMemberName('');
      setMemberType('');
      setAge('');
      setMemberMongoId('');
      return toast.error('Please enter Member ID to search');
    }

    setFetchingMember(true);
    showLoader();

    try {
      // 1. Try API search endpoint
      let match = await fetchMemberFromApi(trimmed);

      // 2. Fallback to loaded list
      if (!match && allMembers && allMembers.length > 0) {
        const target = trimmed.toLowerCase();
        match = allMembers.find((m) => {
          const mCode = String(m.memberId || m.MemberId || m.member_id || '').trim().toLowerCase();
          const mMongoId = String(m._id || m.id || '').trim().toLowerCase();
          const mPhone = String(m.MobileNo || m.mobile || m.phone || '').trim().toLowerCase();
          const mAadhar = String(m.Aadhar || m.aadhaar || m.aadhar || '').trim().toLowerCase();
          return mCode === target || mMongoId === target || mPhone === target || mAadhar === target;
        });
      }

      if (match) {
        const mid = match.memberId || match.MemberId || match.member_id || match.member_no || match._id || trimmed;
        const mongoId = match._id || match.id || mid;
        const { fullName, type, age: ageVal } = extractMemberData(match);

        setMemberId(mid);
        setMemberMongoId(mongoId);
        setMemberName(fullName);
        setMemberType(type);
        setAge(ageVal);
        toast.success('Member details fetched successfully');
      } else {
        toast.error(`No active member found with ID "${trimmed}"`);
      }
    } catch (err) {
      console.error('[ApplyWallet] Error searching member:', err);
      toast.error('Failed to fetch member details');
    } finally {
      setFetchingMember(false);
      hideLoader();
    }
  };

  // ── Reset Form ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setDate(today);
    setBranchName('');
    setMemberId('');
    setMemberMongoId('');
    setMemberName('');
    setMemberType('');
    setAge('');
    setWalletAmount('');
    setRemarks('');
  };

  // ── Submit / Next Step Handler: Creates New Request & Goes to List View ───
  const handleNextStep = (e) => {
    e.preventDefault();

    if (!branchName) return toast.error('Please select Branch Name');
    if (!memberId || !memberName) return toast.error('Please enter valid Member Details');
    if (!walletAmount || parseFloat(walletAmount) <= 0)
      return toast.error('Please enter a valid Wallet Amount');

    const bObj = branches.find((b) => {
      const name = b.BranchName || b.branchName || b.name || b.branch_name || '';
      return name === branchName || b._id === branchName || b.BranchCode === branchName;
    });
    const resolvedBranchId = bObj?._id || bObj?.id || bObj?.BranchCode || branchName;

    // Create unique ID for new request
    const newReqId = `WAL-2026-00${walletRequests.length + 1}`;

    const newWalletRequest = {
      id: newReqId,
      date,
      branchName,
      branch_id: resolvedBranchId,
      memberId,
      member_id: memberMongoId || memberId,
      memberName,
      memberType: memberType || 'Regular',
      age: age || '-',
      walletAmount: parseFloat(walletAmount) || 0,
      remarks: remarks || 'Wallet topup application',
      status: 'Pending',
      type: 'Wallet Application',
      createdAt: new Date().toLocaleString(),
    };

    // 🌟 LOG DATA TO CONSOLE 🌟
    console.log('================ NEW APPLY WALLET REQUEST CREATED ================');
    console.log('Payload:', newWalletRequest);

    // Add new request to top of list
    setWalletRequests((prev) => [newWalletRequest, ...prev]);

    Swal.fire({
      icon: 'success',
      title: 'Wallet Application Submitted!',
      text: `Request ID ${newReqId} created successfully. Redirecting to Apply Wallet List.`,
      confirmButtonColor: '#2D336B',
      timer: 2000,
    });

    // Reset form and navigate to Wallet Requests list page
    resetForm();
    navigate('/loan/wallet_requests');
  };

  // ── Status Action Handlers for List Items (Approve / Reject / Delete) ─────
  const handleApprove = (reqId) => {
    console.log('================ APPROVING WALLET REQUEST ================', reqId);
    setWalletRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'Approved' } : r))
    );
    toast.success(`Request ${reqId} Approved!`);
  };

  const handleReject = (reqId) => {
    console.log('================ REJECTING WALLET REQUEST ================', reqId);
    setWalletRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'Rejected' } : r))
    );
    toast.error(`Request ${reqId} Rejected!`);
  };

  const handleDelete = (reqId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Remove wallet request ${reqId} from list?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
    }).then((res) => {
      if (res.isConfirmed) {
        console.log('================ DELETING WALLET REQUEST ================', reqId);
        setWalletRequests((prev) => prev.filter((r) => r.id !== reqId));
        toast.success(`Request ${reqId} deleted.`);
      }
    });
  };

  // ── Filtered List Items ───────────────────────────────────────────────────
  const filteredRequests = walletRequests.filter((r) => {
    const matchesStatus =
      statusFilter === 'ALL' || r.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      r.id.toLowerCase().includes(query) ||
      r.memberId.toLowerCase().includes(query) ||
      r.memberName.toLowerCase().includes(query) ||
      r.branchName.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  // KPI Counts
  const counts = {
    ALL: walletRequests.length,
    pending: walletRequests.filter((r) => r.status.toLowerCase() === 'pending').length,
    approved: walletRequests.filter((r) => r.status.toLowerCase() === 'approved').length,
    rejected: walletRequests.filter((r) => r.status.toLowerCase() === 'rejected').length,
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
      <div className="max-w-7xl mx-auto space-y-4">
        {/* ── TOP NAVIGATION TABS (Form vs List View) ──────────────────────── */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                step === 1
                  ? 'bg-[#3B3C6E] text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>APPLY WALLET FORM</span>
            </button>

            <button
              type="button"
              onClick={() => {
                console.log('================ SWITCHED TO WALLET LIST VIEW ================', walletRequests);
                setStep(2);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                step === 2
                  ? 'bg-[#3B3C6E] text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>APPLY WALLET LIST ({walletRequests.length})</span>
            </button>
          </div>

          <div className="text-xs font-medium text-gray-500">
            Current Module: <span className="font-bold text-indigo-900">Loan &gt; Apply Wallet</span>
          </div>
        </div>

        {/* ── STEP 1: APPLY WALLET FORM ────────────────────────────────────── */}
        {step === 1 && (
          <div className="shadow-sm rounded-lg border border-gray-200 bg-white overflow-hidden">
            <form onSubmit={handleNextStep} className="space-y-0">
              {/* ── Header Banner: APPLY WALLET ────────────────────────────────── */}
              <div className="bg-[#3B3C6E] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-200" />
                  <span>APPLY WALLET</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs underline hover:text-purple-200 font-normal transition"
                >
                  View All Requests ({walletRequests.length}) &rarr;
                </button>
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
                {/* Top Row: Date & Branch Name */}
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
                    <label className={labelCls}>
                      Branch Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">--Select--</option>
                      {branches.map((b, idx) => {
                        const name = b.BranchName || b.branchName || b.name || b.branch_name || '';
                        const code = b.BranchCode || b.code || '';
                        const val = name || code;
                        return (
                          <option key={`branch_${b._id || b.BranchCode || idx}_${idx}`} value={val}>
                            {name} {code ? `(${code})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* ── Section 1: Member Details ───────────────────────────────── */}
                <div className="rounded border border-gray-200">
                  <SectionBanner title="Member Details" />
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className={labelCls}>
                          Member ID <span className="text-red-500">*</span>
                        </label>
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
                            onBlur={() => {}}
                            placeholder="Member ID"
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleSearchMember}
                            className="px-2.5 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
                            title="Search Member ID"
                          >
                            {fetchingMember ? (
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Search className="w-3.5 h-3.5" />
                            )}
                            <span>Search</span>
                          </button>
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

                {/* ── Section 2: Details ──────────────────────────────────────── */}
                <div className="rounded border border-gray-200">
                  <SectionBanner title="Details" />
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className={labelCls}>
                          Wallet Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={walletAmount}
                          onChange={(e) => setWalletAmount(e.target.value)}
                          placeholder="0"
                          className={inputCls}
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className={labelCls}>Remarks / Purpose</label>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Optional remarks"
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
                    className="px-8 py-2 bg-[#2D336B] hover:bg-[#1E2245] text-white font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2 shadow"
                  >
                    <span>NEXT</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 2: APPLY WALLET REQUESTS LIST VIEW ──────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-[#3B3C6E] text-white p-4 rounded-xl shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-200" />
                  <span>APPLY WALLET REQUESTS LIST</span>
                </h1>
                <p className="text-xs text-purple-200 mt-0.5">
                  View, filter, and manage all member wallet application requests
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log('================ REFRESHED WALLET LIST ================', walletRequests);
                    toast.success('Wallet list refreshed');
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh List</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-1.5 bg-white text-[#3B3C6E] hover:bg-purple-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Apply New Wallet</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'ALL', label: 'All Requests', icon: <Users className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50' },
                { key: 'pending', label: 'Pending Review', icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50' },
                { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50' },
                { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4 text-red-600" />, bg: 'bg-red-50' },
              ].map((tab) => {
                const isSelected = statusFilter === tab.key;
                return (
                  <div
                    key={tab.key}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      console.log(`================ FILTER CHANGED TO ${tab.key} ================`);
                    }}
                    className={`bg-white rounded-xl p-3 border cursor-pointer transition shadow-sm ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`p-2 rounded-lg ${tab.bg}`}>{tab.icon}</span>
                      <span className="text-xl font-black text-gray-900">{counts[tab.key]}</span>
                    </div>
                    <div className="mt-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {tab.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter Bar & Search Input */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['ALL', 'pending', 'approved', 'rejected'].map((statusKey) => (
                  <button
                    key={statusKey}
                    onClick={() => setStatusFilter(statusKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                      statusFilter === statusKey
                        ? 'bg-[#3B3C6E] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {statusKey} ({counts[statusKey]})
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Member, Req ID, Branch..."
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
            </div>

            {/* Wallet Requests Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#3B3C6E] text-white font-bold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 border-b border-indigo-900">Req. ID</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Date</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Member ID</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Member Name</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Branch</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Wallet Amount</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Remarks</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Status</th>
                      <th className="px-4 py-3 border-b border-indigo-900 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-gray-400">
                          <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
                          <p className="font-semibold text-sm">No wallet requests found</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Try adjusting your search query or filter tab.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((r) => {
                        const statusColors = {
                          Pending: 'bg-amber-100 text-amber-800 border-amber-200',
                          Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          Rejected: 'bg-red-100 text-red-800 border-red-200',
                        };

                        return (
                          <tr key={r.id} className="hover:bg-indigo-50/40 transition">
                            <td className="px-4 py-3 font-bold text-indigo-900">{r.id}</td>
                            <td className="px-4 py-3 text-gray-600">{r.date}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{r.memberId}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{r.memberName}</td>
                            <td className="px-4 py-3 text-gray-600">{r.branchName}</td>
                            <td className="px-4 py-3 font-bold text-emerald-700">
                              ₹{(r.walletAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                              {r.remarks || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                  statusColors[r.status] || 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* View Details Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('================ VIEWING WALLET REQUEST DETAILS ================', r);
                                    setSelectedRequest(r);
                                  }}
                                  className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Approve Button */}
                                {r.status === 'Pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApprove(r.id)}
                                      className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                                      title="Approve Request"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReject(r.id)}
                                      className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition"
                                      title="Reject Request"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDelete(r.id)}
                                  className="p-1.5 bg-gray-100 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete Request"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── VIEW DETAILS MODAL ─────────────────────────────────────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="bg-[#3B3C6E] text-white px-5 py-3 flex items-center justify-between font-bold text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-200" />
                <span>WALLET REQUEST DETAILS - {selectedRequest.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-gray-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-gray-800">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-500 block font-semibold">Request ID</span>
                  <span className="font-bold text-indigo-900 text-sm">{selectedRequest.id}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Application Date</span>
                  <span className="font-bold">{selectedRequest.date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Member ID</span>
                  <span className="font-bold text-gray-900">{selectedRequest.memberId}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Member Name</span>
                  <span className="font-bold text-gray-900">{selectedRequest.memberName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Member Type</span>
                  <span>{selectedRequest.memberType || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Member Age</span>
                  <span>{selectedRequest.age || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Branch Name</span>
                  <span className="font-semibold text-gray-800">{selectedRequest.branchName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Requested Amount</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    ₹{(selectedRequest.walletAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block font-semibold mb-1">Remarks / Purpose</span>
                <div className="p-3 bg-slate-50 border border-gray-200 rounded-lg text-gray-700">
                  {selectedRequest.remarks || 'No remarks provided.'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-500 font-semibold">Current Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedRequest.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedRequest.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedRequest.status}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white font-bold text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyWallet;
