import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Building2,
  MapPin,
  Phone,
  Hash,
  CheckCircle,
  PlusCircle,
  Loader,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const CreateBranch = () => {
  const navigate = useNavigate();
  const localprimeBase =
    import.meta.env.VITE_LOCALPRIME_URL ||
    'http://192.168.29.145:5000/badri_enterprises/localprime';

  const getInitialForm = () => ({
    branchName: '',
    address: '',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    pincode: '',
    contactNumber: '',
    status: 'active',
  });

  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(getInitialForm());
    toast.dismiss();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.branchName || !formData.contactNumber) {
      toast.error('Please fill in Branch Name and Contact Number');
      return;
    }

    setLoading(true);

    const payload = {
      branchName: formData.branchName,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      contactNumber: formData.contactNumber,
      status: formData.status,
    };

    console.log('=== [CREATE BRANCH] SUBMITTING JSON DATA ===', JSON.stringify(payload, null, 2));
    console.log('=== [CREATE BRANCH] SUBMITTING PAYLOAD OBJECT ===', payload);

    try {
      // First try sending as application/json (Flask request.get_json() compatibility)
      const res = await axios.post(`${localprimeBase}/branches`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('=== [CREATE BRANCH] SUCCESS RESPONSE JSON ===', res.data);
      toast.success(res.data?.message || 'Branch created successfully!');
      setFormData(getInitialForm());
    } catch (err) {
      console.error('JSON error, trying FormData fallback:', err);
      // Fallback to multipart/form-data in case Flask endpoint expects request.form
      try {
        const fd = new FormData();
        Object.keys(payload).forEach((key) => {
          fd.append(key, payload[key] || '');
        });

        const res2 = await axios.post(`${localprimeBase}/branches`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('=== [CREATE BRANCH] FORMDATA FALLBACK SUCCESS RESPONSE ===', res2.data);
        toast.success(res2.data?.message || 'Branch created successfully!');
        setFormData(getInitialForm());
      } catch (err2) {
        console.error('Create branch error:', err2);
        toast.error(
          err2?.response?.data?.message ||
            err2?.response?.data?.error ||
            'Failed to create branch. Please check server logs.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm outline-none transition bg-white';
  const labelCls = 'block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-purple-600" />
            Create New Branch
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Register a new branch or showroom location for loan operations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/loan/branch_list')}
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-purple-200 transition shadow-sm"
          >
            View Branch List
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Branch Identification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleChange}
                    placeholder="e.g. Bhopal Showroom"
                    className={`${inputCls} pl-10`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    maxLength={15}
                    className={`${inputCls} pl-10`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Address Info */}
          <div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              Location Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Bhopal"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Madhya Pradesh"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 462042"
                  maxLength={6}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Complete Address</label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Bairagarh Chichli, Near Holy Cross School"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating Branch...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Create Branch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBranch;
