import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Eye, X, Package, Tag, Calculator, Filter, RotateCcw, ChevronRight } from 'lucide-react';
import useApi from '../../api/useApi';
/**
 * TransactionList Component
 * Includes Date Range filtering and detailed invoice view.
 */
const TransactionList = () => {
  // --- STATE ---
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [rawData, setrawData] = useState([])

  // --- DATA ---
  // const rawData = [
  //   {
  //     invoiceId: "INV-001",
  //     date: "17-02-2026",
  //     vendor: { name: "ABC Traders" },
  //     ledgerAccount: "Purchase Account",
  //     grandTotal: "12500.00",
  //     items: [
  //       {
  //         name: "Product A",
  //         gstRate: 18,
  //         isRcm: false,
  //         calcMode: "Inclusive",
  //         basePrice: "10000",
  //         gstAmount: "1800",
  //         total: "11800"
  //       },
  //       {
  //         name: "Product B",
  //         gstRate: 5,
  //         isRcm: false,
  //         calcMode: "Exclusive",
  //         basePrice: "600",
  //         gstAmount: "30",
  //         total: "630"
  //       }
  //     ]
  //   },
  //   {
  //     invoiceId: "INV-002",
  //     date: "16-02-2026",
  //     vendor: { name: "XYZ Enterprises" },
  //     ledgerAccount: "Office Expense",
  //     grandTotal: "5000.00",
  //     items: [
  //       {
  //         name: "Stationery",
  //         gstRate: 12,
  //         isRcm: false,
  //         calcMode: "Exclusive",
  //         basePrice: "4500",
  //         gstAmount: "540",
  //         total: "5040"
  //       }
  //     ]
  //   },
  //   {
  //     invoiceId: "INV-003",
  //     date: "10-01-2026",
  //     vendor: { name: "Global Tech" },
  //     ledgerAccount: "IT Assets",
  //     grandTotal: "45000.00",
  //     items: [
  //       {
  //         name: "Monitor",
  //         gstRate: 18,
  //         isRcm: false,
  //         calcMode: "Exclusive",
  //         basePrice: "38135",
  //         gstAmount: "6865",
  //         total: "45000"
  //       }
  //     ]
  //   }
  // ];

  // --- HELPERS ---
  
  /**
   * Converts "DD-MM-YYYY" string to a JavaScript Date object
   */
  const parseDisplayDate = (dateStr) => {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  /**
   * Filters the data based on fromDate and toDate
   */
  const filteredData = useMemo(() => {
    return rawData.filter((item) => {
      const itemDate = parseDisplayDate(item.date);
      
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      
      return true;
    });
  }, [fromDate, toDate,rawData]);

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
  };

  const totalSum = filteredData.reduce((acc, curr) => acc + parseFloat(curr.grandTotal), 0);

    const {getData,postData}= useApi()

  useEffect(() => {
    const func=async()=>{
        const res = await getData('/trade/api/get-vouchers')
        console.log(res.data.map((item)=>(item.data )))
        setrawData(res.data.map((item)=>(item.data )))
        }
  func()  
  }, [])
  

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Filter size={20} className="text-blue-500" />
            Transactions
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase">Manage and monitor your purchase history</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">From Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="pb-3 hidden md:block">
            <ChevronRight size={16} className="text-slate-300" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">To Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          {(fromDate || toDate) && (
            <button 
              onClick={resetFilters}
              className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all mb-[1px]"
              title="Clear Filters"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="relative">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Vendor Name</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Grand Total</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((invoice) => (
                    <tr key={invoice.invoiceId} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                            <Calendar size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{new Date(invoice.date).toLocaleDateString('en-GB')}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="text-xs font-black text-slate-800">{invoice.vendor?.name}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">ID: {invoice.invoiceId} • {invoice.ledgerAccount}</p>
                      </td>
                      <td className="p-5 text-right">
                        <span className="text-sm font-black text-blue-600">₹{parseFloat(invoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="p-5 text-center">
                        {/* <button 
                          onClick={() => setSelectedInvoice(invoice)}
                          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm hover:shadow-blue-200"
                        >
                          <Eye size={14} /> View
                        </button> */}
                     { invoice.billImage&&  <button 
                          onClick={() => window.open(invoice.billImage)}
                          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm hover:shadow-blue-200"
                        >
                          <Eye size={14} /> View
                        </button>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-20 text-center text-slate-400 italic bg-white">
                      <div className="flex flex-col items-center gap-3">
                        <Filter size={32} className="opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-tight">No transactions match your filters</p>
                        <button onClick={resetFilters} className="text-[10px] font-black text-blue-500 underline uppercase">Reset Filters</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center px-8">
            <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Showing {filteredData.length} of {rawData.length} Entries
            </span>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Filtered Sum</p>
                  <p className="text-sm font-black text-slate-800">₹{totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Transaction Details</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black uppercase">{selectedInvoice.invoiceId}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedInvoice.date}</span>
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Vendor</p>
                  <p className="text-sm font-bold text-slate-800">{selectedInvoice.vendor?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Ledger Account</p>
                  <p className="text-sm font-bold text-blue-600">{selectedInvoice.ledgerAccount}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
                    <Package size={12}/> Product Breakdown
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {selectedInvoice.items.length} Items
                  </p>
                </div>
                <div className="space-y-3">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-white shadow-sm p-3 rounded-xl text-slate-500 border border-slate-100"><Tag size={16}/></div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{item.productName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                            Tax: <span className={item.isRcm ? 'text-orange-500' : 'text-blue-500'}>{item.isRcm ? 'RCM' : `${item.gstRate}%`}</span> • Mode: {item.calcMode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">₹{parseFloat(item.total).toLocaleString('en-IN')}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Base: ₹{item.basePrice} + GST: ₹{item.gstAmount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-900 flex justify-between items-center text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <Calculator size={20} className="text-blue-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none mb-1">Payable Amount</span>
                  <span className="text-[9px] font-bold text-blue-400 uppercase">Inclusive of all taxes</span>
                </div>
              </div>
              <div className="text-right relative z-10">
                <span className="text-3xl font-black italic tracking-tighter">₹{parseFloat(selectedInvoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;