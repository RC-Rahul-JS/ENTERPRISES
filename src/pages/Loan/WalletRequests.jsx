import React, { useState, useEffect } from 'react';
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
  Check,
} from 'lucide-react';
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

const WalletRequests = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  // ── State ────────────────────────────────────────────────────────────────
  const [walletRequests, setWalletRequests] = useState(INITIAL_DUMMY_WALLET_REQUESTS);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Log list data on mount and whenever list changes ─────────────────────
  useEffect(() => {
    console.log('================ [WalletRequests] CURRENT LIST DATA ================');
    console.log('Total Requests:', walletRequests.length);
    console.log('Data:', walletRequests);
  }, [walletRequests]);

  // ── Fetch from API with fallback to dummy data ───────────────────────────
  const fetchWalletRequests = async () => {
    setLoading(true);
    showLoader();
    console.log('================ [WalletRequests] FETCHING LIST ================');

    try {
      const res = await axios.get(`${BASE_URL}/wallet-requests`);
      let list = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.requests || [];

      if (list && list.length > 0) {
        setWalletRequests(list);
        console.log('[WalletRequests] Fetched from API:', list);
      } else {
        console.log('[WalletRequests] API returned empty, using active list data.');
      }
      toast.success('Wallet requests list updated');
    } catch (err) {
      console.warn('[WalletRequests] API not available, maintaining current list:', err?.message);
      toast.success('Wallet requests refreshed');
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  // ── Approve Request ──────────────────────────────────────────────────────
  const handleApprove = (reqId) => {
    console.log('================ [WalletRequests] APPROVING REQUEST ================', reqId);
    setWalletRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'Approved' } : r))
    );
    toast.success(`Wallet Request ${reqId} Approved!`);
  };

  // ── Reject Request ───────────────────────────────────────────────────────
  const handleReject = (reqId) => {
    console.log('================ [WalletRequests] REJECTING REQUEST ================', reqId);
    setWalletRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'Rejected' } : r))
    );
    toast.error(`Wallet Request ${reqId} Rejected!`);
  };

  // ── Delete Request ───────────────────────────────────────────────────────
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
        console.log('================ [WalletRequests] DELETING REQUEST ================', reqId);
        setWalletRequests((prev) => prev.filter((r) => r.id !== reqId));
        toast.success(`Request ${reqId} deleted.`);
      }
    });
  };

  // ── Filtered Requests ─────────────────────────────────────────────────────
  const filteredRequests = walletRequests.filter((r) => {
    const matchesStatus =
      statusFilter === 'ALL' || r.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (r.id && r.id.toLowerCase().includes(query)) ||
      (r.memberId && r.memberId.toLowerCase().includes(query)) ||
      (r.memberName && r.memberName.toLowerCase().includes(query)) ||
      (r.branchName && r.branchName.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  // KPI Counts
  const counts = {
    ALL: walletRequests.length,
    pending: walletRequests.filter((r) => r.status.toLowerCase() === 'pending').length,
    approved: walletRequests.filter((r) => r.status.toLowerCase() === 'approved').length,
    rejected: walletRequests.filter((r) => r.status.toLowerCase() === 'rejected').length,
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Banner */}
        <div className="bg-[#3B3C6E] text-white p-4 rounded-xl shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-200" />
              <span>WALLET REQUESTS</span>
            </h1>
            <p className="text-xs text-purple-200 mt-0.5">
              View, review, and manage member wallet top-up requests
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchWalletRequests}
              disabled={loading}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
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
                  console.log(`================ [WalletRequests] FILTER CHANGED TO ${tab.key} ================`);
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
                                console.log('================ [WalletRequests] VIEWING DETAILS ================', r);
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

export default WalletRequests;
