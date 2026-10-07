import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Loader, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';
import { BASE_URL as localprimeBase } from '../../config/api';

// ─── Toast Helper ─────────────────────────────────────────────────────────────
const toast = {
  success: (msg) =>
    Swal.fire({ icon: 'success', title: 'Success', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  error: (msg) =>
    Swal.fire({ icon: 'error', title: 'Error', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
};

// ─── Inline Edit Row ──────────────────────────────────────────────────────────
const EditRow = ({ lvl, onSave, onCancel, submitting }) => {
  const [level, setLevel] = useState(String(lvl.level));
  const [levelName, setLevelName] = useState(lvl.levelName || '');
  const [status, setStatus] = useState(lvl.status || 'active');

  return (
    <tr className="bg-blue-50/60">
      <td className="py-2 px-3">
        <input
          type="number"
          min="1"
          value={level}
          onChange={e => setLevel(e.target.value)}
          className="w-20 border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#54578C]"
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="text"
          value={levelName}
          onChange={e => setLevelName(e.target.value)}
          placeholder="Level Name"
          className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#54578C]"
        />
      </td>
      <td className="py-2 px-3">
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#54578C] bg-white"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </td>
      <td className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onSave({ level, levelName, status })}
            disabled={submitting}
            className="text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200 px-2 py-1 rounded transition flex items-center gap-1 text-xs font-bold disabled:opacity-50"
          >
            {submitting ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Save
          </button>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition flex items-center gap-1 text-xs font-bold"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CommissionLevels = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Create form state
  const [newLevel, setNewLevel] = useState('');
  const [newLevelName, setNewLevelName] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [creating, setCreating] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchLevels = async () => {
    setLoading(true);
    showLoader();
    try {
      const res = await axios.get(`${localprimeBase}/commission-levels`);
      let list = [];
      if (res.data?.success && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      }
      setLevels(list.sort((a, b) => a.level - b.level));
    } catch (err) {
      toast.error('Failed to load commission levels');
      console.error(err);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  useEffect(() => { fetchLevels(); }, []);

  // ── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const lv = parseInt(newLevel, 10);
    if (!newLevel || isNaN(lv) || lv <= 0) {
      return toast.error('Level must be a positive integer');
    }
    setCreating(true);
    showLoader();
    try {
      const res = await axios.post(`${localprimeBase}/commission-levels`, {
        level: lv,
        levelName: newLevelName,
        status: newStatus,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Commission level created');
        setNewLevel('');
        setNewLevelName('');
        setNewStatus('active');
        fetchLevels();
      } else {
        toast.error(res.data?.message || 'Failed to create level');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create commission level');
    } finally {
      setCreating(false);
      hideLoader();
    }
  };

  // ── Edit Save ────────────────────────────────────────────────────────────
  const handleEditSave = async (levelDoc, { level, levelName, status }) => {
    const lv = parseInt(level, 10);
    if (!level || isNaN(lv) || lv <= 0) {
      return toast.error('Level must be a positive integer');
    }
    setEditSubmitting(true);
    showLoader();
    try {
      const res = await axios.post(`${localprimeBase}/commission-levels/${levelDoc._id}`, {
        level: lv,
        levelName,
        status,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Commission level updated');
        setEditingId(null);
        fetchLevels();
      } else {
        toast.error(res.data?.message || 'Failed to update level');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update commission level');
    } finally {
      setEditSubmitting(false);
      hideLoader();
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (levelDoc) => {
    const result = await Swal.fire({
      title: 'Delete Level?',
      text: `Are you sure you want to delete Level ${levelDoc.level} (${levelDoc.levelName || 'Unnamed'})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });
    if (!result.isConfirmed) return;
    showLoader();
    try {
      await axios.delete(`${localprimeBase}/commission-levels/${levelDoc._id}`);
      toast.success('Commission level deleted');
      fetchLevels();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete commission level');
    } finally {
      hideLoader();
    }
  };

  const inputCls = "border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#54578C] w-full";

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Create New Level Box ───────────────────────────────────────── */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#54578C] text-white px-4 py-2.5 font-bold uppercase text-xs sm:text-sm tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Commission Level
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Level No. *</label>
                <input
                  type="number"
                  min="1"
                  value={newLevel}
                  onChange={e => setNewLevel(e.target.value)}
                  placeholder="e.g. 1"
                  className={`${inputCls} w-24`}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Level Name</label>
                <input
                  type="text"
                  value={newLevelName}
                  onChange={e => setNewLevelName(e.target.value)}
                  placeholder="e.g. Branch Manager"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className={`${inputCls} w-32 bg-gray-50`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-6 py-1.5 bg-[#2A2B54] hover:bg-[#1E1F3D] text-white font-bold text-sm rounded shadow transition disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
              >
                {creating ? <Loader className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Levels Table ──────────────────────────────────────────────── */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#54578C] text-white px-4 py-2.5 font-bold uppercase text-xs sm:text-sm tracking-wider flex justify-between items-center">
            <span>Commission Levels</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{levels.length} Total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-gray-700 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4 w-24">Level No.</th>
                  <th className="py-3 px-4">Level Name</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      <Loader className="w-5 h-5 animate-spin mx-auto inline mr-2" />
                      Loading levels...
                    </td>
                  </tr>
                ) : levels.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400 font-medium">
                      No commission levels found. Create one above.
                    </td>
                  </tr>
                ) : (
                  levels.map(lvl => (
                    editingId === lvl._id ? (
                      <EditRow
                        key={lvl._id}
                        lvl={lvl}
                        submitting={editSubmitting}
                        onSave={(vals) => handleEditSave(lvl, vals)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <tr key={lvl._id} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-bold text-indigo-700 text-base">
                          {lvl.level}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700">
                          {lvl.levelName || <span className="text-gray-400 italic">Not set</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lvl.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {lvl.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingId(lvl._id)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition flex items-center gap-1 text-xs font-bold"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(lvl)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition flex items-center gap-1 text-xs font-bold"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommissionLevels;
