// src/pages/Reports/TrialBalance.jsx
import moment from 'moment';
import React from 'react';
import Swal from 'sweetalert2';

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
const LedgerTable = ({ title, data }) => {
    // const totals = calculateTotals(data);

    // Tailwind Classes for Table
    const thClasses = "px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50";
    const thRightClasses = "px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50 font-mono";
    const tdClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-700 bg-white border-b border-gray-100";
    const tdRightClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono bg-white border-b border-gray-100";
    const tdCrClasses = "px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-green-700 bg-green-50 border-b border-gray-100";
    const tdDrClasses = "px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-red-700 bg-red-50 border-b border-gray-100";
    const tdBalanceClasses = "px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-gray-900 bg-white border-b border-gray-100";
    const tfootClasses = "bg-gray-100 font-bold text-base border-t-2 border-gray-300";

    return (
        <div className="rounded-xl mb-8 overflow-hidden bg-white shadow-lg border border-gray-200">
            <h2 className="bg-blue-800 text-white p-5 text-xl font-bold m-0">{title}</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className={thClasses}>Name</th>
                            <th className={thRightClasses}>Opening Balance</th>
                            <th className={thRightClasses}>Debit (Dr)</th>
                            <th className={thRightClasses}>Credit (Cr)</th>
                            <th className={thRightClasses}>Closing Balance</th> {/* Updated column header */}
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0 ? data.map((item) => (
                            <tr key={item.ledger_id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className={tdClasses}>{item.ledger_name}</td>
                                <td className={tdRightClasses}>{formatCurrency(item.opening_balance)}</td>
                                <td className={tdDrClasses}>{formatCurrency(item.period_debit)}</td>
                                <td className={tdCrClasses}>{formatCurrency(item.period_credit)}</td>
                                <td className={tdBalanceClasses}>{formatCurrency(item.closing_balance)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-base text-gray-500 italic">
                                    No ledger data found for {title}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {/* <tfoot>
                        <tr className={tfootClasses}>
                            <td colSpan={1} className="px-6 py-4 text-gray-900">Total</td>
                            <td className="px-6 py-4 text-right font-mono text-gray-700">{formatCurrency(totals.opBalance)}</td>
                            <td className="px-6 py-4 text-right font-mono text-green-700">{formatCurrency(totals.cr)}</td>
                            <td className="px-6 py-4 text-right font-mono text-red-700">{formatCurrency(totals.dr)}</td>
                            <td className="px-6 py-4 text-right font-mono text-gray-900">{formatCurrency(totals.balance)}</td>
                        </tr>
                    </tfoot> */}
                </table>
            </div>
        </div>
    );
};

/**
 * Main App Component
 * This is the default export.
 */
export default function TrialBalance() {
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
        const url = `${API_BASE_URL}/v1/financial-report?company=${company}&from=${startDate}&to=${moment(endDate).add(1, 'days').format('YYYY-MM-DD')}`;
        
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
            <div className="flex justify-start items-end mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
                
                {/* From Date Input */}
                <div className="flex flex-col mr-3">
                    <label className="text-sm font-medium text-gray-600 mb-1" htmlFor="startDate">From Date</label>
                    <input 
                        type="date" 
                        id="startDate"
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-40"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        aria-label="Start Date"
                    />
                </div>
                
                {/* To Date Input */}
                <div className="flex flex-col mr-4">
                    <label className="text-sm font-medium text-gray-600 mb-1" htmlFor="endDate">To Date</label>
                    <input 
                        type="date" 
                        id="endDate"
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-40"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        aria-label="End Date"
                    />
                </div>

                {/* To Company Input */}
                <div className="flex flex-col mr-4">
                    <label className="text-sm font-medium text-gray-600 mb-1" htmlFor="company">Company</label>
                    <select
                        id="company"
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-40"
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
                    className="ml-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-150 h-10" 
                    onClick={handleClearClick}
                >
                    Clear
                </button>
            </div>
            
            {/* Conditional Content */}
            {loading ? (
                <div className="text-center p-8 text-lg font-medium text-blue-600">
                    Loading ledger data... Please wait.
                </div>
            ) : data ? (
                <>
                    {/* Render Tables for each API group */}
                    <LedgerTable title="Assets" data={assetsData} />
                    <LedgerTable title="Liabilities" data={liabilitiesData} />
                    <LedgerTable title="Income" data={incomeData} />
                    <LedgerTable title="Expenditure" data={expenditureData} />

                    {/* Grand Total Card */}
                    <div className="rounded-xl mt-8 overflow-hidden bg-white shadow-xl border-2 border-blue-100">
                        <table className="min-w-full">
                            <tfoot>
                                <tr className="bg-blue-50 font-extrabold text-xl border-t-2 border-blue-200">
                                    <td colSpan={1} className="px-6 py-5 text-gray-900">GRAND TOTAL</td>
                                    <td className="px-6 py-5 text-right font-mono text-gray-800">{formatCurrency(grandTotals.opBalance)}</td>
                                    <td className="px-6 py-5 text-right font-mono text-red-800">{formatCurrency(grandTotals.dr)}</td>
                                    <td className="px-6 py-5 text-right font-mono text-green-800">{formatCurrency(grandTotals.cr)}</td>
                                    <td className="px-6 py-5 text-right font-mono text-gray-900">{formatCurrency(grandTotals.balance)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            ) : (
                <div className="text-center p-8 text-lg text-gray-500 bg-white rounded-xl shadow-md">
                    Please select a date range and click **Search** to view the Trial Balance.
                </div>
            )}
        </div>
    );
}