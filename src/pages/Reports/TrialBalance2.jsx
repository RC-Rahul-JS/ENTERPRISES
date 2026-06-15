// src/pages/Reports/TrialBalance.jsx
import moment from 'moment';
import React, { useRef } from 'react';
import Swal from 'sweetalert2';
import { useReactToPrint } from "react-to-print";



// NOTE: API_BASE_URL is assumed to be defined globally or passed down
const API_BASE_URL = import.meta.env.VITE_API_URL; 

// --- Helper Functions (Unchanged) ---

/**
 * Calculates totals for a given array of ledger items.
 * @param {Array<Object>} items - Array of ledger items.
 * @returns {Object} - An object containing totals for opBalance, cr, dr, and balance.
 */
const calculateTotals = (items) => {
    // Note: The API data uses 'opening_balance', 'period_credit', 'period_debit', 'closing_balance'.
    // We adjust the names in the reduce function to match the data structure.
    return items?.reduce((acc, item) => {
        // Renaming properties to match the component's internal naming convention for calculation
        acc.opBalance += item.opening_balance || 0;
        acc.cr += item.period_credit || 0;
        acc.dr += item.period_debit || 0;
        acc.balance += item.closing_balance || 0;
        return acc;
    }, { opBalance: 0, cr: 0, dr: 0, balance: 0 });
};

/**
 * Formats a number as a currency string.
 * @param {number} amount - The number to format.
 * @returns {string} - Formatted currency string (e.g., 1,234.56).
 */
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// --- Components ---

/**
 * A reusable table component for displaying ledger data.
 * @param {Object} props
 * @param {string} title - The title for the table (e.g., "Income").
 * @param {Array<Object>} data - The array of data to display (using API field names).
 */
const LedgerTable = ({ title, groupedData }) => {
  return (
    <div className="mb-10">

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <div className="h-[2px] flex-1 bg-gray-200 ml-4"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">

        {Object.entries(groupedData || {}).map(([groupName, subgroups]) => (
          <div key={groupName} className="border-b border-gray-200">

            {/* GROUP */}
            <div className="bg-gray-50 px-5 py-3 font-semibold text-gray-700 text-lg">
              {groupName}
            </div>

            {Object.entries(subgroups).map(([subgroupName, items]) => (
              <div key={subgroupName} className="px-4 py-2">

                {/* SUBGROUP */}
                <div className="text-blue-600 font-semibold text-sm mb-2">
                  {subgroupName}
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">

                    {/* HEADER */}
                    <thead className="bg-gray-100 sticky top-0">
                      <tr className="text-gray-600 text-xs uppercase">
                        <th className="px-4 py-2 text-left">Ledger</th>
                        <th className="px-4 py-2 text-right">Opening</th>
                        <th className="px-4 py-2 text-right">Debit</th>
                        <th className="px-4 py-2 text-right">Credit</th>
                        <th className="px-4 py-2 text-right">Closing</th>
                      </tr>
                    </thead>

                    {/* BODY */}
                    <tbody>
                      {items.map((item, i) => (
                        <tr
                          key={item.ledger_id}
                          className={`border-t ${
                            i % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 transition`}
                        >
                          <td className="px-4 py-2 text-gray-800">
                            {item.ledger_name}
                          </td>

                          <td className="px-4 py-2 text-right font-mono text-gray-600">
                            {formatCurrency(item.opening_balance)}
                          </td>

                          <td className="px-4 py-2 text-right font-mono text-red-500">
                            {formatCurrency(item.period_debit)}
                          </td>

                          <td className="px-4 py-2 text-right font-mono text-green-600">
                            {formatCurrency(item.period_credit)}
                          </td>

                          <td className="px-4 py-2 text-right font-mono font-semibold">
                            {formatCurrency(item.closing_balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              </div>
            ))}

          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main App Component
 * This is the default export.
 */
export default function TrialBalance() {
    const printRef = useRef(null);


    
    // Initial state set to empty string for date inputs and null for data
    const [startDate, setStartDate] = React.useState(moment(new Date()).format('YYYY-MM-DD'));
    const [endDate, setEndDate] = React.useState(moment(new Date()).format('YYYY-MM-DD'));
    const [data, setData] = React.useState(null); // *** START AS NULL ***
    const [loading, setLoading] = React.useState(false); 
    const [company, setCompany] = React.useState('duniya');

    
    // We use the data properties (Assets, Income, etc.) directly from the API response (data)
    const incomeData = data?.Income || [];
    const assetsData = data?.Assets || [];
    const liabilitiesData = data?.Liabilities || [];
    const expenditureData = data?.Expenditure || [];

    // Calculate totals for each section
    const incomeTotals = React.useMemo(() => calculateTotals(incomeData), [incomeData]);
    const assetsTotals = React.useMemo(() => calculateTotals(assetsData), [assetsData]);
    const liabilitiesTotals = React.useMemo(() => calculateTotals(liabilitiesData), [liabilitiesData]);
    const expenditureTotals = React.useMemo(() => calculateTotals(expenditureData), [expenditureData]);

     const groupByGroupAndSubgroup = (data) => {
  const result = {};

  data.forEach((item) => {
    const group = item.group_name || "Unknown";
    const subgroup = item.subgroupname || "-";

    if (!result[group]) {
      result[group] = {};
    }

    if (!result[group][subgroup]) {
      result[group][subgroup] = [];
    }

    result[group][subgroup].push(item);
  });

  return result;
};


    const groupedAssets = groupByGroupAndSubgroup(assetsData);
const groupedLiabilities = groupByGroupAndSubgroup(liabilitiesData);
const groupedIncome = groupByGroupAndSubgroup(incomeData);
const groupedExpenditure = groupByGroupAndSubgroup(expenditureData);


const handlePrint = useReactToPrint({
  contentRef: printRef,
  documentTitle: `Trial_Balance_${startDate}_to_${endDate}`,
});


    // Calculate grand totals across all groups
    const grandTotals = React.useMemo(() => {
        return {
            opBalance: incomeTotals.opBalance + assetsTotals.opBalance + liabilitiesTotals.opBalance + expenditureTotals.opBalance,
            cr: incomeTotals.cr + assetsTotals.cr + liabilitiesTotals.cr + expenditureTotals.cr,
            dr: incomeTotals.dr + assetsTotals.dr + liabilitiesTotals.dr + expenditureTotals.dr,
            balance: incomeTotals.balance + assetsTotals.balance + liabilitiesTotals.balance + expenditureTotals.balance,
        };
    }, [incomeTotals, assetsTotals, liabilitiesTotals, expenditureTotals]);
    
    // --- API and Filter Handlers ---

   
    const handleFilterClick = async (e) => {
        e.preventDefault();
        
        if (!startDate || !endDate) {
            Swal.fire('Missing Dates', 'Please select both a start date and an end date.', 'warning');
            return;
        }

        if (moment(startDate).isAfter(moment(endDate))) {
            Swal.fire('Invalid Range', 'Start date cannot be after end date.', 'error');
            return;
        }
        setLoading(true);
        setData(null); 

        // API call using moment to ensure correct date format
        const url = `${API_BASE_URL}/v1/financial-report-trial-balance?company=${company}&from=${startDate}&to=${moment(endDate).add(1, 'days').format('YYYY-MM-DD')}`;
        
        try {
            const response = await fetch(url, {
                headers: { 'Content-Type': 'application/json' },
            });
    
            if (!response.ok) throw new Error(`Error ${response.status}`);
    
            const result = await response.json();
            setData(result);
    
            const hasData = Object.values(result).some(arr => arr.length > 0);
            if (!hasData) {
                Swal.fire('No Data', 'No ledger entries found in the selected period.', 'info');
            }
        } catch (err) {
            console.error('Fetch failed:', err);
            Swal.fire('Connection Failed', 'Could not load ledger data. Try later.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const handleClearClick = () => {
        setStartDate('');
        setEndDate('');
        setActiveStartDate('');
        setActiveEndDate('');
        setData(null); // Clear displayed data on clear
    };

    // --- Render ---

    return (
        <div className="min-h-screen p-6 bg-gray-100 font-sans text-gray-800">
            
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">Trial Balance Report 📊</h1>

            {/* Date Filters Row */}
            <div className="flex flex-wrap justify-start items-end gap-3 mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
                
                {/* From Date Input */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1" htmlFor="startDate">From Date</label>
                    <input 
                        type="date" 
                        id="startDate"
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-40"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        aria-label="Start Date"
                    />
                </div>
                
                {/* To Date Input */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1" htmlFor="endDate">To Date</label>
                    <input 
                        type="date" 
                        id="endDate"
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-40"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        aria-label="End Date"
                    />
                </div>

                {/* To Company Input */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1" htmlFor="company">Company</label>
                    <select
                        id="company"
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-40"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        aria-label="Company"
                    >
                        <option value="duniya">Duniya Enterprises</option>
                        {/* <option value="care">care2connet</option>
                        <option value="gold">Gold App</option> */}
                    </select>
                </div>
                
                {/* Search Button */}
                <button 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg shadow-sm hover:bg-blue-900 transition-colors duration-150 h-10 disabled:bg-gray-400" 
                    onClick={handleFilterClick}
                    disabled={loading || !startDate || !endDate}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>

                {/* Clear Button */}
                <button 
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-150 h-10" 
                    onClick={handleClearClick}
                >
                    Clear
                </button>

                <button
  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
  onClick={handlePrint}
  disabled={!data}
>
  Download PDF
</button>
            </div>
            
            <div ref={printRef}>
            {/* Conditional Content */}
            {loading ? (
                <div className="text-center p-8 text-lg font-medium text-blue-600">
                    Loading ledger data... Please wait.
                </div>
            ) : data ? (
                <div>
                    {/* Render Tables for each API group */}
                    {/* <LedgerTable title="Assets" data={assetsData} />
                    <LedgerTable title="Liabilities" data={liabilitiesData} />
                    <LedgerTable title="Income" data={incomeData} />
                    <LedgerTable title="Expenditure" data={expenditureData} /> */}
                    <LedgerTable title="Assets" groupedData={groupedAssets} />
<LedgerTable title="Liabilities" groupedData={groupedLiabilities} />
<LedgerTable title="Income" groupedData={groupedIncome} />
<LedgerTable title="Expenditure" groupedData={groupedExpenditure} />

                    {/* Grand Total Card */}
                    <div className="rounded-xl mt-8 overflow-hidden bg-white shadow-xl border-2 border-blue-100">
                        <table className="min-w-full">
                            <tfoot>
                                <tr className="bg-blue-50 font-extrabold text-sm border-t-2 border-blue-200">
                                    <td colSpan={1} className="px-6 py-5 text-gray-900">GRAND TOTAL</td>
                                    <td className="px-6 py-5 text-right font-mono text-gray-800">{formatCurrency(grandTotals.opBalance)}</td>
                                    <td className="px-6 py-5 text-right font-mono text-red-800">{formatCurrency(grandTotals.dr)}</td>
                                    <td className="px-6 py-5 text-right font-mono text-green-800">{formatCurrency(grandTotals.cr)}</td>
                                    <td className="px-6 py-5 text-right font-mono text-gray-900">{formatCurrency(grandTotals.balance)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center p-8 text-lg text-gray-500 bg-white rounded-xl shadow-md">
                    Please select a date range and click **Search** to view the Trial Balance.
                </div>
            )}
            </div>
        </div>
    );
}