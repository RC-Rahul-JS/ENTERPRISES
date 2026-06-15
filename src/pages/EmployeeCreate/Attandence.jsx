import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Edit3,
  X,
  Phone,
  Mail,
  UserCheck,
  Home,
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import useApi from '../../api/useApi';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';

// ─────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────
const Badge = ({ children, status }) => {
  const styles = {
    Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'On Leave': 'bg-amber-100 text-amber-700 border-amber-200',
    Inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status] || styles.Inactive}`}>
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────
// Main Staff List
// ─────────────────────────────────────────────
export default function StaffList() {
  const { getData, postData } = useApi();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Password Update Modal State
  const [showPwd, setShowPwd] = useState(false);
  const [pwdTarget, setPwdTarget] = useState({ _id: '', empID: '', name: '' });
  const [pwdForm, setPwdForm] = useState({ password: '', confirmPassword: '' });
  const [pwdError, setPwdError] = useState('');
  
  // Form State
  const [validationMessage, setValidationMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', dob: '', age: '', address: '',
    designation: '', status: 'Active',
    password: '', confirmPassword: ''
  });
  const [designations, setDesignations] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const staffRes = await getData('/trade/list-staff');
      if (Array.isArray(staffRes)) setEmployees(staffRes);

      const desigRes = await getData('/trade/designations');
      if (Array.isArray(desigRes)) setDesignations(desigRes);
    } catch {
      showErrorAlert('Error', 'Could not load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(term) ||
        emp.phone?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.department?.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  const resetForm = () => {
    setForm({ 
      name: '', phone: '', email: '', dob: '', age: '', address: '', 
      designation: '', status: 'Active',
      password: '', confirmPassword: '' 
    });
    setValidationMessage('');
    setShowPassword(false);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEditOpen = (e, emp) => {
    e.stopPropagation();
    setEditingId(emp._id);
    setForm({
      name: emp.name || '',
      phone: emp.phone || '',
      email: emp.email || '',
      dob: emp.dob || '',
      age: emp.age || '',
      address: emp.address || '',
      designation: (typeof emp.designation === 'object' && emp.designation !== null) ? emp.designation._id : (emp.designation || ''),
      status: emp.status || 'Active',
      password: '', // Leave blank unless they want to update it
      confirmPassword: '',
      _id: emp._id
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dob') {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      setForm((p) => ({ ...p, dob: value, age }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const generatePassword = () => {
    const namePart = form.name
      ? form.name.trim().split(' ').map((n) => n.charAt(0).toUpperCase()).join('')
      : 'ST';
    const phonePart = form.phone ? form.phone.slice(-4) : '0000';
    const symbols = ['@', '#', '$', '!'];
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const rand = Math.floor(10 + Math.random() * 90);
    const pwd = `${namePart}${phonePart}${sym}${rand}`;
    setForm((p) => ({ ...p, password: pwd, confirmPassword: pwd }));
    setShowPassword(true);
  };

  const validate = () => {
    setValidationMessage('');
    const nameRegex = /^[A-Za-z ]{3,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (!nameRegex.test(form.name)) { setValidationMessage('Invalid Name. Must contain at least 3 letters.'); return false; }
    if (!phoneRegex.test(form.phone)) { setValidationMessage('Invalid Phone Number. Must be 10 digits starting with 6-9.'); return false; }
    if (!form.dob) { setValidationMessage('Date of Birth is required.'); return false; }
    if (!form.address) { setValidationMessage('Address is required.'); return false; }
    
    // For password, only validate if it's a new employee OR if they typed something while editing
    if (!editingId || form.password) {
      if (form.password.length < 6) { setValidationMessage('Password must be at least 6 characters.'); return false; }
      if (form.password !== form.confirmPassword) { setValidationMessage('Passwords do not match.'); return false; }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      // Create a clean payload, explicitly removing role and department
      const { role, depart, department, ...cleanPayload } = form;

      if (editingId) {
        // ── Edit mode: NEVER send password fields ──
        const { password, confirmPassword, ...updateData } = cleanPayload;
        await postData('/trade/create-staff', { ...updateData });
        showSuccessAlert('Success!', 'Staff details updated successfully.');
      } else {
        await postData('/trade/create-staff', { ...cleanPayload, pAccount: 'A17' });
        showSuccessAlert('Success!', 'Staff member created successfully.');
      }
      resetForm();
      fetchData();
    } catch {
      showErrorAlert('Error', 'Could not save. Please try again.');
    }
  };

  // ── Password Update Handler ──
  const openPwdModal = (emp) => {
    setSearchTerm('');               // ← clear any browser-autofilled value
    setPwdTarget({ _id: emp._id, empID: emp.empID, name: emp.name });
    setPwdForm({ password: '', confirmPassword: '' });
    setPwdError('');
    setShowPwd(false);
    setIsModalOpen(true);
  };

  const handlePwdUpdate = async (e) => {
    e.preventDefault();
    if (pwdForm.password.length < 6) {
      setPwdError('Password must be at least 6 characters.');
      return;
    }
    if (pwdForm.password !== pwdForm.confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }
    setPwdError('');
    try {
      await postData('/trade/create-staff', { 
        _id: pwdTarget._id, 
        password: pwdForm.password,
        confirmPassword: pwdForm.confirmPassword 
      });
      showSuccessAlert('Success!', 'Password updated successfully.');
      closePwdModal();
    } catch {
      showErrorAlert('Error', 'Could not update password. Please try again.');
    }
  };

  const closePwdModal = () => {
    setPwdTarget({ _id: '', empID: '', name: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-[1100px] mx-auto">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <UserCheck className="text-indigo-600" size={32} />
              Staff List
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              View, create and manage all staff members.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
              <Users size={18} className="text-indigo-500" />
              <span className="text-indigo-700 font-bold text-sm">{employees.length} Members</span>
            </div>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-100 active:scale-95"
            >
              <Plus size={18} />
              Add Employee
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="staff-search"
              type="text"
              name="staff-search"
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readonly')}
              onClick={(e) => e.target.removeAttribute('readonly')}
              placeholder="Search by name, phone, email or department..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-slate-400 font-medium text-sm">Loading staff...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Users size={48} className="opacity-30" />
              <p className="font-semibold">No staff members found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">#</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">Emp ID</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Staff Member</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Designation</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEmployees.map((emp, idx) => (
                  <tr key={emp._id || idx} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-5 py-4 text-sm text-slate-400 font-bold">{idx + 1}</td>

                    <td className="px-5 py-4 text-sm text-slate-500 font-medium hidden sm:table-cell">
                      {emp.empID || '—'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-100 flex-shrink-0">
                          {emp?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">{emp.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Phone size={9} />{emp.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="text-sm font-semibold text-slate-700">
                        {
                          (typeof emp.designation === 'object' && emp.designation !== null && emp.designation.name)
                            ? emp.designation.name
                            : (designations.find(d => d._id === (typeof emp.designation === 'object' ? emp.designation._id : emp.designation))?.name || emp.designation_name || '—')
                        }
                      </div>
                    </td>

                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Mail size={11} className="text-indigo-400" />{emp.email || '—'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-1">
                        <Home size={11} className="text-slate-300" />
                        <span className="truncate max-w-[140px]">{emp.address || '—'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <Badge status={emp.status}>{emp.status || 'Active'}</Badge>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => handleEditOpen(e, emp)}
                          className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-indigo-100 active:scale-95"
                        >
                          <Edit3 size={13} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openPwdModal(emp); }}
                          className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-200 hover:border-amber-500 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-amber-100 active:scale-95"
                          title="Change Password"
                        >
                          <KeyRound size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Unified Create / Edit Employee Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetForm}></div>

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">
                  {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{editingId ? "Edit Staff Details" : "Create New Staff"}</h2>
                  <p className="text-xs text-slate-400 font-medium">{editingId ? form.name : "Fill out the details below"}</p>
                </div>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {validationMessage && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                  {validationMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Full Name</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Email Address</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange}
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Phone Number</label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange} required
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Date of Birth</label>
                      <input type="date" name="dob" value={form.dob} onChange={handleChange} required
                        className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Age</label>
                      <input type="text" name="age" value={form.age} disabled
                        className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-slate-50 text-slate-500 text-sm cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} required rows={2}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Designation</label>
                    <select name="designation" value={form.designation} onChange={handleChange} required
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white">
                      <option value="">-- Select Designation --</option>
                      {designations.map((desig) => (
                        <option key={desig._id} value={desig._id}>{desig.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status (Only show when editing) */}
                {editingId && (
                  <div>
                    <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Status</label>
                    <div className="flex gap-2">
                      {['Active', 'On Leave', 'Inactive'].map((s) => (
                        <button key={s} type="button"
                          onClick={() => setForm((prev) => ({ ...prev, status: s }))}
                          className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                            form.status === s
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Dynamic Password (HIDDEN ON EDIT) ── */}
                {!editingId && (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold text-sm">
                        Account Password
                      </label>
                      <button type="button" onClick={generatePassword}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-all active:scale-95">
                        <RefreshCw size={12} />
                        Auto-Generate
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password" value={form.password} onChange={handleChange} 
                          required
                          placeholder="Min. 6 characters"
                          className="w-full border border-slate-200 px-4 py-2.5 pr-10 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                        <button type="button" onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword" value={form.confirmPassword} onChange={handleChange} 
                          required
                          placeholder="Re-enter password"
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                      </div>
                    </div>

                    {form.password && (
                      <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${
                        form.password === form.confirmPassword && form.password.length >= 6
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {form.password === form.confirmPassword && form.password.length >= 6
                          ? '✓ Passwords match'
                          : form.password !== form.confirmPassword
                          ? '✗ Passwords do not match'
                          : '✗ Password too short (min 6 chars)'}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-slate-50 flex-shrink-0">
              <button type="button" onClick={resetForm}
                className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm font-bold active:scale-95">
                {editingId ? "Update Employee" : "Save Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Independent Password Update Modal ── */}
      {isModalOpen && pwdTarget._id && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closePwdModal}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-100">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
                  <p className="text-xs text-slate-400 font-medium">For {pwdTarget.name} ({pwdTarget.empID})</p>
                </div>
              </div>
              <button onClick={closePwdModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {pwdError && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                  {pwdError}
                </div>
              )}
              <form onSubmit={handlePwdUpdate} className="space-y-4">
                <div className="relative">
                  <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">New Password</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwdForm.password}
                    onChange={(e) => setPwdForm(p => ({ ...p, password: e.target.value }))}
                    required
                    placeholder="Min. 6 characters"
                    className="w-full border border-slate-200 px-4 py-2.5 pr-10 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all" 
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1.5 ml-1">Confirm Password</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    placeholder="Re-enter password"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all" 
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-100 mt-6 flex justify-end gap-3">
                  <button type="button" onClick={closePwdModal}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-md shadow-amber-100 active:scale-95">
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}