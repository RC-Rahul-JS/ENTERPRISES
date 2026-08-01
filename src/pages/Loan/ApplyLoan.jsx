import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CreditCard, Loader, Search, FileText, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import loanService from '../../api/loanService';

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

  // ── Step Navigation State (1: Loan Form, 2: Documents Upload) ────────────
  const [step, setStep] = useState(1);

  // ── Form State ─────────────────────────────────────────────────────────────
  // Top Header / Apply Loan Section
  const [date, setDate] = useState(today);
  const [branchName, setBranchName] = useState('');
  const [productType, setProductType] = useState('');
  const [selectedLoan, setSelectedLoan] = useState('');
  const [durationIn, setDurationIn] = useState('');

  // Member Details
  const [memberId, setMemberId] = useState('');
  const [memberMongoId, setMemberMongoId] = useState('');
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
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTenure, setLoanTenure] = useState('');
  const [frequency, setFrequency] = useState('');
  const [interestType, setInterestType] = useState('');
  const [roi, setRoi] = useState('');
  const [emi, setEmi] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');

  // Introducer Details
  const [introducer, setIntroducer] = useState('');
  const [introducerMongoId, setIntroducerMongoId] = useState('');
  const [introducerName, setIntroducerName] = useState('');

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
      setEmi('');
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
      console.warn('[ApplyLoan] Member search direct endpoint not available, falling back to loaded members list:', err?.message);
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
        const mId = match._id || match.id || match.member_id || match.memberId || trimmed;
        setMemberMongoId(mId);
        setMemberName(fullName || '');
        setMemberType(type || 'Regular');
        setAge(ageVal || '');
        toast.success(`Member Found: ${fullName || trimmed}`);
      } else {
        // Do not give any details if Member ID is not matched
        setMemberMongoId('');
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
    setMemberMongoId(m._id || m.id || m.member_id || m.memberId || mid);
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
      setIntroducerMongoId('');
      setShowIntroducerDropdown(false);
      return toast.error('Please enter Agent Code to search');
    }

    setFetchingMember(true);
    setShowIntroducerDropdown(false);

    try {
      // Fetch both members and agent requests
      const [resMem, resAgents] = await Promise.all([
        axios.get(`${BASE}/get-members`).catch(() => ({ data: [] })),
        axios.get(`${BASE}/agent-requests`).catch(() => ({ data: [] })),
      ]);

      let rawMembers = Array.isArray(resMem.data)
        ? resMem.data
        : resMem.data?.data || resMem.data?.members || [];
      let rawAgents = Array.isArray(resAgents.data)
        ? resAgents.data
        : resAgents.data?.data || resAgents.data?.requests || [];

      const searchCode = trimmed.toLowerCase();

      // Find match in approved agents or approved members
      let match = rawAgents.find((a) => {
        const aStatus = String(a.status || a.Status || a.agentStatus || '').toLowerCase();
        const isApproved = ['approved', 'active', 'accepted', 'verified'].includes(aStatus);
        const codes = [
          a.agent_code, a.agentCode, a.AgentCode,
          a.member_code, a.memberId, a.member_id, a._id, a.code
        ].map((v) => String(v || '').toLowerCase().trim());
        return isApproved && codes.includes(searchCode);
      });

      let matchedMember = null;

      if (match) {
        // If matched from agent-requests, find the corresponding member object in rawMembers for full details
        const mId = String(match.member_id?.$oid || match.member_id || match.memberId || match.MemberId || match._id || '');
        matchedMember = rawMembers.find((m) =>
          String(m._id || m.id || m.memberId || '').toLowerCase() === mId.toLowerCase()
        ) || match;
      } else {
        // Find directly in rawMembers by agentCode or memberId
        matchedMember = rawMembers.find((m) => {
          const mStatus = String(m.status || m.Status || m.agentStatus || '').toLowerCase();
          const isApproved = ['approved', 'active', 'accepted', 'verified'].includes(mStatus);
          const ids = [
            m.agentCode, m.agent_code, m.AgentCode,
            m.memberId, m.member_id, m.MemberNo, m.memberNo,
            m.MemberCode, m.memberCode, m._id
          ].map((v) => String(v || '').toLowerCase().trim());
          return isApproved && ids.includes(searchCode);
        });
      }

      if (matchedMember) {
        const { fullName } = extractMemberData(matchedMember);
        const iId = matchedMember._id || matchedMember.id || matchedMember.member_id || matchedMember.memberId || trimmed;
        setIntroducerMongoId(iId);
        setIntroducerName(fullName || match?.member_name || match?.MemberName || trimmed);
        toast.success(`Approved Agent Found: ${fullName || trimmed}`);
      } else {
        setIntroducerMongoId('');
        setIntroducerName('');
        toast.error(`Agent Code "${trimmed}" is invalid or not an approved Agent.`);
      }
    } catch (err) {
      console.error('[ApplyLoan] Error searching Agent Code:', err);
      setIntroducerMongoId('');
      setIntroducerName('');
      toast.error(`Error searching Agent Code "${trimmed}"`);
    } finally {
      setFetchingMember(false);
    }
  };

  const selectIntroducerSuggestion = (m) => {
    const mid = m.memberId || m.MemberId || m._id || m.id || '';
    setIntroducer(mid);
    setIntroducerMongoId(m._id || m.id || m.member_id || m.memberId || mid);
    const { fullName } = extractMemberData(m);
    setIntroducerName(fullName);
    setShowIntroducerDropdown(false);
  };

  // ── Dynamic Document Handlers ──────────────────────────────────────────────
  const handleAddMoreDoc = () => {
    if (!newDocName.trim()) {
      return toast.error('Please enter Document Name');
    }
    if (!newDocFile) {
      return toast.error('Please choose a document file to upload');
    }

    const docObj = {
      id: Date.now(),
      name: newDocName.trim(),
      number: newDocNumber.trim(),
      file: newDocFile,
    };

    setAddMoreDocs((prev) => [...prev, docObj]);
    setNewDocName('');
    setNewDocNumber('');
    setNewDocFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success(`Added document: ${docObj.name}`);
  };

  const handleRemoveDoc = (id) => {
    setAddMoreDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // ── Reset Form to Fresh State ──────────────────────────────────────────────
  const resetForm = () => {
    setDate(today);
    setBranchName('');
    setProductType('Loan');
    setSelectedLoan('');
    setDurationIn('');

    setMemberId('');
    setMemberMongoId('');
    setMemberName('');
    setMemberType('');
    setAge('');

    setGuarantorSelect('');
    setGuarantorId('');
    setGuarantorName('');
    setGuarantorType('');
    setGuarantorAge('');

    setLoanAmount('');
    setLoanTenure('');
    setFrequency('');
    setInterestType('');
    setRoi('');
    setEmi('');
    setLoanPurpose('');

    setIntroducer('');
    setIntroducerMongoId('');
    setIntroducerName('');

    // Reset Document Upload States
    setStep(1);
    setBankStatement(null);
    setForm16(null);
    setOtherDoc(null);
    setNewDocName('');
    setNewDocNumber('');
    setNewDocFile(null);
    setAddMoreDocs([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Step 1 Validation -> Proceed to Step 2 (Documents) ────────────────────
  const handleNextStep = (e) => {
    e.preventDefault();

    if (!branchName) return toast.error('Please select Branch Name');
    if (!selectedLoan) return toast.error('Please select Loan Product');
    if (!memberId || !memberName) return toast.error('Please enter Member Details');
    if (!introducer || !introducer.trim()) return toast.error('Please enter Agent Code / Introducer ID');
    if (!loanAmount || parseFloat(loanAmount) <= 0) return toast.error('Please enter valid Loan Amount');

    setStep(2);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    setSubmitting(true);

    // Resolve branch and product IDs
    const bObj = branches.find((b) => {
      const name = b.BranchName || b.branchName || b.name || b.branch_name || '';
      return name === branchName || b._id === branchName || b.BranchCode === branchName;
    });
    const resolvedBranchId = bObj?._id || bObj?.id || bObj?.BranchCode || branchName;

    const pObj = loanProducts.find((p) => {
      const pName = p.ProductName || p.productName || p.name || p.title || p.ProductTitle || '';
      return pName === selectedLoan || p._id === selectedLoan || p.id === selectedLoan;
    });
    const resolvedLoanProductId = pObj?._id || pObj?.id || pObj?.productId || selectedLoan;

    // Build FormData — same pattern as CreateMember.jsx
    const formDataPayload = new FormData();

    formDataPayload.append('member_id', memberMongoId || memberId);
    formDataPayload.append('branch_id', resolvedBranchId);
    formDataPayload.append('loan_product_id', resolvedLoanProductId);
    formDataPayload.append('requestedAmount', parseFloat(loanAmount) || 0);
    formDataPayload.append('requestedTenure', parseInt(loanTenure, 10) || 0);
    formDataPayload.append('agent_id', introducerMongoId || introducer || '');
    formDataPayload.append('agent_code', introducer || '');
    formDataPayload.append('introducer_id', introducerMongoId || introducer || '');
    formDataPayload.append('date', date);
    formDataPayload.append('branchName', branchName);
    formDataPayload.append('productType', productType);
    formDataPayload.append('selectedLoan', selectedLoan);
    formDataPayload.append('durationIn', durationIn);
    formDataPayload.append('memberId', memberId);
    formDataPayload.append('memberName', memberName);
    formDataPayload.append('memberType', memberType);
    formDataPayload.append('age', age);
    formDataPayload.append('guarantorId', guarantorId);
    formDataPayload.append('guarantorName', guarantorName);
    formDataPayload.append('guarantorType', guarantorType);
    formDataPayload.append('guarantorAge', guarantorAge);
    formDataPayload.append('loanAmount', loanAmount);
    formDataPayload.append('loanTenure', loanTenure);
    formDataPayload.append('frequency', frequency);
    formDataPayload.append('interestType', interestType);
    formDataPayload.append('roi', roi);
    formDataPayload.append('emi', emi);
    formDataPayload.append('loanPurpose', loanPurpose);
    formDataPayload.append('introducer', introducer);
    formDataPayload.append('introducerName', introducerName);
    formDataPayload.append('status', 'Pending');

    // Documents — build docsMeta with fileKey, attach each raw file once
    const docsMeta = [];

    if (bankStatement) {
      docsMeta.push({ id: 1, name: 'Bank Statement', number: '', fileKey: 'bankStatement' });
      formDataPayload.append('bankStatement', bankStatement);
      formDataPayload.append('UploadBankStatement', bankStatement);
    }
    if (form16) {
      docsMeta.push({ id: 2, name: 'Form 16 / Balance Sheet', number: '', fileKey: 'form16' });
      formDataPayload.append('form16', form16);
      formDataPayload.append('UploadForm16', form16);
    }
    if (otherDoc) {
      docsMeta.push({ id: 3, name: 'Other', number: '', fileKey: 'otherDocument' });
      formDataPayload.append('otherDocument', otherDoc);
      formDataPayload.append('UploadOtherDoc', otherDoc);
    }

    if (addMoreDocs && addMoreDocs.length > 0) {
      addMoreDocs.forEach((doc, index) => {
        const fileKey = doc.name
          ? doc.name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ +(.)/g, (_, c) => c.toUpperCase())
          : `additionalDoc_${index + 1}`;
        docsMeta.push({ id: doc.id || index + 4, name: doc.name, number: doc.number || '', fileKey });
        if (doc.file) formDataPayload.append(fileKey, doc.file);
      });
    }

    // Send docsMeta as a single JSON string
    formDataPayload.append('additionalDocs', JSON.stringify(docsMeta));

    // console.log('--- Loan Request FormData Payload Entries ---');
    // for (let pair of formDataPayload.entries()) {
    //   console.log(pair[0] + ':', pair[1]);
    // }
    console.log('formDataPayload', formDataPayload);

    try {
      const res = await loanService.createLoanRequest(formDataPayload);
      console.log('Apply Loan API Success:', res);
      toast.success(res?.message || 'Loan request submitted successfully!');
      // resetForm();
    } catch (error) {
      console.error('Error submitting loan request:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to submit loan request');
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
        {/* ── STEP 1: APPLY LOAN FORM ──────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-0">
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
                  <label className={labelCls}>
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b, idx) => {
                      const name = b.BranchName || b.branchName || b.name || b.branch_name || '';
                      const code = b.BranchCode || b.code || '';
                      const val = name || code;
                      return (
                        <option key={b._id || idx} value={val}>
                          {name} {code ? `(${code})` : ''}
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
                    <option value="">--Select--</option>
                    <option value="Group">Group</option>
                    <option value="Loan">Loan</option>
                    <option value="Limit">Limit</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>
                    Select Loan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLoan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedLoan(val);
                      const pObj = loanProducts.find((p) => {
                        const pName = p.ProductName || p.productName || p.name || p.title || p.ProductTitle || '';
                        return pName === val || p._id === val;
                      });
                      if (pObj) {
                        const pRoi = pObj.roi || pObj.interestRate || pObj.rateOfInterest || pObj.interest_rate || '';
                        if (pRoi) setRoi(pRoi);
                        const pTenure = pObj.tenure || pObj.loanTenure || pObj.duration || '';
                        if (pTenure) setLoanTenure(pTenure);
                        const pFreq = pObj.frequency || pObj.paymentFrequency || '';
                        if (pFreq) setFrequency(pFreq);
                        const pType = pObj.interestType || pObj.interest_type || '';
                        if (pType) setInterestType(pType);
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">Select Loan Product</option>
                    {loanProducts
                      .filter((p) => {
                        if (!productType) return true;
                        const pType = p.productType || p.product_type || p.type || p.ProductType || 'Loan';
                        return pType.toLowerCase() === productType.toLowerCase();
                      })
                      .map((p, idx) => {
                        const pName = p.ProductName || p.productName || p.name || p.title || p.ProductTitle || '';
                        return (
                          <option key={p._id || idx} value={pName}>
                            {pName}
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
                    <option value="">Select Duration In</option>
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>
              </div>

              {/* ── Banner 2: Member Details ─────────────────────────────── */}
              <div className="rounded border border-gray-200">
                <SectionBanner title="Member Details" />
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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
                          title="Search Member ID"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search</span>
                        </button>

                        {showMemberDropdown && memberSuggestions.length > 0 && (
                          <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-xl max-h-56 overflow-y-auto text-xs divide-y divide-gray-100 ring-1 ring-black/5">
                            {memberSuggestions.map((m, idx) => {
                              const mid = m.memberId || m.MemberId || m._id || m.id || '';
                              const { fullName } = extractMemberData(m);
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
                        placeholder="Member Type"
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

              {/* ── Banner 3: Guarantor / Co-Applicant Details ───────────── */}
              <div className="rounded border border-gray-200">
                <SectionBanner title="Guarantor / Co-Applicant Details" />
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className={labelCls}>Guarantor Select</label>
                      <select
                        value={guarantorSelect}
                        onChange={(e) => setGuarantorSelect(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select Guarantor</option>
                        <option value="Guarantor 1">Guarantor 1</option>
                        <option value="Guarantor 2">Guarantor 2</option>
                        <option value="Co-Applicant">Co-Applicant</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Guarantor ID</label>
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
                          placeholder="Enter Guarantor ID"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleSearchGuarantor}
                          className="px-2.5 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
                          title="Search Guarantor ID"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search</span>
                        </button>

                        {showGuarantorDropdown && guarantorSuggestions.length > 0 && (
                          <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-xl max-h-56 overflow-y-auto text-xs divide-y divide-gray-100 ring-1 ring-black/5">
                            {guarantorSuggestions.map((m, idx) => {
                              const mid = m.memberId || m.MemberId || m._id || m.id || '';
                              const { fullName } = extractMemberData(m);
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
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Guarantor Name</label>
                      <input
                        type="text"
                        value={guarantorName}
                        onChange={(e) => setGuarantorName(e.target.value)}
                        placeholder="Guarantor Name"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Guarantor Type</label>
                      <input
                        type="text"
                        value={guarantorType}
                        onChange={(e) => setGuarantorType(e.target.value)}
                        placeholder="Guarantor Type"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Guarantor Age</label>
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

              {/* ── Banner 4: Loan Details ────────────────────────────────── */}
              <div className="rounded border border-gray-200">
                <SectionBanner title="Loan Details" />
                <div className="p-4 bg-white space-y-4">
                  {/* First row of Loan Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className={labelCls}>
                        Loan Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="Enter Loan Amount"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Loan Tenure</label>
                      <input
                        type="number"
                        value={loanTenure}
                        onChange={(e) => setLoanTenure(e.target.value)}
                        placeholder="Tenure"
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
                        <option value="">Select Frequency</option>
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
                        <option value="">Select Interest Type</option>
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
                        placeholder="Enter ROI (%)"
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
                        placeholder="Calculated EMI"
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

              {/* ── Banner 5: Agent Details ─────────────────────────────── */}
              <div className="rounded border border-gray-200">
                <SectionBanner title="Agent Details" />
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className={labelCls}>
                        Agent Code <span className="text-red-500">*</span>
                      </label>
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
                          placeholder="Enter Agent Code (e.g. AG002)"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleSearchIntroducer}
                          className="px-2.5 py-1.5 bg-[#3B3C6E] hover:bg-[#2D336B] text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
                          title="Search Agent Code"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search</span>
                        </button>

                        {showIntroducerDropdown && introducerSuggestions.length > 0 && (
                          <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-xl max-h-56 overflow-y-auto text-xs divide-y divide-gray-100 ring-1 ring-black/5">
                            {introducerSuggestions.map((m, idx) => {
                              const mid = m.agentCode || m.agent_code || m.memberId || m.MemberId || m._id || m.id || '';
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
                      <label className={labelCls}>Agent Name</label>
                      <input
                        type="text"
                        value={introducerName}
                        onChange={(e) => setIntroducerName(e.target.value)}
                        placeholder="Agent Name"
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
            {/* Banner: DOCUMENTS */}
            <div className="bg-[#3B3C6E] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-200" />
                <span>DOCUMENTS</span>
              </div>
            </div>

            <div
              className="p-5 space-y-5 bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300'%3E%3Cg stroke='%23c5cae9' stroke-width='0.5' opacity='0.25' fill='none'%3E%3Ccircle cx='300' cy='150' r='120'/%3E%3Ccircle cx='300' cy='150' r='80'/%3E%3Cline x1='0' y1='150' x2='600' y2='150'/%3E%3Cline x1='300' y1='0' x2='300' y2='300'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
              }}
            >
              {/* Upload KYC Documents Section */}
              <div className="rounded border border-gray-200 overflow-hidden">
                <SectionBanner title="Upload KYC Documents" />
                <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Bank Statement</label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setBankStatement(e.target.files[0] || null)}
                      className={inputCls}
                    />
                    {bankStatement && (
                      <p className="text-[10px] text-green-600 font-semibold mt-1 truncate">
                        Selected: {bankStatement.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Form 16 / Balance Sheet</label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setForm16(e.target.files[0] || null)}
                      className={inputCls}
                    />
                    {form16 && (
                      <p className="text-[10px] text-green-600 font-semibold mt-1 truncate">
                        Selected: {form16.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Other</label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setOtherDoc(e.target.files[0] || null)}
                      className={inputCls}
                    />
                    {otherDoc && (
                      <p className="text-[10px] text-green-600 font-semibold mt-1 truncate">
                        Selected: {otherDoc.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Add More Documents Section */}
              <div className="rounded border border-gray-200 overflow-hidden">
                <SectionBanner title="Add More Documents" />
                <div className="p-4 bg-white space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-3">
                      <label className={labelCls}>Document Name:</label>
                      <input
                        type="text"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="Enter Document Name"
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className={labelCls}>Document Number:</label>
                      <input
                        type="text"
                        value={newDocNumber}
                        onChange={(e) => setNewDocNumber(e.target.value)}
                        placeholder="Enter Document Number"
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => setNewDocFile(e.target.files[0] || null)}
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddMoreDoc}
                        className="w-full sm:w-auto px-6 py-1.5 bg-[#1E2245] hover:bg-[#2D336B] text-white font-bold text-xs uppercase tracking-wider rounded transition flex items-center justify-center gap-1 shadow"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    </div>
                  </div>

                  {/* Added Documents List / Table */}
                  {addMoreDocs.length > 0 && (
                    <div className="mt-4 border rounded-md overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-100 border-b text-gray-700 font-semibold uppercase text-[11px]">
                          <tr>
                            <th className="p-2 border-r">Document Name</th>
                            <th className="p-2 border-r">Document Number</th>
                            <th className="p-2 border-r">File Name</th>
                            <th className="p-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {addMoreDocs.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50">
                              <td className="p-2 border-r font-medium text-gray-800">{doc.name}</td>
                              <td className="p-2 border-r text-gray-600">{doc.number || 'N/A'}</td>
                              <td className="p-2 border-r text-indigo-600 font-mono text-[11px]">
                                {doc.file ? doc.file.name : 'No File'}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(doc.id)}
                                  className="text-red-500 hover:text-red-700 font-bold p-1 rounded hover:bg-red-50 transition"
                                  title="Remove Document"
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

              {/* Action Buttons: Back & Submit */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-[#2D336B] hover:bg-[#1E2245] text-white font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2 shadow"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-2 bg-[#1E2245] hover:bg-[#2D336B] text-white font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
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

export default ApplyLoan;
