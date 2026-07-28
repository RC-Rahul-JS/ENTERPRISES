import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Pencil, Loader, Save } from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';

const toast = {
  success: (msg) => {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },
  error: (msg) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },
};

const AgentDesignation = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const [level, setLevel] = useState('');
  const [designationName, setDesignationName] = useState('');
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ── Fetch Agent Designations (GET /designations) ───────────────────────────
  const fetchDesignations = async () => {
    setLoading(true);
    showLoader();
    const localprimeBase = import.meta.env.VITE_LOCALPRIME_URL || 'http://192.168.29.145:5000/badri_enterprises/localprime';
    const api = `${localprimeBase}/designations`;
    try {
      const res = await axios.get(api);
      console.log('[AgentDesignation] GET /designations res:', res.data);
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.designations || [];
      setDesignations(list);
    } catch (err) {
      console.warn('[AgentDesignation] Error fetching /designations:', err?.response?.data || err.message);
      setDesignations([]);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  // ── Submit (CREATE: POST /designations | UPDATE: POST /designations/<id>) ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!designationName || !designationName.trim()) {
      return toast.error('Please enter Designation Name');
    }

    setSubmitting(true);
    showLoader();

    const payload = {
      designationName: designationName.trim(), // required key
      level: level ? level.trim() : (designations.length + 1).toString(),
    };

    console.log('[AgentDesignation] Submitting payload:', payload, 'editingId:', editingId);

    const localprimeBase = import.meta.env.VITE_LOCALPRIME_URL || 'http://192.168.29.145:5000/badri_enterprises/localprime';

    try {
      if (editingId) {
        // UPDATE: POST /designations/<designation_id>
        const api = `${localprimeBase}/designations/${editingId}`;
        const res = await axios.post(api, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success(res.data?.message || 'Agent Designation updated successfully!');
      } else {
        // CREATE: POST /designations
        const api = `${localprimeBase}/designations`;
        const res = await axios.post(api, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success(res.data?.message || 'Agent Designation created successfully!');
      }

      setDesignationName('');
      setLevel('');
      setEditingId(null);
      fetchDesignations();
    } catch (err) {
      console.error('[AgentDesignation] Error saving designation:', err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || 'Failed to save Agent Designation.');
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  // ── Edit Row Handler ───────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    const dName =
      item.designationName ||
      item.designation_name ||
      item.name ||
      item.designation ||
      '';
    const dLevel = item.level || item.Level || (index + 1).toString();
    const id = item._id || item.id || null;

    setDesignationName(dName);
    setLevel(dLevel);
    setEditingId(id || index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDesignationName('');
    setLevel('');
  };

  const inputCls =
    'px-3 py-1.5 bg-white border border-gray-400 rounded text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48';

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-300">
        {/* ── Header Banner ───────────────────────────────────────────── */}
        <div className="bg-[#54578C] text-white px-4 py-2.5 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-sm">
          CREATE AGENT DESIGNATION
        </div>

        <div className="p-5 space-y-6">
          {/* ── Inputs Row ─────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-gray-700">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Level</label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="Level"
                  className={inputCls}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Designation Name</label>
                <input
                  type="text"
                  value={designationName}
                  onChange={(e) => setDesignationName(e.target.value)}
                  placeholder="Designation Name"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* ── Action Buttons ───────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-5 py-1.5 bg-gray-500 hover:bg-gray-600 text-white font-bold text-xs uppercase tracking-wider rounded transition"
                >
                  CANCEL
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-1.5 bg-[#2A2B54] hover:bg-[#1E1F3D] text-white font-bold text-xs uppercase tracking-wider rounded transition shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    <span>SAVING...</span>
                  </>
                ) : editingId ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>UPDATE</span>
                  </>
                ) : (
                  <span>ADD</span>
                )}
              </button>
            </div>
          </form>

          {/* ── Designation Table ──────────────────────────────────────── */}
          <div className="overflow-x-auto border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#2D2E5F] text-white font-bold text-xs uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-16">S.no.</th>
                  <th className="py-2.5 px-4 w-32">Level</th>
                  <th className="py-2.5 px-4">Designation Name</th>
                  <th className="py-2.5 px-4 text-center w-24">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Loading agent designations...</span>
                      </div>
                    </td>
                  </tr>
                ) : designations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 font-medium">
                      No designations found.
                    </td>
                  </tr>
                ) : (
                  designations.map((item, index) => {
                    const dName =
                      item.designationName ||
                      item.designation_name ||
                      item.name ||
                      item.designation ||
                      '';
                    const dLevel = item.level || item.Level || (index + 1).toString();
                    const isEvenRow = index % 2 === 1;

                    return (
                      <tr
                        key={item._id || item.id || index}
                        className={isEvenRow ? 'bg-[#E3FAF9]' : 'bg-white hover:bg-slate-50 transition'}
                      >
                        <td className="py-2.5 px-4 font-medium text-gray-700">{index + 1}</td>
                        <td className="py-2.5 px-4 font-medium text-gray-700">{dLevel}</td>
                        <td className="py-2.5 px-4 font-semibold text-gray-800">{dName}</td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleEdit(item, index)}
                            className="p-1 text-gray-700 hover:text-indigo-700 transition rounded hover:bg-white/60"
                            title="Edit Designation"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
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
    </div>
  );
};

export default AgentDesignation;
