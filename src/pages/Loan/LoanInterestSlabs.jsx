import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Percent,
  Edit,
  Eye,
  Loader,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';

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

const LoanInterestSlabs = () => {
  const localprimeBase =
    import.meta.env.VITE_LOCALPRIME_URL ||
    'http://192.168.29.145:5000/badri_enterprises/localprime';

  // Available Loan Products from API
  const [allLoanProducts, setAllLoanProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form State
  const [loanType, setLoanType] = useState('Loan'); // Group, Loan, Limit
  const [interestType, setInterestType] = useState('Flat'); // Flat, Reducing
  const [reducing, setReducing] = useState('Daily'); // Daily, Monthly, Weekly, Yearly
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [selectedLoanName, setSelectedLoanName] = useState('--Select--');
  const [durationIn, setDurationIn] = useState('Days'); // Days, Months, Years

  // Sub-Section Fields
  const [fromVal, setFromVal] = useState('0');
  const [toVal, setToVal] = useState('');
  const [rateOfInterest, setRateOfInterest] = useState('');
  const [chqBounceCharge, setChqBounceCharge] = useState('');
  const [minimumAmount, setMinimumAmount] = useState('');
  const [minimumPeriod, setMinimumPeriod] = useState('');
  const [processingFee, setProcessingFee] = useState('');
  const [gstPercentage, setGstPercentage] = useState('18');
  const [feeType, setFeeType] = useState('Percent (%)'); // Percent (%), Flat
  const [otherPenalty, setOtherPenalty] = useState('');
  const [grace, setGrace] = useState('');
  const [lpc, setLpc] = useState('');
  const [status, setStatus] = useState('Active');

  const [submitting, setSubmitting] = useState(false);

  // Directory Data State
  const [slabs, setSlabs] = useState([]);
  const [loadingSlabs, setLoadingSlabs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedSlab, setSelectedSlab] = useState(null); // View Modal
  const [editingSlab, setEditingSlab] = useState(null); // Edit Modal
  const [updating, setUpdating] = useState(false);

  // Edit Form State
  const [editLoanType, setEditLoanType] = useState('Loan');
  const [editInterestType, setEditInterestType] = useState('Flat');
  const [editReducing, setEditReducing] = useState('Daily');
  const [editSelectedLoanId, setEditSelectedLoanId] = useState('');
  const [editSelectedLoanName, setEditSelectedLoanName] = useState('--Select--');
  const [editDurationIn, setEditDurationIn] = useState('Days');
  const [editFromVal, setEditFromVal] = useState('0');
  const [editToVal, setEditToVal] = useState('');
  const [editRateOfInterest, setEditRateOfInterest] = useState('');
  const [editChqBounceCharge, setEditChqBounceCharge] = useState('');
  const [editMinimumAmount, setEditMinimumAmount] = useState('');
  const [editMinimumPeriod, setEditMinimumPeriod] = useState('');
  const [editProcessingFee, setEditProcessingFee] = useState('');
  const [editGstPercentage, setEditGstPercentage] = useState('18');
  const [editFeeType, setEditFeeType] = useState('Percent (%)');
  const [editOtherPenalty, setEditOtherPenalty] = useState('');
  const [editGrace, setEditGrace] = useState('');
  const [editLpc, setEditLpc] = useState('');
  const [editStatus, setEditStatus] = useState('Active');

  // Fetch Loan Products for Dropdown
  const fetchLoanProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await axios.get(`${localprimeBase}/loan-products`);
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data?.data)) list = res.data.data;
      else if (Array.isArray(res.data?.products)) list = res.data.products;
      else if (res.data && typeof res.data === 'object') {
        const arr = Object.values(res.data).find((v) => Array.isArray(v));
        if (arr) list = arr;
      }

      const normalized = list.map((item) => {
        const mongoId =
          item._id ||
          item.loan_id ||
          item.loanId ||
          item.product_id ||
          item.productId ||
          item.id ||
          '';
        const name =
          item.productName ||
          item.product_name ||
          item.loanName ||
          item.loan_name ||
          item.name ||
          item.title ||
          'Unnamed Product';
        const type =
          item.productType || item.product_type || item.type || 'Loan';
        return {
          raw: item,
          id: mongoId,
          _id: mongoId,
          loan_id: mongoId,
          name,
          type,
          status: item.status || 'Active',
        };
      });

      setAllLoanProducts(normalized);
    } catch (err) {
      console.error('Error fetching loan products for slab dropdown:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch Interest Slabs / Parameters List
  const fetchInterestSlabs = async () => {
    setLoadingSlabs(true);
    try {
      const res = await axios.get(`${localprimeBase}/loan-parameters`);
      console.log('=== [LOAN PARAMETERS] FETCH RESPONSE ===', res.data);

      let rawList = [];
      if (Array.isArray(res.data)) rawList = res.data;
      else if (Array.isArray(res.data?.data)) rawList = res.data.data;
      else if (Array.isArray(res.data?.parameters)) rawList = res.data.parameters;
      else if (Array.isArray(res.data?.slabs)) rawList = res.data.slabs;
      else if (res.data && typeof res.data === 'object') {
        const arr = Object.values(res.data).find((v) => Array.isArray(v));
        if (arr) rawList = arr;
        else rawList = [res.data];
      }

      const normalized = rawList.map((item, idx) => {
        const id =
          item._id ||
          item.parameter_id ||
          item.parameterId ||
          item.slab_id ||
          item.slabId ||
          item.id ||
          `PARAM-${100 + idx}`;
        return {
          raw: item,
          id,
          parameter_id: id,
          loanType: item.loanType || item.loan_type || 'Loan',
          interestType: item.interestType || item.interest_type || 'Flat',
          reducing: item.reducing || 'Daily',
          selectedLoan:
            item.selectedLoan || item.selected_loan || item.loanName || 'N/A',
          durationIn: item.durationIn || item.duration_in || 'Days',
          fromVal: item.fromVal || item.from_val || item.from || '0',
          toVal: item.toVal || item.to_val || item.to || 'N/A',
          rateOfInterest:
            item.rateOfInterest || item.rate_of_interest || item.roi || '0',
          chqBounceCharge:
            item.chqBounceCharge || item.chq_bounce_charge || '0',
          minimumAmount: item.minimumAmount || item.minimum_amount || '0',
          minimumPeriod: item.minimumPeriod || item.minimum_period || '0',
          processingFee: item.processingFee || item.processing_fee || '0',
          gstPercentage: item.gstPercentage || item.gst_percentage || '18',
          feeType: item.feeType || item.fee_type || 'Percent (%)',
          otherPenalty: item.otherPenalty || item.other_penalty || '0',
          grace: item.grace || '0',
          lpc: item.lpc || '0',
          status: item.status || item.Status || 'Active',
          createdAt: item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : item.createdAt || 'N/A',
        };
      });

      setSlabs(normalized);
    } catch (err) {
      console.error('Error fetching interest slabs/parameters:', err);
      setSlabs([]);
    } finally {
      setLoadingSlabs(false);
    }
  };

  useEffect(() => {
    fetchLoanProducts();
    fetchInterestSlabs();
  }, []);

  // Filter products by selected Loan Type for Creation Form
  const filteredLoanProductsForForm = allLoanProducts.filter(
    (p) => String(p.type).toLowerCase() === String(loanType).toLowerCase()
  );

  // Filter products by selected Loan Type for Edit Form
  const filteredLoanProductsForEdit = allLoanProducts.filter(
    (p) => String(p.type).toLowerCase() === String(editLoanType).toLowerCase()
  );

  // Handle Create Interest Slab
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!selectedLoanId && (!selectedLoanName || selectedLoanName === '--Select--')) {
      toast.error('Please select a Loan product');
      return;
    }
    if (!rateOfInterest) {
      toast.error('Please enter Rate of Interest (%age)');
      return;
    }

    setSubmitting(true);

    let actualLoanId = selectedLoanId;
    let actualLoanName = selectedLoanName;

    if (!actualLoanId || actualLoanId === '--Select--') {
      const match = allLoanProducts.find(
        (p) => String(p.name).toLowerCase() === String(selectedLoanName).toLowerCase()
      );
      if (match) {
        actualLoanId = match.id || match._id || match.loan_id;
      }
    }

    if (!actualLoanName || actualLoanName === '--Select--') {
      const match = allLoanProducts.find(
        (p) => String(p.id) === String(selectedLoanId)
      );
      if (match) {
        actualLoanName = match.name;
      }
    }

    if (!actualLoanId || actualLoanId === '--Select--') {
      toast.error('Please select a valid Loan product');
      setSubmitting(false);
      return;
    }

    const payload = {
      loan_id: actualLoanId,
      Loan_id: actualLoanId,
      loan_Id: actualLoanId,
      loanId: actualLoanId,
      product_id: actualLoanId,
      productId: actualLoanId,
      _id: actualLoanId,
      loanType,
      loan_type: loanType,
      interestType,
      interest_type: interestType,
      reducing,
      selectedLoan: actualLoanName,
      selected_loan: actualLoanName,
      loanName: actualLoanName,
      loan_name: actualLoanName,
      productName: actualLoanName,
      product_name: actualLoanName,
      durationIn,
      duration_in: durationIn,
      fromVal,
      from_val: fromVal,
      from: fromVal,
      toVal,
      to_val: toVal,
      to: toVal,
      rateOfInterest,
      rate_of_interest: rateOfInterest,
      roi: rateOfInterest,
      chqBounceCharge,
      chq_bounce_charge: chqBounceCharge,
      minimumAmount,
      minimum_amount: minimumAmount,
      minimumPeriod,
      minimum_period: minimumPeriod,
      processingFee,
      processing_fee: processingFee,
      gstPercentage,
      gst_percentage: gstPercentage,
      feeType,
      fee_type: feeType,
      otherPenalty,
      other_penalty: otherPenalty,
      grace,
      lpc,
      status,
      Status: status,
    };

    console.log('=== [CREATE LOAN PARAMETER] PAYLOAD ===', payload);

    try {
      const res = await axios.post(`${localprimeBase}/loan-parameters`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('=== [CREATE LOAN PARAMETER] JSON SUCCESS ===', res.data);
      toast.success(res.data?.message || 'Loan Parameter created successfully!');
      
      // Reset Form
      setSelectedLoanId('');
      setSelectedLoanName('--Select--');
      setToVal('');
      setRateOfInterest('');
      setChqBounceCharge('');
      setMinimumAmount('');
      setMinimumPeriod('');
      setProcessingFee('');
      setOtherPenalty('');
      setGrace('');
      setLpc('');

      fetchInterestSlabs();
    } catch (err) {
      console.error('=== [JSON SUBMIT FAILED] ERROR ===', err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      console.error('=== [JSON SUBMIT FAILED] SERVER RESPONSE DATA ===', err?.response?.data);

      if (serverMsg) {
        toast.error(serverMsg);
        setSubmitting(false);
        return;
      }

      try {
        const fd = new FormData();
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== undefined && payload[key] !== null) {
            fd.append(key, String(payload[key]));
          }
        });

        const res2 = await axios.post(`${localprimeBase}/loan-parameters`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log('=== [CREATE LOAN PARAMETER] FORMDATA SUCCESS ===', res2.data);
        toast.success(res2.data?.message || 'Loan Parameter created successfully!');
        
        // Reset Form
        setSelectedLoanId('');
        setSelectedLoanName('--Select--');
        setToVal('');
        setRateOfInterest('');
        setChqBounceCharge('');
        setMinimumAmount('');
        setMinimumPeriod('');
        setProcessingFee('');
        setOtherPenalty('');
        setGrace('');
        setLpc('');

        fetchInterestSlabs();
      } catch (err2) {
        console.error('=== [FORMDATA SUBMIT FAILED] ERROR ===', err2);
        console.error('=== [FORMDATA SUBMIT FAILED] SERVER RESPONSE DATA ===', err2?.response?.data);

        toast.error(
          err2?.response?.data?.message ||
            err2?.response?.data?.error ||
            'Failed to create Loan Parameter.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingSlab(item);
    setEditLoanType(item.loanType);
    setEditInterestType(item.interestType);
    setEditReducing(item.reducing);
    setEditSelectedLoanId(item.loan_id || item.raw?.loan_id || item.raw?.Loan_id || item.id);
    setEditSelectedLoanName(item.selectedLoan);
    setEditDurationIn(item.durationIn);
    setEditFromVal(item.fromVal);
    setEditToVal(item.toVal === 'N/A' ? '' : item.toVal);
    setEditRateOfInterest(item.rateOfInterest);
    setEditChqBounceCharge(item.chqBounceCharge);
    setEditMinimumAmount(item.minimumAmount);
    setEditMinimumPeriod(item.minimumPeriod);
    setEditProcessingFee(item.processingFee);
    setEditGstPercentage(item.gstPercentage);
    setEditFeeType(item.feeType);
    setEditOtherPenalty(item.otherPenalty);
    setEditGrace(item.grace);
    setEditLpc(item.lpc);
    setEditStatus(item.status);
  };

  // Update Interest Slab / Parameter
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingSlab) return;

    setUpdating(true);
    const targetId = editingSlab.parameter_id || editingSlab.id;

    let actualEditLoanId = editSelectedLoanId;
    let actualEditLoanName = editSelectedLoanName;

    if (!actualEditLoanId || actualEditLoanId === '--Select--') {
      const match = allLoanProducts.find(
        (p) => String(p.name).toLowerCase() === String(editSelectedLoanName).toLowerCase()
      );
      if (match) {
        actualEditLoanId = match.id || match._id || match.loan_id;
      }
    }

    if (!actualEditLoanName || actualEditLoanName === '--Select--') {
      const match = allLoanProducts.find(
        (p) => String(p.id) === String(editSelectedLoanId)
      );
      if (match) {
        actualEditLoanName = match.name;
      }
    }

    const payload = {
      _id: targetId,
      parameter_id: targetId,
      slab_id: targetId,
      id: targetId,
      loan_id: actualEditLoanId,
      Loan_id: actualEditLoanId,
      loan_Id: actualEditLoanId,
      loanId: actualEditLoanId,
      loanId: actualEditLoanId,
      product_id: actualEditLoanId,
      productId: actualEditLoanId,
      loanType: editLoanType,
      loan_type: editLoanType,
      interestType: editInterestType,
      interest_type: editInterestType,
      reducing: editReducing,
      selectedLoan: actualEditLoanName,
      selected_loan: actualEditLoanName,
      loanName: actualEditLoanName,
      loan_name: actualEditLoanName,
      durationIn: editDurationIn,
      duration_in: editDurationIn,
      fromVal: editFromVal,
      from_val: editFromVal,
      from: editFromVal,
      toVal: editToVal,
      to_val: editToVal,
      to: editToVal,
      rateOfInterest: editRateOfInterest,
      rate_of_interest: editRateOfInterest,
      roi: editRateOfInterest,
      chqBounceCharge: editChqBounceCharge,
      chq_bounce_charge: editChqBounceCharge,
      minimumAmount: editMinimumAmount,
      minimum_amount: editMinimumAmount,
      minimumPeriod: editMinimumPeriod,
      minimum_period: editMinimumPeriod,
      processingFee: editProcessingFee,
      processing_fee: editProcessingFee,
      gstPercentage: editGstPercentage,
      gst_percentage: editGstPercentage,
      feeType: editFeeType,
      fee_type: editFeeType,
      otherPenalty: editOtherPenalty,
      other_penalty: editOtherPenalty,
      grace: editGrace,
      lpc: editLpc,
      status: editStatus,
      Status: editStatus,
    };

    console.log('=== [UPDATE LOAN PARAMETER] PAYLOAD ===', payload);

    try {
      const res = await axios.post(
        `${localprimeBase}/loan-parameters/${targetId}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('=== [UPDATE LOAN PARAMETER] JSON SUCCESS ===', res.data);
      toast.success(res.data?.message || 'Loan Parameter updated successfully!');
      setEditingSlab(null);
      fetchInterestSlabs();
    } catch (err) {
      console.error('=== [UPDATE JSON FAILED] ERROR ===', err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      console.error('=== [UPDATE JSON FAILED] SERVER RESPONSE DATA ===', err?.response?.data);

      if (serverMsg) {
        toast.error(serverMsg);
        setUpdating(false);
        return;
      }

      try {
        const fd = new FormData();
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== undefined && payload[key] !== null) {
            fd.append(key, String(payload[key]));
          }
        });

        const res2 = await axios.post(
          `${localprimeBase}/loan-parameters/${targetId}`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        console.log('=== [UPDATE LOAN PARAMETER] FORMDATA SUCCESS ===', res2.data);
        toast.success(res2.data?.message || 'Loan Parameter updated successfully!');
        setEditingSlab(null);
        fetchInterestSlabs();
      } catch (err2) {
        console.error('=== [UPDATE FORMDATA FAILED] ERROR ===', err2);
        console.error('=== [UPDATE FORMDATA FAILED] SERVER RESPONSE DATA ===', err2?.response?.data);
        console.error('=== [UPDATE FORMDATA FAILED] STATUS CODE ===', err2?.response?.status);

        toast.error(
          err2?.response?.data?.message ||
            err2?.response?.data?.error ||
            'Failed to update Loan Parameter.'
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  // Search filter
  const filteredSlabs = slabs.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      String(s.loanType).toLowerCase().includes(term) ||
      String(s.selectedLoan).toLowerCase().includes(term) ||
      String(s.interestType).toLowerCase().includes(term) ||
      String(s.rateOfInterest).toLowerCase().includes(term)
    );
  });

  const inputCls =
    'w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition';
  const labelCls = 'block text-[11px] font-bold text-gray-700 mb-1';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* Top Banner Title */}
      <div className="bg-[#3B3C6E] text-white px-4 py-2.5 rounded-t-lg shadow-sm font-semibold text-xs sm:text-sm uppercase tracking-wider mb-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-purple-200" />
          <span>CREATE LOAN INTEREST SLAB</span>
        </div>
        <button
          onClick={fetchInterestSlabs}
          className="hover:bg-white/10 p-1 rounded transition text-xs flex items-center gap-1"
          title="Refresh List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingSlabs ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Creation Form */}
      <div className="bg-white border-x border-b border-gray-200 shadow-sm mb-6 rounded-b-lg overflow-hidden">
        <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4">
          {/* Row 1 Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Loan Type */}
            <div>
              <label className={labelCls}>Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => {
                  setLoanType(e.target.value);
                  setSelectedLoanId('');
                  setSelectedLoanName('--Select--');
                }}
                className={inputCls}
              >
                <option value="Group">Group</option>
                <option value="Loan">Loan</option>
                <option value="Limit">Limit</option>
              </select>
            </div>

            {/* Interest Type */}
            <div>
              <label className={labelCls}>Interest Type</label>
              <select
                value={interestType}
                onChange={(e) => setInterestType(e.target.value)}
                className={inputCls}
              >
                <option value="Flat">Flat</option>
                <option value="Reducing">Reducing</option>
              </select>
            </div>

            {/* Reducing */}
            <div>
              <label className={labelCls}>Reducing</label>
              <select
                value={reducing}
                onChange={(e) => setReducing(e.target.value)}
                className={inputCls}
              >
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {/* Select Loan (Filtered by Loan Type from /loan-products) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  Select Loan
                </label>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">
                  Filtered by {loanType}
                </span>
              </div>
              <select
                value={selectedLoanId}
                onChange={(e) => {
                  const chosenId = e.target.value;
                  setSelectedLoanId(chosenId);
                  const prod = allLoanProducts.find(
                    (p) => String(p.id) === String(chosenId)
                  );
                  if (prod) {
                    setSelectedLoanName(prod.name);
                  } else {
                    setSelectedLoanName('--Select--');
                  }
                }}
                className={inputCls}
                required
              >
                <option value="">--Select--</option>
                {filteredLoanProductsForForm.length > 0 ? (
                  filteredLoanProductsForForm.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No products found for {loanType}
                  </option>
                )}
              </select>
            </div>

            {/* Duration In */}
            <div>
              <label className={labelCls}>Duration In</label>
              <select
                value={durationIn}
                onChange={(e) => setDurationIn(e.target.value)}
                className={inputCls}
              >
                <option value="Days">Days</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </select>
            </div>
          </div>

          {/* Sub-Header Section Banner: Edit / Details */}
          <div className="bg-[#5C5E9B] text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider mt-4">
            Edit / Slab Parameters
          </div>

          {/* Row 2 & 3 Input Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div>
              <label className={labelCls}>From</label>
              <input
                type="text"
                value={fromVal}
                onChange={(e) => setFromVal(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>To</label>
              <input
                type="text"
                value={toVal}
                onChange={(e) => setToVal(e.target.value)}
                placeholder="Date Range"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Rate of Interest</label>
              <input
                type="text"
                value={rateOfInterest}
                onChange={(e) => setRateOfInterest(e.target.value)}
                placeholder="Enter %age"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Chq Bounce Charge</label>
              <input
                type="text"
                value={chqBounceCharge}
                onChange={(e) => setChqBounceCharge(e.target.value)}
                placeholder="Enter %age"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Minimum Amount</label>
              <input
                type="text"
                value={minimumAmount}
                onChange={(e) => setMinimumAmount(e.target.value)}
                placeholder="Enter Value"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Minimum Period</label>
              <input
                type="text"
                value={minimumPeriod}
                onChange={(e) => setMinimumPeriod(e.target.value)}
                placeholder="Enter Value"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Processing Fee</label>
              <input
                type="text"
                value={processingFee}
                onChange={(e) => setProcessingFee(e.target.value)}
                placeholder="Enter %age"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>GST(%)</label>
              <input
                type="text"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
                placeholder="18"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Type</label>
              <select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
                className={inputCls}
              >
                <option value="Percent (%)">Percent (%)</option>
                <option value="Flat / Amount">Flat / Amount</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Other Penalty</label>
              <input
                type="text"
                value={otherPenalty}
                onChange={(e) => setOtherPenalty(e.target.value)}
                placeholder="Enter %age"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Grace</label>
              <input
                type="text"
                value={grace}
                onChange={(e) => setGrace(e.target.value)}
                placeholder="In days"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>LPC</label>
              <input
                type="text"
                value={lpc}
                onChange={(e) => setLpc(e.target.value)}
                placeholder="LPC Value"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Submit Button Bar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#2D336B] hover:bg-[#222754] text-white font-bold rounded-md text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Directory Header Bar */}
      <div className="bg-white rounded-t-lg border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
          Interest Slabs Directory
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
            {filteredSlabs.length} Slabs
          </span>
        </h2>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search slab, loan, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Table Directory */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#3B3C6E] text-white text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-14 text-center border-r border-indigo-900/50">
                  S.no.
                </th>
                <th className="py-3 px-3 border-r border-indigo-900/50">
                  Loan Type
                </th>
                <th className="py-3 px-3 border-r border-indigo-900/50">
                  Selected Loan
                </th>
                <th className="py-3 px-3 border-r border-indigo-900/50">
                  Interest Type
                </th>
                <th className="py-3 px-3 border-r border-indigo-900/50 text-center">
                  ROI (%)
                </th>
                <th className="py-3 px-3 border-r border-indigo-900/50 text-center">
                  Duration
                </th>
                <th className="py-3 px-3 border-r border-indigo-900/50 text-center">
                  Status
                </th>
                <th className="py-3 px-4 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs sm:text-sm">
              {loadingSlabs ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    <Loader className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading interest slabs...
                  </td>
                </tr>
              ) : filteredSlabs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No interest slabs found.
                  </td>
                </tr>
              ) : (
                filteredSlabs.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className={
                      index % 2 === 0
                        ? 'bg-white hover:bg-slate-50 transition'
                        : 'bg-[#EAFBFB]/60 hover:bg-[#DDF6F6] transition'
                    }
                  >
                    <td className="py-3 px-3 font-semibold text-gray-700 text-center border-r border-gray-100">
                      {index + 1}
                    </td>

                    <td className="py-3 px-3 font-bold text-gray-800 border-r border-gray-100">
                      {item.loanType}
                    </td>

                    <td className="py-3 px-3 font-semibold text-indigo-900 border-r border-gray-100">
                      {item.selectedLoan}
                    </td>

                    <td className="py-3 px-3 text-gray-600 border-r border-gray-100">
                      {item.interestType} ({item.reducing})
                    </td>

                    <td className="py-3 px-3 font-extrabold text-emerald-700 text-center border-r border-gray-100">
                      {item.rateOfInterest}%
                    </td>

                    <td className="py-3 px-3 text-center border-r border-gray-100 text-gray-600 font-medium">
                      {item.durationIn}
                    </td>

                    <td className="py-3 px-3 text-center border-r border-gray-100">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {item.status === 'Active' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-gray-500" />
                        )}
                        {item.status}
                      </span>
                    </td>

                    {/* Actions: View & Edit */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedSlab(item)}
                          className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          title="Edit Slab"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- View All Details Modal --- */}
      {selectedSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600" />
                Interest Slab Details — {selectedSlab.selectedLoan}
              </h3>
              <button
                onClick={() => setSelectedSlab(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex justify-between items-center">
                <div>
                  <span className="text-gray-400 font-semibold block text-[11px]">
                    Selected Loan
                  </span>
                  <span className="text-sm font-extrabold text-gray-900">
                    {selectedSlab.selectedLoan}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold ${
                    selectedSlab.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {selectedSlab.status}
                </span>
              </div>

              {/* Grid of ALL Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Loan Type
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.loanType}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Interest Type
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.interestType}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Reducing
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.reducing}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Duration In
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.durationIn}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Rate of Interest (ROI)
                  </span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {selectedSlab.rateOfInterest}%
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Chq Bounce Charge
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.chqBounceCharge}%
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    From - To
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.fromVal} - {selectedSlab.toVal}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Minimum Amount
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.minimumAmount}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Minimum Period
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.minimumPeriod}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Processing Fee
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.processingFee} ({selectedSlab.feeType})
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    GST (%)
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.gstPercentage}%
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Other Penalty
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.otherPenalty}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Grace (days)
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.grace}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    LPC
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.lpc}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-semibold block text-[10px]">
                    Created Date
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSlab.createdAt}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  const item = selectedSlab;
                  setSelectedSlab(null);
                  handleOpenEdit(item);
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-md text-xs transition"
              >
                Edit Slab
              </button>
              <button
                onClick={() => setSelectedSlab(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-md text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit All Parameters Modal --- */}
      {editingSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Interest Slab
              </h3>
              <button
                onClick={() => setEditingSlab(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Loan Type</label>
                  <select
                    value={editLoanType}
                    onChange={(e) => {
                      setEditLoanType(e.target.value);
                      setEditSelectedLoanId('');
                      setEditSelectedLoanName('--Select--');
                    }}
                    className={inputCls}
                  >
                    <option value="Group">Group</option>
                    <option value="Loan">Loan</option>
                    <option value="Limit">Limit</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Interest Type</label>
                  <select
                    value={editInterestType}
                    onChange={(e) => setEditInterestType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="Flat">Flat</option>
                    <option value="Reducing">Reducing</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Reducing</label>
                  <select
                    value={editReducing}
                    onChange={(e) => setEditReducing(e.target.value)}
                    className={inputCls}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Select Loan</label>
                  <select
                    value={editSelectedLoanId}
                    onChange={(e) => {
                      const chosenId = e.target.value;
                      setEditSelectedLoanId(chosenId);
                      const prod = allLoanProducts.find(
                        (p) => String(p.id) === String(chosenId)
                      );
                      if (prod) {
                        setEditSelectedLoanName(prod.name);
                      } else {
                        setEditSelectedLoanName('--Select--');
                      }
                    }}
                    className={inputCls}
                    required
                  >
                    <option value="">--Select--</option>
                    {filteredLoanProductsForEdit.length > 0 ? (
                      filteredLoanProductsForEdit.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No products found for {editLoanType}
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Duration In</label>
                  <select
                    value={editDurationIn}
                    onChange={(e) => setEditDurationIn(e.target.value)}
                    className={inputCls}
                  >
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>From</label>
                  <input
                    type="text"
                    value={editFromVal}
                    onChange={(e) => setEditFromVal(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>To</label>
                  <input
                    type="text"
                    value={editToVal}
                    onChange={(e) => setEditToVal(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Rate of Interest</label>
                  <input
                    type="text"
                    value={editRateOfInterest}
                    onChange={(e) => setEditRateOfInterest(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Chq Bounce Charge</label>
                  <input
                    type="text"
                    value={editChqBounceCharge}
                    onChange={(e) => setEditChqBounceCharge(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Minimum Amount</label>
                  <input
                    type="text"
                    value={editMinimumAmount}
                    onChange={(e) => setEditMinimumAmount(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Minimum Period</label>
                  <input
                    type="text"
                    value={editMinimumPeriod}
                    onChange={(e) => setEditMinimumPeriod(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Processing Fee</label>
                  <input
                    type="text"
                    value={editProcessingFee}
                    onChange={(e) => setEditProcessingFee(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>GST(%)</label>
                  <input
                    type="text"
                    value={editGstPercentage}
                    onChange={(e) => setEditGstPercentage(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    value={editFeeType}
                    onChange={(e) => setEditFeeType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="Percent (%)">Percent (%)</option>
                    <option value="Flat / Amount">Flat / Amount</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Other Penalty</label>
                  <input
                    type="text"
                    value={editOtherPenalty}
                    onChange={(e) => setEditOtherPenalty(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Grace</label>
                  <input
                    type="text"
                    value={editGrace}
                    onChange={(e) => setEditGrace(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>LPC</label>
                  <input
                    type="text"
                    value={editLpc}
                    onChange={(e) => setEditLpc(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className={inputCls}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingSlab(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-md text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-[#2D336B] hover:bg-[#222754] text-white font-bold rounded-md text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
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

export default LoanInterestSlabs;
