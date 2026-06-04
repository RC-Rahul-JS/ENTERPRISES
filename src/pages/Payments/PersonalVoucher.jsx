// src/pages/LedgerStatementPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import useApi from '../../api/useApi';
import moment from 'moment';
import { Check } from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_URL;
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FileSpreadsheet } from 'lucide-react';
export default function LedgerStatementPage() {

   const [isChecked, setIsChecked] = useState(false);
  // Employee Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  const [ledgerCode, setledgerCode] = useState('')

  // Staff Data
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Ledger Inputs
  const [formData, setFormData] = useState({
    ledgerId: 'A25',
    from: moment(new Date()).format('YYYY-MM-DD'),
    to: moment(new Date()).format('YYYY-MM-DD'),
    grouptype: "",
    group_id: "",
  });

  const { getData } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [accounts, setAccounts] = useState([]);


  // Fetch Staff + Designations
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await getData("/staff/designations");
        const res2 = await getData("/trade/search-data");

        if (Array.isArray(res) && Array.isArray(res2)) {
          setDesignations(res);
          setEmployees(res2);
          console.log(res2)
        }
      } catch (error) {
        console.error("Failed to load staff data:", error);
      }
    };
    fetchdata();
  }, []);

     // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    try {
      const g = await getData("/groups");
      const res = await getData("/ledgers");
      if (Array.isArray(g)) setGroups(g);
      if (Array.isArray(res)) setAccounts(res);
    } catch (e) {
      showErrorAlert("Error", "Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

   // ---------------- HANDLE CHANGE ----------------
  const handleChange1 = (e) => {
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

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees
    .filter(emp => 
        emp.plist && emp.plist.includes(formData.ledgerId)
      )
  }, [formData.ledgerId]);

  const currentEmployee = useMemo(() => {
    return employees.find(emp => emp.id === selectedEmpId);
  }, [selectedEmpId, employees]);

  const selectEmployee = (id) => {
    const emp = employees.find(item=>item._id === id)
    setSelectedEmpId(emp._id);
    setledgerCode(emp.pAccount);
    setSearchTerm(emp.name);
    // setShowSuggestions(false);

    // Set ledgerId automatically if needed
    setFormData(prev => ({
      ...prev,
      ledgerId: emp.ledger_id || prev.ledgerId
    }));
  };

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Format Helpers
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatAmount = (num) =>
    Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // Submit Form → Load Ledger
  const handleSubmit = async (e) => {
    e.preventDefault();


    console.log(selectedEmpId)

    const { ledgerId, from, to } = formData;

    if (new Date(from) > new Date(to)) {
      Swal.fire('Invalid Range', 'Start date cannot be after end date.', 'error');
      return;
    }

    setLoading(true);
    setData(null);
    console.log(formData.ledgerId,selectedEmpId)

    const url = `${API_BASE_URL}/v1/ledger2/${formData.ledgerId}/${selectedEmpId}?from=${moment(from).format('YYYY-MM-DD')}&to=${moment(to)
      .add(1, 'days')
      .format('YYYY-MM-DD')}`;

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const result = await response.json();

      setData(result);
    //   setData(result.filter((item)=>(item.empId===selectedEmpId)));
      console.log(result)

      if (result.transaction_count === 0) {
        Swal.fire('No Transactions', 'No entries found in this period.', 'info');
      }
    } catch (err) {
      Swal.fire('Error', 'Could not load ledger data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dropdown Styles
  const s = {
    inputGroup: { position: 'relative' },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
    },
    label: { fontWeight: '600', marginBottom: '6px', display: 'block' },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      maxHeight: '250px',
      overflowY: 'auto',
      zIndex: 20,
    },
    dropItem: (id) => ({
      padding: '10px 12px',
      cursor: 'pointer',
      backgroundColor: hoveredItem === id ? '#f1f5f9' : 'white',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }),
  };

  
  const filteredGroups = groups.filter((g) => g.GroupType === formData.grouptype);
  const filteredaccounts = accounts.filter((s) => s.Group_id === formData.group_id);

  const BeautifulCheckbox = ({ label  }) => {
  // Local state to manage whether the checkbox is checked
 

  // Function to toggle the checked state
  const handleToggle = () => {
    setIsChecked(prev => !prev);
  };

  return (
    <div
      className="flex items-center space-x-3 cursor-pointer select-none"
      onClick={handleToggle}
      role="checkbox"
      aria-checked={isChecked}
      // Enable keyboard navigation and activation
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
    >
      {/* Custom Checkbox Indicator (The visual part) */}
      <div
        className={`
          relative w-6 h-6 rounded-lg border-2 flex items-center justify-center 
          transition-all duration-300 ease-in-out shadow-sm
          focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
          ${isChecked
            // Style when checked: vibrant green background and border
            ? 'bg-emerald-500 border-emerald-500 transform scale-100'
            // Style when unchecked: white background, light gray border
            : 'bg-white border-gray-300 transform scale-95'
          }
          hover:shadow-md
        `}
        aria-hidden="true"
      >
        {/* Checkmark Icon */}
        <Check
          className={`
            w-4 h-4 text-white transition-opacity duration-200
            ${isChecked ? 'opacity-100' : 'opacity-0'}
          `}
        />
        {/* Hidden native input for robust accessibility, though primary interaction is via role attributes */}
        <input
          type="checkbox"
          className="sr-only"
          checked={isChecked}
          onChange={handleToggle}
        />
      </div>

      {/* Label Text - Reduced from text-lg to text-sm */}
      <span className="text-gray-700 font-medium text-sm">
        {label}
      </span>
    </div>
  );
};



  const exportToExcel = () => {
  if (!data || data.transactions.length === 0) {
    Swal.fire("No Data", "Nothing to export", "warning");
    return;
  }

  const excelData = data.transactions.map((tx, index) => {
    const runningBalance =
      index === 0
        ? data.opening_balance + tx.debit - tx.credit
        : data.transactions[index - 1].runningBalance + tx.debit - tx.credit;

    data.transactions[index].runningBalance = runningBalance;

    return {
      Date: formatDate(tx.date),
      Company: tx.company,
      Voucher_No: tx.voucher_number,
      Type: tx.voucher_type,
      Narration: tx.narration,
      Debit: tx.debit,
      Credit: tx.credit,
      Balance:
        runningBalance >= 0
          ? `${runningBalance} Dr`
          : `${Math.abs(runningBalance)} Cr`,
    };
  });

  // Add Opening Balance on top
  excelData.unshift({
    Date: "",
    Company: "",
    Voucher_No: "",
    Type: "Opening Balance",
    Narration: "",
    Debit: "",
    Credit: "",
    Balance: data.opening_balance,
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const fileData = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  saveAs(fileData, `Ledger_${formData.ledgerId}.xlsx`);
};




 const DrCr=(b)=>{
    if (parseFloat(b)===0&&formData.grouptype==='Income') {
return 'Cr'
    }else if (parseFloat(b)===0&&formData.grouptype==='Liabilities') {
return 'Cr'
    }else if (parseFloat(b)===0&&formData.grouptype==='Expenditure') {
      return 'Dr'
    }else if (parseFloat(b)===0&&formData.grouptype==='Assets') {
      return 'Dr'
    }
    return 'Dr'
  }


  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl border">
      <h2 className="text-2xl font-bold text-center mb-2">Personal Statement</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-6 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
      >
         <div>
          <label className="block font-semibold mb-2">GroupType</label>
           <select
                name="grouptype"
                value={formData.grouptype}
                onChange={handleChange1}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select</option>
                 {["Income", "Assets", "Expenditure", "Liabilities"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
              </select>
        </div>
         <div>
          <label className="block font-semibold mb-2">GroupName</label>
           <select
                name="group_id"
                value={formData.group_id}
                onChange={handleChange1}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select</option>
                 {filteredGroups.map((g) => (
                      <option key={g._id} value={g._id}>{g.GroupName}</option>
                    ))}
              </select>
        </div>
         <div>
          <label className="block font-semibold mb-2">Ledger</label>
           <select
                name="ledgerId"
                value={formData.ledgerId}
                onChange={handleChange1}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select</option>
                 {filteredaccounts.map((acc, idx) => (
                  <option key={idx} value={acc.Code}>
                    {acc.LedgerName}
                  </option>
                ))}
              </select>
        </div>

        {/* Employee Search */}
        <div>
          <label style={s.label}>Account</label>
          {/* <input
            type="text"
            style={s.input}
            placeholder="Type name to search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
              setSelectedEmpId(null);
            }}
            onFocus={() => setShowSuggestions(true)}
          /> */}
            <select
                value={selectedEmpId}
                onChange={(e) => selectEmployee(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select</option>
                 {filteredEmployees.map((acc, idx) => (
                  <option key={idx} value={acc._id}>
                    {acc.name}
                  </option>
                ))}
              </select>

          {/* <div className="flex justify-start pt-4">
          <BeautifulCheckbox
            label="View Advance Personal Ledger"
            defaultChecked={false}
          />
        </div> */}

          {showSuggestions && searchTerm && (
            <ul style={s.dropdown}>
              {filteredEmployees.map(emp => (
                <li
                  key={emp.id}
                  style={s.dropItem(emp.id)}
                  onMouseEnter={() => setHoveredItem(emp.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => selectEmployee(emp)}
                >
                  <strong>{emp.name}</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {emp.designation_name}
                  </span>
                </li>
              ))}
              {filteredEmployees.length === 0 && (
                <li style={{ padding: '15px', color: '#94a3b8' }}>No matches</li>
              )}
            </ul>
          )}
        </div>

        {/* From Date */}
        <div>
          <label className="block font-semibold mb-2">From Date</label>
          <input
            type="date"
            name="from"
            value={formData.from}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block font-semibold mb-2">To Date</label>
          <input
            type="date"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-3 flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {loading ? 'Loading...' : 'Load Statement'}
          </button>
        </div>
      </form>


      {!loading && data && (
          <div className="px-6 py-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 shadow-inner">
            <div className="flex items-center gap-6">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Transactions</span>
                  <span className="text-sm font-black text-gray-800">{data.transaction_count}</span>
               </div>
               <div className="h-10 w-[1px] bg-gray-200"></div>
              
            </div>

            <button
              onClick={exportToExcel}
              className="flex text-xs items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 group"
            >
              <FileSpreadsheet size={15} className="group-hover:rotate-12 transition-transform" />
              Download Excel Report
            </button>
          </div>
        )}

      {/* Ledger Output */}
      {!loading && data && (
        <div>
          {/* Summary */}
          {/* <div className="bg-blue-50 p-5 rounded-lg border mb-8"> */}
            {/* <h3 className="text-lg font-semibold">Account Summary</h3> */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3"> */}
              {/* <div><strong>Ledger Name:</strong> {data.transactions[0]?.ledger_name}</div> */}
              {/* <div><strong>Opening Balance:</strong> {formatAmount(data.opening_balance)} Dr</div> */}
              {/* <div><strong>Total Transactions:</strong> {data.transaction_count}</div> */}
            {/* </div> */}
          {/* </div> */}

          {/* Table */}
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="px-6 py-3 text-left">Date</th>
                  {/* <th className="px-6 py-3 text-left">Company</th> */}
                  {/* <th className="px-6 py-3 text-left">Voucher No</th> */}
                  {/* <th className="px-6 py-3 text-left">Type</th> */}
                  <th className="px-6 py-3 text-left">Particular</th>
                  <th className="px-6 py-3 text-right">Debit</th>
                  <th className="px-6 py-3 text-right">Credit</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y">
                <tr className="bg-yellow-50 font-semibold">
                  <td colSpan="4" className="px-6 py-3 text-right">
                    Opening Balance
                  </td>
                  <td className="px-6 py-3 text-right">
                    {formatAmount(data.opening_balance)} {DrCr(data.opening_balance)}
                  </td>
                </tr>

                {data.transactions.map((tx, idx) => {
                  if (idx === 0) {
                    tx.runningBalance = data.opening_balance + tx.debit - tx.credit;
                  } else {
                    tx.runningBalance =
                      data.transactions[idx - 1].runningBalance + tx.debit - tx.credit;
                  }

                  return (
                    <tr key={idx}>
                      <td className="px-6 py-3">{formatDate(tx.date)}</td>
                      {/* <td className="px-6 py-3">{tx.company}</td> */}
                      {/* <td className="px-6 py-3">{tx.voucher_number}</td> */}
                      {/* <td className="px-6 py-3">{tx.voucher_type}</td> */}
                      <td className="px-6 py-3">{tx.narration}</td>
                      <td className="px-6 py-3 text-right">
                        {tx.debit > 0 ? formatAmount(tx.debit) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {tx.credit > 0 ? formatAmount(tx.credit) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold">
                        {formatAmount(tx.runningBalance>0?tx.runningBalance:tx.runningBalance*-1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
