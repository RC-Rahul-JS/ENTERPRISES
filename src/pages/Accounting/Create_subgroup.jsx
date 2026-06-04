import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { 
  PlusCircle, 
  Edit3, 
  Search, 
  LayoutGrid, 
  FileText, 
  PieChart, 
  Database,
  ChevronRight,
  AlertCircle
} from "lucide-react";

// Importing your custom hooks and utilities
import useApi from "../../api/useApi";
import { showErrorAlert, showSuccessAlert } from "../../utils/alerts";

export default function LedgerManagement() {
  const { postData, getData } = useApi();

  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    _id: "",
    grouptype: "",
    group_id: "",
    subgroupname: "",
  });

  const [list, setList] = useState([]);
  const [grouplist, setgrouplist] = useState([]);

  // --- Logic Helpers ---
  const getHeadColor = (type) => {
    const colors = {
      Income: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Assets: "bg-blue-100 text-blue-700 border-blue-200",
      Expenditure: "bg-rose-100 text-rose-700 border-rose-200",
      Liabilities: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // ---------------- FETCH DATA ----------------
  const fetchdata = async () => {
    try {
      const res = await getData("/groups");
      const res2 = await getData("/subgroups");

      if (Array.isArray(res)) setgrouplist(res);
      if (Array.isArray(res2)) setList(res2);
    } catch (error) {
      console.error("Failed to load data:", error);
      showErrorAlert("Error", "Could not load data. Please try again.");
    }
  };

  useEffect(() => {
    fetchdata();
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
      });
    } else if (name === "group_id") {
      setFormData((prev) => ({
        ...prev,
        group_id: value,
        subgroupname: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { grouptype, group_id, subgroupname } = formData;

    if (!grouptype || !group_id || !subgroupname.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all fields",
        confirmButtonColor: "#4f46e5", // Indigo-600 to match modern UI
      });
      return;
    }

    // Duplicate check
    const exists = list.some(
      (item) =>
        item.subgroupname.toLowerCase() === subgroupname.toLowerCase() &&
        item.Group_id === group_id &&
        item._id !== formData._id
    );

    if (exists) {
      Swal.fire({
        icon: "error",
        title: "Duplicate Subgroup",
        text: "This subgroup already exists under the selected group.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    try {
      await postData("/subgroups", formData);
      showSuccessAlert("Success!", formData._id ? "Updated successfully" : "Created successfully");

      setFormData({
        _id: "",
        grouptype: "",
        group_id: "",
        subgroupname: "",
      });

      fetchdata();
    } catch (error) {
      console.error("Save failed:", error);
      showErrorAlert("Error", "Could not save data.");
    }
  };

  // ---------------- EDIT ----------------
  const handleEdit = (item) => {
    setFormData({
      _id: item._id,
      grouptype: item.GroupType,
      group_id: item.Group_id,
      subgroupname: item.subgroupname,
    });

    Swal.fire({
      icon: "info",
      title: "Edit Mode",
      text: `Editing: ${item.subgroupname}`,
      timer: 1200,
      showConfirmButton: false,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derived filters
  const filteredGroups = grouplist.filter((g) => g.GroupType === formData.grouptype);
  
  const filteredList = list.filter(item => 
    item.subgroupname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.GroupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.Code && item.Code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans antialiased text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        {/* <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <Database className="w-8 h-8 text-indigo-600" />
              Sub-Group Management
            </h1>
            <p className="text-slate-500 mt-1">Configure and manage your ledger hierarchy and financial heads.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <LayoutGrid className="w-4 h-4" />
            <span>Finance Control</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-indigo-600">Ledgers</span>
          </div>
        </header> */}

        {/* FORM CARD */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-500" />
              {formData._id ? "Update Sub-Group" : "Create New Sub-Group"}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Head Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Account Head</label>
                <div className="relative">
                  <PieChart className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <select
                    name="grouptype"
                    value={formData.grouptype}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Type</option>
                    {["Income", "Assets", "Expenditure", "Liabilities"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Group Name Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Main Group</label>
                <div className="relative">
                  <LayoutGrid className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <select
                    name="group_id"
                    value={formData.group_id}
                    onChange={handleChange}
                    disabled={!formData.grouptype}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Group</option>
                    {filteredGroups.map((g) => (
                      <option key={g._id} value={g._id}>{g.GroupName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub-group Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Sub-Group Name</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter ledger name..."
                    name="subgroupname"
                    value={formData.subgroupname}
                    onChange={handleChange}
                    disabled={!formData.group_id}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
              {formData._id && (
                <button
                  type="button"
                  onClick={() => setFormData({_id:"", grouptype:"", group_id:"", subgroupname:""})}
                  className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-10 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95"
              >
                {formData._id ? "SAVE CHANGES" : "CREATE SUB GROUP"}
              </button>
            </div>
          </form>
        </div>

        {/* DATA LISTING SECTION */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
            <h3 className="font-semibold text-lg">Existing Sub-Groups</h3>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ledgers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4 border-b border-slate-100">#</th>
                  <th className="px-6 py-4 border-b border-slate-100">Code</th>
                  <th className="px-6 py-4 border-b border-slate-100">Sub Group</th>
                  <th className="px-6 py-4 border-b border-slate-100">Parent Group</th>
                  <th className="px-6 py-4 border-b border-slate-100 text-center">Head Type</th>
                  <th className="px-6 py-4 border-b border-slate-100 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredList.length > 0 ? (
                  filteredList.map((item, i) => (
                    <tr 
                      key={item._id} 
                      className="group hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {item.Code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.subgroupname}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 italic">
                        {item.GroupName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getHeadColor(item.GroupType)}`}>
                          {item.GroupType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                          title="Edit Ledger"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-lg font-medium italic">No ledgers found</p>
                        <p className="text-sm">Try adjusting your search or create a new entry.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
            Showing {filteredList.length} of {list.length} total records
          </div>
        </div>
      </div>
    </div>
  );
}