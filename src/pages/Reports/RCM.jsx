import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  ArrowUpDown, 
  FileText,
  Calculator,
  Calendar,
  MapPin,
  X,
  ChevronRight
} from 'lucide-react';
import useApi from '../../api/useApi';

const App = () => {
  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [rawResponse, setrawResponse] = useState({ data: [], count: 0 }); // Initialized with empty array

  const { getData } = useApi();

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await getData('/trade/api/get-vouchers');
        if (res?.data) {
            console.log(res.data)
          setrawResponse(res);
        }
      } catch (error) {
        console.error("Failed to fetch vouchers:", error);
      }
    };
    fetchVouchers();  
  }, []);

  
  // FIXED: Added rawResponse to dependencies and added null-safe checks
  const flattenedData = useMemo(() => {
    if (!rawResponse?.data || !Array.isArray(rawResponse.data)) return [];

    return rawResponse.data.map(item => {
      const d = item.data || {};
      const isPunjab = d.POS?.toLowerCase() === 'punjab';
      const totalAmount = parseFloat(d.total_gst || 0);
      
      const cgst = isPunjab ? totalAmount / 2 : 0;
      const sgst = isPunjab ? totalAmount / 2 : 0;
      const igst = !isPunjab ? totalAmount : 0;
      
      return {
        id: d.invoiceId ? `${d.invoiceId}-${Math.random()}` : Math.random(), 
        date: d.date || new Date().toISOString(),
        billNumber: d.invoiceId || 'N/A',
        vendor: d.vendor?.name || 'Unknown Vendor',
        pos: d.POS || 'N/A',
        cgst: cgst,
        sgst: sgst,
        igst: igst,
        totalGst: totalAmount,
        isPunjab: isPunjab
      };
    });
  }, [rawResponse]); // Important: dependency added here

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let filtered = flattenedData.filter(item => {
      const matchesSearch = 
        item.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pos.toLowerCase().includes(searchTerm.toLowerCase());

      const itemDate = new Date(item.date).getTime();
      const start = fromDate ? new Date(fromDate).getTime() : -Infinity;
      const end = toDate ? new Date(toDate).getTime() : Infinity;
      const matchesDate = itemDate >= start && itemDate <= end;

      return matchesSearch && matchesDate;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [flattenedData, searchTerm, fromDate, toDate, sortConfig]);

  const stats = useMemo(() => {
    return processedData.reduce((acc, curr) => ({
      cgst: acc.cgst + curr.cgst,
      sgst: acc.sgst + curr.sgst,
      igst: acc.igst + curr.igst,
      total: acc.total + curr.totalGst
    }), { cgst: 0, sgst: 0, igst: 0, total: 0 });
  }, [processedData]);

  const clearFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  const exportToCSV = () => {
    if (processedData.length === 0) return;
    const headers = ["Date", "Bill Number", "Vendor", "POS", "RCM CGST", "RCM SGST", "RCM IGST", "RCM Total GST"];
    const csvRows = processedData.map(item => [
      new Date(item.date).toLocaleDateString('en-IN'),
      `#${item.billNumber}`,
      `"${item.vendor.replace(/"/g, '""')}"`,
      item.pos,
      item.cgst.toFixed(3),
      item.sgst.toFixed(3),
      item.igst.toFixed(3),
      item.totalGst.toFixed(3)
    ].join(','));

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RCM_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TableHeader = ({ label, sortKey, align = "left" }) => (
    <th 
      className={`px-6 py-4 text-${align} text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100`}
      onClick={() => handleSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <ArrowUpDown size={14} className={sortConfig.key === sortKey ? 'text-blue-600' : 'text-slate-300'} />
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calculator className="text-white" size={24} />
              </div>
              RCM Summary (Derived)
            </h1>
            <p className="text-slate-500 text-sm mt-1">Calculated from total GST based on Place of Supply</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToCSV}
              disabled={processedData.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'RCM Total CGST', value: stats.cgst, color: 'text-slate-900' },
            { label: 'RCM Total SGST', value: stats.sgst, color: 'text-slate-900' },
            { label: 'RCM Total IGST', value: stats.igst, color: 'text-slate-900' },
            { label: 'RCM Net Liability', value: stats.total, color: 'text-white', bg: 'bg-blue-600 shadow-blue-200' }
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg || 'bg-white'} p-5 rounded-2xl border ${stat.bg ? 'border-transparent' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.1em] mb-2 ${stat.bg ? 'text-blue-100' : 'text-slate-400'}`}>
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                ₹{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* Filters Bar */}
          <div className="p-5 border-b border-slate-100 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search by Bill, Vendor or POS..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-3">From</span>
                  <input type="date" className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-3">To</span>
                  <input type="date" className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                {(searchTerm || fromDate || toDate) && (
                  <button onClick={clearFilters} className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors uppercase">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  <TableHeader label="Date" sortKey="date" />
                  <TableHeader label="Bill ID" sortKey="billNumber" />
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Vendor Detail</th>
                  <TableHeader label="RCM CGST" sortKey="cgst" align="right" />
                  <TableHeader label="RCM SGST" sortKey="sgst" align="right" />
                  <TableHeader label="RCM IGST" sortKey="igst" align="right" />
                  <TableHeader label="RCM Total GST" sortKey="totalGst" align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedData.length > 0 ? (
                  processedData.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">
                        #{item.billNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold group-hover:text-blue-700 transition-colors">{item.vendor}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-tighter">
                            <MapPin size={10} className="text-slate-300" /> {item.pos}
                          </span>
                        </div>
                      </td>
                      
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-mono text-[13px] ${item.isPunjab ? 'text-slate-700' : 'text-slate-300'}`}>
                        {item.cgst > 0 ? `₹${item.cgst.toFixed(3)}` : '—'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-mono text-[13px] ${item.isPunjab ? 'text-slate-700' : 'text-slate-300'}`}>
                        {item.sgst > 0 ? `₹${item.sgst.toFixed(3)}` : '—'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-mono text-[13px] ${!item.isPunjab ? 'text-blue-600 font-semibold' : 'text-slate-300'}`}>
                        {item.igst > 0 ? `₹${item.igst.toFixed(3)}` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded-full font-bold font-mono text-[13px] transition-all">
                            ₹{item.totalGst.toFixed(3)}
                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                         </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-slate-400">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Punjab (Intra: 50/50 Split)</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Other (Inter: 100% IGST)</span>
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               Count: {processedData.length}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;