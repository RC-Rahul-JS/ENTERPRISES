import React, { useState, useMemo, useEffect } from 'react';
import useApi from "../../api/useApi";
import Swal from 'sweetalert2';
import axios from 'axios';
import moment from 'moment';
const PayrollFormComplete = () => {
   const {getData,postData}= useApi()
  // --- Mock Data ---
  // const employees = [
  //   { id: 1, name: 'Rahul Sharma', designation: 'Senior Developer', department: 'Tech' },
  //   { id: 2, name: 'Priya Verma', designation: 'UI/UX Designer', department: 'Design' },
  //   { id: 3, name: 'Amit Patel', designation: 'Project Manager', department: 'Management' },
  //   { id: 4, name: 'Sneha Singh', designation: 'QA Engineer', department: 'Tech' },
  //   { id: 5, name: 'Vikram Malhotra', designation: 'DevOps Engineer', department: 'Ops' },
  //   { id: 6, name: 'Anjali Gupta', designation: 'HR Manager', department: 'HR' },
  // ];


  // Ledger Search States
const [ledgerSearch, setLedgerSearch] = useState('');
const [showLedgerSuggestions, setShowLedgerSuggestions] = useState(false);
const [selectedLedger, setSelectedLedger] = useState(null);
const [hoverLedger, setHoverLedger] = useState(null);
const [list, setList] = useState([]);

const filteredLedgers = useMemo(() => {
  if (!ledgerSearch) return list;
  return list.filter(l =>
    l.LedgerName.toLowerCase().includes(ledgerSearch.toLowerCase())
  );
}, [ledgerSearch, list]);


const selectLedger = (item) => {
  setSelectedLedger(item);
  setLedgerSearch(item.LedgerName);
  setShowLedgerSuggestions(false);
};

useEffect(() => {
  console.log(selectedLedger)
}, [selectedLedger])





  const [employees, setemployee] = useState([])
  const [Designations, setDesignations] = useState([])
    const fetchdata = async () => {
        try {
          const res = await getData("/staff/designations");
          const res2 = await getData("/trade/search-data");
          console.log(res,res2)
          if (Array.isArray(res)&&Array.isArray(res2)) {
            setDesignations(res);
            setemployee(res2);
          } 
        } catch (error) {
          console.error("Failed to load appointments:", error);
          // showErrorAlert("Error", "Could not load Data. Please try again."); 
        }
      };
      useEffect(() => {
            fetchdata();
          }, []);

  const banks = ['IDBI Bank'];

  // --- State ---
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Transaction Inputs State
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [txnId, setTxnId] = useState('');
  
  // List State
  const [addedList, setAddedList] = useState([]);

  // --- PAYMENT MODE & OVERALL DETAILS ---
  const [paymentMode, setPaymentMode] = useState('BANK'); // 'BANK', 'CHEQUE', 'CASH'
  const [selectedBank, setSelectedBank] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [ChequeBank, setChequeBank] = useState('')
  const [chequeDate, setChequeDate] = useState('');
  
  // NEW: Overall Batch Narration
  const [batchNarration, setBatchNarration] = useState('');



   
    const [grouplist,setgrouplist] = useState([]); // Simulate fetched data
  
    const fetchdataledger = async () => {
        try {
        const res = await getData("/groups");
        const res2 = await getData("/ledgers");
        console.log(res)
        if (Array.isArray(res2)) {
            setgrouplist(res);
            setList(res2);
            console.log(res2.filter((item)=>(item.GroupType==='Liabilities')))
        } 
        } catch (error) {
        console.error("Failed to load Data:", error);
        showErrorAlert("Error", "Could not load Data. Please try again."); 
        }
    };
      useEffect(() => {
      fetchdataledger();
      }, []);





  // --- Logic ---
  // const filteredEmployees = useMemo(() => {
  //   if (!searchTerm) return employees;
  //   return employees
  //         .filter(emp => 
  //           emp.plist && emp.plist.includes(selectedLedger) 
  //         )
  // }, [searchTerm]);
  const filteredEmployees = useMemo(() => {
      if (!searchTerm) return employees;
      return employees.filter(emp => 
              emp.plist && emp.plist.includes(selectedLedger?.Code) && emp.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            
    }, [searchTerm]);

  const [currentEmployee, setcurrentEmployee] = useState('')

  // const currentEmployee = useMemo(() => {
  //   return employees.find(emp => emp.id === selectedEmpId);
  // }, [selectedEmpId]);

  const totalAmount = addedList.reduce((acc, item) => acc + item.amount, 0);

  const selectEmployee = (emp) => {
    console.log(emp)
    setSelectedEmpId(emp.id);
    setSearchTerm(emp.name); 
    setShowSuggestions(false);
    setcurrentEmployee(emp)
  };

  const handleAdd = () => {
    if ( !amount ) {
      alert("Please fill in all transaction fields.");
      return;
    }

    if (!currentEmployee ) {
       const newItem = {
      id: Date.now(),
      date: date,
      empId: '#',
      empName: '#',
      designation: '',
      department: '',
      amount: parseFloat(amount),
      narration: "Receipt Voucher",
      ledger_id: selectedLedger.Code,
      ledger_name:selectedLedger.LedgerName,
      // txnId: txnId
    };

    setAddedList([...addedList, newItem]);

    // Auto-Clear inputs
    setAmount('');
    setNarration('');
    // setTxnId('');
    setSearchTerm(''); 
    setSelectedEmpId(null); 


    }else{
       const newItem = {
      id: Date.now(),
      date: date,
      empId: currentEmployee._id,
      empName: currentEmployee.name,
      designation: currentEmployee.designation_name,
      department: currentEmployee.department,
      amount: parseFloat(amount),
      narration: "Receipt Voucher",
      ledger_id: selectedLedger.Code,
      ledger_name:selectedLedger.LedgerName,
      // txnId: txnId
    };

    setAddedList([...addedList, newItem]);

    // Auto-Clear inputs
    setAmount('');
    setNarration('');
    // setTxnId('');
    setSearchTerm(''); 
    setSelectedEmpId(null); 
    setcurrentEmployee('')

    }

   
  };

  const handleRemove = (id) => {
    setAddedList(addedList.filter(item => item.id !== id));
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async() => {
    if (addedList.length === 0) return alert("List is empty.");
    
    // Validation based on Payment Mode
    let details = {};

    if (paymentMode === 'BANK') {
      if (!selectedBank) return alert("Please select a Source Bank.");
      details = { type: 'BANK_TRANSFER', bankName: selectedBank };
    } 
    else if (paymentMode === 'CHEQUE') {
      // if (!chequeNo || !chequeDate) return alert("Please fill in Cheque Number and Date.");
      details = { type: 'CHEQUE', chequeNumber: chequeNo, chequeDate: chequeDate };
    }
    else if (paymentMode === 'CASH') {
       details = { type: 'CASH_PAYMENT' };
    }

    // 1. Create JSON Structure
    const payload = {
      submissionId: `SUB-${Date.now()}`,
      submissionDate: new Date().toISOString(),
      paymentDate: date,
      overallNarration: batchNarration, // New Field
      paymentMode: paymentMode, 
      paymentDetails: details,
      totalAmount: totalAmount,
      totalTransactions: addedList.length,
      transactionList: addedList
    };

     try {

      // const formattedDebits = addedList.map(c => ({
      //   // ledger_id: 'A15',
      //   // ledger_name:'Salary and Employee Benefits',
      //   ledger_id: paymentMode === 'CASH'?'A11':'A4',
      //   ledger_name:paymentMode === 'CASH'?'Cash in Hand':'IDBI Bank',
      //   narration: txnId || "Receipt Voucher",
      //   debit:c.amount,
      //   credit:0,
      //   employee_id:c.empId,
      //   employee_name:c.empName,
         
      // }));

       const formattedDebits = [{
        // ledger_id: 'A15',
        // ledger_name:'Salary and Employee Benefits',
        ledger_id: paymentMode === 'CASH'?'A11':'A4',
        ledger_name:paymentMode === 'CASH'?'Cash in Hand':'IDBI Bank',
        narration: txnId || "Receipt Voucher",
        debit:totalAmount,
        credit:0,
        employee_id:'#',
        employee_name:'#',
         
      }];

      const formattedCredit =addedList.map(d => ({
        ledger_id: d.ledger_id,
        ledger_name:d.ledger_name,
        narration: txnId || "Receipt Voucher",
        debit:0,
        credit:d.amount,
        employee_id:d.empId,
        employee_name:d.empName,
      }));

      

     


        const voucher = {
        date: new Date(date).toISOString(),
        created_at: new Date().toISOString(),
        entries: [...formattedDebits,...formattedCredit],
        amount: totalAmount,
        narration: batchNarration,
        cbankName: ChequeBank===''?'x':ChequeBank,
        voucher_type: "Receipt",
        voucher_mode: paymentMode === 'CASH'?"Cash":"Bank"

      };
      console.log(voucher)


//  try {
//         const formattedDebits = debits.map(d => ({
//         ledger_id: d.ledger,
//         ledger_name:getLedgerName(d.ledger),
//         narration: d.particular || "Journal Voucher",
//         debit:d.amount,
//         credit:0
//       }));
      
//       // Format the single Credit entry
//       const formattedCredit =credits.map(c => ({
//         ledger_id: c.ledger,
//         ledger_name:getLedgerName(c.ledger),
//         narration: c.particular || "Journal Voucher",
//         debit:0,
//         credit:c.amount
//       }));

//       const voucher = {
//         date: new Date().toISOString(),
//         created_at: new Date().toISOString(),
//         entries: [...formattedDebits,...formattedCredit],
//         amount: totalCredit,
//         narration: narration,
//         voucher_type: "Journal",
//       };
//       console.log(voucher)
      const res=await postData('/receipt_voucher',voucher)
      Swal.fire({
        title: "Successful",
        text: 'Receipt Voucher Successfully Saved!',
        icon: "success",
        timer:2000
      });

//       // Update local entries list
//       setEntries(prev => [voucher, ...prev]);

//       // Reset form
//       setDebits([]);
//       setCredits([]);
//       setNarration("");
//       setNewLineItem({ ledger: "", amount: "", particular: "", type: "debit" });

    } catch (error) {
      console.error("Error saving journal voucher:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to save journal voucher.",
        icon: "error"
      });
    }








    // 2. Log to Console
    console.log("Final Payroll JSON Data:",payload );
    console.log("Final Payroll JSON Data:", JSON.stringify(payload, null, 2));
    alert("Entry Submitted Successfully!");

    // 3. Reset Form
    setAddedList([]);
    setSelectedBank('');
    setChequeNo('');
    setChequeBank('');
    setChequeDate('');
    setPaymentMode('BANK'); 
    setBatchNarration(''); // Reset Overall Narration
    setAmount('');
    setNarration('');
    setTxnId('');
    setSearchTerm('');
    setSelectedEmpId(null);
    setcurrentEmployee('')
    setDate(new Date().toISOString().slice(0, 10));
  };

  // --- Inline Styles ---
  const s = {
    wrapper: { backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Inter", sans-serif', display: 'flex', justifyContent: 'center' },
    container: { backgroundColor: '#ffffff', width: '100%', maxWidth: '950px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'visible' },
    
    header: { background: '#0d3f90ff', padding: '25px 40px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { margin: 0, fontSize: '22px', fontWeight: '600' },
    
    body: { padding: '40px' },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', position: 'relative' },
    row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', marginBottom: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: '15px' },
    label: { fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#334155', outline: 'none', width: '100%', boxSizing: 'border-box' },
    
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: '220px', overflowY: 'auto', marginTop: '4px', listStyle: 'none', padding: '0' },
    dropItem: (id) => ({ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', backgroundColor: hoveredItem === id ? '#f8fafc' : 'white', display: 'flex', justifyContent: 'space-between' }),
    
    card: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '15px 20px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#0d3f90ff', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
    
    addBtn: { width: '100%', padding: '14px', backgroundColor: '#0d3f90ff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '30px' },
    
    tableContainer: { border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '30px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '14px', background: '#f8fafc', color: '#475569', fontSize:'12px', fontWeight:'700', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '14px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' },
    
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '25px', borderTop: '2px dashed #cbd5e1' },
    submitBtn: { padding: '14px 30px', backgroundColor: '#0d3f90ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
    
    radioGroup: { display: 'flex', gap: '20px', marginBottom: '15px' },
    radioLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#334155' }
  };

  const [ledgerCode, setledgerCode] = useState('')
useEffect(() => {
  if (!ledgerSearch) return;

  const match = list.find(
    (item) => item.LedgerName.toLowerCase() === ledgerSearch.toLowerCase()
  );

  if (match) {
    setledgerCode(match.Code);
    console.log("Selected Ledger Code:", match.Code);
  }
}, [ledgerSearch, list]);


const API_BASE_URL = import.meta.env.VITE_API_URL;
const fetchLedgerData = async () => {
  try {
    // ✅ API Call (best practice using params)
    const res = await axios.get(
      `${API_BASE_URL}/v1/ledger2/${selectedLedger.Code}/${currentEmployee._id}`,
      {
        params: {
          from: moment(date).add(1, "days").format("YYYY-MM-DD"),
          to: moment(date).add(1, "days").format("YYYY-MM-DD")
        }
      }
    );
    if (res?.data) {
      const bal =  parseFloat(res.data.opening_balance)>=0?res.data.opening_balance:res.data.opening_balance*-1
      setcurrentEmployee({...currentEmployee,designation_name:`Balance : ₹${bal}`})
    } else {
    }

  } catch (error) {
    console.error("API Error:", error.message);
  }
};

useEffect(() => {
  if (currentEmployee._id &&selectedLedger.Code) {
    fetchLedgerData()
  }
}, [selectedLedger,currentEmployee._id])

  

  return (
    <div style={s.wrapper}>
      <div style={s.container}>
        <div style={s.header}>
          <div style={s.title}>Receipt Entry Portal</div>
          <div style={{fontSize:'14px', opacity: 0.8}}>Today: {date}</div>
        </div>

        <div style={s.body}>

           <div style={s.row2}>

 <div style={s.inputGroup}>
              <label style={s.label}>Receipt Date</label>
              <input type="date" style={s.input} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>


          <div className="relative">
  <label style={s.label}>Ledger Name</label>

  <input
    type="text"
    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    placeholder="Search Ledger..."
    value={ledgerSearch}
    onChange={(e) => {
      setLedgerSearch(e.target.value);
      setShowLedgerSuggestions(true);
      setSelectedLedger(null);
      // setledgerCode(employees.filter((item)=>(item.LedgerName===e.target.value))[0].Code);
    }}
    onFocus={() => setShowLedgerSuggestions(true)}
  />

  {showLedgerSuggestions && ledgerSearch && (
    <ul
      className="absolute w-full bg-white border rounded-lg shadow-lg mt-1 max-h-56 overflow-auto z-50"
    >
      {filteredLedgers.map((item) => (
        <li
          key={item.Code}
          onMouseEnter={() => setHoverLedger(item.Code)}
          onMouseLeave={() => setHoverLedger(null)}
          onClick={() => selectLedger(item)}
          className={`px-4 py-2 cursor-pointer border-b 
            ${hoverLedger === item.Code ? "bg-gray-100" : ""}`}
        >
          <div className="font-semibold text-gray-900">{item.LedgerName}</div>
          <div className="text-xs text-gray-500">{item.GroupName}</div>
        </li>
      ))}

      {filteredLedgers.length === 0 && (
        <li className="px-4 py-2 text-gray-500 text-sm">No matches</li>
      )}
    </ul>
  )}
</div>


</div>
          
          
          {/* Search & Date */}
          <div style={s.row2}>
            <div style={s.inputGroup}>
              <label style={s.label}>Accounts</label>
              <input
                style={s.input}
                type="text"
                placeholder="Type name to search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                  setSelectedEmpId(null); 
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && searchTerm && (
                <ul style={s.dropdown}>
                  {filteredEmployees
                  // .filter((item)=>(item.pAccount===ledgerCode))
                  .map(emp => (
                    <li 
                      key={emp.id} 
                      style={s.dropItem(emp.id)}
                      onMouseEnter={() => setHoveredItem(emp.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => selectEmployee(emp)}
                    >
                      <span style={{fontWeight:'600', color: '#1e293b'}}>{emp.name}</span>
                      <span style={{fontSize:'12px', color:'#64748b'}}>{emp.designation_name}</span>
                    </li>
                  ))}
                  {filteredEmployees.length === 0 && <li style={{padding:'15px', color:'#94a3b8'}}>No matches</li>}
                </ul>
              )}
            </div>


              <div style={s.inputGroup}>
              <label style={s.label}>Amount (₹)</label>
              <input onWheel={(e) => e.target.blur()} type="number" style={s.input} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

           
          </div>

          {currentEmployee && (
            <div style={s.card}>
              <div style={s.avatar}>{currentEmployee.name.charAt(0)}</div>
              <div>
                <div style={{fontWeight:'bold', color:'#1e293b'}}>{currentEmployee.name}</div>
                <div style={{fontSize:'13px', color:'#3b82f6'}}>{currentEmployee.designation_name}</div>
              </div>
            </div>
          )}

          {/* Main Inputs */}
          <div style={s.row3}>
            {/* <div style={s.inputGroup}>
              <label style={s.label}>Transaction ID</label>
              <input type="text" style={s.input} placeholder="e.g. UTR-88291" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
            </div> */}
          
            {/* <div style={s.inputGroup}>
              <label style={s.label}>Narration</label>
              <input type="text" style={s.input} placeholder="Remarks..." value={narration} onChange={(e) => setNarration(e.target.value)} />
            </div> */}
          </div>

          <button style={s.addBtn} onClick={handleAdd}>+ Add Transaction</button>

          {/* List Table */}
          {addedList.length > 0 ? (
            <div style={s.tableContainer}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {/* <th style={s.th}>Txn ID</th> */}
                    <th style={s.th}>Employee</th>
                    {/* <th style={s.th}>Narration</th> */}
                    <th style={{...s.th, textAlign:'right'}}>Amount</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedList.map(item => (
                    <tr key={item.id}>
                      {/* <td style={{...s.td, fontFamily:'monospace', fontWeight:'600'}}>{item.txnId}</td> */}
                      <td style={s.td}>
                        <div style={{fontWeight:'600'}}>{item.empName}</div>
                        <div style={{fontSize:'11px', color:'#64748b'}}>{item.designation}</div>
                      </td>
                      {/* <td style={s.td}>{item.narration}</td> */}
                      <td style={{...s.td, textAlign:'right', fontWeight:'bold'}}>₹{item.amount}</td>
                      <td style={s.td}>
                        <button onClick={() => handleRemove(item.id)} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontWeight:'600'}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{textAlign:'center', padding:'20px', border:'2px dashed #e2e8f0', borderRadius:'10px', color:'#94a3b8', marginBottom:'30px'}}>
              No transactions added yet.
            </div>
          )}

          {/* Footer */}
          <div style={s.footer}>
            <div style={{width: '50%'}}>
              <label style={s.label}>Receipt Method</label>
              <div style={s.radioGroup}>
                <label style={s.radioLabel}>
                  <input 
                    type="radio" 
                    name="payMode" 
                    checked={paymentMode === 'BANK'} 
                    onChange={() => setPaymentMode('BANK')} 
                  /> 
                  Online / Cheque
                </label>
                {/* <label style={s.radioLabel}>
                  <input 
                    type="radio" 
                    name="payMode" 
                    checked={paymentMode === 'CHEQUE'} 
                    onChange={() => setPaymentMode('CHEQUE')} 
                  /> 
                  Cheque
                </label> */}
                <label style={s.radioLabel}>
                  <input 
                    type="radio" 
                    name="payMode" 
                    checked={paymentMode === 'CASH'} 
                    onChange={() => setPaymentMode('CASH')} 
                  /> 
                  Cash
                </label>
              </div>

              {/* Conditional Inputs */}
              {paymentMode === 'BANK' && (
                <>
                <div style={s.inputGroup}>
                   <label style={s.label}>Select Source Bank</label>
                   <select style={s.input} value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                    <option value="">-- Select Bank --</option>
                    {banks.map((b,i) => <option key={i} value={b}>{b}</option>)}
                  </select>
                </div>


<div style={s.inputGroup}>
              <label style={s.label}>Cheque No./ Bank Ref.</label>
              <input type="text" style={s.input} placeholder="e.g. UTR-88291" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
            </div></>
              )}

              {paymentMode === 'CHEQUE' && (
                <div style={{display: 'flex', gap: '10px'}}>
                  <div style={s.inputGroup}>
              <label style={s.label}>Cheque No./ Bank Ref.</label>
              <input type="text" style={s.input} placeholder="e.g. UTR-88291" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
            </div>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Bank Name</label>
                    <input 
                      type="text" 
                      style={s.input} 
                      placeholder="######" 
                      value={ChequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                    />
                  </div>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Cheque Date</label>
                    <input 
                      type="date" 
                      style={s.input} 
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {/* NEW: Overall Remark / Batch Narration */}
              <div style={{marginTop: '15px'}}>
                <label style={s.label}>Overall Remark / Batch Note</label>
                <input 
                  type="text" 
                  style={s.input} 
                  placeholder="e.g. October Salary Batch 1" 
                  value={batchNarration}
                  onChange={(e) => setBatchNarration(e.target.value)}
                />
              </div>

            </div>

            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'12px', color:'#64748b', marginBottom:'5px'}}>Total Disbursement</div>
              <div style={{fontSize:'22px', fontWeight:'800', color:'#0d3f90ff', marginBottom:'10px'}}>₹{totalAmount.toLocaleString()}</div>
              <button style={s.submitBtn} onClick={handleSubmit}>Submit</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PayrollFormComplete;