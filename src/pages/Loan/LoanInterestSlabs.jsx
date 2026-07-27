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
      timer: 4000,
      timerProgressBar: true,
    }),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Utility: clean an object by converting all values to strings (safe for JSON). */
const cleanObj = (obj) => {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) out[k] = String(v);
  });
  return out;
};

/** Extract first non-empty value from an item for a list of keys. */
const pick = (item, keys, fallback = '') =>
  keys.reduce((acc, k) => (acc !== '' ? acc : item?.[k] ?? ''), '') || fallback;

/** Find MongoDB-like id from a product object. */
const pickId = (item) =>
  pick(item, ['_id', 'loan_id', 'loanId', 'product_id', 'productId', 'id']);

// ── Component ──────────────────────────────────────────────────────────────────

const LoanInterestSlabs = () => {
  const BASE =
    import.meta.env.VITE_LOCALPRIME_URL ||
    'http://192.168.29.145:5000/badri_enterprises/localprime';

  // ── State ──────────────────────────────────────────────────────────────────

  const [allProducts, setAllProducts] = useState([]);
  const [slabs, setSlabs] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSlabs, setLoadingSlabs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [editingSlab, setEditingSlab] = useState(null);

  // Create form
  const [loanType, setLoanType] = useState('Loan');
  const [interestType, setInterestType] = useState('Flat');
  const [reducing, setReducing] = useState('Daily');
  const [selLoanId, setSelLoanId] = useState('');
  const [selLoanName, setSelLoanName] = useState('');
  const [durationIn, setDurationIn] = useState('Days');
  const [fromVal, setFromVal] = useState('0');
  const [toVal, setToVal] = useState('');
  const [roi, setRoi] = useState('');
  const [chqBounce, setChqBounce] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [minPeriod, setMinPeriod] = useState('');
  const [procFee, setProcFee] = useState('');
  const [gst, setGst] = useState('18');
  const [feeType, setFeeType] = useState('Percent (%)');
  const [penalty, setPenalty] = useState('');
  const [grace, setGrace] = useState('');
  const [lpc, setLpc] = useState('');
  const [status, setStatus] = useState('Active');

  // Edit form
  const [editLoanType, setEditLoanType] = useState('Loan');
  const [editInterestType, setEditInterestType] = useState('Flat');
  const [editReducing, setEditReducing] = useState('Daily');
  const [editSelLoanId, setEditSelLoanId] = useState('');
  const [editSelLoanName, setEditSelLoanName] = useState('');
  const [editDurationIn, setEditDurationIn] = useState('Days');
  const [editFromVal, setEditFromVal] = useState('0');
  const [editToVal, setEditToVal] = useState('');
  const [editRoi, setEditRoi] = useState('');
  const [editChqBounce, setEditChqBounce] = useState('');
  const [editMinAmount, setEditMinAmount] = useState('');
  const [editMinPeriod, setEditMinPeriod] = useState('');
  const [editProcFee, setEditProcFee] = useState('');
  const [editGst, setEditGst] = useState('18');
  const [editFeeType, setEditFeeType] = useState('Percent (%)');
  const [editPenalty, setEditPenalty] = useState('');
  const [editGrace, setEditGrace] = useState('');
  const [editLpc, setEditLpc] = useState('');
  const [editStatus, setEditStatus] = useState('Active');

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await axios.get(`${BASE}/loan-products`);
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data?.data)) list = res.data.data;
      else if (res.data && typeof res.data === 'object') {
        const arr = Object.values(res.data).find((v) => Array.isArray(v));
        if (arr) list = arr;
      }
      setAllProducts(
        list.map((item) => ({
          id: pickId(item),
          name: pick(item, ['productName', 'product_name', 'loanName', 'loan_name', 'name', 'title'], 'Unnamed'),
          type: pick(item, ['productType', 'product_type', 'type'], 'Loan'),
        }))
      );
    } catch (err) {
      console.error('[fetchProducts] error:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSlabs = async () => {
    setLoadingSlabs(true);
    try {
      const res = await axios.get(`${BASE}/loan-parameters`);
      let raw = [];
      if (Array.isArray(res.data)) raw = res.data;
      else if (Array.isArray(res.data?.data)) raw = res.data.data;
      else if (res.data && typeof res.data === 'object') {
        const arr = Object.values(res.data).find((v) => Array.isArray(v));
        raw = arr || (Object.keys(res.data).length ? [res.data] : []);
      }
      setSlabs(
        raw.map((item, idx) => {
          const id = pick(item, ['_id', 'parameter_id', 'parameterId', 'slab_id', 'id'], `P-${idx}`);
          return {
            id,
            parameter_id: id,
            loan_id: pick(item, ['loan_id', 'loanId', 'Loan_id']),
            loanType: pick(item, ['loanType', 'loan_type'], 'Loan'),
            interestType: pick(item, ['interestType', 'interest_type'], 'Flat'),
            reducing: item.reducing || 'Daily',
            selectedLoan: pick(item, ['selectedLoan', 'selected_loan', 'loanName', 'loan_name'], 'N/A'),
            durationIn: pick(item, ['durationIn', 'duration_in'], 'Days'),
            fromVal: pick(item, ['fromVal', 'from_val', 'from'], '0'),
            toVal: pick(item, ['toVal', 'to_val', 'to'], 'N/A'),
            rateOfInterest: pick(item, ['rateOfInterest', 'rate_of_interest', 'roi'], '0'),
            chqBounceCharge: pick(item, ['chqBounceCharge', 'chq_bounce_charge'], '0'),
            minimumAmount: pick(item, ['minimumAmount', 'minimum_amount'], '0'),
            minimumPeriod: pick(item, ['minimumPeriod', 'minimum_period'], '0'),
            processingFee: pick(item, ['processingFee', 'processing_fee'], '0'),
            gstPercentage: pick(item, ['gstPercentage', 'gst_percentage'], '18'),
            feeType: pick(item, ['feeType', 'fee_type'], 'Percent (%)'),
            otherPenalty: pick(item, ['otherPenalty', 'other_penalty'], '0'),
            grace: item.grace || '0',
            lpc: item.lpc || '0',
            status: item.status || item.Status || 'Active',
            createdAt: item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : item.createdAt || 'N/A',
            raw: item,
          };
        })
      );
    } catch (err) {
      console.error('[fetchSlabs] error:', err);
      setSlabs([]);
    } finally {
      setLoadingSlabs(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSlabs();
  }, []);

  // ── Filtered product lists ─────────────────────────────────────────────────

  const productsForCreate = allProducts.filter(
    (p) => p.type.toLowerCase() === loanType.toLowerCase()
  );
  const productsForEdit = allProducts.filter(
    (p) => p.type.toLowerCase() === editLoanType.toLowerCase()
  );

  // ── Resolve loan id from product list ──────────────────────────────────────

  const resolveLoanId = (id, name, products) => {
    if (id) return id;
    const match = products.find(
      (p) => p.name.toLowerCase() === (name || '').toLowerCase()
    );
    return match ? match.id : '';
  };

  const resolveLoanName = (id, name, products) => {
    if (name && name !== '--Select--') return name;
    const match = products.find((p) => p.id === id);
    return match ? match.name : name || '';
  };

  // ── Submit helpers ─────────────────────────────────────────────────────────

  /**
   * Submit as application/json — Flask backend uses request.get_json().
   * CORS 500 errors were caused by empty numeric fields crashing Flask;
   * all numeric fields now default to '0' so Flask won't crash.
   */
  const submitJson = async (url, data) => {
    console.log('[SUBMIT] URL:', url, 'Payload:', data);
    const res = await axios.post(url, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  };

  // ── Reset create form ──────────────────────────────────────────────────────

  const resetCreateForm = () => {
    setSelLoanId('');
    setSelLoanName('');
    setToVal('');
    setRoi('');
    setChqBounce('');
    setMinAmount('');
    setMinPeriod('');
    setProcFee('');
    setPenalty('');
    setGrace('');
    setLpc('');
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();

    const loanId = resolveLoanId(selLoanId, selLoanName, allProducts);
    if (!loanId) {
      toast.error('Please select a valid Loan product');
      return;
    }
    if (!roi) {
      toast.error('Please enter Rate of Interest');
      return;
    }

    setSubmitting(true);
    const loanName = resolveLoanName(loanId, selLoanName, allProducts);

    const data = {
      loan_id: loanId,
      Loan_id: loanId,
      loanId: loanId,
      product_id: loanId,
      loanType,
      loan_type: loanType,
      interestType,
      interest_type: interestType,
      reducing,
      selectedLoan: loanName,
      loanName,
      loan_name: loanName,
      durationIn,
      duration_in: durationIn,
      from: fromVal || '0',
      fromVal: fromVal || '0',
      to: toVal || '0',
      toVal: toVal || '0',
      rateOfInterest: roi,
      rate_of_interest: roi,
      roi,
      chqBounceCharge: chqBounce || '0',
      chq_bounce_charge: chqBounce || '0',
      minimumAmount: minAmount || '0',
      minimum_amount: minAmount || '0',
      minimumPeriod: minPeriod || '0',
      minimum_period: minPeriod || '0',
      processingFee: procFee || '0',
      processing_fee: procFee || '0',
      gstPercentage: gst || '18',
      gst_percentage: gst || '18',
      feeType,
      fee_type: feeType,
      otherPenalty: penalty || '0',
      other_penalty: penalty || '0',
      grace: grace || '0',
      lpc: lpc || '0',
      status,
      Status: status,
    };

    console.log('[CREATE] payload:', data);

    try {
      const result = await submitJson(`${BASE}/loan-parameters`, data);
      console.log('[CREATE] success:', result);
      toast.success(result?.message || 'Loan Parameter created successfully!');
      resetCreateForm();
      fetchSlabs();
    } catch (err) {
      console.error('[CREATE] error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create Loan Parameter.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingSlab(item);
    setEditLoanType(item.loanType || 'Loan');
    setEditInterestType(item.interestType || 'Flat');
    setEditReducing(item.reducing || 'Daily');
    setEditSelLoanId(item.loan_id || item.raw?.loan_id || item.raw?.Loan_id || '');
    setEditSelLoanName(item.selectedLoan || '');
    setEditDurationIn(item.durationIn || 'Days');
    setEditFromVal(item.fromVal || '0');
    setEditToVal(item.toVal === 'N/A' ? '' : item.toVal || '');
    setEditRoi(item.rateOfInterest || '');
    setEditChqBounce(item.chqBounceCharge || '');
    setEditMinAmount(item.minimumAmount || '');
    setEditMinPeriod(item.minimumPeriod || '');
    setEditProcFee(item.processingFee || '');
    setEditGst(item.gstPercentage || '18');
    setEditFeeType(item.feeType || 'Percent (%)');
    setEditPenalty(item.otherPenalty || '');
    setEditGrace(item.grace || '');
    setEditLpc(item.lpc || '');
    setEditStatus(item.status || 'Active');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingSlab) return;

    const targetId = editingSlab.parameter_id || editingSlab.id;
    const loanId = resolveLoanId(editSelLoanId, editSelLoanName, allProducts);
    const loanName = resolveLoanName(loanId, editSelLoanName, allProducts);

    setUpdating(true);
    const data = {
      _id: targetId,
      parameter_id: targetId,
      id: targetId,
      loan_id: loanId,
      Loan_id: loanId,
      loanId: loanId,
      product_id: loanId,
      loanType: editLoanType,
      loan_type: editLoanType,
      interestType: editInterestType,
      interest_type: editInterestType,
      reducing: editReducing,
      selectedLoan: loanName,
      loanName,
      loan_name: loanName,
      durationIn: editDurationIn,
      duration_in: editDurationIn,
      from: editFromVal || '0',
      fromVal: editFromVal || '0',
      to: editToVal || '0',
      toVal: editToVal || '0',
      rateOfInterest: editRoi,
      rate_of_interest: editRoi,
      roi: editRoi,
      chqBounceCharge: editChqBounce || '0',
      chq_bounce_charge: editChqBounce || '0',
      minimumAmount: editMinAmount || '0',
      minimum_amount: editMinAmount || '0',
      minimumPeriod: editMinPeriod || '0',
      minimum_period: editMinPeriod || '0',
      processingFee: editProcFee || '0',
      processing_fee: editProcFee || '0',
      gstPercentage: editGst || '18',
      gst_percentage: editGst || '18',
      feeType: editFeeType,
      fee_type: editFeeType,
      otherPenalty: editPenalty || '0',
      other_penalty: editPenalty || '0',
      grace: editGrace || '0',
      lpc: editLpc || '0',
      status: editStatus,
      Status: editStatus,
    };

    console.log('[UPDATE] payload:', data);

    try {
      const result = await submitJson(`${BASE}/loan-parameters/${targetId}`, data);
      console.log('[UPDATE] success:', result);
      toast.success(result?.message || 'Loan Parameter updated successfully!');
      setEditingSlab(null);
      fetchSlabs();
    } catch (err) {
      console.error('[UPDATE] error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to update Loan Parameter.';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredSlabs = slabs.filter((s) => {
    const t = searchTerm.toLowerCase();
    return (
      s.loanType.toLowerCase().includes(t) ||
      s.selectedLoan.toLowerCase().includes(t) ||
      s.interestType.toLowerCase().includes(t) ||
      String(s.rateOfInterest).includes(t)
    );
  });

  const inputCls =
    'w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition';
  const labelCls = 'block text-[11px] font-bold text-gray-700 mb-1';

  // ── Loan dropdown helper ────────────────────────────────────────────────────

  const LoanDropdown = ({ value, onChange, products, loanTypeLabel }) => (
    <select value={value} onChange={onChange} className={inputCls} required>
      <option value="">--Select--</option>
      {products.length > 0 ? (
        products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))
      ) : (
        <option value="" disabled>
          No products found for {loanTypeLabel}
        </option>
      )}
    </select>
  );

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* Top Banner */}
      <div className="bg-[#3B3C6E] text-white px-4 py-2.5 rounded-t-lg shadow-sm font-semibold text-xs sm:text-sm uppercase tracking-wider mb-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-purple-200" />
          <span>CREATE LOAN INTEREST SLAB</span>
        </div>
        <button
          onClick={fetchSlabs}
          className="hover:bg-white/10 p-1 rounded transition text-xs flex items-center gap-1"
          title="Refresh List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingSlabs ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Create Form */}
      <div className="bg-white border-x border-b border-gray-200 shadow-sm mb-6 rounded-b-lg overflow-hidden">
        <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className={labelCls}>Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => {
                  setLoanType(e.target.value);
                  setSelLoanId('');
                  setSelLoanName('');
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
              <select value={interestType} onChange={(e) => setInterestType(e.target.value)} className={inputCls}>
                <option value="Flat">Flat</option>
                <option value="Reducing">Reducing</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Reducing</label>
              <select value={reducing} onChange={(e) => setReducing(e.target.value)} className={inputCls}>
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-gray-700">Select Loan</label>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">
                  Filtered by {loanType}
                </span>
              </div>
              <LoanDropdown
                value={selLoanId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelLoanId(id);
                  const p = allProducts.find((p) => p.id === id);
                  setSelLoanName(p ? p.name : '');
                }}
                products={productsForCreate}
                loanTypeLabel={loanType}
              />
            </div>

            <div>
              <label className={labelCls}>Duration In</label>
              <select value={durationIn} onChange={(e) => setDurationIn(e.target.value)} className={inputCls}>
                <option value="Days">Days</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </select>
            </div>
          </div>

          {/* Section Banner */}
          <div className="bg-[#5C5E9B] text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider mt-4">
            Edit / Slab Parameters
          </div>

          {/* Row 2+ Parameter Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            {[
              ['From', fromVal, setFromVal, '0'],
              ['To', toVal, setToVal, 'Date Range'],
              ['Rate of Interest', roi, setRoi, 'Enter %age', true],
              ['Chq Bounce Charge', chqBounce, setChqBounce, 'Enter %age'],
              ['Minimum Amount', minAmount, setMinAmount, 'Enter Value'],
              ['Minimum Period', minPeriod, setMinPeriod, 'Enter Value'],
              ['Processing Fee', procFee, setProcFee, 'Enter %age'],
              ['GST(%)', gst, setGst, '18'],
            ].map(([label, val, setter, ph, req]) => (
              <div key={label}>
                <label className={labelCls}>{label}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={ph}
                  className={inputCls}
                  required={!!req}
                />
              </div>
            ))}

            <div>
              <label className={labelCls}>Type</label>
              <select value={feeType} onChange={(e) => setFeeType(e.target.value)} className={inputCls}>
                <option value="Percent (%)">Percent (%)</option>
                <option value="Flat / Amount">Flat / Amount</option>
              </select>
            </div>

            {[
              ['Other Penalty', penalty, setPenalty, 'Enter %age'],
              ['Grace', grace, setGrace, 'In days'],
              ['LPC', lpc, setLpc, 'LPC Value'],
            ].map(([label, val, setter, ph]) => (
              <div key={label}>
                <label className={labelCls}>{label}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={ph}
                  className={inputCls}
                />
              </div>
            ))}

            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Submit */}
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

      {/* Directory Header */}
      <div className="bg-white rounded-t-lg border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
          Interest Slabs Directory
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
            {filteredSlabs.length} Slabs
          </span>
        </h2>
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

      {/* Directory Table */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#3B3C6E] text-white text-xs uppercase tracking-wider font-semibold">
                {['S.no.', 'Loan Type', 'Selected Loan', 'Interest Type', 'ROI (%)', 'Duration', 'Status', 'Actions'].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`py-3 px-3 ${i === 0 ? 'w-14 text-center' : ''} ${i === 7 ? 'w-24 text-center' : ''} ${i < 7 ? 'border-r border-indigo-900/50' : ''}`}
                    >
                      {h}
                    </th>
                  )
                )}
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

      {/* View Details Modal */}
      {selectedSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600" />
                Interest Slab Details — {selectedSlab.selectedLoan}
              </h3>
              <button onClick={() => setSelectedSlab(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex justify-between items-center">
                <div>
                  <span className="text-gray-400 font-semibold block text-[11px]">Selected Loan</span>
                  <span className="text-sm font-extrabold text-gray-900">{selectedSlab.selectedLoan}</span>
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['Loan Type', selectedSlab.loanType],
                  ['Interest Type', selectedSlab.interestType],
                  ['Reducing', selectedSlab.reducing],
                  ['Duration In', selectedSlab.durationIn],
                  ['Rate of Interest (ROI)', `${selectedSlab.rateOfInterest}%`],
                  ['Chq Bounce Charge', `${selectedSlab.chqBounceCharge}%`],
                  ['From - To', `${selectedSlab.fromVal} - ${selectedSlab.toVal}`],
                  ['Minimum Amount', selectedSlab.minimumAmount],
                  ['Minimum Period', selectedSlab.minimumPeriod],
                  ['Processing Fee', `${selectedSlab.processingFee} (${selectedSlab.feeType})`],
                  ['GST (%)', `${selectedSlab.gstPercentage}%`],
                  ['Other Penalty', selectedSlab.otherPenalty],
                  ['Grace (days)', selectedSlab.grace],
                  ['LPC', selectedSlab.lpc],
                  ['Created Date', selectedSlab.createdAt],
                ].map(([label, val]) => (
                  <div key={label} className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 font-semibold block text-[10px]">{label}</span>
                    <span className="font-bold text-gray-800">{val}</span>
                  </div>
                ))}
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

      {/* Edit Modal */}
      {editingSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Interest Slab
              </h3>
              <button onClick={() => setEditingSlab(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">
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
                      setEditSelLoanId('');
                      setEditSelLoanName('');
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
                  <select value={editInterestType} onChange={(e) => setEditInterestType(e.target.value)} className={inputCls}>
                    <option value="Flat">Flat</option>
                    <option value="Reducing">Reducing</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Reducing</label>
                  <select value={editReducing} onChange={(e) => setEditReducing(e.target.value)} className={inputCls}>
                    <option value="Daily">Daily</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Select Loan</label>
                  <LoanDropdown
                    value={editSelLoanId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setEditSelLoanId(id);
                      const p = allProducts.find((p) => p.id === id);
                      setEditSelLoanName(p ? p.name : '');
                    }}
                    products={productsForEdit}
                    loanTypeLabel={editLoanType}
                  />
                </div>

                <div>
                  <label className={labelCls}>Duration In</label>
                  <select value={editDurationIn} onChange={(e) => setEditDurationIn(e.target.value)} className={inputCls}>
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>

                {[
                  ['From', editFromVal, setEditFromVal],
                  ['To', editToVal, setEditToVal],
                  ['Rate of Interest', editRoi, setEditRoi, true],
                  ['Chq Bounce Charge', editChqBounce, setEditChqBounce],
                  ['Minimum Amount', editMinAmount, setEditMinAmount],
                  ['Minimum Period', editMinPeriod, setEditMinPeriod],
                  ['Processing Fee', editProcFee, setEditProcFee],
                  ['GST(%)', editGst, setEditGst],
                ].map(([label, val, setter, req]) => (
                  <div key={label}>
                    <label className={labelCls}>{label}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      className={inputCls}
                      required={!!req}
                    />
                  </div>
                ))}

                <div>
                  <label className={labelCls}>Type</label>
                  <select value={editFeeType} onChange={(e) => setEditFeeType(e.target.value)} className={inputCls}>
                    <option value="Percent (%)">Percent (%)</option>
                    <option value="Flat / Amount">Flat / Amount</option>
                  </select>
                </div>

                {[
                  ['Other Penalty', editPenalty, setEditPenalty],
                  ['Grace', editGrace, setEditGrace],
                  ['LPC', editLpc, setEditLpc],
                ].map(([label, val, setter]) => (
                  <div key={label}>
                    <label className={labelCls}>{label}</label>
                    <input type="text" value={val} onChange={(e) => setter(e.target.value)} className={inputCls} />
                  </div>
                ))}

                <div>
                  <label className={labelCls}>Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputCls}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSlab(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-md text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-[#2D336B] hover:bg-[#222754] text-white font-bold rounded-md text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
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
