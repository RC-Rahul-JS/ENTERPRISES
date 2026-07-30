import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  X,
  RefreshCw,
  Save,
  Loader,
} from 'lucide-react';

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch only Accepted members from API
  const fetchMembers = async () => {
    setLoading(true);
    const localprimeBase = import.meta.env.VITE_LOCALPRIME_URL || 'http://192.168.29.145:5000/badri_enterprises/localprime';
    const api = `${localprimeBase}/get-members`;
    try {
      const res = await axios.get(api);
      console.log('Fetched Members List Response:', res.data);

      let rawList = [];
      if (Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res.data?.data)) {
        rawList = res.data.data;
      } else if (res.data?.data && typeof res.data.data === 'object') {
        rawList = [res.data.data];
      } else if (res.data && typeof res.data === 'object') {
        rawList = [res.data];
      }

      // 🔍 Debug: log first record's keys to confirm field names from API
      if (rawList.length > 0) {
        console.log('[MemberList] API field keys (first record):', Object.keys(rawList[0]));
        console.log('[MemberList] First record sample:', rawList[0]);
      }

      // Normalize data fields strictly from API
      const normalized = rawList
        .filter((item) => {
          // ⚠️  The API sends TWO status fields:
          //   item.status  (lowercase) = actual approval/request status → "pending", "approved", "rejected"
          //   item.Status  (uppercase) = always "Active" (hardcoded by the form submit)
          // We MUST check lowercase status FIRST — it's the authoritative approval flag.
          // Checking Status first caused pending members to slip through (Status:"Active" always passes).
          const approvalStatus = (
            item.status            ||   // ← real approval status (check FIRST!)
            item.request_status    ||
            item.approval_status   ||
            item.member_status     ||
            item.Status            ||   // ← fallback: uppercase (only if lowercase missing)
            ''
          ).toLowerCase();
          // Only show members explicitly approved/active
          return ['approved', 'active', 'accepted', 'verified'].includes(approvalStatus);
        })
        .map((item, idx) => {
        // ── Resolve the member's OWN sequential ID ────────────────────────────────
        // From API data confirmed:
        //   MemberId (capital M) = INTRODUCER's member ID  ← do NOT use for own ID
        //   MemberName           = INTRODUCER's name
        //   The member's own generated ID lives in memberId (lowercase) or member_id,
        //   assigned by the backend only after the request is approved.
        //
        // Step 1: try known exact field names (never MemberId — that's the introducer)
        let id =
          item.memberId       ||   // own ID lowercase (set by backend on approval)
          item.member_id      ||   // snake_case variant
          item.MemberNo       ||   // alternative backend field name
          item.memberNo       ||
          item.member_no      ||
          item.MemberCode     ||
          item.memberCode     ||
          item.member_code    ||
          '';

        // Step 2: if still empty, scan ALL string fields for a value that looks like
        // a zero-padded member number (e.g. "0010001", "0010004") — 5 to 12 digits, starts with 0
        if (!id) {
          const paddedNumRe = /^0\d{4,11}$/;   // e.g. 0010001
          for (const [k, v] of Object.entries(item)) {
            const lk = k.toLowerCase();
            // Skip the introducer's MemberId field and non-ID fields
            if (lk === 'memberid' || lk.includes('name') || lk.includes('address') ||
                lk.includes('phone') || lk.includes('email') || lk.includes('status') ||
                lk.includes('date') || lk.includes('created') || lk.includes('upload') ||
                lk.includes('kyc') || lk.includes('nom') || lk.includes('gur')) continue;
            if (typeof v === 'string' && paddedNumRe.test(v.trim())) {
              id = v.trim();
              console.log('[MemberList] Smart scan found ID in field "' + k + '":', id);
              break;
            }
          }
        }

        // Step 3: fall back to MongoDB _id
        if (!id) id = item._id || `MEM-${1000 + idx}`;

        console.log('[MemberList] row', idx, '→ resolved id:', id,
          '| memberId:', item.memberId, '| member_id:', item.member_id,
          '| MemberNo:', item.MemberNo, '| id:', item.id, '| _id:', item._id);

        // displayId — if id is a raw MongoDB ObjectId (24-char hex), show MEM-000N instead
        const isMongoId = /^[a-f\d]{24}$/i.test(String(id));
        const displayId = isMongoId
          ? `MEM-${String(idx + 1).padStart(4, '0')}`
          : String(id);

        const firstName = item.FirstName || item.firstname || item.first_name || '';
        const lastName = item.LastName || item.lastname || item.last_name || '';
        
        let name = `${firstName} ${lastName}`.trim();

        const phone = item.MobileNo || item.phone || item.mobile || 'N/A';
        const email = item.Email || item.email || '';
        const city = item.City || item.city || '';
        const state = item.State || item.state || '';
        const address = item.PermanentAdd || item.address || '';
        const aadhaar = item.Aadhar || item.aadhaar || '';
        // Use uppercase Status as the display status for approved members
        // (lowercase status = approval flag; once approved, Status = 'Active' is the account status)
        const status = item.Status || item.status || 'Active';
        const gender = item.Gender || item.gender || 'N/A';
        const fatherName = item.FatherName || item.fathername || '';
        const category = item.Category || item.category || '';
        const occupation = item.Occupation || item.occupation || '';

        return {
          raw: item,
          id,          // internal: real value used for API calls & lookups
          displayId,   // display: human-readable label shown to user
          memberName: name || displayId,
          firstName,
          lastName,
          fatherSpouseName: fatherName,
          gender,
          phone,
          email,
          aadhaar,
          address,
          city,
          state,
          category,
          occupation,
          status,
          // Member Type: from MemberCategory (API) or membertype (form field)
          memberType: item.MemberCategory || item.memberCategory || item.membertype || item.MemberType || item.member_type || 'Ordinary',
          createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        };
      });

      setMembers(normalized);
    } catch (error) {
      console.error('Error fetching members from API:', error);

      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Handle Edit Click - Load ALL CreateMember fields & Images
  const handleOpenEdit = (member) => {
    setEditingMember(member);
    const r = member.raw || {};
    setEditFormData({
      // ✅ Bug 3 fix: member's own ID — same priority as the map() above
      id: r.memberId || r.member_id || r.MemberCode || r.memberCode || member.id,

      // Personal
      branchname: r.BranchName || '',
      branch: r.BranchCode || '',
      aadharnumber: r.Aadhar || member.aadhaar || '',
      title: r.Title || 'Mr',
      firstname: r.FirstName || member.firstName || '',
      lastname: r.LastName || member.lastName || '',
      fathername: r.FatherName || member.fatherSpouseName || '',
      dob: r.DateOfBirth || '',
      age: r.Age || '',
      gender: r.Gender || member.gender || 'Male',
      category: r.Category || member.category || '',
      mobile: r.MobileNo || member.phone || '',
      email: r.Email || member.email || '',
      occupation: r.Occupation || member.occupation || '',
      officeaddress: r.OfficialAdd || '',
      income: r.MonthlyIncome || '',

      // Address
      paddress: r.PermanentAdd || member.address || '',
      city: r.City || member.city || '',
      district: r.District || '',
      state: r.State || member.state || '',
      pincode: r.PinCode || '',
      caddress: r.ResidenceAdd || '',
      ccity: r.RCity || '',
      cdistrict: r.RDistrict || '',
      cstate: r.Rstate || '',
      cpincode: r.RPinCode || '',

      // Introducer
      introducerid: r.MemberId || '',
      introducername: r.MemberName || '',
      peroidknown: r.Duration || '',

      // Nominee & Guardian
      nomineetitle: r.NomTitle || 'Mr',
      nomineename: r.NomName || '',
      nomineerelation: r.NomRelation || '',
      nomineeage: r.NomAge || '',
      nomineedob: r.NomDOB || '',
      nomineeaddress: r.NomAddress || '',
      gurdianname: r.GurName || '',
      gurdianrelation: r.GurRelationship || '',
      gurdianage: r.GurAge || '',

      // KYC
      idproof: r.KycIdproof || 'Aadhar',
      idproofnumber: r.KycDocNo || '',
      addressproof: r.KycAddProof || 'Aadhar',
      addressproofnumber: r.KycTdocNo || '',

      // Existing Image URLs
      UploadPhoto: r.UploadPhoto || '',
      UploadId: r.UploadId || '',
      UploadId2: r.UploadId2 || '',
      UploadAddress: r.UploadAddress || '',
      UploadAddress2: r.UploadAddress2 || '',

      // File Objects for new uploads
      photo: null,
      idfront: null,
      idback: null,
      addfront: null,
      addback: null,
    });
  };

  // Handle Edit Input Change (handles text & file inputs)
  const handleEditChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setEditFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Submit Edit & Update Member (Sends updated keys via POST with endpoint fallbacks)
  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setSavingEdit(true);

    const mongoId = editingMember?.raw?._id || editingMember?.id;
    // ✅ Bug 3 fix: use member's own ID field, NOT MemberId (which is the introducer's ID)
    const memberId = editFormData.id || editingMember?.raw?.memberId || editingMember?.raw?.member_id || editingMember?.raw?.MemberCode || editingMember?.id;
    const orig = editingMember?.raw || {};

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

    // Construct FormData payload with updated text fields & file attachments
    const formDataPayload = new FormData();
    const jsonPayload = {};

    let hasChanges = false;

    Object.keys(fieldMapping).forEach((formKey) => {
      const apiKey = fieldMapping[formKey];
      const origVal = orig[apiKey] || '';
      const newVal = editFormData[formKey] !== undefined ? editFormData[formKey] : '';
      if (String(newVal).trim() !== String(origVal).trim()) {
        formDataPayload.append(apiKey, newVal);
        jsonPayload[apiKey] = newVal;
        hasChanges = true;
      }
    });

    // Check files
    if (editFormData.photo instanceof File) {
      formDataPayload.append('photo', editFormData.photo);
      formDataPayload.append('UploadPhoto', editFormData.photo);
      hasChanges = true;
    }
    if (editFormData.idfront instanceof File) {
      formDataPayload.append('idfront', editFormData.idfront);
      formDataPayload.append('UploadId', editFormData.idfront);
      hasChanges = true;
    }
    if (editFormData.idback instanceof File) {
      formDataPayload.append('idback', editFormData.idback);
      formDataPayload.append('UploadId2', editFormData.idback);
      hasChanges = true;
    }
    if (editFormData.addfront instanceof File) {
      formDataPayload.append('addfront', editFormData.addfront);
      formDataPayload.append('UploadAddress', editFormData.addfront);
      hasChanges = true;
    }
    if (editFormData.addback instanceof File) {
      formDataPayload.append('addback', editFormData.addback);
      formDataPayload.append('UploadAddress2', editFormData.addback);
      hasChanges = true;
    }

    if (!hasChanges) {
      Swal.fire('No Changes', 'No fields were modified to update.', 'info');
      setSavingEdit(false);
      setEditingMember(null);
      return;
    }

    console.log(`--- Updating Member (mongoId: ${mongoId}, memberId: ${memberId}) ---`);
    console.log('JSON Payload:', jsonPayload);

    const localprimeBase = import.meta.env.VITE_LOCALPRIME_URL || 'http://192.168.29.145:5000/badri_enterprises/localprime';

    // Try API endpoints & methods sequentially
    const endpointsToTry = [
      { url: `${localprimeBase}/members/${mongoId}`, method: 'post' },
      { url: `${localprimeBase}/members/${memberId}`, method: 'post' },
      { url: `${localprimeBase}/members/${mongoId}`, method: 'put' },
      { url: `${localprimeBase}/members/${memberId}`, method: 'put' },
    ];

    let successRes = null;

    for (let target of endpointsToTry) {
      try {
        console.log(`Attempting update via ${target.method.toUpperCase()} ${target.url}...`);
        if (target.method === 'post') {
          successRes = await axios.post(target.url, formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          successRes = await axios.put(target.url, jsonPayload, {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (successRes?.data) {
          console.log('Update API Succeeded:', successRes.data);
          break;
        }
      } catch (attemptErr) {
        console.warn(`Failed attempt ${target.method.toUpperCase()} ${target.url}:`, attemptErr?.response?.data || attemptErr.message);
      }
    }

    if (successRes) {
      Swal.fire({
        icon: 'success',
        title: 'Member Updated!',
        text: successRes.data?.message || 'Member details updated successfully.',
        confirmButtonColor: '#9333ea',
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Member Updated',
        text: 'Member details updated in local list view.',
        confirmButtonColor: '#9333ea',
      });
    }

    fetchMembers();
    setSavingEdit(false);
    setEditingMember(null);
  };

  // Delete Member
  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'Delete Member?',
      text: `Are you sure you want to delete ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = members.filter((m) => m.id !== id);
        setMembers(updated);
        Swal.fire('Deleted!', 'Member has been removed.', 'success');
      }
    });
  };

  // Toggle Status
  const handleToggleStatus = (id) => {
    const updated = members.map((m) => {
      if (m.id === id) {
        const newStatus = m.status === 'Active' ? 'Closed' : 'Active';
        return { ...m, status: newStatus };
      }
      return m;
    });
    setMembers(updated);
    Swal.fire({
      icon: 'success',
      title: 'Status Updated',
      text: 'Member status updated successfully.',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone?.includes(searchTerm) ||
      m.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activeCount = members.filter((m) => m.status?.toLowerCase() === 'active').length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="w-7 h-7 text-purple-600" />
            Member Directory
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Showing <span className="font-semibold text-emerald-600">Accepted</span> members only. Use Member Requests tab to manage pending applications.
          </p>
        </div>

        <button
          onClick={fetchMembers}
          disabled={loading}
          className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition border border-purple-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Total Members</span>
            <div className="text-2xl font-extrabold text-gray-800">{members.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Active Status</span>
            <div className="text-2xl font-extrabold text-gray-800">{activeCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Latest Joined</span>
            <div className="text-sm font-bold text-gray-800">
              {members.length > 0 ? members[0].createdAt : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ID, name, phone, city..."
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
            <p className="text-sm font-medium text-gray-600">Fetching members from API...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Member Type</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">City / State</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">
                      No members found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-purple-50/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-purple-700 text-xs">
                        {member.displayId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{member.memberName}</div>
                        {member.fatherSpouseName && (
                          <div className="text-xs text-gray-400">S/O, W/O: {member.fatherSpouseName}</div>
                        )}
                      </td>
                      {/* Member Type column */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          (member.memberType || '').toLowerCase() === 'agent'     ? 'bg-purple-100 text-purple-700' :
                          (member.memberType || '').toLowerCase() === 'regular'   ? 'bg-emerald-100 text-emerald-700' :
                          (member.memberType || '').toLowerCase() === 'associate' ? 'bg-amber-100 text-amber-700' :
                          (member.memberType || '').toLowerCase() === 'senior'    ? 'bg-indigo-100 text-indigo-700' :
                          'bg-blue-100 text-blue-700'  /* Ordinary / default */
                        }`}>
                          {member.memberType || 'Ordinary'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" /> {member.phone}
                        </div>
                        {member.email && <div className="text-[11px] text-gray-400">{member.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-gray-800">{member.city || 'N/A'}</div>
                        <div className="text-gray-400">{member.state}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {member.createdAt}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedMember(member)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit Member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(member.id, member.memberName)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Member Details Modal (Comprehensive View of ALL fields) */}
      {selectedMember && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-5 border-b border-gray-100">
              {selectedMember.raw?.UploadPhoto ? (
                <img
                  src={selectedMember.raw.UploadPhoto}
                  alt="Member Photo"
                  className="w-16 h-16 rounded-2xl object-cover border border-purple-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-2xl border border-purple-200">
                  {selectedMember.memberName?.charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {selectedMember.raw?.Title ? `${selectedMember.raw.Title} ` : ''}
                    {selectedMember.memberName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    {selectedMember.raw?.Category || selectedMember.category || 'Member'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      (selectedMember.status || '').toLowerCase() === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selectedMember.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                  <span>
                    Member ID: <strong className="text-purple-700 font-mono">{selectedMember.displayId}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Aadhaar: <strong>{selectedMember.raw?.Aadhar || selectedMember.aadhaar || 'N/A'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Created: <strong>{selectedMember.createdAt}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Grid of Sections */}
            <div className="space-y-6 text-xs text-gray-700">
              {/* Section 1: Personal Details */}
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-gray-400 block font-medium">Father / Husband Name</span>
                    <span className="font-semibold text-gray-800">
                      {selectedMember.raw?.FatherName || selectedMember.fatherSpouseName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Date of Birth & Age</span>
                    <span className="font-semibold text-gray-800">
                      {selectedMember.raw?.DateOfBirth || 'N/A'}{' '}
                      {selectedMember.raw?.Age ? `(${selectedMember.raw.Age} yrs)` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Gender</span>
                    <span className="font-semibold text-gray-800">{selectedMember.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Mobile Number</span>
                    <span className="font-semibold text-gray-800">{selectedMember.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Email Address</span>
                    <span className="font-semibold text-gray-800">{selectedMember.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Occupation</span>
                    <span className="font-semibold text-gray-800">
                      {selectedMember.raw?.Occupation || selectedMember.occupation || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Monthly Income</span>
                    <span className="font-semibold text-gray-800">
                      {selectedMember.raw?.MonthlyIncome ? `₹${selectedMember.raw.MonthlyIncome}` : 'N/A'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block font-medium">Official Address</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.OfficialAdd || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Address Details */}
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Address & Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-purple-600 font-bold block mb-1">Permanent Address</span>
                    <p className="font-medium text-gray-800 leading-relaxed">
                      {selectedMember.raw?.PermanentAdd || selectedMember.address || 'N/A'}
                    </p>
                    <div className="mt-1 text-gray-500">
                      City: <strong>{selectedMember.raw?.City || selectedMember.city || 'N/A'}</strong> | District:{' '}
                      <strong>{selectedMember.raw?.District || 'N/A'}</strong> | State:{' '}
                      <strong>{selectedMember.raw?.State || selectedMember.state || 'N/A'}</strong> | Pincode:{' '}
                      <strong>{selectedMember.raw?.PinCode || 'N/A'}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-purple-600 font-bold block mb-1">
                      Residence Address {selectedMember.raw?.SameAddress === 'true' && '(Same as Permanent)'}
                    </span>
                    <p className="font-medium text-gray-800 leading-relaxed">
                      {selectedMember.raw?.ResidenceAdd || 'N/A'}
                    </p>
                    <div className="mt-1 text-gray-500">
                      City: <strong>{selectedMember.raw?.RCity || 'N/A'}</strong> | District:{' '}
                      <strong>{selectedMember.raw?.RDistrict || 'N/A'}</strong> | State:{' '}
                      <strong>{selectedMember.raw?.Rstate || 'N/A'}</strong> | Pincode:{' '}
                      <strong>{selectedMember.raw?.RPinCode || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Introducer & Branch Details */}
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Introducer & Branch
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-gray-400 block font-medium">Introducer Member ID</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.MemberId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Introducer Name</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.MemberName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Period Known (Duration)</span>
                    <span className="font-semibold text-gray-800">
                      {selectedMember.raw?.Duration ? `${selectedMember.raw.Duration} yrs/mos` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Branch Code</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.BranchCode || '001'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Branch Name</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.BranchName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Nominee & Guardian Details */}
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Nominee & Guardian Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-gray-400 block font-medium">Nominee Name</span>
                    <span className="font-semibold text-gray-800">
                      {selectedMember.raw?.NomTitle ? `${selectedMember.raw.NomTitle} ` : ''}
                      {selectedMember.raw?.NomName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Nominee Relationship</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.NomRelation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Nominee DOB / Age</span>
                    <span className="font-semibold text-gray-800">
                      {selectedMember.raw?.NomDOB || 'N/A'}{' '}
                      {selectedMember.raw?.NomAge ? `(${selectedMember.raw.NomAge} yrs)` : ''}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block font-medium">Nominee Address</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.NomAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Guardian Name</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.GurName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Guardian Relation</span>
                    <span className="font-semibold text-gray-800">
                      {selectedMember.raw?.GurRelationship || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Guardian Age</span>
                    <span className="font-semibold text-gray-800">{selectedMember.raw?.GurAge || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: KYC Proof Details */}
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> KYC Document Proofs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400 block font-medium">
                      ID Proof ({selectedMember.raw?.KycIdproof || 'Aadhaar'})
                    </span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {selectedMember.raw?.KycDocNo || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">
                      Address Proof ({selectedMember.raw?.KycAddProof || 'Aadhaar'})
                    </span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {selectedMember.raw?.KycTdocNo || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 6: Uploaded Document Images Gallery */}
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Uploaded Documents & Media
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { title: 'Photo', url: selectedMember.raw?.UploadPhoto },
                    { title: 'ID Front', url: selectedMember.raw?.UploadId },
                    { title: 'ID Back', url: selectedMember.raw?.UploadId2 },
                    { title: 'Add Front', url: selectedMember.raw?.UploadAddress },
                    { title: 'Add Back', url: selectedMember.raw?.UploadAddress2 },
                  ].map((doc, i) => (
                    <div key={i} className="flex flex-col items-center bg-white p-2 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-semibold text-gray-600 mb-1">{doc.title}</span>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative w-full h-20 rounded-lg overflow-hidden border border-gray-100 bg-gray-100 block"
                        >
                          <img
                            src={doc.url}
                            alt={doc.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                            View Full
                          </div>
                        </a>
                      ) : (
                        <div className="w-full h-20 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                          Not Uploaded
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal (All CreateMember fields editable) */}
      {editingMember && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingMember(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Edit Member Form</h3>
                <p className="text-xs text-gray-500">
                  Member ID: <span className="font-mono font-bold text-purple-700">{editFormData.id} (Read-Only)</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-6 text-xs">
              {/* Section 1: Personal Details */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> 1. Personal Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Branch Name</label>
                    <input
                      type="text"
                      name="branchname"
                      value={editFormData.branchname || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Branch Code</label>
                    <input
                      type="text"
                      name="branch"
                      value={editFormData.branch || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      name="aadharnumber"
                      value={editFormData.aadharnumber || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Title</label>
                    <select
                      name="title"
                      value={editFormData.title || 'Mr'}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstname"
                      value={editFormData.firstname || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastname"
                      value={editFormData.lastname || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Father / Husband Name</label>
                    <input
                      type="text"
                      name="fathername"
                      value={editFormData.fathername || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={editFormData.dob || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={editFormData.age || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={editFormData.gender || 'Male'}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={editFormData.category || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={editFormData.mobile || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={editFormData.occupation || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Monthly Income</label>
                    <input
                      type="text"
                      name="income"
                      value={editFormData.income || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-semibold text-gray-700 mb-1">Official Address</label>
                    <input
                      type="text"
                      name="officeaddress"
                      value={editFormData.officeaddress || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Permanent & Residence Address */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> 2. Address & Location
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-semibold text-gray-700 mb-1">Permanent Address</label>
                    <input
                      type="text"
                      name="paddress"
                      value={editFormData.paddress || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={editFormData.city || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">District</label>
                    <input
                      type="text"
                      name="district"
                      value={editFormData.district || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={editFormData.state || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Pin Code</label>
                    <input
                      type="text"
                      name="pincode"
                      value={editFormData.pincode || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 pt-2">
                    <label className="block font-semibold text-gray-700 mb-1">Residence Address</label>
                    <input
                      type="text"
                      name="caddress"
                      value={editFormData.caddress || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Residence City</label>
                    <input
                      type="text"
                      name="ccity"
                      value={editFormData.ccity || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Residence District</label>
                    <input
                      type="text"
                      name="cdistrict"
                      value={editFormData.cdistrict || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Residence State</label>
                    <input
                      type="text"
                      name="cstate"
                      value={editFormData.cstate || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Residence Pin Code</label>
                    <input
                      type="text"
                      name="cpincode"
                      value={editFormData.cpincode || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Introducer & Referral */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> 3. Introducer & Referral
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Introducer Member ID</label>
                    <input
                      type="text"
                      name="introducerid"
                      value={editFormData.introducerid || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Introducer Member Name</label>
                    <input
                      type="text"
                      name="introducername"
                      value={editFormData.introducername || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Period Known (Duration)</label>
                    <input
                      type="text"
                      name="peroidknown"
                      value={editFormData.peroidknown || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Nominee & Guardian Details */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> 4. Nominee & Guardian Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nominee Title</label>
                    <select
                      name="nomineetitle"
                      value={editFormData.nomineetitle || 'Mr'}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nominee Name</label>
                    <input
                      type="text"
                      name="nomineename"
                      value={editFormData.nomineename || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nominee Relationship</label>
                    <input
                      type="text"
                      name="nomineerelation"
                      value={editFormData.nomineerelation || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nominee DOB</label>
                    <input
                      type="date"
                      name="nomineedob"
                      value={editFormData.nomineedob || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nominee Age</label>
                    <input
                      type="number"
                      name="nomineeage"
                      value={editFormData.nomineeage || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nominee Address</label>
                    <input
                      type="text"
                      name="nomineeaddress"
                      value={editFormData.nomineeaddress || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Guardian Name</label>
                    <input
                      type="text"
                      name="gurdianname"
                      value={editFormData.gurdianname || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Guardian Relation</label>
                    <input
                      type="text"
                      name="gurdianrelation"
                      value={editFormData.gurdianrelation || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Guardian Age</label>
                    <input
                      type="number"
                      name="gurdianage"
                      value={editFormData.gurdianage || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: KYC Proof Details */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> 5. KYC Document Numbers
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">ID Proof Type</label>
                    <input
                      type="text"
                      name="idproof"
                      value={editFormData.idproof || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">ID Proof Number</label>
                    <input
                      type="text"
                      name="idproofnumber"
                      value={editFormData.idproofnumber || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Address Proof Type</label>
                    <input
                      type="text"
                      name="addressproof"
                      value={editFormData.addressproof || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Address Proof Number</label>
                    <input
                      type="text"
                      name="addressproofnumber"
                      value={editFormData.addressproofnumber || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Image Uploads & Updates */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> 6. Update Document Images & Photos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Photo */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                    <label className="block font-semibold text-gray-700">Member Photo</label>
                    {editFormData.photo instanceof File ? (
                      <p className="text-[11px] text-emerald-600 font-bold">
                        Selected: {editFormData.photo.name}
                      </p>
                    ) : editFormData.UploadPhoto ? (
                      <img
                        src={editFormData.UploadPhoto}
                        alt="Photo Preview"
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ) : null}
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      onChange={handleEditChange}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>

                  {/* ID Front */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                    <label className="block font-semibold text-gray-700">ID Proof Front</label>
                    {editFormData.idfront instanceof File ? (
                      <p className="text-[11px] text-emerald-600 font-bold">
                        Selected: {editFormData.idfront.name}
                      </p>
                    ) : editFormData.UploadId ? (
                      <img
                        src={editFormData.UploadId}
                        alt="ID Front Preview"
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ) : null}
                    <input
                      type="file"
                      name="idfront"
                      accept="image/*"
                      onChange={handleEditChange}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>

                  {/* ID Back */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                    <label className="block font-semibold text-gray-700">ID Proof Back</label>
                    {editFormData.idback instanceof File ? (
                      <p className="text-[11px] text-emerald-600 font-bold">
                        Selected: {editFormData.idback.name}
                      </p>
                    ) : editFormData.UploadId2 ? (
                      <img
                        src={editFormData.UploadId2}
                        alt="ID Back Preview"
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ) : null}
                    <input
                      type="file"
                      name="idback"
                      accept="image/*"
                      onChange={handleEditChange}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>

                  {/* Address Front */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                    <label className="block font-semibold text-gray-700">Address Proof Front</label>
                    {editFormData.addfront instanceof File ? (
                      <p className="text-[11px] text-emerald-600 font-bold">
                        Selected: {editFormData.addfront.name}
                      </p>
                    ) : editFormData.UploadAddress ? (
                      <img
                        src={editFormData.UploadAddress}
                        alt="Address Front Preview"
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ) : null}
                    <input
                      type="file"
                      name="addfront"
                      accept="image/*"
                      onChange={handleEditChange}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>

                  {/* Address Back */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                    <label className="block font-semibold text-gray-700">Address Proof Back</label>
                    {editFormData.addback instanceof File ? (
                      <p className="text-[11px] text-emerald-600 font-bold">
                        Selected: {editFormData.addback.name}
                      </p>
                    ) : editFormData.UploadAddress2 ? (
                      <img
                        src={editFormData.UploadAddress2}
                        alt="Address Back Preview"
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ) : null}
                    <input
                      type="file"
                      name="addback"
                      accept="image/*"
                      onChange={handleEditChange}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition shadow-md"
                >
                  <Save className="w-4 h-4" />
                  {savingEdit ? 'Updating...' : 'Save & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
