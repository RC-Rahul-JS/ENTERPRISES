import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Wallet, Loader, Search, FileText, Trash2, PlusCircle, ArrowLeft, CheckCircle } from 'lucide-react';
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

const ApplyWallet = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];

  // ── Step Navigation State (1: Wallet Form, 2: Document Uploads) ───────────
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

  // ── Document Upload States ────────────────────────────────────────────────
  const [bankStatement, setBankStatement] = useState(null);
  const [form16, setForm16] = useState(null);
  const [otherDoc, setOtherDoc] = useState(null);

  // Dynamic Add More Documents States
  const [newDocName, setNewDocName] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocFile, setNewDocFile] = useState(null);
  const [addMoreDocs, setAddMoreDocs] = useState([]);
  const fileInputRef = useRef(null);

  // Dropdown & Search options
  const [branches, setBranches] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingMember, setFetchingMember] = useState(false);

  // ── Fetch Branches & Members ──────────────────────────────────────────────
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

  // ── Member ID Input & Direct Search ──────────────────────────────────────
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

  // ── Document Handlers ─────────────────────────────────────────────────────
  const handleAddMoreDoc = () => {
    if (!newDocName.trim()) return toast.error('Please enter Document Name');
    if (!newDocFile) return toast.error('Please select a File to upload');

    const newDocObj = {
      id: Date.now(),
      name: newDocName.trim(),
      number: newDocNumber.trim(),
      file: newDocFile,
      fileName: newDocFile.name,
    };

    setAddMoreDocs((prev) => [...prev, newDocObj]);
    setNewDocName('');
    setNewDocNumber('');
    setNewDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    toast.success('Document added to list');
  };

  const handleRemoveAddMoreDoc = (id) => {
    setAddMoreDocs((prev) => prev.filter((doc) => doc.id !== id));
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

    setStep(1);
    setBankStatement(null);
    setForm16(null);
    setOtherDoc(null);
    setNewDocName('');
    setNewDocNumber('');
    setNewDocFile(null);
    setAddMoreDocs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Navigation & Submit Handlers ──────────────────────────────────────────
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

    const walletData = {
      date,
      branchName,
      branch_id: resolvedBranchId,
      memberId,
      member_id: memberMongoId || memberId,
      memberName,
      memberType,
      age,
      walletAmount: parseFloat(walletAmount) || 0,
      remarks,
      status: 'Pending',
      type: 'Wallet Application',
    };

    console.log('================ APPLY WALLET DATA ================');
    console.log('Wallet Form Data (JSON):', walletData);

    setStep(2);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    setSubmitting(true);
    showLoader();

    // Resolve Branch ID
    const bObj = branches.find((b) => {
      const name = b.BranchName || b.branchName || b.name || b.branch_name || '';
      return name === branchName || b._id === branchName || b.BranchCode === branchName;
    });
    const resolvedBranchId = bObj?._id || bObj?.id || bObj?.BranchCode || branchName;

    // Build FormData
    const formDataPayload = new FormData();
    formDataPayload.append('member_id', memberMongoId || memberId);
    formDataPayload.append('memberId', memberId);
    formDataPayload.append('memberName', memberName);
    formDataPayload.append('memberType', memberType);
    formDataPayload.append('age', age);
    formDataPayload.append('branch_id', resolvedBranchId);
    formDataPayload.append('branchName', branchName);
    formDataPayload.append('date', date);
    formDataPayload.append('walletAmount', parseFloat(walletAmount) || 0);
    formDataPayload.append('amount', parseFloat(walletAmount) || 0);
    formDataPayload.append('remarks', remarks);
    formDataPayload.append('status', 'Pending');
    formDataPayload.append('type', 'Wallet Application');

    // Documents
    const docsMeta = [];
    if (bankStatement) {
      docsMeta.push({ docName: 'Bank Statement', fileKey: 'bankStatement' });
      formDataPayload.append('bankStatement', bankStatement);
    }
    if (form16) {
      docsMeta.push({ docName: 'Form 16', fileKey: 'form16' });
      formDataPayload.append('form16', form16);
    }
    if (otherDoc) {
      docsMeta.push({ docName: 'Other Document', fileKey: 'otherDoc' });
      formDataPayload.append('otherDoc', otherDoc);
    }

    addMoreDocs.forEach((doc, index) => {
      const key = `customDoc_${index}`;
      docsMeta.push({
        docName: doc.name,
        docNumber: doc.number,
        fileKey: key,
      });
      formDataPayload.append(key, doc.file);
    });

    formDataPayload.append('documentsMeta', JSON.stringify(docsMeta));

    console.log('================ APPLY WALLET SUBMIT FORM DATA ================');
    for (let pair of formDataPayload.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

    // Endpoints fallback array
    const apiEndpoints = [
      { url: `${BASE_URL}/create-wallet-request`, type: 'multipart' },
      { url: `${BASE_URL}/wallet-requests`, type: 'multipart' },
      { url: `${BASE_URL}/apply-wallet`, type: 'multipart' },
      { url: `${BASE_URL}/create-member-wallet`, type: 'multipart' },
      { url: `${BASE_URL}/loan-requests`, type: 'multipart' },
    ];

    let success = false;
    let responseMsg = '';

    for (const endpoint of apiEndpoints) {
      try {
        const res = await axios.post(endpoint.url, formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.status === 200 || res.status === 201) {
          success = true;
          responseMsg = res.data?.message || 'Wallet Application submitted successfully!';
          break;
        }
      } catch (err) {
        console.warn(`[ApplyWallet] Endpoint ${endpoint.url} failed:`, err?.response?.data || err.message);
      }
    }

    setSubmitting(false);
    hideLoader();

    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Wallet Application Submitted!',
        text: responseMsg,
        confirmButtonColor: '#2D336B',
      });
      resetForm();
    } else {
      toast.error('Failed to submit Wallet Application. Please check your backend connection.');
    }
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
      <div className="max-w-7xl mx-auto shadow-sm rounded-lg border border-gray-200 bg-white">
        {/* ── STEP 1: APPLY WALLET FORM ────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-0">
            {/* ── Header Banner: APPLY WALLET ────────────────────────────────── */}
            <div className="bg-[#3B3C6E] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-200" />
                <span>APPLY WALLET</span>
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
        )}

        {/* ── STEP 2: DOCUMENTS UPLOAD ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-0">
            {/* Header Banner: DOCUMENTS */}
            <div className="bg-[#3B3C6E] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-200" />
                <span>DOCUMENTS</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 bg-[#2D336B] hover:bg-indigo-900 text-white px-3 py-1 rounded text-xs transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Wallet Form</span>
              </button>
            </div>

            <div className="p-5 space-y-5 bg-white">
              {/* Mandatory/Standard Documents Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded p-3 bg-slate-50/50">
                  <label className={labelCls}>Bank Statement</label>
                  <input
                    type="file"
                    onChange={(e) => setBankStatement(e.target.files[0] || null)}
                    className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {bankStatement && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3 h-3" /> {bankStatement.name}
                    </p>
                  )}
                </div>

                <div className="border border-gray-200 rounded p-3 bg-slate-50/50">
                  <label className={labelCls}>Form 16</label>
                  <input
                    type="file"
                    onChange={(e) => setForm16(e.target.files[0] || null)}
                    className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {form16 && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3 h-3" /> {form16.name}
                    </p>
                  )}
                </div>

                <div className="border border-gray-200 rounded p-3 bg-slate-50/50">
                  <label className={labelCls}>Other Document</label>
                  <input
                    type="file"
                    onChange={(e) => setOtherDoc(e.target.files[0] || null)}
                    className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {otherDoc && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3 h-3" /> {otherDoc.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Add More Documents Section */}
              <div className="rounded border border-gray-200 overflow-hidden">
                <SectionBanner title="Add More Documents" />
                <div className="p-4 bg-white space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className={labelCls}>Document Name</label>
                      <input
                        type="text"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="Document Name"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Document No.</label>
                      <input
                        type="text"
                        value={newDocNumber}
                        onChange={(e) => setNewDocNumber(e.target.value)}
                        placeholder="Document No."
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Upload File</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => setNewDocFile(e.target.files[0] || null)}
                        className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleAddMoreDoc}
                      className="px-4 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Document</span>
                    </button>
                  </div>

                  {/* Added Documents List */}
                  {addMoreDocs.length > 0 && (
                    <div className="mt-4 border border-gray-200 rounded overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
                          <tr>
                            <th className="px-3 py-2 border-b">Document Name</th>
                            <th className="px-3 py-2 border-b">Document No.</th>
                            <th className="px-3 py-2 border-b">File Name</th>
                            <th className="px-3 py-2 border-b text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {addMoreDocs.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-medium text-gray-800">{doc.name}</td>
                              <td className="px-3 py-2 text-gray-600">{doc.number || '-'}</td>
                              <td className="px-3 py-2 text-gray-600">{doc.fileName}</td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAddMoreDoc(doc.id)}
                                  className="text-red-500 hover:text-red-700 transition"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Submit & Back Buttons */}
              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-2 bg-[#2D336B] hover:bg-[#1E2245] text-white font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Wallet Application</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyWallet;
