import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Loader, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';
import { BASE_URL as localprimeBase } from '../../config/api';

// ─── Toast Helper ─────────────────────────────────────────────────────────────
const toast = {
  success: (msg) => Swal.fire({ icon: 'success', title: 'Success', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  error: (msg) => Swal.fire({ icon: 'error', title: 'Error', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AgentCommission = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => { });
  const hideLoader = loaderCtx?.hideLoader || (() => { });

  // ── Shared data ────────────────────────────────────────────────────────
  const [productOptions, setProductOptions] = useState([]);
  const [levels, setLevels] = useState([]);   // active commission-levels from DB
  const [slabs, setSlabs] = useState([]);     // all commission-slabs from DB
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlabs, setLoadingSlabs] = useState(false);

  // ── CREATE section state ───────────────────────────────────────────────
  const [cProductType, setCProductType] = useState('Loan');
  const [cSelectedProduct, setCSelectedProduct] = useState('');
  const [cYear, setCYear] = useState('3');
  const [commissionData, setCommissionData] = useState({});

  // ── LIST section state ────────────────────────────────────────────────
  const [lProductType, setLProductType] = useState('Loan');
  const [lSelectedProduct, setLSelectedProduct] = useState('');
  const [lYear, setLYear] = useState('');

  // inline view/edit row state
  const [expandedSlabId, setExpandedSlabId] = useState(null);
  const [editingSlabId, setEditingSlabId] = useState(null);
  const [editLevelVals, setEditLevelVals] = useState({});
  const [editSlabData, setEditSlabData] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Fetch Products ─────────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${localprimeBase}/loan-products`);
      let list = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.data) ? res.data.data
          : Array.isArray(res.data?.loan_products) ? res.data.loan_products : [];
      const norm = list.map((item, idx) => ({
        id: item._id || `P-${idx}`,
        name: item.productName || item.loanName || item.name || 'Unnamed',
        type: item.productType || item.type || 'Loan',
      }));
      setProductOptions(norm);
      if (norm.length > 0) {
        setCSelectedProduct(norm[0].id);
        // Do NOT set lSelectedProduct here, so the filter starts at "All Products"
      }
    } catch (e) { console.warn(e); }
  };

  // ── Fetch Active Levels ────────────────────────────────────────────────
  const fetchLevels = async () => {
    setLoading(true); showLoader();
    try {
      const res = await axios.get(`${localprimeBase}/commission-levels`);
      let list = (res.data?.success && Array.isArray(res.data.data)) ? res.data.data
        : Array.isArray(res.data) ? res.data : [];
      list = list.filter(l => l.status === 'active');
      setLevels(list);
      const init = {};
      list.forEach(l => { init[l._id] = { firstYear: '', secondYear: '', thirdYear: '' }; });
      setCommissionData(init);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); hideLoader(); }
  };

  // ── Fetch Slabs ────────────────────────────────────────────────────────
  const fetchSlabs = async () => {
    setLoadingSlabs(true);
    try {
      const res = await axios.get(`${localprimeBase}/commission-slabs`);
      let list = (res.data?.success && Array.isArray(res.data.data)) ? res.data.data
        : Array.isArray(res.data) ? res.data : [];
      setSlabs(list);
    } catch (e) { console.warn(e); }
    finally { setLoadingSlabs(false); }
  };

  useEffect(() => { fetchProducts(); fetchLevels(); fetchSlabs(); }, []);

  // ── Filtered products for dropdowns ───────────────────────────────────
  const filteredForCreate = productOptions.filter(p =>
    cProductType === 'Loan' ? (p.type === 'Loan' || p.type === 'Personal Loan' || p.name.includes('Loan')) : true
  );
  const filteredForList = productOptions.filter(p =>
    lProductType === 'Loan' ? (p.type === 'Loan' || p.type === 'Personal Loan' || p.name.includes('Loan')) : true
  );

  useEffect(() => {
    // If the selected product is no longer valid after type change, reset it
    if (cSelectedProduct && !filteredForCreate.find(p => p.id === cSelectedProduct) && filteredForCreate.length > 0) {
      setCSelectedProduct(filteredForCreate[0].id);
    }
  }, [cProductType, cSelectedProduct, filteredForCreate]);

  // ── Matched slabs for list section ────────────────────────────────────
  const matchedSlabs = slabs.filter(s => {
    // Exact match for product type
    if (lProductType && s.productType !== lProductType) return false;
    // Exact match for id or name
    if (lSelectedProduct) {
      const selectedName = productOptions.find(p => p.id === lSelectedProduct)?.name || '';
      if (String(s.productId) !== String(lSelectedProduct) && s.productName !== selectedName) {
        return false;
      }
    }
    // Match year
    if (lYear && String(s.year) !== lYear) return false;
    return true;
  });

  // ── Create Slab ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!cSelectedProduct) return toast.error('Please select a Product');
    const prod = productOptions.find(p => String(p.id) === String(cSelectedProduct));
    if (!prod) return toast.error('Invalid product selection');

    const payloadLevels = levels.map(l => {
      const v = commissionData[l._id] || {};
      return { level_id: String(l._id), firstYear: parseFloat(v.firstYear || 0), secondYear: parseFloat(v.secondYear || 0), thirdYear: parseFloat(v.thirdYear || 0) };
    });

    setSubmitting(true); showLoader();
    try {
      const res = await axios.post(`${localprimeBase}/commission-slabs`, {
        productType: cProductType, productId: String(prod.id), productName: prod.name,
        year: parseInt(cYear, 10), levels: payloadLevels,
      }, { headers: { 'Content-Type': 'application/json' } });
      toast.success(res.data?.message || 'Commission slab created!');
      
      // Clear inputs
      const reset = {};
      levels.forEach(l => { reset[l._id] = { firstYear: '', secondYear: '', thirdYear: '' }; });
      setCommissionData(reset);
      
      // Fetch fresh data so it immediately shows
      fetchSlabs();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to create slab.'); }
    finally { setSubmitting(false); hideLoader(); }
  };

  // ── Delete Slab ────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete?', text: "This can't be undone.", icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete!'
    })
      .then(async r => {
        if (!r.isConfirmed) return;
        showLoader();
        try {
          await axios.delete(`${localprimeBase}/commission-slabs/${id}`);
          toast.success('Slab deleted');
          if (editingSlabId === id) setEditingSlabId(null);
          if (expandedSlabId === id) setExpandedSlabId(null);
          fetchSlabs();
        } catch (e) { toast.error(e?.response?.data?.message || 'Delete failed'); }
        finally { hideLoader(); }
      });
  };

  // ── Start Edit ─────────────────────────────────────────────────────────
  const startEdit = (slab) => {
    setEditingSlabId(slab._id);
    setExpandedSlabId(slab._id);
    setEditSlabData({
      productType: slab.productType || 'Loan',
      productId: slab.productId || '',
      productName: slab.productName || '',
      year: String(slab.year || '3'),
      status: slab.status || 'active'
    });
    const map = {};
    levels.forEach(l => { map[String(l._id)] = { firstYear: '', secondYear: '', thirdYear: '' }; });
    (slab.levels || []).forEach(sl => {
      const key = String(sl.level_id || sl._id || '');
      if (map[key]) map[key] = { firstYear: String(sl.firstYear ?? 0), secondYear: String(sl.secondYear ?? 0), thirdYear: String(sl.thirdYear ?? 0) };
    });
    setEditLevelVals(map);
  };

  const saveEdit = async (slab) => {
    const payloadLevels = levels.map(l => ({
      level_id: String(l._id),
      firstYear: parseFloat(editLevelVals[String(l._id)]?.firstYear || 0),
      secondYear: parseFloat(editLevelVals[String(l._id)]?.secondYear || 0),
      thirdYear: parseFloat(editLevelVals[String(l._id)]?.thirdYear || 0),
    }));
    setEditSubmitting(true); showLoader();
    try {
      const payload = {
        ...editSlabData,
        year: parseInt(editSlabData.year, 10),
        levels: payloadLevels
      };
      
      const res = await axios.post(`${localprimeBase}/commission-slabs/${slab._id}`,
        payload, { headers: { 'Content-Type': 'application/json' } });
      if (res.data?.success) {
        toast.success(res.data.message || 'Updated!');
        setEditingSlabId(null); 
        fetchSlabs();
      } else { toast.error(res.data?.message || 'Update failed'); }
    } catch (e) { toast.error(e?.response?.data?.message || 'Update failed'); }
    finally { setEditSubmitting(false); hideLoader(); }
  };

  // ── Shared styles ──────────────────────────────────────────────────────
  const selCls = "border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#54578C] bg-white";
  const inCls = "w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#54578C]";
  const editInCls = "w-full border border-blue-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-[#54578C] bg-blue-50";

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6" style={{ backgroundImage: 'radial-gradient(circle at 60% 20%, rgba(162,187,248,0.12) 0%, transparent 55%)' }}>
      <div className="max-w-5xl mx-auto space-y-0">

        {/* ══════════════════════════════════════════════════════════════
            CREATE SECTION
        ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-t shadow-sm border border-gray-200 border-b-0">
          <div className="bg-[#54578C] text-white px-5 py-2.5 font-bold uppercase text-xs tracking-widest rounded-t">
            AGENT COMMISSION
          </div>
          <div className="px-5 py-4 flex flex-wrap items-center gap-6 text-sm font-semibold text-gray-700">
            <div className="flex items-center gap-2.5">
              <label className="text-gray-600 whitespace-nowrap">Product Type</label>
              <select value={cProductType} onChange={e => setCProductType(e.target.value)} className={`${selCls} w-36`}>
                <option value="Loan">Loan</option>
                <option value="Group">Group</option>
                <option value="Limit">Limit</option>
              </select>
            </div>
            <div className="flex items-center gap-2.5">
              <label className="text-gray-600 whitespace-nowrap">Product</label>
              <select value={cSelectedProduct} onChange={e => setCSelectedProduct(e.target.value)} className={`${selCls} w-48`}>
                {filteredForCreate.length === 0 && <option value="">-- No Products --</option>}
                {filteredForCreate.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2.5">
              <label className="text-gray-600 whitespace-nowrap">Year</label>
              <select value={cYear} onChange={e => setCYear(e.target.value)} className={`${selCls} w-24`}>
                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} Year</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Commission Entry Table */}
        <div className="bg-white shadow-sm border-x border-gray-200 border-b-0">
          <div className="bg-[#54578C]/85 text-white px-5 py-2 text-xs font-bold uppercase tracking-widest">
            Commission
          </div>
          <div className="p-5 pb-6">
            <div className="border border-[#54578C]/20 rounded overflow-hidden" style={{ maxWidth: 500 }}>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#54578C]/85 text-white font-bold uppercase text-xs tracking-wider">
                    <th className="py-2.5 px-4 w-32 border-r border-[#54578C]/20">Designation</th>
                    <th className="py-2.5 px-4 w-24 text-center">1st year</th>
                    <th className="py-2.5 px-4 w-24 text-center">2nd year</th>
                    <th className="py-2.5 px-4 w-24 text-center">3rd year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="4" className="py-6 text-center text-gray-400 text-xs">
                      <Loader className="w-4 h-4 animate-spin inline mr-1" /> Loading...
                    </td></tr>
                  ) : levels.length === 0 ? (
                    <tr><td colSpan="4" className="py-5 text-center text-gray-400 text-xs italic">
                      No active levels. Add in "Commission Levels" tab.
                    </td></tr>
                  ) : levels.map(lvl => {
                    const v = commissionData[lvl._id] || {};
                    return (
                      <tr key={lvl._id} className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-4 font-medium text-gray-700 border-r border-gray-100">{lvl.levelName || `Level ${lvl.level}`}</td>
                        <td className="py-1.5 px-2"><input type="number" min="0" max="100" value={v.firstYear || ''} onChange={e => setCommissionData(p => ({ ...p, [lvl._id]: { ...p[lvl._id], firstYear: e.target.value } }))} className={inCls} /></td>
                        <td className="py-1.5 px-2"><input type="number" min="0" max="100" value={v.secondYear || ''} onChange={e => setCommissionData(p => ({ ...p, [lvl._id]: { ...p[lvl._id], secondYear: e.target.value } }))} className={inCls} /></td>
                        <td className="py-1.5 px-2"><input type="number" min="0" max="100" value={v.thirdYear || ''} onChange={e => setCommissionData(p => ({ ...p, [lvl._id]: { ...p[lvl._id], thirdYear: e.target.value } }))} className={inCls} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-start mt-5">
              <button onClick={handleCreate} disabled={submitting || !levels.length}
                className="px-12 py-2.5 bg-[#2A2B54] hover:bg-[#1E1F3D] text-white font-bold text-sm rounded transition disabled:opacity-50 flex items-center gap-2 justify-center" style={{ width: 120 }}>
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            LIST SECTION
        ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white border-t-2 border-[#54578C]/20 border-x border-gray-200 border-b-0 mt-0">
          <div className="bg-[#54578C] text-white px-5 py-2.5 font-bold uppercase text-xs tracking-widest">
            COMMISSION SLABS LIST
          </div>

          {/* Filters for List */}
          <div className="px-5 py-4 flex flex-wrap items-center gap-6 text-sm font-semibold text-gray-700 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2.5">
              <label className="text-gray-600 whitespace-nowrap">Product Type</label>
              <select value={lProductType} onChange={e => { setLProductType(e.target.value); setEditingSlabId(null); setExpandedSlabId(null); setLSelectedProduct(''); }} className={`${selCls} w-36`}>
                <option value="Loan">Loan</option>
                <option value="Group">Group</option>
                <option value="Limit">Limit</option>
                <option value="">All Types</option>
              </select>
            </div>
            <div className="flex items-center gap-2.5">
              <label className="text-gray-600 whitespace-nowrap">Product</label>
              <select value={lSelectedProduct} onChange={e => { setLSelectedProduct(e.target.value); setEditingSlabId(null); setExpandedSlabId(null); }} className={`${selCls} w-48`}>
                <option value="">-- All Products --</option>
                {filteredForList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2.5">
              <label className="text-gray-600 whitespace-nowrap">Year</label>
              <select value={lYear} onChange={e => { setLYear(e.target.value); setEditingSlabId(null); setExpandedSlabId(null); }} className={`${selCls} w-28`}>
                <option value="">All Years</option>
                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} Year</option>)}
              </select>
            </div>
            <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full border border-gray-200">
              {matchedSlabs.length} slab{matchedSlabs.length !== 1 ? 's' : ''} found
            </span>
          </div>

          <div className="p-0 border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-center">Year</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingSlabs ? (
                    <tr><td colSpan="6" className="py-8 text-center text-gray-400 text-sm">
                      <Loader className="w-5 h-5 animate-spin inline mr-2" /> Loading slabs...
                    </td></tr>
                  ) : matchedSlabs.length === 0 ? (
                    <tr><td colSpan="6" className="py-8 text-center text-gray-400 text-sm italic">
                      No commission slabs found.
                    </td></tr>
                  ) : (
                    matchedSlabs.map((slab, idx) => {
                      const isEditing = editingSlabId === slab._id;
                      const isExpanded = expandedSlabId === slab._id;
                      const prod = productOptions.find(p => String(p.id) === String(slab.productId));

                      return (
                        <React.Fragment key={slab._id || idx}>
                          {/* Row Compact View */}
                          <tr className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-blue-50/50' : isExpanded ? 'bg-indigo-50/30' : ''}`}>
                            <td className="py-2.5 px-4 text-center">
                              <button onClick={() => { if(isEditing) return; setExpandedSlabId(p => p===slab._id ? null : slab._id); }} 
                                disabled={isEditing} className="text-gray-400 hover:text-indigo-600 transition disabled:opacity-30">
                                {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                              </button>
                            </td>
                            <td className="py-2.5 px-2">
                              {isEditing ? (
                                <select value={editSlabData.productId} onChange={e => {
                                  const pr = productOptions.find(p => String(p.id) === String(e.target.value));
                                  setEditSlabData({ ...editSlabData, productId: e.target.value, productName: pr ? pr.name : '' });
                                }} className={`${selCls} w-full py-1 text-xs px-1`}>
                                  {productOptions
                                    .filter(p => editSlabData.productType === 'Loan' ? (p.type === 'Loan' || p.type === 'Personal Loan' || p.name.includes('Loan')) : true)
                                    .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  {!productOptions.find(p => String(p.id) === String(editSlabData.productId)) && (
                                    <option value={editSlabData.productId}>{editSlabData.productName || 'Unknown'}</option>
                                  )}
                                </select>
                              ) : (
                                <span className="font-bold text-gray-700 block ml-2">{slab.productName || prod?.name || '—'}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2">
                              {isEditing ? (
                                <select value={editSlabData.productType} onChange={e => setEditSlabData({ ...editSlabData, productType: e.target.value })} className={`${selCls} w-full py-1 text-xs px-1`}>
                                  <option value="Loan">Loan</option>
                                  <option value="Group">Group</option>
                                  <option value="Limit">Limit</option>
                                </select>
                              ) : (
                                <span className="text-gray-500 text-xs block ml-2">{slab.productType}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {isEditing ? (
                                <select value={editSlabData.year} onChange={e => setEditSlabData({ ...editSlabData, year: e.target.value })} className={`${selCls} w-full py-1 text-xs px-1`}>
                                  {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} Yr</option>)}
                                </select>
                              ) : (
                                <span className="font-bold text-indigo-700">{slab.year} Yr</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {isEditing ? (
                                <select value={editSlabData.status} onChange={e => setEditSlabData({ ...editSlabData, status: e.target.value })} className={`${selCls} w-full py-1 text-xs px-1`}>
                                  <option value="active">active</option>
                                  <option value="inactive">inactive</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${slab.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                  {slab.status}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <div className="flex gap-2 justify-center items-center">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => saveEdit(slab)} disabled={editSubmitting}
                                      className="px-2.5 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded text-[11px] font-bold transition flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => { setEditingSlabId(null); setExpandedSlabId(null); }}
                                      className="px-2.5 py-1 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded text-[11px] font-bold transition">
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(slab)}
                                      className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[11px] font-bold flex items-center gap-1 transition">
                                      <Pencil className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(slab._id)}
                                      className="px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded text-[11px] font-bold flex items-center gap-1 transition">
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Levels Details Table */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="6" className="p-0 border-b border-gray-200">
                                <div className={`px-10 py-4 ${isEditing ? 'bg-blue-50/20' : 'bg-indigo-50/20'}`}>
                                  <table className="text-left text-sm border-collapse border border-[#54578C]/20 rounded overflow-hidden" style={{ maxWidth: 500, width: '100%' }}>
                                    <thead>
                                      <tr className={`${isEditing ? 'bg-blue-100/50 text-blue-800' : 'bg-white text-gray-600'} font-bold uppercase text-[11px] tracking-wider`}>
                                        <th className="py-2 px-4 border-r border-[#54578C]/20 border-b">Designation</th>
                                        <th className="py-2 px-3 text-center border-b">1st year</th>
                                        <th className="py-2 px-3 text-center border-b">2nd year</th>
                                        <th className="py-2 px-3 text-center border-b">3rd year</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                      {!isEditing ? (
                                        // Read-Only View
                                        (slab.levels || []).length === 0 ? (
                                          <tr><td colSpan="4" className="py-3 text-center text-gray-400 text-xs italic">No levels defined</td></tr>
                                        ) : (slab.levels || []).map((lv, i) => (
                                          <tr key={i} className="hover:bg-gray-50/60 border-b border-gray-50 last:border-0">
                                            <td className="py-2 px-4 font-medium text-gray-700 text-xs border-r border-gray-100">{lv.levelName || `Level ${lv.level}`}</td>
                                            <td className="py-2 px-3 text-center font-bold text-indigo-700">{lv.firstYear}%</td>
                                            <td className="py-2 px-3 text-center font-bold text-indigo-700">{lv.secondYear}%</td>
                                            <td className="py-2 px-3 text-center font-bold text-indigo-700">{lv.thirdYear}%</td>
                                          </tr>
                                        ))
                                      ) : (
                                        // Edit Mode View
                                        levels.length === 0 ? (
                                          <tr><td colSpan="4" className="py-3 text-center text-gray-400 text-xs italic">No active levels found</td></tr>
                                        ) : levels.map(lvl => {
                                          const ev = editLevelVals[String(lvl._id)] || { firstYear: '', secondYear: '', thirdYear: '' };
                                          return (
                                            <tr key={lvl._id} className="hover:bg-blue-50/30 border-b border-gray-50 last:border-0">
                                              <td className="py-2 px-4 font-medium text-gray-700 text-xs border-r border-gray-100">{lvl.levelName || `Level ${lvl.level}`}</td>
                                              <td className="py-1.5 px-2">
                                                <input type="number" min="0" max="100" value={ev.firstYear} onChange={e => setEditLevelVals(p => ({ ...p, [String(lvl._id)]: { ...p[String(lvl._id)], firstYear: e.target.value } }))} className={editInCls} />
                                              </td>
                                              <td className="py-1.5 px-2">
                                                <input type="number" min="0" max="100" value={ev.secondYear} onChange={e => setEditLevelVals(p => ({ ...p, [String(lvl._id)]: { ...p[String(lvl._id)], secondYear: e.target.value } }))} className={editInCls} />
                                              </td>
                                              <td className="py-1.5 px-2">
                                                <input type="number" min="0" max="100" value={ev.thirdYear} onChange={e => setEditLevelVals(p => ({ ...p, [String(lvl._id)]: { ...p[String(lvl._id)], thirdYear: e.target.value } }))} className={editInCls} />
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom rounded corner */}
        <div className="bg-white rounded-b shadow-sm border border-t-0 border-gray-200 h-1" />

      </div>
    </div>
  );
};

export default AgentCommission;
