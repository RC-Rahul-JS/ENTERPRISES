import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { 
  PlusCircle, 
  Edit3, 
  Search, 
  Layers, 
  FileText, 
  ChevronRight,
  Database,
  Tag
} from "lucide-react";
import useApi from "../../api/useApi";
import { showErrorAlert, showSuccessAlert } from "../../utils/alerts";

export default function LedgerManagement() {
  const { postData, getData } = useApi();

  const [formData, setFormData] = useState({
    _id: "",
    grouptype: "",
    group_id: "",
    subgroupname: "",
    ledgername: "",
  });

  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [ledgers, setLedgers] = useState([]);

  // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    try {
      const g = await getData("/groups");
      const sg = await getData("/subgroups");
      const l = await getData("/ledgers");

      if (Array.isArray(g)) setGroups(g);
      if (Array.isArray(sg)) setSubgroups(sg);
      if (Array.isArray(l)) setLedgers(l);
    } catch (e) {
      showErrorAlert("Error", "Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "grouptype") {
      setFormData({
        _id: "",
        grouptype: value,
        group_id: "",
        subgroupname: "",
        ledgername: "",
      });
    } else if (name === "group_id") {
      setFormData((p) => ({
        ...p,
        group_id: value,
        subgroupname: "",
        ledgername: "",
      }));
    } else if (name === "subgroupname") {
      setFormData((p) => ({
        ...p,
        subgroupname: value,
        ledgername: "",
      }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { grouptype, group_id, subgroupname, ledgername } = formData;

    if (!grouptype || !group_id || !subgroupname || !ledgername.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill all fields to proceed',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    const exists = ledgers.some(
      (l) =>
        l.LedgerName.toLowerCase() === ledgername.toLowerCase() &&
        l.subgroupname === subgroupname &&
        l._id !== formData._id
    );

    if (exists) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Entry',
        text: 'This ledger name already exists within the selected subgroup',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    try {
      await postData("/ledgers", formData);
      showSuccessAlert("Success", formData._id ? "Ledger updated successfully" : "New ledger created successfully");

      setFormData({
        _id: "",
        grouptype: "",
        group_id: "",
        subgroupname: "",
        ledgername: "",
      });

      fetchData();
    } catch (e) {
      showErrorAlert("Error", "The operation failed. Please try again.");
    }
  };



  // ---------------- EDIT ----------------
  const handleEdit = (item) => {
    setFormData({
      _id: item._id,
      grouptype: item.GroupType,
      group_id: item.Group_id,
      subgroupname: item.subgroupname,
      ledgername: item.LedgerName,
    });

    Swal.fire({
      icon: 'info',
      title: 'Edit Mode Active',
      text: `You are now editing: ${item.LedgerName}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  };

  // ---------------- FILTERS ----------------
  const filteredGroups = groups.filter((g) => g.GroupType === formData.grouptype);
  const filteredSubgroups = subgroups.filter((s) => s.Group_id === formData.group_id);

  // Helper for Badge Colors
  const getTypeColor = (type) => {
    const colors = {
      Income: "bg-emerald-100 text-emerald-700",
      Assets: "bg-blue-100 text-blue-700",
      Expenditure: "bg-orange-100 text-orange-700",
      Liabilities: "bg-rose-100 text-rose-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ledger Management</h1>
            <p className="text-slate-500 mt-1">Create and manage your financial ledgers and accounts.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <Database className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-slate-700">{ledgers.length} Total Ledgers</span>
          </div>
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">
              {formData._id ? "Update Ledger Details" : "Create New Ledger"}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Group Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Head</label>
                <div className="relative">
                  <select
                    name="grouptype"
                    value={formData.grouptype}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
                  >
                    <option value="">Select Type</option>
                    {["Income", "Assets", "Expenditure", "Liabilities"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-3 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</label>
                <div className="relative">
                  <select
                    name="group_id"
                    value={formData.group_id}
                    onChange={handleChange}
                    disabled={!formData.grouptype}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Group</option>
                    {filteredGroups.map((g) => (
                      <option key={g._id} value={g._id}>{g.GroupName}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-3 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Subgroup */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub Group</label>
                <div className="relative">
                  <select
                    name="subgroupname"
                    value={formData.subgroupname}
                    onChange={handleChange}
                    disabled={!formData.group_id}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Sub Group</option>
                    {filteredSubgroups.map((s) => (
                      <option key={s._id} value={s.subgroupname}>{s.subgroupname}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-3 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Ledger Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ledger Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="ledgername"
                    value={formData.ledgername}
                    onChange={handleChange}
                    placeholder="Enter ledger name..."
                    disabled={!formData.subgroupname}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Tag className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

            </div>

            <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-6">
              <button 
                type="submit"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-200"
              >
                {formData._id ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                {formData._id ? "UPDATE LEDGER" : "CREATE LEDGER"}
              </button>
            </div>
          </form>
        </div>

        {/* LIST TABLE SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-800 text-lg">Existing Ledgers</h3>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Quick search..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">#</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Code</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Ledger Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Subgroup</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Group</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Head Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgers.length ? (
                  ledgers.map((l, i) => (
                    <tr key={l._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{i + 1}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {l.Code || '---'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-800">{l.LedgerName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-300" />
                          {l.subgroupname}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{l.GroupName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${getTypeColor(l.GroupType)}`}>
                          {l.GroupType}
                        </span>
                      </td>
                       <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${getTypeColor(l.GroupType)}`}>
                          {l.GroupType==='Assets'||l.GroupType==='Expenditure'?'Dr':'Cr'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleEdit(l)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit Ledger"
                        >
                          <Edit3 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Database className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-500 font-medium">No ledger records found</p>
                        <button 
                          onClick={() => setFormData({...formData, _id: ""})} 
                          className="text-indigo-600 text-sm font-semibold hover:underline"
                        >
                          Clear filters or create one above
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium italic">
              * Ensure all account names follow standard accounting naming conventions for better reporting.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}