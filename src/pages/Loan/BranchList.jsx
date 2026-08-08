import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Building2,
  MapPin,
  Phone,
  Hash,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  RefreshCw,
  Search,
  Loader,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL as localprimeBase } from '../../config/api';

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
  dismiss: () => Swal.close(),
};

const BranchList = () => {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedBranch, setSelectedBranch] = useState(null); // View Modal
  const [editingBranch, setEditingBranch] = useState(null); // Edit Modal
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const getField = (obj, candidates) => {
    if (!obj || typeof obj !== 'object') return null;
    for (const c of candidates) {
      if (obj[c] !== undefined && obj[c] !== null && String(obj[c]).trim() !== '') {
        return obj[c];
      }
    }
    const normMap = {};
    for (const [k, v] of Object.entries(obj)) {
      const nk = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        normMap[nk] = v;
      }
    }
    for (const c of candidates) {
      const nc = String(c).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normMap[nc] !== undefined) {
        return normMap[nc];
      }
    }
    return null;
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${localprimeBase}/branches`);
      console.log('=== [BRANCH LIST] FETCH RESPONSE JSON ===', res.data);

      let rawList = [];
      if (Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res.data?.data)) {
        rawList = res.data.data;
      } else if (Array.isArray(res.data?.branches)) {
        rawList = res.data.branches;
      } else if (Array.isArray(res.data?.list)) {
        rawList = res.data.list;
      } else if (res.data && typeof res.data === 'object') {
        const arrayProp = Object.values(res.data).find((val) => Array.isArray(val));
        if (arrayProp) {
          rawList = arrayProp;
        } else if (res.data.data && typeof res.data.data === 'object') {
          rawList = [res.data.data];
        } else {
          rawList = [res.data];
        }
      }

      if (rawList.length > 0) {
        console.log('=== [BRANCH LIST] FIRST ITEM KEYS ===', Object.keys(rawList[0]));
        console.log('=== [BRANCH LIST] FIRST ITEM DATA ===', rawList[0]);
      }

      const normalized = rawList.map((item, idx) => {
        const id =
          getField(item, ['branch_id', 'branchid', 'branch_id', '_id', 'id']) ||
          `BR-${100 + idx}`;

        const rawStatus =
          getField(item, [
            'status',
            'branch_status',
            'branchstatus',
            'is_active',
            'isactive',
            'active',
          ]) || 'active';
        const statusStr = String(rawStatus).toLowerCase().trim();
        const status =
          statusStr === 'inactive' ||
          statusStr === 'false' ||
          statusStr === '0' ||
          statusStr === 'deactive' ||
          statusStr === 'deactivated'
            ? 'inactive'
            : 'active';

        let branchName =
          getField(item, [
            'branchname',
            'branch_name',
            'name',
            'title',
            'showroom',
            'showroomname',
            'branch',
            'branch_title',
            'locationname',
          ]) || 'Unnamed Branch';

        if (branchName === 'Unnamed Branch' && item && typeof item === 'object') {
          for (const [k, v] of Object.entries(item)) {
            const lk = String(k).toLowerCase();
            if (
              typeof v === 'string' &&
              v.trim() !== '' &&
              !lk.includes('id') &&
              !lk.includes('code') &&
              !lk.includes('status') &&
              !lk.includes('date') &&
              !lk.includes('created') &&
              !lk.includes('time') &&
              !lk.includes('phone') &&
              !lk.includes('mobile') &&
              !lk.includes('pin')
            ) {
              branchName = v;
              break;
            }
          }
        }

        const branchCode =
          getField(item, [
            'branchcode',
            'branch_code',
            'code',
            'branchno',
            'branch_no',
            'branch_id',
            'branchid',
            'id',
          ]) || 'N/A';

        const address =
          getField(item, [
            'address',
            'complete_address',
            'completeaddress',
            'permanentadd',
            'location',
            'street',
          ]) || '';

        const city =
          getField(item, [
            'city',
            'branch_city',
            'branchcity',
            'district',
          ]) || '';

        const state =
          getField(item, [
            'state',
            'branch_state',
            'branchstate',
          ]) || 'Madhya Pradesh';

        const pincode =
          getField(item, [
            'pincode',
            'pin_code',
            'zip',
            'zipcode',
            'postalcode',
            'pin',
          ]) || '';

        let contactNumber =
          getField(item, [
            'contactnumber',
            'contact_number',
            'phone',
            'mobile',
            'mobileno',
            'mobile_no',
            'phoneno',
            'contact',
            'contactno',
          ]) || 'N/A';

        if (contactNumber === 'N/A' && item && typeof item === 'object') {
          for (const [k, v] of Object.entries(item)) {
            const strVal = String(v || '').trim();
            if (/^\d{10,12}$/.test(strVal)) {
              contactNumber = strVal;
              break;
            }
          }
        }

        return {
          raw: item,
          id,
          branchName,
          branchCode,
          address,
          city,
          state,
          pincode,
          contactNumber,
          status,
          createdAt: item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : item.createdAt || '',
        };
      });

      setBranches(normalized);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to fetch branch list'
      );
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // --- Toggle Active/Inactive Status ---
  const handleToggleStatus = async (branch) => {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    setTogglingId(branch.id);

    const payload = {
      branchName: branch.branchName || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      pincode: branch.pincode || '',
      contactNumber: branch.contactNumber || '',
      status: newStatus,
    };

    try {
      const res = await axios.post(
        `${localprimeBase}/branches/${branch.id}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success(
        res.data?.message || `Branch marked as ${newStatus.toUpperCase()}!`
      );
      fetchBranches();
    } catch (error) {
      console.error('Toggle status JSON error, trying FormData fallback:', error);
      try {
        const fd = new FormData();
        Object.keys(payload).forEach((key) => {
          fd.append(key, payload[key] || '');
        });

        const res2 = await axios.post(
          `${localprimeBase}/branches/${branch.id}`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        toast.success(
          res2.data?.message || `Branch marked as ${newStatus.toUpperCase()}!`
        );
        fetchBranches();
      } catch (err2) {
        toast.error(
          err2?.response?.data?.message || `Failed to update branch status`
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  // --- Open Edit Modal ---
  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setEditFormData({
      branchName: branch.branchName,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      pincode: branch.pincode,
      contactNumber: branch.contactNumber,
      status: branch.status,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBranch) return;

    setSavingEdit(true);
    const payload = {
      branchName: editFormData.branchName,
      address: editFormData.address,
      city: editFormData.city,
      state: editFormData.state,
      pincode: editFormData.pincode,
      contactNumber: editFormData.contactNumber,
      status: editFormData.status,
    };

    console.log('=== [UPDATE BRANCH] SUBMITTING JSON DATA ===', JSON.stringify(payload, null, 2));
    console.log('=== [UPDATE BRANCH] SUBMITTING PAYLOAD OBJECT ===', payload);

    try {
      const res = await axios.post(
        `${localprimeBase}/branches/${editingBranch.id}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('=== [UPDATE BRANCH] SUCCESS RESPONSE JSON ===', res.data);
      toast.success(res.data?.message || 'Branch updated successfully!');
      fetchBranches();
      setEditingBranch(null);
    } catch (error) {
      console.error('Edit JSON error, trying FormData fallback:', error);
      try {
        const fd = new FormData();
        Object.keys(payload).forEach((key) => {
          fd.append(key, payload[key] || '');
        });

        const res2 = await axios.post(
          `${localprimeBase}/branches/${editingBranch.id}`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        console.log('=== [UPDATE BRANCH] FORMDATA FALLBACK SUCCESS RESPONSE ===', res2.data);
        toast.success(res2.data?.message || 'Branch updated successfully!');
        fetchBranches();
        setEditingBranch(null);
      } catch (err2) {
        toast.error(
          err2?.response?.data?.message || 'Failed to update branch details'
        );
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter Logic
  const filteredBranches = branches.filter((b) => {
    const matchesStatus =
      statusFilter === 'ALL' || b.status === statusFilter.toLowerCase();
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      String(b.branchName || '').toLowerCase().includes(s) ||
      String(b.branchCode || '').toLowerCase().includes(s) ||
      String(b.city || '').toLowerCase().includes(s) ||
      String(b.contactNumber || '').toLowerCase().includes(s) ||
      String(b.state || '').toLowerCase().includes(s) ||
      String(b.address || '').toLowerCase().includes(s);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    ALL: branches.length,
    active: branches.filter((b) => b.status === 'active').length,
    inactive: branches.filter((b) => b.status === 'inactive').length,
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs outline-none transition';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-purple-600" />
            Branch Management Directory
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all branch and showroom locations, edit details, and toggle active status.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/loan/create_branch')}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-purple-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Branch
          </button>
          <button
            onClick={fetchBranches}
            disabled={loading}
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition border border-purple-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { key: 'ALL', label: 'Total Branches', color: 'bg-purple-100 text-purple-600', icon: <Building2 className="w-5 h-5" /> },
          { key: 'active', label: 'Active Branches', color: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle className="w-5 h-5" /> },
          { key: 'inactive', label: 'Inactive Branches', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-5 h-5" /> },
        ].map((tab) => (
          <div
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition hover:shadow-md ${
              statusFilter === tab.key
                ? 'border-purple-400 ring-2 ring-purple-200'
                : 'border-gray-100'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tab.color}`}
            >
              {tab.icon}
            </div>
            <div className="text-2xl font-extrabold text-gray-800">
              {counts[tab.key]}
            </div>
            <div className="text-xs font-semibold text-gray-400 mt-0.5">
              {tab.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'ALL', label: 'All Branches' },
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' },
          ].map((tab) => {
            const activeClr = {
              ALL: 'bg-purple-600 text-white',
              active: 'bg-emerald-500 text-white',
              inactive: 'bg-gray-500 text-white',
            };
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === tab.key
                    ? activeClr[tab.key]
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            );
          })}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, code, city, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader className="w-8 h-8 animate-spin text-purple-600 mb-3" />
            <p className="text-sm font-semibold">Loading Branches...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Branch Name</th>
                  <th className="py-3.5 px-4">Contact Number</th>
                  <th className="py-3.5 px-4">City & State</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredBranches.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      No branches found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => {
                    const isToggling = togglingId === branch.id;
                    return (
                      <tr
                        key={branch.id}
                        className="hover:bg-purple-50/30 transition"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                          {branch.branchCode}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          {branch.branchName}
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {branch.contactNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-800">
                            {branch.city || 'N/A'}
                          </div>
                          <div className="text-gray-400 text-[11px]">
                            {branch.state} {branch.pincode ? `(${branch.pincode})` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-gray-500">
                          {branch.address || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              branch.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {branch.status === 'active' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {branch.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => setSelectedBranch(branch)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition"
                              title="View Branch Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(branch)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Edit Branch"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              disabled={isToggling}
                              onClick={() => handleToggleStatus(branch)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                branch.status === 'active'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              } disabled:opacity-50`}
                              title={
                                branch.status === 'active'
                                  ? 'Deactivate Branch'
                                  : 'Activate Branch'
                              }
                            >
                              {isToggling ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : branch.status === 'active' ? (
                                <>
                                  <ToggleLeft className="w-3.5 h-3.5" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="w-3.5 h-3.5" />
                                  Activate
                                </>
                              )}
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
        )}
      </div>

      {/* --- View Modal --- */}
      {selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Branch Details — {selectedBranch.branchCode}
              </h3>
              <button
                onClick={() => setSelectedBranch(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex justify-between items-center">
                <div>
                  <span className="text-gray-400 font-semibold block text-[11px]">
                    Branch Name
                  </span>
                  <span className="text-sm font-extrabold text-gray-800">
                    {selectedBranch.branchName}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold ${
                    selectedBranch.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {selectedBranch.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold block">
                    Branch Code
                  </span>
                  <span className="font-bold text-gray-800 font-mono">
                    {selectedBranch.branchCode}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold block">
                    Contact Number
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedBranch.contactNumber}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold block">
                    City
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedBranch.city || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold block">
                    State
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedBranch.state || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold block">
                    PIN Code
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedBranch.pincode || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold block">
                    Created Date
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedBranch.createdAt || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-semibold block">
                  Complete Address
                </span>
                <span className="font-semibold text-gray-700">
                  {selectedBranch.address || 'N/A'}
                </span>
              </div>

              {/* Show any additional custom fields returned by backend */}
              {selectedBranch.raw && typeof selectedBranch.raw === 'object' && (
                <div className="mt-2 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Additional Server Record Details
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-3 rounded-xl max-h-36 overflow-y-auto">
                    {Object.entries(selectedBranch.raw).map(([key, value]) => {
                      if (
                        [
                          'branchName',
                          'branch_name',
                          'BranchName',
                          'branchCode',
                          'branch_code',
                          'BranchCode',
                          'contactNumber',
                          'contact_number',
                          'ContactNumber',
                          'city',
                          'City',
                          'state',
                          'State',
                          'pincode',
                          'PinCode',
                          'address',
                          'Address',
                          'status',
                          'Status',
                          'created_at',
                          'createdAt',
                        ].includes(key)
                      ) {
                        return null;
                      }
                      return (
                        <div key={key} className="truncate">
                          <span className="text-gray-400 font-semibold block">
                            {key}:
                          </span>
                          <span className="text-gray-700 font-mono">
                            {String(value ?? 'N/A')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  const b = selectedBranch;
                  setSelectedBranch(null);
                  handleOpenEdit(b);
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition"
              >
                Edit Branch
              </button>
              <button
                onClick={() => setSelectedBranch(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Branch — {editingBranch.branchCode}
              </h3>
              <button
                onClick={() => setEditingBranch(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={editFormData.branchName || ''}
                    onChange={handleEditChange}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={editFormData.contactNumber || ''}
                    onChange={handleEditChange}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editFormData.status || 'active'}
                    onChange={handleEditChange}
                    className={inputCls}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={editFormData.city || ''}
                    onChange={handleEditChange}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={editFormData.state || ''}
                    onChange={handleEditChange}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={editFormData.pincode || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">
                  Complete Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={editFormData.address || ''}
                  onChange={handleEditChange}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEdit ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchList;
