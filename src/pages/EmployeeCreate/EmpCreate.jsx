import React, { useEffect, useState } from "react";
import { showErrorAlert, showSuccessAlert } from "../../utils/alerts";
import useApi from "../../api/useApi";
import { Eye, EyeOff, RefreshCw, X, User, Phone, MapPin, Calendar, Briefcase, Shield } from "lucide-react";

// ─────────────────────────────────────────────
// View Employee Detail Modal
// ─────────────────────────────────────────────
const ViewModal = ({ employee, onClose }) => {
  if (!employee) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-black border-2 border-white/30">
                {employee.name?.charAt(0)?.toUpperCase() || "E"}
              </div>
            <div>
              <h2 className="text-white text-lg font-bold leading-tight">{employee.name}</h2>
              <p className="text-blue-100 text-xs font-medium mt-0.5">{employee.designation_name || "—"}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <DetailRow icon={<Phone size={15} className="text-blue-500" />} label="Phone" value={employee.phone} />
          <DetailRow icon={<Calendar size={15} className="text-indigo-500" />} label="Date of Birth" value={employee.dob} />
          <DetailRow icon={<User size={15} className="text-purple-500" />} label="Age" value={employee.age ? `${employee.age} years` : "—"} />
          <DetailRow icon={<MapPin size={15} className="text-rose-500" />} label="Address" value={employee.address} />
          <DetailRow icon={<Shield size={15} className="text-green-500" />} label="Account" value={employee.pAccount || "—"} />
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
    <div className="mt-0.5 flex-shrink-0">{icon}</div>
    <div>
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-gray-800 mt-0.5">{value || "—"}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Employee Page
// ─────────────────────────────────────────────
const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    age: "",
    address: "",
    designation: "",
    password: "",
    confirmPassword: ""
  });
  const [search, setSearch] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const { getData, postData } = useApi();

  const fetchdata = async () => {
    try {
      // Fetch staff
      const res2 = await getData("/staff");
      if (Array.isArray(res2)) {
        setEmployees(res2.filter((item) => item.designation !== "699adeffef0f329d90a0f35e"));
      }
      
      // Fetch designations
      const desigRes = await getData("/trade/designations");
      if (Array.isArray(desigRes)) {
        setDesignations(desigRes);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      showErrorAlert("Error", "Could not load Data. Please try again.");
    }
  };

  useEffect(() => {
    fetchdata();
  }, []);

  // ── Dynamic Password Generator ──
  const generatePassword = () => {
    const namePart = form.name
      ? form.name.trim().split(" ").map((n) => n.charAt(0).toUpperCase()).join("")
      : "ST";
    const phonePart = form.phone ? form.phone.slice(-4) : "0000";
    const symbols = ["@", "#", "$", "!"];
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const rand = Math.floor(10 + Math.random() * 90);
    const pwd = `${namePart}${phonePart}${sym}${rand}`;
    setForm((prev) => ({ ...prev, password: pwd, confirmPassword: pwd }));
    setShowPassword(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "dob") {
      const birthDate = new Date(value);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      setForm({ ...form, dob: value, age });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validateForm = () => {
    setValidationMessage("");
    const nameRegex = /^[A-Za-z ]{3,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!nameRegex.test(form.name)) {
      setValidationMessage("Invalid Name. Must contain at least 3 letters.");
      return false;
    }
    if (!phoneRegex.test(form.phone)) {
      setValidationMessage("Invalid Phone Number. Must be a 10-digit number starting with 6, 7, 8, or 9.");
      return false;
    }
    if (!form.dob) {
      setValidationMessage("Date of Birth is required.");
      return false;
    }
    if (!form.address) {
      setValidationMessage("Address is required.");
      return false;
    }
    if (!form.designation) {
      setValidationMessage("Please select a Designation.");
      return false;
    }
    if (!editingId || form.password) {
      if (form.password.length < 6) {
        setValidationMessage("Password must be at least 6 characters.");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setValidationMessage("Passwords do not match.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Create a clean payload, explicitly removing role and department
      const { role, depart, department, ...cleanPayload } = form;

      if (editingId) {
        // ── Edit mode: NEVER send password fields ──
        const { password, confirmPassword, ...updateData } = cleanPayload;
        await postData(`/trade/update-staff`, { ...updateData, _id: editingId });
        showSuccessAlert("Success!", "Updated Successfully");
      } else {
        await postData(`/staff/create`, { ...cleanPayload, pAccount: "A17" });
        showSuccessAlert("Success!", "Created successfully");
      }
      fetchdata();
      resetForm();
    } catch (error) {
      console.error("Failed to save group:", error);
      showErrorAlert("Error", "Could not save. Please try again.");
    }
  };

  const handleEdit = (id) => {
    console.log("Editing employee with ID:", id);
    const employeeToEdit = employees.find((emp) => emp._id === id);
    if (employeeToEdit) {
      setEditingId(id);
      
      // Extract designation ID safely in case the backend populated it as an object
      const desigId = typeof employeeToEdit.designation === 'object' && employeeToEdit.designation !== null 
        ? employeeToEdit.designation._id 
        : (employeeToEdit.designation || "");

      setForm({
        ...employeeToEdit,
        designation: desigId
      });
      setShowModal(true);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      dob: "",
      age: "",
      address: "",
      designation: "",
      password: "",
      confirmPassword: ""
    });
    setPreview(null);
    setEditingId(null);
    setValidationMessage("");
    setShowPassword(false);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setEmployeeToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setEmployees(employees.filter((emp) => emp.id !== employeeToDelete));
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 min-h-screen bg-white-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Share Holders</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg hover:bg-blue-700 transition transform hover:scale-105 w-full sm:w-auto"
        >
          + Create Share Holder
        </button>
      </div>

      <input
        type="text"
        placeholder="Search employees..."
        className="border border-gray-300 rounded-lg px-4 py-2 mb-6 w-full md:w-1/3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Employee Table */}
      <div className="overflow-x-auto shadow-xl rounded-2xl bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="p-4 border-b-2">S No</th>
              <th className="p-4 border-b-2">Name</th>
              <th className="p-4 border-b-2">Phone</th>
              <th className="p-4 border-b-2">Age</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Designation</th>
              <th className="p-4 border-b-2">Address</th>
              <th className="p-4 border-b-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp, index) => (
              <tr key={emp._id || index} className="border-b hover:bg-gray-50">
                <td className="p-4">{index + 1}</td>
                <td className="p-4 font-medium text-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-base border-2 border-blue-200 flex-shrink-0">
                      {emp.name?.charAt(0)?.toUpperCase() || "E"}
                    </div>
                    {emp.name}
                  </div>
                </td>
                <td className="p-4 text-gray-600">{emp.phone}</td>
                <td className="p-4 text-gray-600">{emp.age}</td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                    {
                      (typeof emp.designation === 'object' && emp.designation !== null && emp.designation.name)
                        ? emp.designation.name
                        : (designations.find(d => d._id === (typeof emp.designation === 'object' ? emp.designation._id : emp.designation))?.name || emp.designation_name || "—")
                    }
                  </span>
                </td>
                <td className="p-4 text-gray-600 max-w-[160px] truncate">{emp.address}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {/* View Button */}
                    <button
                      onClick={() => setViewingEmployee(emp)}
                      className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-xs font-bold"
                    >
                      View
                    </button>
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(emp._id)}
                      className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition text-xs font-bold"
                    >
                      Edit
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(emp._id)}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Employee Modal ── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={resetForm}></div>

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "Edit Employee" : "Create Employee"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[80vh]">
              <div className="p-6">
                {validationMessage && (
                  <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                    {validationMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium text-sm mb-1">Full Name</label>
                      <input type="text" name="name" value={form.name} onChange={handleChange} required
                        className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium text-sm mb-1">Email</label>
                      <input type="email" name="email" value={form.email} onChange={handleChange}
                        className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium text-sm mb-1">Phone Number</label>
                      <input type="text" name="phone" value={form.phone} onChange={handleChange} required
                        className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium text-sm mb-1">Date of Birth</label>
                      <input type="date" name="dob" value={form.dob} onChange={handleChange} required
                        className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium text-sm mb-1">Age</label>
                      <input type="text" name="age" value={form.age} disabled
                        className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium text-sm mb-1">Address</label>
                    <textarea name="address" value={form.address} onChange={handleChange} required rows={2}
                      className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium text-sm mb-1">Designation</label>
                      <select name="designation" value={form.designation} onChange={handleChange} required
                        className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">-- Select Designation --</option>
                        {designations.map((des) => (
                          <option key={des._id} value={des._id}>{des.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── Password (Create only — hidden in Edit mode) ── */}
                  {!editingId && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                    <label className="block text-gray-700 font-medium text-sm">
                      Password
                    </label>
                    <button type="button" onClick={generatePassword}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all active:scale-95">
                      <RefreshCw size={12} />
                      Auto-Generate
                    </button>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Set Password</label>
                        <div className="relative">
                          <input
                          type={showPassword ? "text" : "password"}
                          name="password" value={form.password} onChange={handleChange} 
                          required={!editingId}
                          autoComplete="new-password"
                          placeholder="Min. 6 characters"
                          className="w-full border border-gray-300 px-4 py-2 pr-10 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <button type="button" onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Confirm Password</label>
                        <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword" value={form.confirmPassword} onChange={handleChange} 
                        required={!!form.password}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>

                    {form.password && (
                      <div className={`text-xs font-medium px-3 py-2 rounded-lg ${
                        form.password === form.confirmPassword && form.password.length >= 6
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {form.password === form.confirmPassword && form.password.length >= 6
                          ? "✓ Passwords match"
                          : form.password !== form.confirmPassword
                          ? "✗ Passwords do not match"
                          : "✗ Password too short (min 6 chars)"}
                      </div>
                    )}
                  </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={resetForm}
                      className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 transition text-sm font-medium">
                      Cancel
                    </button>
                    <button type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition text-sm font-bold">
                      {editingId ? "Update Employee" : "Save Employee"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Employee Modal ── */}
      <ViewModal employee={viewingEmployee} onClose={() => setViewingEmployee(null)} />

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full relative z-10 text-center">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this employee?</p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;
