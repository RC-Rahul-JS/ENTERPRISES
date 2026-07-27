import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Users,
  Search,
  Eye,
  Edit,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Loader,
  Phone,
  CreditCard,
  Calendar,
} from 'lucide-react';
import statejosn from './statedistrict.json';

const BASE_URL =
  import.meta.env.VITE_LOCALPRIME_URL ||
  'http://192.168.29.145:5000/badri_enterprises/localprime';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

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

const fieldMapping = {
  branchname: 'BranchName',
  branch: 'BranchCode',
  aadharnumber: 'Aadhar',
  title: 'Title',
  firstname: 'FirstName',
  lastname: 'LastName',
  fathername: 'FatherName',
  dob: 'DateOfBirth',
  age: 'Age',
  gender: 'Gender',
  category: 'Category',
  mobile: 'MobileNo',
  email: 'Email',
  occupation: 'Occupation',
  officeaddress: 'OfficialAdd',
  income: 'MonthlyIncome',
  paddress: 'PermanentAdd',
  city: 'City',
  district: 'District',
  state: 'State',
  pincode: 'PinCode',
  caddress: 'ResidenceAdd',
  ccity: 'RCity',
  cdistrict: 'RDistrict',
  cstate: 'Rstate',
  cpincode: 'RPinCode',
  introducerid: 'MemberId',
  introducername: 'MemberName',
  peroidknown: 'Duration',
  nomineetitle: 'NomTitle',
  nomineename: 'NomName',
  nomineerelation: 'NomRelation',
  nomineeage: 'NomAge',
  nomineedob: 'NomDOB',
  nomineeaddress: 'NomAddress',
  gurdianname: 'GurName',
  gurdianrelation: 'GurRelationship',
  gurdianage: 'GurAge',
  idproof: 'KycIdproof',
  idproofnumber: 'KycDocNo',
  addressproof: 'KycAddProof',
  addressproofnumber: 'KycTdocNo',
};

const MemberRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // --- Fetch ---
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/member-requests`);
      console.log('Member Requests raw response:', res.data);

      let rawList = [];
      if (Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res.data?.data)) {
        rawList = res.data.data;
      } else if (Array.isArray(res.data?.requests)) {
        rawList = res.data.requests;
      } else if (res.data?.data && typeof res.data.data === 'object') {
        rawList = [res.data.data];
      }
      // Note: we intentionally do NOT push the whole res.data object
      // when it's just a wrapper — only push objects that look like member records

      const normalized = rawList.map((item, idx) => {
        const id =
          item.request_id || item.requestId || item._id ||
          item.memberId || item.MemberId || `REQ-${1000 + idx}`;
        const firstName = item.FirstName || item.firstname || item.first_name || '';
        const lastName = item.LastName || item.lastname || item.last_name || '';
        const name = `${firstName} ${lastName}`.trim() || id;
        const rawStatus =
          item.status ||
          item.Status ||
          item.request_status ||
          item.requestStatus ||
          item.RequestStatus ||
          item.approval_status ||
          item.approvalStatus ||
          item.member_status ||
          item.MemberStatus ||
          item.req_status ||
          (item.is_approved ? 'approved' : '') ||
          (item.approved ? 'approved' : '') ||
          '';
        // Normalise to lowercase string
        const status = rawStatus.toString().toLowerCase();
        return {
          raw: item, id,
          memberName: name, firstName, lastName,
          phone: item.MobileNo || item.phone || item.mobile || 'N/A',
          email: item.Email || item.email || '',
          city: item.City || item.city || '',
          state: item.State || item.state || '',
          address: item.PermanentAdd || item.address || '',
          aadhaar: item.Aadhar || item.aadhaar || '',
          status,
          gender: item.Gender || item.gender || 'N/A',
          fatherSpouseName: item.FatherName || item.fathername || '',
          category: item.Category || item.category || '',
          occupation: item.Occupation || item.occupation || '',
          createdAt: item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : item.ReceiptDate || 'N/A',
        };
      });
      setRequests(normalized);
    } catch (error) {
      console.error('Error fetching member requests:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch member requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // --- Status Update ---
  const getReqId = (req) =>
    req?.raw?.request_id || req?.raw?.requestId || req?.raw?._id || req?.id;

  // API only accepts 'approved' or 'rejected' (lowercase)
  // Send as FormData so Flask's data.get('status') / request.form.get('status') works
  const handleStatusUpdate = async (requestItem, newStatus) => {
    const requestId = getReqId(requestItem);
    setUpdatingStatus(requestId);
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      const res = await axios.post(
        `${BASE_URL}/update-member-request/${requestId}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success(res.data?.message || `Request marked as ${newStatus}!`);
      fetchRequests();
    } catch (error) {
      const msg = error?.response?.data?.message || '';
      // If server says 'already approved' / 'already rejected', treat as success & refresh
      if (
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('approved') ||
        msg.toLowerCase().includes('success')
      ) {
        toast.success(msg || `Request is already ${newStatus}!`);
        fetchRequests();
        return;
      }
      console.error('Status update error:', error?.response?.data || error.message);
      // Fallback: try JSON body in case server reads request.get_json()
      try {
        const res2 = await axios.post(
          `${BASE_URL}/update-member-request/${requestId}`,
          { status: newStatus },
          { headers: { 'Content-Type': 'application/json' } }
        );
        toast.success(res2.data?.message || `Request marked as ${newStatus}!`);
        fetchRequests();
      } catch (err2) {
        const msg2 = err2?.response?.data?.message || '';
        if (
          msg2.toLowerCase().includes('already') ||
          msg2.toLowerCase().includes('approved') ||
          msg2.toLowerCase().includes('success')
        ) {
          toast.success(msg2 || `Request is already ${newStatus}!`);
          fetchRequests();
          return;
        }
        toast.error(msg2 || `Failed to mark as ${newStatus}`);
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  // --- Edit ---
  const handleOpenEdit = (req) => {
    setEditingRequest(req);
    const r = req.raw || {};
    setEditFormData({
      id: getReqId(req),
      branchname: r.BranchName || '', branch: r.BranchCode || '',
      aadharnumber: r.Aadhar || req.aadhaar || '',
      title: r.Title || 'Mr',
      firstname: r.FirstName || req.firstName || '',
      lastname: r.LastName || req.lastName || '',
      fathername: r.FatherName || req.fatherSpouseName || '',
      dob: r.DateOfBirth || '', age: r.Age || '',
      gender: r.Gender || req.gender || 'Male',
      category: r.Category || req.category || '',
      mobile: r.MobileNo || req.phone || '',
      email: r.Email || req.email || '',
      occupation: r.Occupation || req.occupation || '',
      officeaddress: r.OfficialAdd || '', income: r.MonthlyIncome || '',
      paddress: r.PermanentAdd || req.address || '',
      city: r.City || req.city || '', district: r.District || '',
      state: r.State || req.state || 'Madhya Pradesh', pincode: r.PinCode || '',
      caddress: r.ResidenceAdd || '', ccity: r.RCity || '',
      cdistrict: r.RDistrict || '', cstate: r.Rstate || 'Madhya Pradesh', cpincode: r.RPinCode || '',
      introducerid: r.MemberId || '', introducername: r.MemberName || '', peroidknown: r.Duration || '',
      nomineetitle: r.NomTitle || 'Mr', nomineename: r.NomName || '',
      nomineerelation: r.NomRelation || '', nomineeage: r.NomAge || '',
      nomineedob: r.NomDOB || '', nomineeaddress: r.NomAddress || '',
      gurdianname: r.GurName || '', gurdianrelation: r.GurRelationship || '', gurdianage: r.GurAge || '',
      idproof: r.KycIdproof || 'Aadhar', idproofnumber: r.KycDocNo || '',
      addressproof: r.KycAddProof || 'Aadhar', addressproofnumber: r.KycTdocNo || '',
      UploadPhoto: r.UploadPhoto || '', UploadId: r.UploadId || '',
      UploadId2: r.UploadId2 || '', UploadAddress: r.UploadAddress || '', UploadAddress2: r.UploadAddress2 || '',
      photo: null, idfront: null, idback: null, addfront: null, addback: null,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setEditFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    const requestId = editFormData.id;
    const orig = editingRequest?.raw || {};
    const formDataPayload = new FormData();
    let hasChanges = false;

    Object.keys(fieldMapping).forEach((formKey) => {
      const apiKey = fieldMapping[formKey];
      const origVal = orig[apiKey] || '';
      const newVal = editFormData[formKey] !== undefined ? editFormData[formKey] : '';
      if (String(newVal).trim() !== String(origVal).trim()) {
        formDataPayload.append(apiKey, newVal);
        hasChanges = true;
      }
    });

    const fileFields = [
      { key: 'photo', up: 'UploadPhoto' }, { key: 'idfront', up: 'UploadId' },
      { key: 'idback', up: 'UploadId2' }, { key: 'addfront', up: 'UploadAddress' },
      { key: 'addback', up: 'UploadAddress2' },
    ];
    fileFields.forEach(({ key, up }) => {
      if (editFormData[key] instanceof File) {
        formDataPayload.append(key, editFormData[key]);
        formDataPayload.append(up, editFormData[key]);
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      Swal.fire('No Changes', 'No fields were modified.', 'info');
      setSavingEdit(false);
      setEditingRequest(null);
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/update-member-request/${requestId}`,
        formDataPayload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success(res.data?.message || 'Request updated successfully!');
      fetchRequests();
      setEditingRequest(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update request');
    } finally {
      setSavingEdit(false);
    }
  };

  // --- Filter & Smart Status Detection ---
  // Recognize all synonyms ('approved', 'accepted', 'active', etc.) from backend
  const getEffectiveStatus = (r) => {
    const s = (
      r.status ||
      r.raw?.Status ||
      r.raw?.status ||
      r.raw?.request_status ||
      r.raw?.approval_status ||
      r.raw?.member_status ||
      ''
    )
      .toString()
      .toLowerCase();
    if (
      s === 'approved' ||
      s === 'accepted' ||
      s === 'active' ||
      s === 'verified' ||
      s === 'true' ||
      s === '1'
    ) {
      return 'approved';
    }
    if (s === 'rejected' || s === 'false' || s === '0') {
      return 'rejected';
    }
    return 'pending';
  };

  const filtered = requests.filter((r) => {
    const eff = getEffectiveStatus(r);
    const matchesStatus = statusTab === 'ALL' || eff === statusTab;
    const matchesSearch =
      r.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone?.includes(searchTerm) ||
      r.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    ALL: requests.length,
    pending: requests.filter((r) => getEffectiveStatus(r) === 'pending').length,
    approved: requests.filter((r) => getEffectiveStatus(r) === 'approved').length,
    rejected: requests.filter((r) => getEffectiveStatus(r) === 'rejected').length,
  };

  const StatusBadge = ({ status, requestObj }) => {
    const eff = requestObj ? getEffectiveStatus(requestObj) : getEffectiveStatus({ status });
    const map = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${map[eff] || 'bg-gray-100 text-gray-600'}`}>
        {labels[eff] || eff}
      </span>
    );
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs outline-none transition';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Clock className="w-7 h-7 text-amber-500" />
            Member Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review, accept, reject, and edit incoming member applications.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition border border-purple-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {STATUS_TABS.map((tab) => {
          const icons = {
            ALL: <Users className="w-5 h-5" />,
            pending: <Clock className="w-5 h-5" />,
            approved: <CheckCircle className="w-5 h-5" />,
            rejected: <XCircle className="w-5 h-5" />,
          };
          const colors = {
            ALL: 'bg-purple-100 text-purple-600',
            pending: 'bg-amber-100 text-amber-600',
            approved: 'bg-emerald-100 text-emerald-600',
            rejected: 'bg-red-100 text-red-600',
          };
          return (
            <div
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition hover:shadow-md ${statusTab === tab.key ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-100'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colors[tab.key]}`}>
                {icons[tab.key]}
              </div>
              <div className="text-2xl font-extrabold text-gray-800">{counts[tab.key]}</div>
              <div className="text-xs font-semibold text-gray-400 mt-0.5">{tab.label}</div>
            </div>
          );
        })}
      </div>

      {/* Status Filter Tabs + Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const activeClr = {
              ALL: 'bg-purple-600 text-white',
              pending: 'bg-amber-500 text-white',
              approved: 'bg-emerald-500 text-white',
              rejected: 'bg-red-500 text-white',
            };
            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${statusTab === tab.key ? activeClr[tab.key] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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
            placeholder="Search name, phone, city, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-purple-600">
            <Loader className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm font-medium text-gray-600">Fetching member requests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Request ID</th>
                  <th className="py-3.5 px-4">Applicant Name</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">City / State</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400 text-sm">
                      No requests found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => {
                    const reqId = getReqId(req);
                    const isUpdating = updatingStatus === reqId;
                    return (
                      <tr key={req.id} className="hover:bg-purple-50/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-purple-700 text-xs font-mono">{req.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{req.memberName}</div>
                          {req.fatherSpouseName && <div className="text-xs text-gray-400">S/O, W/O: {req.fatherSpouseName}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" /> {req.phone}
                          </div>
                          {req.email && <div className="text-[11px] text-gray-400">{req.email}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-gray-800">{req.city || 'N/A'}</div>
                          <div className="text-gray-400">{req.state}</div>
                        </td>
                        <td className="py-3.5 px-4"><StatusBadge requestObj={req} /></td>
                        <td className="py-3.5 px-4 text-xs text-gray-500">{req.createdAt}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button onClick={() => setSelectedRequest(req)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenEdit(req)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Edit Request">
                              <Edit className="w-4 h-4" />
                            </button>
                            {getEffectiveStatus(req) !== 'approved' && (
                              <button disabled={isUpdating} onClick={() => handleStatusUpdate(req, 'approved')}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50">
                                {isUpdating ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Approve
                              </button>
                            )}
                            {getEffectiveStatus(req) !== 'rejected' && (
                              <button disabled={isUpdating} onClick={() => handleStatusUpdate(req, 'rejected')}
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50">
                                {isUpdating ? <Loader className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
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

      {/* ── View Details Modal ──────────────────────────────────────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-5 border-b border-gray-100">
              {selectedRequest.raw?.UploadPhoto ? (
                <img src={selectedRequest.raw.UploadPhoto} alt="Photo"
                  className="w-16 h-16 rounded-2xl object-cover border border-purple-200 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-2xl border border-purple-200">
                  {selectedRequest.memberName?.charAt(0) || '?'}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {selectedRequest.raw?.Title ? `${selectedRequest.raw.Title} ` : ''}
                    {selectedRequest.memberName}
                  </h3>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                  <span>Request ID: <strong className="text-purple-700 font-mono">{selectedRequest.id}</strong></span>
                  <span>|</span>
                  <span>Aadhaar: <strong>{selectedRequest.aadhaar || 'N/A'}</strong></span>
                  <span>|</span>
                  <span>Date: <strong>{selectedRequest.createdAt}</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs text-gray-700">
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ['Father / Husband Name', selectedRequest.raw?.FatherName || 'N/A'],
                    ['Date of Birth', `${selectedRequest.raw?.DateOfBirth || 'N/A'} ${selectedRequest.raw?.Age ? `(${selectedRequest.raw.Age} yrs)` : ''}`],
                    ['Gender', selectedRequest.gender || 'N/A'],
                    ['Mobile', selectedRequest.phone],
                    ['Email', selectedRequest.email || 'N/A'],
                    ['Occupation', selectedRequest.raw?.Occupation || 'N/A'],
                    ['Monthly Income', selectedRequest.raw?.MonthlyIncome ? `₹${selectedRequest.raw.MonthlyIncome}` : 'N/A'],
                    ['Category', selectedRequest.category || 'N/A'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="text-gray-400 block font-medium">{label}</span>
                      <span className="font-semibold text-gray-800">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Address & Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-purple-600 font-bold block mb-1">Permanent Address</span>
                    <p className="font-medium text-gray-800">{selectedRequest.raw?.PermanentAdd || 'N/A'}</p>
                    <div className="mt-1 text-gray-500 text-[11px]">
                      {selectedRequest.raw?.City} | {selectedRequest.raw?.District} | {selectedRequest.raw?.State} | {selectedRequest.raw?.PinCode}
                    </div>
                  </div>
                  <div>
                    <span className="text-purple-600 font-bold block mb-1">Residence Address</span>
                    <p className="font-medium text-gray-800">{selectedRequest.raw?.ResidenceAdd || 'N/A'}</p>
                    <div className="mt-1 text-gray-500 text-[11px]">
                      {selectedRequest.raw?.RCity} | {selectedRequest.raw?.RDistrict} | {selectedRequest.raw?.Rstate}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Nominee & Guardian
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ['Nominee Name', `${selectedRequest.raw?.NomTitle || ''} ${selectedRequest.raw?.NomName || 'N/A'}`],
                    ['Nominee Relation', selectedRequest.raw?.NomRelation || 'N/A'],
                    ['Nominee DOB / Age', `${selectedRequest.raw?.NomDOB || 'N/A'} ${selectedRequest.raw?.NomAge ? `(${selectedRequest.raw.NomAge} yrs)` : ''}`],
                    ['Guardian Name', selectedRequest.raw?.GurName || 'N/A'],
                    ['Guardian Relation', selectedRequest.raw?.GurRelationship || 'N/A'],
                    ['Guardian Age', selectedRequest.raw?.GurAge || 'N/A'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="text-gray-400 block font-medium">{label}</span>
                      <span className="font-semibold text-gray-800">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Uploaded Documents
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { title: 'Photo', url: selectedRequest.raw?.UploadPhoto },
                    { title: 'ID Front', url: selectedRequest.raw?.UploadId },
                    { title: 'ID Back', url: selectedRequest.raw?.UploadId2 },
                    { title: 'Add Front', url: selectedRequest.raw?.UploadAddress },
                    { title: 'Add Back', url: selectedRequest.raw?.UploadAddress2 },
                  ].map((doc, i) => (
                    <div key={i} className="flex flex-col items-center bg-white p-2 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-semibold text-gray-600 mb-1">{doc.title}</span>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="group relative w-full h-20 rounded-lg overflow-hidden border border-gray-100 bg-gray-100 block">
                          <img src={doc.url} alt={doc.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">View Full</div>
                        </a>
                      ) : (
                        <div className="w-full h-20 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">Not Uploaded</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center gap-3 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {getEffectiveStatus(selectedRequest) !== 'approved' && (
                  <button disabled={!!updatingStatus}
                    onClick={() => { handleStatusUpdate(selectedRequest, 'approved'); setSelectedRequest(null); }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                )}
                {getEffectiveStatus(selectedRequest) !== 'rejected' && (
                  <button disabled={!!updatingStatus}
                    onClick={() => { handleStatusUpdate(selectedRequest, 'rejected'); setSelectedRequest(null); }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedRequest(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Request Modal ──────────────────────────────────────────────── */}
      {editingRequest && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => setEditingRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Edit Member Request</h3>
                <p className="text-xs text-gray-500">Request ID: <span className="font-mono font-bold text-purple-700">{editFormData.id}</span></p>
              </div>
            </div>

            <form onSubmit={handleUpdateRequest} className="space-y-6 text-xs">
              {/* Section 1: Personal */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> 1. Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Branch Name', name: 'branchname' },
                    { label: 'Branch Code', name: 'branch' },
                    { label: 'Aadhaar Number', name: 'aadharnumber' },
                  ].map(({ label, name }) => (
                    <div key={name}>
                      <label className="block font-semibold text-gray-700 mb-1">{label}</label>
                      <input type="text" name={name} value={editFormData[name] || ''} onChange={handleEditChange} className={inputCls} />
                    </div>
                  ))}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Title</label>
                    <select name="title" value={editFormData.title || 'Mr'} onChange={handleEditChange} className={inputCls}>
                      <option>Mr</option><option>Mrs</option><option>Miss</option>
                    </select>
                  </div>
                  {[
                    { label: 'First Name', name: 'firstname', required: true },
                    { label: 'Last Name', name: 'lastname' },
                    { label: 'Father / Husband Name', name: 'fathername' },
                    { label: 'Date of Birth', name: 'dob', type: 'date' },
                    { label: 'Age', name: 'age', type: 'number' },
                  ].map(({ label, name, type, required }) => (
                    <div key={name}>
                      <label className="block font-semibold text-gray-700 mb-1">{label}</label>
                      <input type={type || 'text'} name={name} value={editFormData[name] || ''} onChange={handleEditChange} className={inputCls} required={required} />
                    </div>
                  ))}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Gender</label>
                    <select name="gender" value={editFormData.gender || 'Male'} onChange={handleEditChange} className={inputCls}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  {[
                    { label: 'Category', name: 'category' },
                    { label: 'Mobile Number', name: 'mobile', type: 'tel', required: true },
                    { label: 'Email', name: 'email', type: 'email' },
                    { label: 'Occupation', name: 'occupation' },
                    { label: 'Monthly Income', name: 'income' },
                  ].map(({ label, name, type, required }) => (
                    <div key={name}>
                      <label className="block font-semibold text-gray-700 mb-1">{label}</label>
                      <input type={type || 'text'} name={name} value={editFormData[name] || ''} onChange={handleEditChange} className={inputCls} required={required} />
                    </div>
                  ))}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-semibold text-gray-700 mb-1">Official Address</label>
                    <input type="text" name="officeaddress" value={editFormData.officeaddress || ''} onChange={handleEditChange} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Section 2: Address */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> 2. Address Details
                </h4>
                <p className="font-semibold text-gray-500">Permanent Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-semibold text-gray-700 mb-1">Address</label>
                    <input type="text" name="paddress" value={editFormData.paddress || ''} onChange={handleEditChange} className={inputCls} />
                  </div>
                  {[{ label: 'City', name: 'city' }, { label: 'Pin Code', name: 'pincode' }].map(({ label, name }) => (
                    <div key={name}>
                      <label className="block font-semibold text-gray-700 mb-1">{label}</label>
                      <input type="text" name={name} value={editFormData[name] || ''} onChange={handleEditChange} className={inputCls} />
                    </div>
                  ))}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">State</label>
                    <select name="state" value={editFormData.state || 'Madhya Pradesh'} onChange={handleEditChange} className={inputCls}>
                      {statejosn.map((s) => <option key={s.state}>{s.state}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">District</label>
                    <select name="district" value={editFormData.district || ''} onChange={handleEditChange} className={inputCls}>
                      <option value="">Select</option>
                      {(statejosn.find((s) => s.state === editFormData.state) || statejosn[0])?.districts?.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <p className="font-semibold text-gray-500 mt-2">Residence Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-semibold text-gray-700 mb-1">Address</label>
                    <input type="text" name="caddress" value={editFormData.caddress || ''} onChange={handleEditChange} className={inputCls} />
                  </div>
                  {[{ label: 'City', name: 'ccity' }, { label: 'Pin Code', name: 'cpincode' }].map(({ label, name }) => (
                    <div key={name}>
                      <label className="block font-semibold text-gray-700 mb-1">{label}</label>
                      <input type="text" name={name} value={editFormData[name] || ''} onChange={handleEditChange} className={inputCls} />
                    </div>
                  ))}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">State</label>
                    <select name="cstate" value={editFormData.cstate || 'Madhya Pradesh'} onChange={handleEditChange} className={inputCls}>
                      {statejosn.map((s) => <option key={s.state}>{s.state}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">District</label>
                    <select name="cdistrict" value={editFormData.cdistrict || ''} onChange={handleEditChange} className={inputCls}>
                      <option value="">Select</option>
                      {(statejosn.find((s) => s.state === editFormData.cstate) || statejosn[0])?.districts?.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Introducer */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> 3. Introducer Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Introducer Member ID', name: 'introducerid' },
                    { label: 'Introducer Name', name: 'introducername' },
                    { label: 'Period Known (Duration)', name: 'peroidknown' },
                  ].map(({ label, name }) => (
                    <div key={name}>
                      <label className="block font-semibold text-gray-700 mb-1">{label}</label>
                      <input type="text" name={name} value={editFormData[name] || ''} onChange={handleEditChange} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Nominee & Guardian */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> 4. Nominee & Guardian
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nominee Title</label>
                    <select name="nomineetitle" value={editFormData.nomineetitle || 'Mr'} onChange={handleEditChange} className={inputCls}>
                      <option>Mr</option><option>Mrs</option><option>Miss</option>
                    </select>
                  </div>
                  {[
                    { label: 'Nominee Name', name: 'nomineename' },
                    { label: 'Nominee Relation', name: 'nomineerelation' },
                    { label: 'Nominee DOB', name: 'nomineedob', type: 'date' },
                    { label: 'Nominee Age', name: 'nomineeage', type: 'number' },
                    { label: 'Nominee Address', name: 'nomineeaddress' },
                    { label: 'Guardian Name', name: 'gurdianname' },
                    { label: 'Guardian Relation', name: 'gurdianrelation' },
                    { label: 'Guardian Age', name: 'gurdianage', type: 'number' },
                  ].map(({ label, name, type }) => (
                    <div key={name}>
                      <label className="block font-semibold text-gray-700 mb-1">{label}</label>
                      <input type={type || 'text'} name={name} value={editFormData[name] || ''} onChange={handleEditChange} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: KYC */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> 5. KYC Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">ID Proof Type</label>
                    <select name="idproof" value={editFormData.idproof || 'Aadhar'} onChange={handleEditChange} className={inputCls}>
                      <option value="Aadhar">Aadhaar</option>
                      <option value="PAN">PAN</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="DL">Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">ID Proof Number</label>
                    <input type="text" name="idproofnumber" value={editFormData.idproofnumber || ''} onChange={handleEditChange} className={inputCls} />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Address Proof Type</label>
                    <select name="addressproof" value={editFormData.addressproof || 'Aadhar'} onChange={handleEditChange} className={inputCls}>
                      <option value="Aadhar">Aadhaar</option>
                      <option value="Electricity Bill">Electricity Bill</option>
                      <option value="Rent Agreement">Rent Agreement</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Address Proof Number</label>
                    <input type="text" name="addressproofnumber" value={editFormData.addressproofnumber || ''} onChange={handleEditChange} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Section 6: Upload Documents */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> 6. Upload Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Photo', name: 'photo', existing: editFormData.UploadPhoto },
                    { label: 'ID Front', name: 'idfront', existing: editFormData.UploadId },
                    { label: 'ID Back', name: 'idback', existing: editFormData.UploadId2 },
                    { label: 'Address Front', name: 'addfront', existing: editFormData.UploadAddress },
                    { label: 'Address Back', name: 'addback', existing: editFormData.UploadAddress2 },
                  ].map(({ label, name, existing }) => (
                    <div key={name}>
                      <label className="block font-semibold text-gray-700 mb-1">{label}</label>
                      {existing && (
                        <a href={existing} target="_blank" rel="noopener noreferrer" className="block mb-1">
                          <img src={existing} alt={label} className="w-full h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition" />
                        </a>
                      )}
                      <input type="file" name={name} accept="image/*" onChange={handleEditChange}
                        className="w-full text-xs border border-gray-200 rounded-xl p-2 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 file:font-semibold hover:file:bg-purple-100 cursor-pointer" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingRequest(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition">
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-60">
                  {savingEdit ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberRequests;
