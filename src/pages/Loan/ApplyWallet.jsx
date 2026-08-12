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
import useApi from '../../api/useApi';

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

// Dummy data removed

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

  // ── Agent Details ────────────────────────────────────────────────────────
  const [agentId, setAgentId] = useState('');
  const [agentMongoId, setAgentMongoId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState('');
  const [age, setAge] = useState('');

  // ── Wallet Details ────────────────────────────────────────────────────────
  const [walletAmount, setWalletAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Dropdown & Search options
  const [branches, setBranches] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingAgent, setFetchingAgent] = useState(false);
  
  // ── Wallet Requests List State ──────────────────────────────────────────
  const [walletRequests, setWalletRequests] = useState([]);
  const { getData, postData } = useApi();

  const fetchWallets = async () => {
    try {
      showLoader();
      const res = await getData('/localprime/wallet/list');
      if (res && res.success) {
        setWalletRequests(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching wallets:', err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    if (step === 2) {
      fetchWallets();
    }
  }, [step]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null); // For View Modal
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewDetails = async (r) => {
    setSelectedRequest(r);
    setWalletTransactions([]);
    setLoadingDetails(true);
    try {
      const res = await getData(`/localprime/wallet/details?wallet_id=${r._id}`);
      if (res && res.success) {
        setSelectedRequest(res.data.wallet || r);
        setWalletTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

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
        const agRes = await axios.get(`${BASE_URL}/agents`);
        let aList = Array.isArray(agRes.data)
          ? agRes.data
          : agRes.data?.data || agRes.data?.agents || [];
        setAllAgents(aList);
      } catch (err) {
        console.error('[ApplyWallet] Error fetching agents:', err);
      }
    };

    fetchDropdowns();
  }, []);

  // ── Helper to extract agent data ─────────────────────────────────────────
  const extractAgentData = (m) => {
    const fullName = m.agentName || m.AgentName || '';
    const type = m.designationName || m.DesignationName || 'Agent';
    let ageVal = m.Age || m.age || '';
    
    // Calculate age from DateOfBirth if present
    if (!ageVal && (m.DateOfBirth || m.dateOfBirth)) {
      const dob = new Date(m.DateOfBirth || m.dateOfBirth);
      if (!isNaN(dob)) {
        const diff = Date.now() - dob.getTime();
        ageVal = Math.abs(new Date(diff).getUTCFullYear() - 1970).toString();
      }
    }

    return { fullName, type, age: ageVal };
  };

  // ── Helper to fetch agent from direct API endpoint ─────────────────────
  const fetchAgentFromApi = async (mid) => {
    if (!mid || !mid.trim()) return null;
    try {
      const api = `${BASE_URL}/agents?agentCode=${encodeURIComponent(mid.trim())}`;
      const res = await axios.get(api);
      if (res.data) {
        const rawPayload = res.data.data !== undefined ? res.data.data : res.data;
        if (!rawPayload || rawPayload.length === 0) return null;
        const data = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          return data;
        }
      }
      return null;
    } catch (err) {
      console.warn('[ApplyWallet] Direct agent search fallback:', err?.message);
      return null;
    }
  };

  // ── Agent ID Input & Search ─────────────────────────────────────────────
  const handleAgentIdInputChange = (val) => {
    setAgentId(val);
    setAgentName('');
    setAgentType('');
    setAge('');
    setAgentMongoId('');
  };

  const handleSearchAgent = async () => {
    const trimmed = agentId ? agentId.trim() : '';

    if (!trimmed) {
      setAgentName('');
      setAgentType('');
      setAge('');
      setAgentMongoId('');
      return toast.error('Please enter Agent ID to search');
    }

    setFetchingAgent(true);
    showLoader();

    try {
      // 1. Try API search endpoint
      let match = await fetchAgentFromApi(trimmed);

      // 2. Fallback to loaded list
      if (!match && allAgents && allAgents.length > 0) {
        const target = trimmed.toLowerCase();
        match = allAgents.find((m) => {
          const mCode = String(m.agentCode || m.AgentCode || '').trim().toLowerCase();
          const mMongoId = String(m._id || m.id || '').trim().toLowerCase();
          const mPhone = String(m.MobileNo || m.mobile || m.phone || '').trim().toLowerCase();
          return mCode === target || mMongoId === target || mPhone === target;
        });
      }

      if (match) {
        const mid = match.agentCode || match._id || trimmed;
        const mongoId = match._id || match.id || mid;
        const { fullName, type, age: ageVal } = extractAgentData(match);

        setAgentId(mid);
        setAgentMongoId(mongoId);
        setAgentName(fullName);
        setAgentType(type);
        setAge(ageVal);
        toast.success('Agent details fetched successfully');
      } else {
        toast.error(`No active agent found with ID "${trimmed}"`);
      }
    } catch (err) {
      console.error('[ApplyWallet] Error searching agent:', err);
      toast.error('Failed to fetch agent details');
    } finally {
      setFetchingAgent(false);
      hideLoader();
    }
  };

  // ── Reset Form ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setDate(today);
    setBranchName('');
    setAgentId('');
    setAgentMongoId('');
    setAgentName('');
    setAgentType('');
    setAge('');
    setWalletAmount('');
    setRemarks('');
  };

  // ── Submit / Next Step Handler: Creates New Request & Goes to List View ───
  const handleNextStep = async (e) => {
    e.preventDefault();

    if (!branchName) return toast.error('Please select Branch Name');
    if (!agentId || !agentName) return toast.error('Please enter valid Agent Details');

    try {
      setSubmitting(true);
      const payload = {
        agent_id: agentMongoId || agentId
      };
      
      const res = await postData('/localprime/wallet/create', payload);
      
      if (res && res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Wallet Created!',
          text: `Wallet created successfully. See console for JSON data.`,
          confirmButtonColor: '#2D336B',
          timer: 2000,
        });
        
        console.log('================ NEW APPLY WALLET REQUEST CREATED ================');
        console.log('Payload:', res.data);
        
        resetForm();
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error(error.message || 'Failed to create wallet');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered List Items ───────────────────────────────────────────────────
  const filteredRequests = walletRequests.filter((r) => {
    const matchesStatus =
      statusFilter === 'ALL' || r.status?.toLowerCase() === statusFilter.toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      r.walletNumber?.toLowerCase().includes(query) ||
      r.agent_id?.toLowerCase().includes(query) ||
      r.agentName?.toLowerCase().includes(query) ||
      r.branchName?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  // ── Helper to dynamically find agent name if missing from wallet data ─────
  const getAgentNameForWallet = (r) => {
    if (!r) return 'N/A';
    let name = r.agentName || r.AgentName;
    if (!name || name.trim() === '' || name.trim().toLowerCase() === 'n/a') {
      const ag = allAgents?.find(a => String(a._id) === String(r.agent_id) || String(a.agentCode) === String(r.agentCode));
      if (ag) {
        name = ag.agentName || ag.AgentName || ag.name || ag.Name || ag.memberName || ag.MemberName || `${ag.FirstName || ag.first_name || ''} ${ag.LastName || ag.last_name || ''}`.trim();
      }
    }
    return name || 'N/A';
  };

  // KPI Counts
  const counts = {
    ALL: walletRequests.length,
    active: walletRequests.filter((r) => r.status?.toLowerCase() === 'active').length,
    inactive: walletRequests.filter((r) => r.status?.toLowerCase() === 'inactive').length,
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

                {/* ── Section 1: Agent Details ───────────────────────────────── */}
                <div className="rounded border border-gray-200">
                  <SectionBanner title="Agent Details" />
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className={labelCls}>
                          Agent ID <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center gap-1">
                          <input
                            type="text"
                            value={agentId}
                            onChange={(e) => handleAgentIdInputChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearchAgent();
                              }
                            }}
                            onBlur={() => {}}
                            placeholder="Agent ID"
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleSearchAgent}
                            className="px-2.5 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
                            title="Search Agent ID"
                          >
                            {fetchingAgent ? (
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Search className="w-3.5 h-3.5" />
                            )}
                            <span>Search</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Agent Name</label>
                        <input
                          type="text"
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                          placeholder="Agent Name"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Designation</label>
                        <input
                          type="text"
                          value={agentType}
                          onChange={(e) => setAgentType(e.target.value)}
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
                      <th className="px-4 py-3 border-b border-indigo-900">Wallet No.</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Agent ID</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Agent Name</th>
                      <th className="px-4 py-3 border-b border-indigo-900">Branch</th>
                      <th className="px-4 py-3 border-b border-indigo-900 text-right">Credit Limit</th>
                      <th className="px-4 py-3 border-b border-indigo-900 text-right">Available Credit</th>
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
                          active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          inactive: 'bg-gray-100 text-gray-800 border-gray-200',
                        };

                        return (
                          <tr key={r._id || r.walletNumber} className="hover:bg-indigo-50/40 transition">
                            <td className="px-4 py-3 font-bold text-indigo-900">{r.walletNumber || r.WalletNumber || '-'}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{r.agentCode || r.AgentCode || '-'}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{getAgentNameForWallet(r)}</td>
                            <td className="px-4 py-3 text-gray-600">{r.branchName || r.BranchName || 'N/A'}</td>
                            <td className="px-4 py-3 font-bold text-gray-700 text-right">
                              ₹{(r.creditLimit || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-700 text-right">
                              ₹{(r.availableCredit || 0).toLocaleString()}
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
                                  onClick={() => handleViewDetails(r)}
                                  className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
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
                <span>WALLET DETAILS - {selectedRequest.walletNumber}</span>
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
                  <span className="text-gray-500 block font-semibold">Wallet Number</span>
                  <span className="font-bold text-indigo-900 text-sm">{selectedRequest.walletNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Creation Date</span>
                  <span className="font-bold">{new Date(selectedRequest.created_at || selectedRequest.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Agent ID</span>
                  <span className="font-bold text-gray-900">{selectedRequest.agentCode || selectedRequest.AgentCode || selectedRequest.agent_id}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Agent Name</span>
                  <span className="font-bold text-gray-900">{getAgentNameForWallet(selectedRequest)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Branch Name</span>
                  <span className="font-semibold text-gray-800">{selectedRequest.branchName || selectedRequest.BranchName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase inline-block mt-1 ${
                      selectedRequest.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {selectedRequest.status || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 mt-3">
                <div>
                  <span className="text-indigo-900 block font-semibold">Credit Limit</span>
                  <span className="font-extrabold text-indigo-700 text-sm">
                    ₹{(selectedRequest.creditLimit || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-900 block font-semibold">Available Credit</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    ₹{(selectedRequest.availableCredit || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block font-semibold">Used Credit</span>
                  <span className="font-bold text-gray-700">
                    ₹{(selectedRequest.usedCredit || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block font-semibold">Total Deposited</span>
                  <span className="font-bold text-gray-700">
                    ₹{(selectedRequest.totalDeposit || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* TRANSACTIONS SECTION */}
              <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-100 px-3 py-2 font-bold text-gray-700 border-b border-gray-200 text-xs">
                  Recent Transactions
                </div>
                <div className="max-h-48 overflow-y-auto bg-white">
                  {loadingDetails ? (
                    <div className="p-4 text-center text-gray-500 font-medium text-xs">Loading transactions...</div>
                  ) : walletTransactions.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 font-medium text-xs">No transactions found</div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {walletTransactions.map(t => (
                          <tr key={t._id} className="hover:bg-gray-50 transition">
                            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                              {new Date(t.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                t.type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-bold text-right text-gray-800">
                              ₹{t.amount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-gray-500 truncate max-w-[120px]" title={t.remarks || '-'}>
                              {t.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
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
