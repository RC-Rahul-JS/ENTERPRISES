import React, { useMemo, useState, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import useApi from "../../api/useApi";

// --- MOCK DEPENDENCIES START ---
// const saveAs = (blob, filename) => {
//   console.log(`--- File Save Mock: ${filename} ---`);
//   console.log("Blob Type:", blob.type);
//   if (blob.type.includes('csv')) {
//     blob.text().then(text => console.log("Content Snippet:\n", text.substring(0, 500) + '...'));
//   } else {
//     console.log("Content: Binary/Excel Data (logged as object reference)");
//   }
// };

// const XLSX = {
//   utils: {
//     json_to_sheet: (data) => {
//       console.log("XLSX Mock: Converting JSON to sheet for data:", data.length, "rows");
//       return {}; 
//     },
//     book_new: () => {
//       console.log("XLSX Mock: Creating new workbook");
//       return {}; 
//     },
//     book_append_sheet: (wb, ws, title) => {
//       console.log(`XLSX Mock: Appending sheet "${title}"`);
//     },
//     sheet_add_aoa: (ws, data, options) => {
//         console.log("XLSX Mock: Adding AOA data (Headers/Totals)");
//         // In a real implementation, this would modify the sheet object (ws)
//     },
//     sheet_add_json: (ws, data, options) => {
//         console.log("XLSX Mock: Adding JSON data (Rows)");
//         // In a real implementation, this would modify the sheet object (ws)
//     }
//   },
//   write: (wb, options) => {
//     console.log(`XLSX Mock: Writing workbook as ${options.bookType}`);
//     return new ArrayBuffer(8); 
//   }
// };
// --- MOCK DEPENDENCIES END ---

// Define the specific GST Slabs requested by the user
const CORE_SLABS = ['0', '5', '18', '40'];

// Helper to normalize date
const toISODate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// Component enhanced to support multiple GST slabs and a consolidated summary
const InvoiceGSTReport = ({ invoices = [], companyState = "Punjab", pageSize = 10 }) => {
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("invoiceDateISO");
  const [sortDir, setSortDir] = useState("desc");

  // Helper to group item tax details by specific GST slabs (0, 5, 18, 40)
  const groupTaxDetails = (items, isIntraState) => {
    const defaultSlabs = CORE_SLABS.reduce((acc, rate) => {
        acc[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        return acc;
    }, {});
    
    // We use a Map/Object to handle all slabs found
    const details = {}; 
    
    (items || []).forEach(item => {
        const rate = String(item.gstRate || 0); // Convert rate to string key
        const taxableValue = Number(item.quantity) * Number(item.unitPrice);
        const totalTax = taxableValue * (Number(rate) / 100);

        if (!details[rate]) {
            details[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        }

        details[rate].taxable += taxableValue;

        if (isIntraState) {
            const halfTax = totalTax / 2;
            details[rate].cgst += halfTax;
            details[rate].sgst += halfTax;
        } else {
            details[rate].igst += totalTax;
        }
    });

    // Merge the calculated details with the default required slabs
    return { ...defaultSlabs, ...details };
  }

  // CORE LOGIC: Annotate invoices by calculating totals from item details
  const annotateInvoices = useMemo(() => {
    return (invoices || []).map((inv) => {
      const clientState = inv?.clientAddress?.state || "";
      const isIntraState = clientState.trim().toLowerCase() === companyState.trim().toLowerCase();
      
      let totalSubtotal = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      
      // Calculate item tax details and group them
      const taxDetailsBySlab = groupTaxDetails(inv.items, isIntraState);
      
      // Sum the totals from the grouped slabs
      Object.values(taxDetailsBySlab).forEach(data => {
        totalSubtotal += data.taxable;
        totalCGST += data.cgst;
        totalSGST += data.sgst;
        totalIGST += data.igst;
      });
      
      const calculatedTotalAmount = totalSubtotal + totalCGST + totalSGST + totalIGST;

      return {
        ...inv,
        clientState,
        isIntraState,
        subtotalAmount: totalSubtotal,
        cgstAmount: totalCGST,
        sgstAmount: totalSGST,
        igstAmount: totalIGST,
        totalAmount: calculatedTotalAmount,
        invoiceDateISO: toISODate(inv.invoiceDate || inv.createdAt),
        taxDetailsBySlab, 
      };
    });
  }, [invoices, companyState]);

  // Filtering Logic 
  const filtered = useMemo(() => {
    let rows = annotateInvoices;
    // Filtering logic (same as before)
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((r) =>
        [r.invoiceNo, r.id, r._id, r.clientName, r.projectName, (r.clientAddress?.gstin || "")].some((f) =>
          String(f || "").toLowerCase().includes(q)
        )
      );
    }
    if (clientFilter) rows = rows.filter((r) => r.clientName === clientFilter);
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    
    const fromDate = dateFrom ? toISODate(dateFrom) : null;
    const toDate = dateTo ? toISODate(dateTo) : null;

    if (fromDate) rows = rows.filter((r) => r.invoiceDateISO >= fromDate);
    if (toDate) rows = rows.filter((r) => r.invoiceDateISO <= toDate);
    
    // Sorting Logic
    rows = rows.sort((a, b) => {
      const aVal = a[sortKey] ?? a.invoiceDateISO ?? 0;
      const bVal = b[sortKey] ?? b.invoiceDateISO ?? 0;
      
      if (sortKey.includes("Date")) {
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        const comparison = dateA.getTime() - dateB.getTime();
        return sortDir === "asc" ? comparison : -comparison;
      }
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        const comparison = aVal - bVal;
        return sortDir === "asc" ? comparison : -comparison;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortDir === "asc" ? -1 : 1;
      if (strA > strB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [annotateInvoices, query, clientFilter, statusFilter, dateFrom, dateTo, sortKey, sortDir]);

  // Consolidated Summary by GST Slab
  const gstSlabSummary = useMemo(() => {
    const summary = CORE_SLABS.reduce((acc, rate) => {
        acc[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
        return acc;
    }, {});
    
    filtered.forEach(inv => {
        Object.entries(inv.taxDetailsBySlab).forEach(([rate, data]) => {
            if (CORE_SLABS.includes(rate)) { // Only aggregate for the fixed slabs
                summary[rate].taxable += data.taxable;
                summary[rate].cgst += data.cgst;
                summary[rate].sgst += data.sgst;
                summary[rate].igst += data.igst;
                summary[rate].totalTax += data.cgst + data.sgst + data.igst;
            }
        });
    });
    
    // Sort slabs numerically (0, 5, 18, 40)
    return Object.entries(summary).sort(([rateA], [rateB]) => Number(rateA) - Number(rateB));
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const uniqueClients = useMemo(() => [...new Set((invoices || []).map((i) => i.clientName).filter(Boolean))], [invoices]);
  const uniqueStatus = useMemo(() => [...new Set((invoices || []).map((i) => i.status).filter(Boolean))], [invoices]);

  function changeSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }
  
  // Utility for calculating grand totals across the filtered dataset
  const grandTotals = useMemo(() => {
    const totals = filtered.reduce((acc, inv) => {
        acc.subtotalAmount += inv.subtotalAmount;
        acc.cgstAmount += inv.cgstAmount;
        acc.sgstAmount += inv.sgstAmount;
        acc.igstAmount += inv.igstAmount;
        acc.totalAmount += inv.totalAmount;
        return acc;
    }, {
        subtotalAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: 0,
    });

    const slabTotals = filtered.reduce((acc, inv) => {
        CORE_SLABS.forEach(slab => {
            acc[slab] += inv.taxDetailsBySlab[slab]?.taxable || 0;
        });
        return acc;
    }, CORE_SLABS.reduce((acc, rate) => ({...acc, [rate]: 0}), {}));
    
    return { ...totals, slabTotals };

  }, [filtered]);


  // Helper component for Sort Icons
  const SortIcon = ({ keyName }) => {
    if (sortKey !== keyName) return null;
    return sortDir === "asc" ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    );
  };
  
  // Export Logic (updated for the new column structure)
  const slabExportColumns = CORE_SLABS.map(s => `Taxable ${s}%`);

  function exportToExcel() {
    const data = filtered.map((r) => {
        const row = {
            'Invoice No': r.invoiceNo || r.id || r._id || "",
            'Date': r.invoiceDateISO || "",
            'Client': r.clientName || "",
            'GSTIN': r.clientAddress?.gstin || "",
            'State': r.clientState || "",
            'Taxable Value (Total)': Number(r.subtotalAmount || 0).toFixed(2),
        };
        // Add slab columns dynamically
        CORE_SLABS.forEach(s => {
            row[`Taxable ${s}%`] = Number(r.taxDetailsBySlab[s]?.taxable || 0).toFixed(2);
        });
        
        return {
            ...row,
            'CGST': Number(r.cgstAmount || 0).toFixed(2),
            'SGST': Number(r.sgstAmount || 0).toFixed(2),
            'IGST': Number(r.igstAmount || 0).toFixed(2),
            'Total GST': (Number(r.cgstAmount || 0) + Number(r.sgstAmount || 0) + Number(r.igstAmount || 0)).toFixed(2),
            'Invoice Total': Number(r.totalAmount || 0).toFixed(2),
            'Status': r.status || "",
        }
    });

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add Summary Table to the Excel sheet
    const summaryData = gstSlabSummary.map(([rate, data]) => ({
        'GST Slab (%)': `${rate}%`,
        'Taxable Value': data.taxable.toFixed(2),
        'Total CGST': data.cgst.toFixed(2),
        'Total SGST': data.sgst.toFixed(2),
        'Total IGST': data.igst.toFixed(2),
        'Total Tax': data.totalTax.toFixed(2),
    }));

    // Add spacer row
    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 });
    // Add summary title
    XLSX.utils.sheet_add_aoa(ws, [['CONSOLIDATED GST SLAB SUMMARY']], { origin: -1 });
    // Add summary data
    XLSX.utils.sheet_add_json(ws, summaryData, { origin: -1 });


    // Prepare grand total row object
    const grandTotalRow = {
        'Invoice No': 'GRAND TOTALS',
        'Taxable Value (Total)': grandTotals.subtotalAmount.toFixed(2),
    };
    CORE_SLABS.forEach(s => {
        grandTotalRow[`Taxable ${s}%`] = grandTotals.slabTotals[s].toFixed(2);
    });
    
    // Final total columns
    // grandTotalRow['CGST'] = grandTotals.cgstAmount.toFixed(2);
    // grandTotalRow['SGST'] = grandTotals.sgstAmount.toFixed(2);
    // grandTotalRow['IGST'] = grandTotals.igstAmount.toFixed(2);
    // grandTotalRow['Total GST'] = (grandTotals.cgstAmount + grandTotals.sgstAmount + grandTotals.igstAmount).toFixed(2);
    // grandTotalRow['Invoice Total'] = grandTotals.totalAmount.toFixed(2);


    // Add grand totals row
    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [grandTotalRow], { origin: -1, skipHeader: true }); 

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "InvoiceGSTReport");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `Invoice-GST-Slab-Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportToCSV() {
    const headers = [
      "Invoice_No", "Date", "Client", "State", "Taxable_Total",
      ...CORE_SLABS.map(s => `Taxable_${s}%`),
      "CGST", "SGST", "IGST", "Total_GST", "Invoice_Total", "Status"
    ];
    
    const rows = filtered.map((r) => {
        const row = [
            r.invoiceNo || r.id || r._id || "",
            r.invoiceDateISO || "",
            r.clientName || "",
            r.clientState || "",
            Number(r.subtotalAmount || 0).toFixed(2),
        ];
        CORE_SLABS.forEach(s => {
            row.push(Number(r.taxDetailsBySlab[s]?.taxable || 0).toFixed(2));
        });
        return [
            ...row,
            Number(r.cgstAmount || 0).toFixed(2),
            Number(r.sgstAmount || 0).toFixed(2),
            Number(r.igstAmount || 0).toFixed(2),
            (Number(r.cgstAmount || 0) + Number(r.sgstAmount || 0) + Number(r.igstAmount || 0)).toFixed(2),
            Number(r.totalAmount || 0).toFixed(2),
            r.status || "",
        ];
    });
    
    const grandTotalSlabValues = CORE_SLABS.map(s => grandTotals.slabTotals[s].toFixed(2));
    
    const grandTotalRow = [
        "GRAND TOTALS", "", "", "", grandTotals.subtotalAmount.toFixed(2),
        ...grandTotalSlabValues,
        grandTotals.cgstAmount.toFixed(2),
        grandTotals.sgstAmount.toFixed(2),
        grandTotals.igstAmount.toFixed(2),
        (grandTotals.cgstAmount + grandTotals.sgstAmount + grandTotals.igstAmount).toFixed(2),
        grandTotals.totalAmount.toFixed(2),
        ""
    ];

    const summaryHeaders = ["\n", "GST_Slab_Summary", "Taxable_Value", "Total_CGST", "Total_SGST", "Total_IGST", "Total_Tax"];
    const summaryRows = gstSlabSummary.map(([rate, data]) => [
        "", // Spacer
        `${rate}%`,
        data.taxable.toFixed(2),
        data.cgst.toFixed(2),
        data.sgst.toFixed(2),
        data.igst.toFixed(2),
        data.totalTax.toFixed(2)
    ]);

    // Escape commas in text fields
    const csvRows = [
        headers, 
        ...rows, 
        grandTotalRow, 
        summaryHeaders, 
        ...summaryRows
    ].map((row) => 
        row.map(cell => {
            const strCell = String(cell);
            if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
                return `"${strCell.replace(/"/g, '""')}"`;
            }
            return strCell;
        }).join(",")
    ).join("\n");
    
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Invoice-GST-Slab-Report_${new Date().toISOString().slice(0, 10)}.csv`);
  }


  return (
    <div className="p-4 bg-gray-50 min-h-screen font-inter">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b pb-4">
          <h2 className="text-3xl font-bold text-gray-800">GST Report: Invoice-wise Slab Breakdown</h2>
          <div className="text-sm text-gray-500 mt-2 sm:mt-0">
            Company State: <span className="font-medium text-indigo-600">{companyState}</span> | **Active Slabs:** {CORE_SLABS.map(s => `${s}%`).join(', ')}
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="flex justify-end gap-3 mb-6">
             <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg shadow-md hover:bg-indigo-600 transition duration-150"
              title="Export CSV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path fillRule="evenodd" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V5zm-2 2a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H5z" clipRule="evenodd" /></svg>
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white font-medium rounded-lg shadow-md hover:bg-green-600 transition duration-150"
              title="Export Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zM9 9a1 1 0 001 1h1a1 1 0 100-2h-1a1 1 0 00-1 1zM9 7a1 1 0 001 1h1a1 1 0 100-2h-1a1 1 0 00-1 1z" clipRule="evenodd" /></svg>
              <span>Export Excel</span>
            </button>
        </div>


        {/* Consolidated GST Slab Summary */}
        <h3 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2 mt-4">1. Consolidated GST Summary (Taxable Value by Slab)</h3>
        <div className="overflow-x-auto border border-indigo-200 rounded-lg shadow-sm mb-8">
            <table className="min-w-full text-sm">
                <thead className="bg-indigo-50">
                    <tr>
                        <th className="p-3 text-left font-bold text-indigo-700">GST Slab (%)</th>
                        <th className="p-3 text-right font-bold text-indigo-700">Taxable Value</th>
                        <th className="p-3 text-right font-bold text-indigo-700">Total CGST</th>
                        <th className="p-3 text-right font-bold text-indigo-700">Total SGST</th>
                        <th className="p-3 text-right font-bold text-indigo-700">Total IGST</th>
                        <th className="p-3 text-right font-bold text-indigo-700">Total Tax</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {gstSlabSummary.length === 0 && (
                        <tr><td colSpan={6} className="p-4 text-center text-gray-500">No tax transactions found in filtered results.</td></tr>
                    )}
                    {gstSlabSummary.map(([rate, data]) => (
                        <tr key={rate} className="bg-white hover:bg-indigo-50/50">
                            <td className="p-3 font-semibold text-lg text-gray-900">{rate}%</td>
                            <td className="p-3 text-right font-mono">{data.taxable.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono text-green-700">{data.cgst.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono text-green-700">{data.sgst.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono text-red-600">{data.igst.toFixed(2)}</td>
                            <td className="p-3 text-right font-bold font-mono text-indigo-600">{(data.cgst + data.sgst + data.igst).toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="bg-indigo-100 font-bold border-t-2 border-indigo-500">
                        <td className="p-3">OVERALL GRAND TOTALS</td>
                        <td className="p-3 text-right font-mono">{grandTotals.subtotalAmount.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-green-800">{grandTotals.cgstAmount.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-green-800">{grandTotals.sgstAmount.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-red-800">{grandTotals.igstAmount.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-xl font-mono text-indigo-700">{(grandTotals.cgstAmount + grandTotals.sgstAmount + grandTotals.igstAmount).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>


        {/* Filters */}
        <h3 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2 mt-8">2. Filter Invoices</h3>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoice no / client / project / gstin..."
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">All Clients</option>
              {uniqueClients.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">All Status</option>
              {uniqueStatus.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Date From" className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Date To" className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>

        {/* Invoice Detail Table */}
        <h3 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2 mt-8">3. Invoice-wise Taxable Value by GST Slab</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full text-xs divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50">Invoice No</th>
                <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => changeSort("invoiceDateISO")}>
                  Date <SortIcon keyName="invoiceDateISO" />
                </th>
                <th className="p-3 text-left font-semibold text-gray-600">Client</th>
                <th className="p-3 text-right font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => changeSort("subtotalAmount")}>
                  Taxable (Total) <SortIcon keyName="subtotalAmount" />
                </th>
                {/* GST Slab Taxable Value Columns (Dynamically generated based on CORE_SLABS) */}
                {CORE_SLABS.map(s => (
                    <th key={s} className="p-3 text-right font-semibold text-gray-600 bg-gray-100">{s}%</th>
                ))}
                {/* Tax Columns */}
                <th className="p-3 text-right font-semibold text-gray-600">CGST</th>
                <th className="p-3 text-right font-semibold text-gray-600">SGST</th>
                <th className="p-3 text-right font-semibold text-gray-600">IGST</th>
                <th className="p-3 text-right font-semibold text-gray-600">Total GST</th>
                <th className="p-3 text-right font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => changeSort("totalAmount")}>
                  Invoice Total <SortIcon keyName="totalAmount" />
                </th>
                {/* <th className="p-3 text-left font-semibold text-gray-600 sticky right-0 bg-gray-50">Status</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageData.length === 0 && (
                <tr><td colSpan={14} className="p-6 text-center text-gray-500">No invoices found matching current filters.</td></tr>
              )}
              {pageData.map((inv) => (
                <tr key={inv.id || inv._id} className="hover:bg-indigo-50/50">
                    <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white hover:bg-indigo-50/50 z-10">{inv.invoiceNo || inv.id?.substring(0, 8)}</td>
                    <td className="p-3">{new Date(inv.invoiceDateISO).toLocaleDateString('en-GB')}</td>
                    <td className="p-3 max-w-[150px] truncate" title={inv.clientName}>{inv.clientName}</td>
                    
                    {/* Taxable Total */}
                    <td className="p-3 text-right font-bold text-gray-800 font-mono">{Number(inv.subtotalAmount || 0).toFixed(2)}</td>
                    
                    {/* Taxable Value by Slab (Dynamic) */}
                    {CORE_SLABS.map(s => (
                        <td key={s} className="p-3 text-right font-mono bg-gray-100/70">{Number(inv.taxDetailsBySlab[s]?.taxable || 0).toFixed(2)}</td>
                    ))}
                    
                    {/* GST Totals */}
                    <td className="p-3 text-right font-mono text-green-700">{Number(inv.cgstAmount || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-green-700">{Number(inv.sgstAmount || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-red-600">{Number(inv.igstAmount || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-bold font-mono text-indigo-600">{(Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0)).toFixed(2)}</td>
                    
                    {/* Invoice Total */}
                    <td className="p-3 text-right font-bold text-lg text-indigo-700 font-mono">{Number(inv.totalAmount || 0).toFixed(2)}</td>
                    
                    {/* <td className="p-3 sticky right-0 bg-white hover:bg-indigo-50/50 z-10">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {inv.status}
                      </span>
                    </td> */}
                </tr>
              ))}
              {/* Grand Totals Row for Page */}
              {pageData.length > 0 && (
                <tr className="bg-gray-100 font-bold border-t-2 border-indigo-200">
                    <td className="p-3" colSpan={3}>PAGE TOTALS ({pageData.length} Invoices)</td>
                    <td className="p-3 text-right font-bold text-gray-900 font-mono">{pageData.reduce((sum, inv) => sum + inv.subtotalAmount, 0).toFixed(2)}</td>
                    
                    {/* Slab Totals for Page (Dynamic) */}
                    {CORE_SLABS.map(s => (
                        <td key={`page-total-${s}`} className="p-3 text-right font-mono bg-gray-200">{pageData.reduce((sum, inv) => sum + (inv.taxDetailsBySlab[s]?.taxable || 0), 0).toFixed(2)}</td>
                    ))}
                    

                    {/* Tax Totals for Page */}
                    <td className="p-3 text-right font-mono text-green-800">{pageData.reduce((sum, inv) => sum + inv.cgstAmount, 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-green-800">{pageData.reduce((sum, inv) => sum + inv.sgstAmount, 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-red-800">{pageData.reduce((sum, inv) => sum + inv.igstAmount, 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-indigo-700 font-mono">{(pageData.reduce((sum, inv) => sum + inv.cgstAmount, 0) + pageData.reduce((sum, inv) => sum + inv.sgstAmount, 0) + pageData.reduce((sum, inv) => sum + inv.igstAmount, 0)).toFixed(2)}</td>

                    {/* Invoice Total for Page */}
                    <td className="p-3 text-right font-bold text-xl text-indigo-700 font-mono">{pageData.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}</td>
                    <td className="p-3" colSpan={1}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6">
          <div className="text-sm text-gray-600 mb-3 sm:mb-0">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length} results
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setPage((p) => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            >
                Previous
            </button>
            <span className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold">
                {page} / {totalPages}
            </span>
            <button 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            >
                Next
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

// Mock Data Generation for Demonstration (Updated for requested slabs)
const generateMockInvoices = (companyState) => {
    const states = ["Punjab", "Haryana", "Delhi", "Maharashtra", "Tamil Nadu"];
    const statuses = ["paid", "unpaid", "pending"];
    const clients = ["Alpha Corp", "Beta Solutions", "Gamma Tech", "Delta Systems"];
    // Using only the slabs requested: 0, 5, 18, 40
    const gstSlabs = [0, 5, 18, 40]; 

    const invoices = [];
    for (let i = 1; i <= 50; i++) {
        const dateOffset = Math.floor(Math.random() * 365);
        const invoiceDate = new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const clientName = clients[Math.floor(Math.random() * clients.length)];
        // Ensure both Intra-state (same state) and Inter-state (different state) transactions exist
        const isIntra = Math.random() < 0.5;
        const clientState = isIntra ? companyState : states.filter(s => s !== companyState)[Math.floor(Math.random() * (states.length - 1))];
        
        // Generate items with mixed GST slabs
        const items = [];
        const numItems = Math.floor(Math.random() * 4) + 1; // 1 to 4 items
        for (let j = 0; j < numItems; j++) {
            items.push({
                name: `Service/Product ${j + 1}`,
                quantity: Math.floor(Math.random() * 5) + 1,
                unitPrice: Math.floor(Math.random() * 500) + 100,
                // Pick slabs randomly from the requested list
                gstRate: gstSlabs[Math.floor(Math.random() * gstSlabs.length)], 
            });
        }
        
        invoices.push({
            id: `INV-${1000 + i}`,
            invoiceNo: `INV-${1000 + i}`,
            invoiceDate: invoiceDate,
            createdAt: new Date(invoiceDate).toISOString(),
            clientName: clientName,
            clientAddress: { state: clientState, gstin: `GSTIN${Math.floor(Math.random() * 90000 + 10000)}` },
            status: status,
            projectName: `Project ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            items: items, 
        });
    }
    return invoices;
};


const DEMO_COMPANY_STATE = "Punjab";
const MOCK_INVOICES = generateMockInvoices(DEMO_COMPANY_STATE);
const GST_SLAB = 18;                   // fixed slab        // 9%

const prepareInvoices = (res2) => {
  return res2.map((inv, index) => {
    // Map items with GST slab
    const items = inv.items.map(item => {
      return {
        name: item.description,
        quantity: item.hours,
        unitPrice: item.rate,
        gstRate: item.gstslab||GST_SLAB
      };
    });


    return {
      id: inv._id,
      invoiceNo: inv.id,
      invoiceDate: inv.invoiceDate,
      createdAt: inv.createdAt,
      clientName: inv.clientName,
      clientAddress: inv.clientAddress,
      status: inv.status,
      projectName: inv.projectName,
      items,
    };
  });
};


// Main App component to run the demo
export default function App() {
  const {getData}=useApi()
  // Mock dependencies loading for a real environment
  useEffect(() => {
    // In a real environment, you would ensure the XLSX library is loaded here if it's external
    console.log("XLSX mock is active for export functionality.");
  }, []);
   const [Invoices, setInvoices] = useState([])
    const fetchdata1 = async () => {
        try {
          const res2 = await getData("/trade/billing");
          console.log(res2)
          if (Array.isArray(res2)) {
            const finalInvoices=prepareInvoices(res2)
            setInvoices(finalInvoices);
          } 
        } catch (error) {
          console.error("Failed to load appointments:", error);
        }
      };
      useEffect(() => {
        fetchdata1()
      }, [])
      
// fetchdata1()

  return (
    <div className="bg-gray-100 min-h-screen">
      <InvoiceGSTReport 
        invoices={Invoices} 
        companyState={DEMO_COMPANY_STATE} 
        pageSize={10} 
      />
    </div>
  );
}