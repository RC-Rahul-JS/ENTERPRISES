import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  UserPlus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Eye,
  X,
  Loader,
  Search,
  Shield,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';

const BASE_URL =
  import.meta.env.VITE_LOCALPRIME_URL ||
  'http://192.168.29.145:5000/badri_enterprises/localprime';

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
      timer: 3000,
      timerProgressBar: true,
    }),
};

const STATUS_TABS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const getEffectiveStatus = (raw) => {
  const s = (
    raw?.status ||
    raw?.Status ||
    raw?.request_status ||
    raw?.approval_status ||
    ''
  )
    .toString()
    .toLowerCase();
  if (['approved', 'accepted', 'active', 'verified', '1', 'true'].includes(s))
    return 'approved';
  if (['rejected', 'declined', 'false', '0'].includes(s)) return 'rejected';
  return 'pending';
};

const StatusBadge = ({ status }) => {
  const map = {
    pending: { cls: 'bg-amber-100 text-amber-700', label: 'Pending' },
    approved: { cls: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    rejected: { cls: 'bg-red-100 text-red-700', label: 'Rejected' },
  };
  const { cls, label } = map[status] || map.pending;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
};

const inputCls =
  'px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#54578C]/40 focus:border-[#54578C] transition w-full';
const readonlyCls =
  'px-3 py-1.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 w-full cursor-not-allowed';

const CreateAgent = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  // ── Form State ─────────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const [formData, setFormData] = useState({
    member_id: '',
    branch_id: '',
    designation_id: '',
    introducer_code: '',
  });
  const [memberInfo, setMemberInfo] = useState(null);
  const [memberLookupLoading, setMemberLookupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Designations ───────────────────────────────────────────────────────────
  const [designations, setDesignations] = useState([]);

  // ── Agent Requests List ────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusTab, setStatusTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);

  // ── Fetch Designations ─────────────────────────────────────────────────────
  const fetchDesignations = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/designations`);
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.designations || [];
      setDesignations(list);
    } catch (err) {
      console.warn(
        '[CreateAgent] Could not load designations:',
        err?.response?.data || err.message
      );
    }
  }, []);

  // ── Fetch Agent Requests (GET /agent-requests) ─────────────────────────────
  const fetchRequests = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/agent-requests`);
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.requests || [];
      setRequests(raw);
    } catch (err) {
      console.error(
        '[CreateAgent] GET /agent-requests error:',
        err?.response?.data || err.message
      );
      toast.error(
        err?.response?.data?.message || 'Failed to load agent requests'
      );
      setRequests([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignations();
    fetchRequests();
  }, [fetchDesignations, fetchRequests]);

  // ── Member Lookup by Member ID ─────────────────────────────────────────────
  const handleMemberLookup = async () => {
    const mid = formData.member_id.trim();
    if (!mid) return toast.error('Please enter a Member ID');
    setMemberLookupLoading(true);
    setMemberInfo(null);
    try {
      // ── GET /get-members → filter by custom member ID client-side ──────
      const res = await axios.get(`${BASE_URL}/get-members`);
      let rawList = [];
      if (Array.isArray(res.data)) rawList = res.data;
      else if (Array.isArray(res.data?.data)) rawList = res.data.data;
      else if (res.data?.data && typeof res.data.data === 'object') rawList = [res.data.data];

      // Match by custom MemberId field — same logic as MemberList display ID
      const d = rawList.find((m) => {
        // MemberList shows: item.memberId || item.MemberId || item._id
        const idA = String(m.memberId  || '').toLowerCase();
        const idB = String(m.MemberId  || '').toLowerCase();
        const idC = String(m.member_id || '').toLowerCase();
        const search = mid.toLowerCase();
        return idA === search || idB === search || idC === search;
      });

      if (!d) {
        toast.error(`Member ID "${mid}" not found.`);
        return;
      }

      // ── Name: mirror EXACTLY what MemberList.jsx shows ────────────────
      // MemberList: let name = `${firstName} ${lastName}`.trim();
      const firstName = d.FirstName || d.firstname || d.first_name || '';
      const lastName  = d.LastName  || d.lastname  || d.last_name  || '';
      const memberName = `${firstName} ${lastName}`.trim()
        || d.MemberName || d.memberName || d.name || d.Name || '';

      const memberType =
        d.MemberType || d.member_type || d.type ||
        d.Category   || d.category    || 'Ordinary';
      const age        = d.Age  || d.age  || '';
      const branchId   = d.BranchCode || d.branchCode || d.branch_id || d.BranchId || '';
      const branchName = d.BranchName || d.branchName || '';

      // ── mongoId: the _id field that the backend expects ────────────────
      const mongoId = d._id || d.id || '';

      setMemberInfo({ memberName, memberType, age, branchId, branchName, mongoId, raw: d });
      setFormData((prev) => ({
        ...prev,
        branch_id: branchId || prev.branch_id,
      }));
    } catch (err) {
      console.error('[CreateAgent] Member lookup error:', err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || 'Failed to fetch members from server.');
      setMemberInfo(null);
    } finally {
      setMemberLookupLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMemberLookup();
    }
  };

  // ── Create Agent Request (POST /agent-requests) ────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { member_id, branch_id, designation_id } = formData;

    if (!member_id.trim()) return toast.error('Member ID is required');
    if (!memberInfo) return toast.error('Please search and select a valid Member first');
    if (!memberInfo.mongoId) return toast.error('Could not resolve Member MongoDB ID. Please re-search.');
    if (!branch_id.trim()) return toast.error('Branch ID is required');
    if (!designation_id) return toast.error('Please select a Designation');

    setSubmitting(true);
    showLoader();
    try {
      const payload = {
        member_id: memberInfo.mongoId,   // ← MongoDB _id (required by backend)
        branch_id: branch_id.trim(),
        designation_id,
        ...(formData.introducer_code
          ? { introducer_code: formData.introducer_code.trim() }
          : {}),
      };
      console.log('[CreateAgent] POST /agent-requests payload:', payload);
      const res = await axios.post(`${BASE_URL}/agent-requests`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      toast.success(
        res.data?.message || 'Agent request created successfully!'
      );
      setFormData({
        member_id: '',
        branch_id: '',
        designation_id: '',
        introducer_code: '',
      });
      setMemberInfo(null);
      fetchRequests();
    } catch (err) {
      // ── Full error details for backend debugging ───────────────────────
      console.group('%c[CreateAgent] POST /agent-requests FAILED', 'color:red;font-weight:bold');
      console.log('📦 Payload sent:',        {
        member_id:       memberInfo?.mongoId,
        branch_id:       formData.branch_id,
        designation_id:  formData.designation_id,
        introducer_code: formData.introducer_code || undefined,
      });
      console.log('🔴 HTTP Status:',         err?.response?.status);
      console.log('📨 Response data:',       err?.response?.data);
      console.log('📋 Response headers:',    err?.response?.headers);
      console.log('⚙️  Request config URL:', err?.config?.url);
      console.log('⚙️  Request method:',     err?.config?.method);
      console.log('⚙️  Request headers:',    err?.config?.headers);
      console.log('💥 Error message:',       err?.message);
      console.log('🔍 Full error object:',   err);
      console.groupEnd();

      toast.error(
        err?.response?.data?.message || err?.response?.data?.error ||
        err?.message || 'Failed to create agent request'
      );
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  // ── Approve / Reject (POST /agent-requests/<request_id>) ──────────────────
  const handleStatusUpdate = async (reqItem, newStatus) => {
    const reqId = reqItem?.request_id || reqItem?.id || reqItem?._id;
    if (!reqId) return toast.error('Invalid request ID');
    setUpdatingStatus(reqId);
    try {
      const res = await axios.post(
        `${BASE_URL}/agent-requests/${reqId}`,
        { status: newStatus },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success(
        res.data?.message || `Request ${newStatus} successfully!`
      );
      fetchRequests();
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('success')
      ) {
        toast.success(msg);
        fetchRequests();
        setUpdatingStatus(null);
        return;
      }
      // Fallback: FormData
      try {
        const fd = new FormData();
        fd.append('status', newStatus);
        const res2 = await axios.post(
          `${BASE_URL}/agent-requests/${reqId}`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        toast.success(
          res2.data?.message || `Request ${newStatus} successfully!`
        );
        fetchRequests();
      } catch (err2) {
        toast.error(
          err2?.response?.data?.message || `Failed to ${newStatus} request`
        );
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = requests.filter((r) => {
    const eff = getEffectiveStatus(r);
    const matchStatus = statusTab === 'ALL' || eff === statusTab;
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      (r.member_id || r.MemberId || '').toLowerCase().includes(term) ||
      (r.member_name || r.MemberName || r.name || '')
        .toLowerCase()
        .includes(term) ||
      (r.branch_id || r.BranchId || '').toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const counts = {
    ALL: requests.length,
    pending: requests.filter((r) => getEffectiveStatus(r) === 'pending').length,
    approved: requests.filter((r) => getEffectiveStatus(r) === 'approved').length,
    rejected: requests.filter((r) => getEffectiveStatus(r) === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-6">
      {/* ── CREATE FORM ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-[#54578C] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          CREATE AGENT
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {/* Row 1 */}
          <div className="flex flex-wrap items-end gap-4 text-xs font-semibold text-gray-700">
            {/* Date */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label>Date</label>
              <input
                type="text"
                value={today}
                readOnly
                className={readonlyCls}
              />
            </div>

            {/* Member ID with lookup */}
            <div className="flex flex-col gap-1 min-w-[170px]">
              <label>
                Member Id <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={formData.member_id}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, member_id: e.target.value }))
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. 0010000001"
                  className={inputCls + ' flex-1'}
                />
                <button
                  type="button"
                  onClick={handleMemberLookup}
                  disabled={memberLookupLoading}
                  title="Lookup Member"
                  className="px-2 py-1.5 bg-[#54578C] hover:bg-[#3d4068] text-white rounded transition flex items-center disabled:opacity-50"
                >
                  {memberLookupLoading ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Member Name (auto-filled) */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label>Member Name</label>
              <input
                type="text"
                value={memberInfo?.memberName || ''}
                readOnly
                placeholder="Auto-filled"
                className={readonlyCls}
              />
            </div>

            {/* Member Type (auto-filled) */}
            <div className="flex flex-col gap-1 min-w-[120px]">
              <label>Member Type</label>
              <input
                type="text"
                value={memberInfo?.memberType || ''}
                readOnly
                placeholder="Auto-filled"
                className={readonlyCls}
              />
            </div>

            {/* Age (auto-filled) */}
            <div className="flex flex-col gap-1 min-w-[70px]">
              <label>Age</label>
              <input
                type="text"
                value={memberInfo?.age || ''}
                readOnly
                placeholder="–"
                className={readonlyCls}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap items-end gap-4 text-xs font-semibold text-gray-700 mt-4">
            {/* Introducer Code */}
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label>Introducer Code</label>
              <input
                type="text"
                value={formData.introducer_code}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    introducer_code: e.target.value,
                  }))
                }
                placeholder="Optional"
                className={inputCls}
              />
            </div>

            {/* Branch ID */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label>
                Branch Id <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.branch_id}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, branch_id: e.target.value }))
                }
                placeholder="e.g. BR001"
                className={inputCls}
              />
            </div>

            {/* Designation */}
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label>
                Designation <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.designation_id}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    designation_id: e.target.value,
                  }))
                }
                className={inputCls}
              >
                <option value="">--Select--</option>
                {designations.map((d, i) => {
                  const id = d._id || d.id || i;
                  const name =
                    d.designationName ||
                    d.designation_name ||
                    d.name ||
                    d.designation ||
                    '';
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Spacer + Create button */}
            <div className="flex-1 flex justify-end items-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-1.5 bg-[#2A2B54] hover:bg-[#1E1F3D] text-white font-bold text-xs uppercase tracking-wider rounded transition shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Member info banner */}
          {memberInfo && (
            <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-xs text-emerald-800">
              <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Member found:{' '}
                <strong>{memberInfo.memberName}</strong>
                {memberInfo.branchName
                  ? ` — Branch: ${memberInfo.branchName}`
                  : ''}
                {memberInfo.memberType
                  ? ` — Type: ${memberInfo.memberType}`
                  : ''}
              </span>
            </div>
          )}
        </form>
      </div>

      {/* ── AGENT REQUESTS LIST ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-[#2D2E5F] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            AGENT REQUESTS
          </div>
          <button
            onClick={fetchRequests}
            disabled={listLoading}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-xs transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${listLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATUS_TABS.map((tab) => {
              const icons = {
                ALL: <Users className="w-4 h-4" />,
                pending: <Clock className="w-4 h-4" />,
                approved: <CheckCircle className="w-4 h-4" />,
                rejected: <XCircle className="w-4 h-4" />,
              };
              const colors = {
                ALL: 'bg-[#54578C]/10 text-[#54578C]',
                pending: 'bg-amber-100 text-amber-600',
                approved: 'bg-emerald-100 text-emerald-600',
                rejected: 'bg-red-100 text-red-600',
              };
              return (
                <div
                  key={tab.key}
                  onClick={() => setStatusTab(tab.key)}
                  className={`rounded-xl p-3 border cursor-pointer transition hover:shadow-sm ${
                    statusTab === tab.key
                      ? 'border-[#54578C] ring-2 ring-[#54578C]/20 bg-[#54578C]/5'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${colors[tab.key]}`}
                  >
                    {icons[tab.key]}
                  </div>
                  <div className="text-xl font-extrabold text-gray-800">
                    {counts[tab.key]}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400">
                    {tab.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap text-xs">
              {STATUS_TABS.map((tab) => {
                const activeClr = {
                  ALL: 'bg-[#54578C] text-white',
                  pending: 'bg-amber-500 text-white',
                  approved: 'bg-emerald-500 text-white',
                  rejected: 'bg-red-500 text-white',
                };
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      statusTab === tab.key
                        ? activeClr[tab.key]
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label} ({counts[tab.key]})
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search member, branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#54578C]/20 text-xs"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#2D2E5F] text-white font-bold text-xs uppercase tracking-wider">
                  <th className="py-2.5 px-4">S.No</th>
                  <th className="py-2.5 px-4">Request ID</th>
                  <th className="py-2.5 px-4">Member ID</th>
                  <th className="py-2.5 px-4">Member Name</th>
                  <th className="py-2.5 px-4">Branch ID</th>
                  <th className="py-2.5 px-4">Designation</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listLoading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-10 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-5 h-5 animate-spin text-[#54578C]" />
                        <span>Loading agent requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-10 text-center text-gray-400 font-medium"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-gray-300" />
                        <span>No agent requests found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => {
                    const reqId =
                      r.request_id || r.id || r._id || `REQ-${idx + 1}`;
                    const memberId =
                      r.member_id || r.MemberId || r.memberId || '—';
                    const memberName =
                      r.member_name || r.MemberName || r.name || '—';
                    const branchId =
                      r.branch_id || r.BranchId || r.branch || '—';
                    const designation =
                      r.designation_name ||
                      r.designationName ||
                      r.designation ||
                      r.designation_id ||
                      '—';
                    const eff = getEffectiveStatus(r);
                    const isUpdating = updatingStatus === reqId;
                    const isEven = idx % 2 === 1;

                    return (
                      <tr
                        key={reqId}
                        className={
                          isEven
                            ? 'bg-[#F0F4FF]'
                            : 'bg-white hover:bg-slate-50 transition'
                        }
                      >
                        <td className="py-2.5 px-4 font-medium text-gray-600">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-[#54578C] text-[11px]">
                          {reqId}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-gray-800">
                          {memberId}
                        </td>
                        <td className="py-2.5 px-4 text-gray-700">
                          {memberName}
                        </td>
                        <td className="py-2.5 px-4 text-gray-600">
                          {branchId}
                        </td>
                        <td className="py-2.5 px-4 text-gray-700">
                          {designation}
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusBadge status={eff} />
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => setSelectedReq(r)}
                              className="p-1.5 rounded text-gray-500 hover:text-[#54578C] hover:bg-[#54578C]/10 transition"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {eff !== 'approved' && (
                              <button
                                disabled={isUpdating}
                                onClick={() =>
                                  handleStatusUpdate(r, 'approved')
                                }
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 transition disabled:opacity-50"
                                title="Approve"
                              >
                                {isUpdating ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                Approve
                              </button>
                            )}
                            {eff !== 'rejected' && (
                              <button
                                disabled={isUpdating}
                                onClick={() =>
                                  handleStatusUpdate(r, 'rejected')
                                }
                                className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold flex items-center gap-1 transition disabled:opacity-50"
                                title="Reject"
                              >
                                {isUpdating ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                Reject
                              </button>
                            )}
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

      {/* ── VIEW DETAILS MODAL ───────────────────────────────────────────────── */}
      {selectedReq && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedReq(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#54578C]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#54578C]" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">
                  Agent Request Details
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  {selectedReq.request_id ||
                    selectedReq.id ||
                    selectedReq._id}
                </p>
              </div>
            </div>

            <div className="space-y-0 text-xs divide-y divide-gray-50">
              {[
                [
                  'Request ID',
                  selectedReq.request_id ||
                    selectedReq.id ||
                    selectedReq._id ||
                    '—',
                ],
                [
                  'Member ID',
                  selectedReq.member_id || selectedReq.MemberId || '—',
                ],
                [
                  'Member Name',
                  selectedReq.member_name ||
                    selectedReq.MemberName ||
                    '—',
                ],
                [
                  'Branch ID',
                  selectedReq.branch_id || selectedReq.BranchId || '—',
                ],
                [
                  'Designation',
                  selectedReq.designation_name ||
                    selectedReq.designationName ||
                    selectedReq.designation_id ||
                    '—',
                ],
                ['Status', getEffectiveStatus(selectedReq)],
                [
                  'Introducer Code',
                  selectedReq.introducer_code ||
                    selectedReq.IntroducerCode ||
                    '—',
                ],
                [
                  'Created At',
                  selectedReq.created_at || selectedReq.CreatedAt || '—',
                ],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2.5"
                >
                  <span className="font-semibold text-gray-500">{label}</span>
                  <span className="font-bold text-gray-800">
                    {label === 'Status' ? (
                      <StatusBadge status={val} />
                    ) : (
                      val
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between items-center gap-3 flex-wrap">
              <div className="flex gap-2">
                {getEffectiveStatus(selectedReq) !== 'approved' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedReq, 'approved');
                      setSelectedReq(null);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                )}
                {getEffectiveStatus(selectedReq) !== 'rejected' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedReq, 'rejected');
                      setSelectedReq(null);
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
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

export default CreateAgent;
