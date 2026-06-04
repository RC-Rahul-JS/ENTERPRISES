import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  RotateCcw, 
  Download, 
  Wallet, 
  TrendingUp, 
  CreditCard,
  FileText, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import moment from 'moment/moment';
import Cookies from 'js-cookie';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



const MONTHS = [
  { name: "January", index: 0 },
  { name: "February", index: 1 },
  { name: "March", index: 2 },
  { name: "April", index: 3 },
  { name: "May", index: 4 },
  { name: "June", index: 5 },
  { name: "July", index: 6 },
  { name: "August", index: 7 },
  { name: "September", index: 8 },
  { name: "October", index: 9 },
  { name: "November", index: 10 },
  { name: "December", index: 11 },
];
// --- MOCK DATA ---
// const MOCK_DATA = [
//   { id: 1, seriesNo: "TXN-001", txnId: "pay_Oh4s7v8dk", date: "2024-10-01", amount: 220 },
//   { id: 2, seriesNo: "TXN-002", txnId: "pay_Ki9d2x1zm", date: "2024-10-02", amount: 220 },
//   { id: 3, seriesNo: "TXN-003", txnId: "pay_Ju3a5c9qw", date: "2024-10-05", amount: 220 },
//   { id: 4, seriesNo: "TXN-004", txnId: "pay_Lo0p4m2nb", date: "2024-10-10", amount: 220 },
//   { id: 5, seriesNo: "TXN-005", txnId: "pay_Mn1b6v5cx", date: "2024-10-12", amount: 220 },
//   { id: 6, seriesNo: "TXN-006", txnId: "pay_Xy8b2n9kl", date: "2024-11-01", amount: 220 },
// ];

const C2cGst = () => {
  // State for Inputs
  const [fromDate, setFromDate] = useState(moment().format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(moment().format('YYYY-MM-DD'));
  const [activeTab, setActiveTab] = useState(Cookies.get('logintype')==='ca'?'gst':'combined'); // 'combined' | 'gst'

  const [filter, setfilter] = useState('By Month')

  // State for Applied Filters (Actual search happens on these)
  const [appliedFilter, setAppliedFilter] = useState({ start: '', end: '' });

  const [MOCK_DATA, setMOCK_DATA] = useState([])


  async function getC2CReport() {
  try {
    const response = await axios.get("https://api.care2connect.in/get_c2c_report", {
      params: {
        from: moment(fromDate).format('YYYY-MM-DD'),
        to: moment(toDate).format('YYYY-MM-DD')
      }
    });

    setMOCK_DATA(response.data)
    console.log("C2C Report:", response.data);
  } catch (error) {
    console.error("Error:", error);
  }
}

// useEffect(() => {
//   getC2CReport()
// }, [appliedFilter])


  // --- Financial Logic ---
  const processData = (item) => {
    const totalAmount = item.amount;       // 220
    const platformFee = 16.95;                // Fixed 20
    const drFee = totalAmount - 20; // 200

    // Deductions
    const razorpayCharge = (totalAmount * 2.2) / 100; // 2.2% of 220 = 4.84
    const gstCharge = 3.05;  
    
    const pay_id = item.pay_id;// 18% of 20 = 3.60
    
    return {
      ...item,
      txnId:pay_id,
      drFee,
      platformFee,
      razorpayCharge,
      gstCharge,
    };
  };

  // --- Search Handler ---
  const handleSearch = () => {
    setAppliedFilter({ start: fromDate, end: toDate });
    getC2CReport()
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setAppliedFilter({ start: '', end: '' });
  };

  // --- Filtering & Totals ---
  const filteredData = useMemo(() => {
    return MOCK_DATA.map(processData).filter(item => {
      if (!appliedFilter.start && !appliedFilter.end) return true;
      const itemDate = new Date(item.date);
      const start = appliedFilter.start ? new Date(appliedFilter.start) : new Date('2000-01-01');
      const end = appliedFilter.end ? new Date(appliedFilter.end) : new Date('2099-12-31');
      return itemDate >= start && itemDate <= end;
    });
  }, [MOCK_DATA]);

  const totals = filteredData.reduce((acc, curr) => ({
    amount: acc.amount + curr.amount,
    drFee: acc.drFee + curr.drFee,
    gstCharge: acc.gstCharge + curr.gstCharge,
    platformFee: acc.platformFee + curr.platformFee,
    razorpayCharge: acc.razorpayCharge + curr.razorpayCharge
  }), { amount: 0, drFee: 0, gstCharge: 0, platformFee: 0, razorpayCharge: 0 });

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);





const exportToExcel = () => {

  const rows = filteredData.map((item, index) => ({
    "S.No": String(index + 1).padStart(2, "0"),
    "Transaction ID": item.txnId,
    "Date": item.date,
    "Received Amount": item.amount,
    "Dr Income": item.drFee,
    "Platform Fee": item.platformFee,
    "CGST": item.gstCharge/2,
    "SGST": item.gstCharge/2,
    "GST (18%)": item.gstCharge,
  }));

  // Add totals as last row
  rows.push({
    "S.No": "",
    "Transaction ID": "TOTAL",
    "Date": "",
    "Received Amount": totals.amount,
    "Dr Income": totals.drFee,
    "Platform Fee": totals.platformFee,
    "CGST": (totals.gstCharge/2).toFixed(3),
    "SGST": (totals.gstCharge/2).toFixed(3),
    "GST (18%)": totals.gstCharge,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(fileData, `Financial_Report_${Date.now()}.xlsx`);
};




  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState("January");


  useEffect(() => {
    const monthIdx = MONTHS.find(m => m.name === selectedMonth).index;

    // Range: Start of selected month to End of selected month
    const start = new Date(selectedYear, monthIdx, 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedYear, monthIdx + 1, 0);
    end.setHours(23, 59, 59, 999);

    setFromDate(moment(start).format('YYYY-MM-DD'))
    setToDate(moment(end).format('YYYY-MM-DD'))

  }, [selectedYear, selectedMonth])


  useEffect(() => {

    if(filter==='Last Quarter'){
      getPreviousQuarterFullRange()
    }
    
  }, [filter])
  
  

  function getPreviousQuarterFullRange() {
  const today = new Date();
  const month = today.getMonth(); // 0–11
  const year = today.getFullYear();

  const currentQuarter = Math.floor(month / 3);
  let prevQuarter = currentQuarter - 1;
  let qYear = year;

  if (prevQuarter < 0) {
    prevQuarter = 3;
    qYear = year - 1;
  }

  const startMonth = prevQuarter * 3;
  const endMonth = startMonth + 2;

  const startDate = new Date(qYear, startMonth, 1);
  const endDate = new Date(qYear, endMonth + 1, 0); // last day of month

  setFromDate(moment(startDate).format('YYYY-MM-DD'))
  setToDate(moment(endDate).format('YYYY-MM-DD'))

  // return {
  //   quarter: `Q${prevQuarter + 1}`,
  //   year: qYear,
  //   startDate,
  //   endDate
  // };
}



  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h1>
            <p className="text-slate-500 mt-1">ledger and tax settlement reports.</p>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-all">
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* --- Stats Cards (Summary) --- */}
       {Cookies.get('logintype')!=='ca'&& <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            icon={<Wallet className="text-blue-600" />} 
            label="Doctor Fee" 
            value={formatINR(totals.drFee)} 
            color="bg-blue-50 border-blue-100" 
          />
          <StatCard 
            icon={<TrendingUp className="text-emerald-600" />} 
            label="Platform Fee" 
            value={formatINR(totals.platformFee)} 
            
            color="bg-emerald-50 border-emerald-100" 
          />
          <StatCard 
            icon={<FileText className="text-purple-600" />} 
            label="Total GST (18%)" 
            value={formatINR(totals.gstCharge)} 
            color="bg-purple-50 border-purple-100" 
          />
        </div>}

        {/* --- Main Content Card --- */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 bg-white">
            
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
            { Cookies.get('logintype')!=='ca' && <button 
                onClick={() => setActiveTab('combined')}
                className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'combined' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Detailed Ledger
              </button>}
              <button 
                onClick={() => setActiveTab('gst')}
                className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'gst' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                GST Report
              </button>
            </div>

     
            <div className="flex items-center gap-3">
 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter</label> 
                <div className="relative">
                  <select 
                    value={filter} 
                    onChange={(e) => setfilter(e.target.value)} 
                    className="appearance-none pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none min-w-[140px]"
                  >
                    {['By Month','Last Quarter','Custom Date Range'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>


              
             {filter==='By Month'&& <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))} 
                  className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
                <div className="relative">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="appearance-none pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none min-w-[140px]"
                  >
                    {MONTHS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>}
            </div>

            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
             {filter==='Custom Date Range'&&<> <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={14} className="text-slate-400" />
                </div>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                />
              </div>
              <span className="text-slate-300 hidden sm:block">to</span>
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={14} className="text-slate-400" />
                </div>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                />
              </div></>}

              {/* ACTION BUTTONS */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleSearch}
                  className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                >
                  <Search size={16} />
                  Search
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* --- TABLE --- */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Receipt No.</th>
                  
                  {activeTab === 'combined' && (
                    <>
                      <th className="px-6 py-4 text-right">Dr Name</th>
                      <th className="px-6 py-4 text-right">Dr ID</th>
                      <th className="px-6 py-4 text-right text-indigo-600">Consultation Fee</th>
                      <th className="px-6 py-4 text-right text-purple-600">Platform Fee</th>
                      {/* <th className="px-6 py-4 text-right text-orange-600">Rzp (2.2%)</th> */}
                      <th className="px-6 py-4 text-right text-emerald-600">GST (18%)</th>
                      <th className="px-6 py-4 text-right">Tatal Amount</th>
                    </>
                  )}

                  {activeTab === 'gst' && (
                    <>
                      <th className="px-6 py-4 text-right">Taxable Value (Pf)</th>
                      <th className="px-6 py-4 text-right text-emerald-700">CGST</th>
                      <th className="px-6 py-4 text-right text-emerald-700">SGST</th>
                      <th className="px-6 py-4 text-right text-emerald-700">GST Amount (18%)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((item,index) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">Sno. {String(index+1).padStart(2, "0")}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{item.txnId}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                          {item.date}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                          {item.receipt_no}
                        </span>
                      </td>

                      {activeTab === 'combined' && (
                        <>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">Dr Neeraj Bansal</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">N001</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-900">{formatINR(item.drFee)}</td>
                          <td className="px-6 py-4 text-right text-slate-500">{formatINR(item.platformFee)}</td>
                          {/* <td className="px-6 py-4 text-right text-orange-500 text-xs">-{formatINR(item.razorpayCharge)}</td> */}
                          <td className="px-6 py-4 text-right text-emerald-600 text-xs">-{formatINR(item.gstCharge)}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">{formatINR(item.amount)}</td>
                        </>
                      )}

                      {activeTab === 'gst' && (
                        <>
                          <td className="px-6 py-4 text-right text-slate-600">{formatINR(item.platformFee)}</td>
                          <td className="px-6 py-4 text-right text-slate-600">{item.gstCharge/2}</td>
                          <td className="px-6 py-4 text-right text-slate-600">{item.gstCharge/2}</td>
                          <td className="px-6 py-4 text-right">
                             <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                               {formatINR(item.gstCharge)}
                             </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                         <Search className="w-8 h-8 opacity-20" />
                         <p>No transactions found for these dates.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              
              {/* Footer Total */}
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  
                  <td colSpan={2} className="px-6 py-4 text-right font-bold text-slate-500 text-xs uppercase">Grand Total</td>
                  
                  {activeTab === 'combined' && (
                    <>
                    <td colSpan={2} className="px-6 py-4 text-right font-bold text-slate-500 text-xs uppercase"></td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-700">{formatINR(totals.drFee)}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">{formatINR(totals.platformFee)}</td>
                      {/* <td className="px-6 py-4 text-right font-bold text-orange-600">{formatINR(totals.razorpayCharge)}</td> */}
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatINR(totals.gstCharge)}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{formatINR(totals.amount)}</td>
                    </>
                  )}
                   {activeTab === 'gst' && (
                    <>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">{formatINR(totals.platformFee)}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">{(totals.gstCharge/2).toFixed(3)}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">{(totals.gstCharge/2).toFixed(3)}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">{formatINR(totals.gstCharge)}</td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for the Top Cards
const StatCard = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-xl border ${color} flex items-center gap-4 transition-transform hover:-translate-y-1`}>
    <div className="p-3 bg-white rounded-lg shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">{label}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default C2cGst;