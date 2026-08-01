import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  CreditCard,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader,
  Clock,
  Check,
  X,
  Users,
  AlertCircle,
  FileText,
  Building,
  User,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';
import loanService from '../../api/loanService';

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
      timer: 4000,
      timerProgressBar: true,
    }),
};

const STATUS_TABS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const StatusBadge = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const map = {
    pending: { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending' },
    approved: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
    active: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
    rejected: { cls: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected' },
  };
  const { cls, label } = map[s] || map.pending;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {label}
    </span>
  );
};

const LoanRequests = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Caches for resolving IDs
  const [membersCache, setMembersCache] = useState([]);
  const [branchesCache, setBranchesCache] = useState([]);
  const [productsCache, setProductsCache] = useState([]);

  // ── Fetch Caches ────────────────────────────────────────────────────────────
  const fetchCaches = useCallback(async () => {
    try {
      const [mRes, bRes, pRes] = await Promise.all([
        axios.get(`${BASE_URL}/get-members`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/branches`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/loan-products`).catch(() => ({ data: [] })),
      ]);

      const mList = Array.isArray(mRes.data) ? mRes.data : mRes.data?.data || [];
      const bList = Array.isArray(bRes.data) ? bRes.data : bRes.data?.data || bRes.data?.branches || [];
      const pList = Array.isArray(pRes.data) ? pRes.data : pRes.data?.data || pRes.data?.products || [];

      setMembersCache(mList);
      setBranchesCache(bList);
      setProductsCache(pList);
    } catch (_) {
      /* silent */
    }
  }, []);

  // ── Fetch Loan Requests (GET /loan-requests) & Approved Loans (GET /loans) ────
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [rawRequests, rawApprovedLoans] = await Promise.all([
        loanService.getLoanRequests().catch(() => []),
        loanService.getAllApprovedLoans().catch(() => []),
      ]);

      console.log('[LoanRequests] GET /loan-requests count:', rawRequests.length);
      console.log('[LoanRequests] GET /loans count:', rawApprovedLoans.length);

      const normalizedRequests = rawRequests.map((item, idx) => {
        const id = item.request_id || item.requestId || item._id || item.id || `LOAN-REQ-${idx + 1}`;
        const rawStatus =
          item.status ||
          item.Status ||
          item.request_status ||
          item.approval_status ||
          'pending';

        return {
          raw: item,
          id,
          serialNo: `LR-${String(idx + 1).padStart(3, '0')}`,
          status: rawStatus.toString().toLowerCase(),
          createdAt: item.created_at || item.createdAt || item.date || 'N/A',
          isApprovedLoan: false,
        };
      });

      const normalizedApproved = rawApprovedLoans.map((item, idx) => {
        const id = item.loan_id || item.loanId || item._id || item.id || `LOAN-${idx + 1}`;
        return {
          raw: item,
          id,
          serialNo: `LN-${String(idx + 1).padStart(3, '0')}`,
          status: 'approved',
          createdAt: item.created_at || item.createdAt || item.date || item.approved_at || 'N/A',
          isApprovedLoan: true,
        };
      });

      // Combine lists and deduplicate by id
      const reqIdSet = new Set(normalizedRequests.map((r) => String(r.id)));
      const extraApproved = normalizedApproved.filter((a) => !reqIdSet.has(String(a.id)));

      setRequests([...normalizedRequests, ...extraApproved]);
    } catch (err) {
      console.error('[LoanRequests] Fetch error:', err);
      toast.error('Failed to load loan requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaches();
    fetchRequests();
  }, [fetchCaches, fetchRequests]);

  // ── Helper: resolve Member, Branch, Product details ────────────────────────
  const getMemberDetails = (item) => {
    const r = item?.raw || item || {};
    const mId = String(r.member_id || r.memberId || r.MemberId || '').toLowerCase();
    const found = membersCache.find(
      (m) =>
        String(m._id || m.id || '').toLowerCase() === mId ||
        String(m.memberId || m.member_id || '').toLowerCase() === mId
    );

    const firstName = r.FirstName || found?.FirstName || found?.firstname || '';
    const lastName = r.LastName || found?.LastName || found?.lastname || '';
    let name = `${firstName} ${lastName}`.trim() || r.memberName || r.MemberName || r.name || '';
    if (!name) name = mId ? `Member (${mId.slice(0, 8)})` : 'N/A';

    const displayMemberId =
      found?.memberId || found?.member_id || found?.MemberNo || r.memberId || r.MemberId || '—';

    return { name, displayMemberId, found };
  };

  const getBranchName = (item) => {
    const r = item?.raw || item || {};
    if (r.branchName || r.branch_name) return r.branchName || r.branch_name;
    const bId = String(r.branch_id || r.branchId || r.BranchId || '').toLowerCase();
    const found = branchesCache.find((b) => String(b._id || b.id || '').toLowerCase() === bId);
    return found?.BranchName || found?.branchName || found?.name || bId || '—';
  };

  const getProductName = (item) => {
    const r = item?.raw || item || {};
    if (r.selectedLoan || r.productName || r.product_name) return r.selectedLoan || r.productName || r.product_name;
    const pId = String(r.loan_product_id || r.productId || r.LoanProductId || '').toLowerCase();
    const found = productsCache.find((p) => String(p._id || p.id || '').toLowerCase() === pId);
    return found?.ProductName || found?.productName || found?.name || pId || '—';
  };

  // ── Status Update: POST /loan-requests-approval/<request_id> ──────────────
  const handleStatusUpdate = async (requestItem, newStatus) => {
    const r = requestItem?.raw || {};
    const requestId = String(r._id?.$oid || r._id || r.id || requestItem?.id || '').trim();
    if (!requestId) return toast.error('Cannot resolve ID for loan request');

    setUpdatingStatus(requestId);
    showLoader();

    const numRoi = parseFloat(r.interestRate || r.roi || r.interest_rate || 0);

    const payload = {
      status: newStatus,
      interestRate: numRoi,
    };

    console.log(`[LoanRequests] POST /loan-requests-approval/${requestId} →`, payload);

    try {
      const res = await loanService.updateLoanApproval(requestId, payload);
      toast.success(res?.message || `Loan request ${newStatus} successfully!`);
      fetchRequests();
    } catch (err) {
      console.error('[LoanRequests] Status update error:', err?.response?.data || err.message);
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || `Failed to mark request as ${newStatus}`
      );
    } finally {
      setUpdatingStatus(null);
      hideLoader();
    }
  };

  // ── View Particular Details: GET /loans/<loan_id> or POST /loan-requests/<request_id> ──
  const handleViewDetails = async (item) => {
    const r = item?.raw || {};
    const id = String(r.loan_id || r.loanId || r._id?.$oid || r._id || item?.id || '').trim();

    if (item.isApprovedLoan || ['approved', 'active'].includes(item.status)) {
      try {
        showLoader();
        const details = await loanService.getApprovedLoanById(id);
        setSelectedRequest({
          ...item,
          raw: { ...r, ...(typeof details === 'object' ? details : {}) },
        });
      } catch (_) {
        setSelectedRequest(item);
      } finally {
        hideLoader();
      }
    } else {
      setSelectedRequest(item);
    }
  };

  // ── Filtered Data ───────────────────────────────────────────────────────────
  const filtered = requests.filter((req) => {
    const r = req.raw || {};
    const { name, displayMemberId } = getMemberDetails(req);
    const branch = getBranchName(req);
    const product = getProductName(req);
    const agentCode = r.agentCode || r.agent_code || r.createdBy || r.introducer || '';

    // Filter by tab
    if (statusTab !== 'ALL' && req.status !== statusTab.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const match =
        name.toLowerCase().includes(q) ||
        displayMemberId.toLowerCase().includes(q) ||
        branch.toLowerCase().includes(q) ||
        product.toLowerCase().includes(q) ||
        agentCode.toLowerCase().includes(q) ||
        req.serialNo.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // KPI Counters
  const counts = {
    ALL: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => ['approved', 'active'].includes(r.status)).length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-600" />
            Loan Requests
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review, approve, or reject member loan applications
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATUS_TABS.map((tab) => {
          const icons = {
            ALL: <Users className="w-5 h-5 text-purple-600" />,
            pending: <Clock className="w-5 h-5 text-amber-600" />,
            approved: <CheckCircle className="w-5 h-5 text-emerald-600" />,
            rejected: <XCircle className="w-5 h-5 text-red-600" />,
          };
          const bg = {
            ALL: 'bg-purple-50',
            pending: 'bg-amber-50',
            approved: 'bg-emerald-50',
            rejected: 'bg-red-50',
          };
          const isSelected = statusTab === tab.key;
          return (
            <div
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`bg-white rounded-2xl p-4 border cursor-pointer transition shadow-sm ${
                isSelected
                  ? 'border-purple-600 ring-2 ring-purple-600/20'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-2.5 rounded-xl ${bg[tab.key]}`}>{icons[tab.key]}</span>
                <span className="text-2xl font-extrabold text-gray-900">{counts[tab.key]}</span>
              </div>
              <div className="mt-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                {tab.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap text-xs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusTab === tab.key
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search member, loan, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 text-xs"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-purple-600">
            <Loader className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm font-medium text-gray-600">Loading loan requests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ref. ID</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Loan Details</th>
                  <th className="py-3.5 px-4">Amount & EMI</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Agent Code</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-gray-300" />
                        <span>No loan requests found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const r = item.raw || {};
                    const { name, displayMemberId } = getMemberDetails(item);
                    const branch = getBranchName(item);
                    const product = getProductName(item);
                    const isUpdating = updatingStatus === item.id;
                    const amount = r.requestedAmount || r.loanAmount || 0;
                    const tenure = r.requestedTenure || r.loanTenure || '—';
                    const agentCode = r.agentCode || r.agent_code || r.createdBy || r.introducer || '—';

                    return (
                      <tr key={item.id} className="hover:bg-purple-50/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-purple-700 text-xs">
                          {item.serialNo}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{name}</div>
                          <div className="text-xs text-gray-400 font-mono">ID: {displayMemberId}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-gray-800">{product}</div>
                          <div className="text-gray-400">Tenure: {tenure} {r.durationIn || 'Months'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-emerald-700 text-sm">
                            ₹{Number(amount).toLocaleString('en-IN')}
                          </div>
                          {r.emi && <div className="text-gray-500 font-medium">EMI: ₹{r.emi}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                          {branch}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold">
                            {agentCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {item.status !== 'approved' && item.status !== 'active' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleStatusUpdate(item, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Approve
                              </button>
                            )}

                            {item.status !== 'rejected' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleStatusUpdate(item, 'rejected')}
                                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
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
        )}
      </div>

      {/* ── View Details Modal ───────────────────────────────────────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">
                  Loan Application Details
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Ref: {selectedRequest.serialNo} | ID: {selectedRequest.id}
                </p>
              </div>
            </div>

            {(() => {
              const r = selectedRequest.raw || {};
              const { name, displayMemberId } = getMemberDetails(selectedRequest);
              const branch = getBranchName(selectedRequest);
              const product = getProductName(selectedRequest);

              const rows = [
                ['Member Name', name],
                ['Member ID', displayMemberId],
                ['Member Type', r.memberType || 'Ordinary'],
                ['Branch', branch],
                ['Loan Product', product],
                ['Requested Amount', `₹${Number(r.requestedAmount || r.loanAmount || 0).toLocaleString('en-IN')}`],
                ['Requested Tenure', `${r.requestedTenure || r.loanTenure || '—'} ${r.durationIn || 'Months'}`],
                ['Frequency', r.frequency || '—'],
                ['Interest Type', r.interestType || 'Flat'],
                ['ROI (%)', `${r.roi || 0}%`],
                ['Calculated EMI', r.emi ? `₹${r.emi}` : '—'],
                ['Loan Purpose', r.loanPurpose || '—'],
                ['Guarantor Type', r.guarantorSelect || '—'],
                ['Guarantor Name', r.guarantorName ? `${r.guarantorName} (ID: ${r.guarantorId || '—'})` : '—'],
                ['Agent Code', r.agentCode || r.agent_code || r.createdBy || r.introducer || '—'],
                ['Agent Name', r.introducerName || '—'],
                ['Status', selectedRequest.status],
                ['Applied Date', selectedRequest.createdAt],
              ];

              return (
                <>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs divide-y sm:divide-y-0 divide-gray-100">
                    {rows.map(([label, val]) => (
                      <div key={label} className="flex justify-between items-center py-2 px-3 bg-gray-50/60 rounded-xl">
                        <span className="font-semibold text-gray-500">{label}</span>
                        <span className="font-bold text-gray-800 text-right max-w-[60%] break-words">
                          {label === 'Status' ? <StatusBadge status={val} /> : val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* ── Documents Section ─────────────────────────────────── */}
                  {(() => {
                    // Parse additionalDocs metadata
                    let docsMeta = [];
                    const rawAdditionalDocs = r.additionalDocs || r.documents || r.documentsMeta;
                    if (typeof rawAdditionalDocs === 'string') {
                      try { docsMeta = JSON.parse(rawAdditionalDocs); } catch (_) {}
                    } else if (Array.isArray(rawAdditionalDocs)) {
                      docsMeta = rawAdditionalDocs;
                    }

                    // Build unified doc list from metadata + top-level URL fields
                    const docList = [];

                    // From docsMeta / additionalDocs array
                    if (docsMeta.length > 0) {
                      docsMeta.forEach((doc) => {
                        const url = r[doc.fileKey] || r[doc.name] || doc.fileData || doc.url || null;
                        docList.push({
                          name: doc.name || doc.fileKey || 'Document',
                          number: doc.number || '',
                          url,
                          fileName: doc.fileName || '',
                        });
                      });
                    }

                    // Fallback top-level image fields if not already added
                    const topLevelDocs = [
                      { key: 'bankStatement',  label: 'Bank Statement' },
                      { key: 'bank_statement', label: 'Bank Statement' },
                      { key: 'form16',         label: 'Form 16 / Balance Sheet' },
                      { key: 'otherDocument',  label: 'Other Document' },
                      { key: 'otherDoc',       label: 'Other Document' },
                    ];
                    topLevelDocs.forEach(({ key, label }) => {
                      if (r[key] && !docList.some((d) => d.name === label)) {
                        docList.push({ name: label, url: r[key], number: '', fileName: '' });
                      }
                    });

                    if (docList.length === 0) return null;

                    return (
                      <div className="mt-5">
                        <div className="bg-[#3B3C6E] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl">
                          📄 Uploaded Documents ({docList.length})
                        </div>
                        <div className="border border-gray-100 rounded-b-xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {docList.map((doc, idx) => {
                            const isImage = doc.url && (
                              doc.url.startsWith('data:image') ||
                              /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(doc.fileName || doc.url || '')
                            );
                            const isBase64 = doc.url && doc.url.startsWith('data:');
                            const hasUrl = !!doc.url;

                            return (
                              <div key={idx} className="flex flex-col items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                {/* Preview */}
                                {isImage && doc.url ? (
                                  <img
                                    src={doc.url}
                                    alt={doc.name}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer"
                                    onClick={() => window.open(doc.url, '_blank')}
                                    title="Click to view full size"
                                  />
                                ) : (
                                  <div className="w-full h-24 rounded-lg bg-purple-50 border border-purple-100 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-purple-100 transition"
                                    onClick={() => hasUrl && window.open(doc.url, '_blank')}
                                  >
                                    <FileText className="w-8 h-8 text-purple-400" />
                                    <span className="text-[10px] text-purple-500 font-medium text-center px-1">
                                      {doc.fileName || 'File'}
                                    </span>
                                  </div>
                                )}

                                {/* Name & Number */}
                                <div className="w-full">
                                  <p className="text-[11px] font-bold text-gray-700 text-center truncate">{doc.name}</p>
                                  {doc.number && (
                                    <p className="text-[10px] text-gray-400 text-center font-mono">#{doc.number}</p>
                                  )}
                                </div>

                                {/* View Button */}
                                {hasUrl && (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full text-center text-[11px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg py-1 transition"
                                  >
                                    View
                                  </a>
                                )}
                                {!hasUrl && (
                                  <span className="w-full text-center text-[11px] text-gray-400 bg-gray-100 rounded-lg py-1">
                                    No file URL
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </>
              );
            })()}

            <div className="mt-6 flex justify-between items-center gap-3 pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                {selectedRequest.status !== 'approved' && selectedRequest.status !== 'active' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRequest, 'approved');
                      setSelectedRequest(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Approve Request
                  </button>
                )}

                {selectedRequest.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRequest, 'rejected');
                      setSelectedRequest(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    Reject Request
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
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

export default LoanRequests;
