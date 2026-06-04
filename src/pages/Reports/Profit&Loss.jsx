import moment from 'moment';
import React from 'react';
import Swal from 'sweetalert2';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// --- Helper Functions (Reused) ---

/**
 * Calculates the total closing balance for a group of ledger items.
 */
const calculateTotalBalance = (items) => {
    return items?.reduce((acc, item) => {
        acc.balance += item.closing_balance || 0;
        return acc;
    }, { balance: 0 });
};

/**
 * Formats a number as a currency string.
 */
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// --- Sub-Component: Profit and Loss T-Account View (Reused) ---

const PnlTAccountView = ({ incomeData, expenditureData, netProfitLoss, totals }) => {
    const isProfit = netProfitLoss >= 0;
    const grandTotal = Math.max(totals.income, totals.expenditure);
    const balancingFigure = Math.abs(netProfitLoss);

    // Styling
    const cellClass = "p-3 border-r border-gray-300 text-sm";
    const headerClass = "bg-green-700 text-white font-bold text-center text-lg p-3 border-r border-gray-300";
    const totalRowClass = "bg-gray-100 font-extrabold text-base border-t-4 border-b-4 border-gray-500";
    const totalCellClass = "p-3 font-mono text-right text-gray-900";
    const listRowClass = "hover:bg-gray-50 transition-colors";
    
    const maxItems = Math.max(incomeData.length, expenditureData.length);
    const rows = Array.from({ length: maxItems });

    return (
        <div className="rounded-xl overflow-hidden bg-white shadow-lg border border-gray-200 mb-8">
            <h2 className="bg-green-900 text-white p-4 text-xl font-bold text-center">Profit and Loss Statement</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-x divide-gray-300">
                    <thead>
                        <tr>
                            <th colSpan={2} className={headerClass}>EXPENDITURE (DR)</th>
                            <th colSpan={2} className={headerClass}>INCOME (CR)</th>
                        </tr>
                        <tr className="bg-gray-50 text-xs text-gray-600 uppercase font-semibold">
                            <th className={`${cellClass} w-1/4`}>Particulars</th>
                            <th className={`${cellClass} text-right w-1/4`}>Amount</th>
                            <th className={`${cellClass} w-1/4`}>Particulars</th>
                            <th className={`${cellClass} text-right w-1/4`}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((_, index) => {
                            const expenseItem = expenditureData[index];
                            const incomeItem = incomeData[index];

                            return (
                                <tr key={index} className={listRowClass}>
                                    {/* Expenditure Side */}
                                    <td className={cellClass}>{expenseItem?.ledger_name || ''}</td>
                                    <td className={`${cellClass} text-right font-mono text-red-600`}>
                                        {expenseItem ? formatCurrency(expenseItem.closing_balance) : ''}
                                    </td>
                                    
                                    {/* Income Side */}
                                    <td className={cellClass}>{incomeItem?.ledger_name || ''}</td>
                                    <td className={`${cellClass} text-right font-mono text-green-600`}>
                                        {incomeItem ? formatCurrency(incomeItem.closing_balance) : ''}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Net Profit/Loss Row */}
                        {isProfit && ( // Net Profit on EXPENSE/DEBIT side
                            <tr>
                                <td className={`${cellClass} bg-green-100 font-bold text-green-800`}>Net Profit (to B/S)</td>
                                <td className={`${cellClass} text-right font-mono bg-green-100 font-bold text-green-800`}>
                                    {formatCurrency(balancingFigure)}
                                </td>
                                <td className={cellClass}></td>
                                <td className={`${cellClass} text-right font-mono`}></td>
                            </tr>
                        )}
                        {!isProfit && ( // Net Loss on INCOME/CREDIT side
                            <tr>
                                <td className={cellClass}></td>
                                <td className={`${cellClass} text-right font-mono`}></td>
                                <td className={`${cellClass} bg-red-100 font-bold text-red-800`}>Net Loss (to B/S)</td>
                                <td className={`${cellClass} text-right font-mono bg-red-100 font-bold text-red-800`}>
                                    {formatCurrency(balancingFigure)}
                                </td>
                            </tr>
                        )}
                        
                    </tbody>
                    <tfoot>
                        {/* Grand Total Row */}
                        <tr className={totalRowClass}>
                            <td className="p-3 font-extrabold text-gray-900 border-r border-gray-500">Total</td>
                            <td className={totalCellClass + " border-r border-gray-500"}>
                                {formatCurrency(grandTotal)}
                            </td>
                            <td className="p-3 font-extrabold text-gray-900 border-r border-gray-500">Total</td>
                            <td className={totalCellClass}>
                                {formatCurrency(grandTotal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

// --- Sub-Component: Balance Sheet T-Account View (Modified for P&L Integration) ---

const BalanceSheetTAccountView = ({ assetsData, liabilitiesData, totals, netProfitLoss, grandTotal }) => {
    
    // Styling
    const cellClass = "p-3 border-r border-gray-300 text-sm";
    const headerClass = "bg-blue-800 text-white font-bold text-center text-lg p-3 border-r border-gray-300";
    const totalRowClass = "bg-gray-100 font-extrabold text-base border-t-4 border-b-4 border-gray-500";
    const totalCellClass = "p-3 font-mono text-right text-gray-900 text-lg";
    const listRowClass = "hover:bg-gray-50 transition-colors";
    
    // Combine standard liabilities with the calculated Net P/L for display
    const liabilitiesWithProfitLoss = [
        ...liabilitiesData,
        // Add Net P/L as a separate line item if it's not zero
        ...(netProfitLoss !== 0 ? [{ 
            ledger_name: netProfitLoss > 0 ? 'Net Profit Added' : 'Net Loss Deducted',
            closing_balance: netProfitLoss,
            ledger_id: 'BS_PL_ADJ'
        }] : [])
    ];
    
    const maxItems = Math.max(liabilitiesWithProfitLoss.length, assetsData.length);
    const rows = Array.from({ length: maxItems });

    return (
        <div className="rounded-xl overflow-hidden bg-white shadow-lg border border-gray-200">
            <h2 className="bg-blue-900 text-white p-4 text-xl font-bold text-center">Balance Sheet</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-x divide-gray-300">
                    <thead>
                        <tr>
                            <th colSpan={2} className={headerClass}>LIABILITIES & CAPITAL (CR)</th>
                            <th colSpan={2} className={headerClass}>ASSETS (DR)</th>
                        </tr>
                        <tr className="bg-gray-50 text-xs text-gray-600 uppercase font-semibold">
                            <th className={`${cellClass} w-1/4`}>Particulars</th>
                            <th className={`${cellClass} text-right w-1/4`}>Amount</th>
                            <th className={`${cellClass} w-1/4`}>Particulars</th>
                            <th className={`${cellClass} text-right w-1/4`}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((_, index) => {
                            const liabilityItem = liabilitiesWithProfitLoss[index];
                            const assetItem = assetsData[index];
                            
                            // Determine style for the P/L adjustment line
                            const isPnlAdjust = liabilityItem?.ledger_id === 'BS_PL_ADJ';
                            const pnlAdjustStyle = liabilityItem?.closing_balance > 0 ? 
                                "bg-green-50 text-green-700 font-bold" : 
                                "bg-red-50 text-red-700 font-bold";

                            return (
                                <tr key={index} className={listRowClass}>
                                    {/* Liabilities Side (CR) */}
                                    <td className={cellClass + (isPnlAdjust ? pnlAdjustStyle : '')}>
                                        {liabilityItem?.ledger_name || ''}
                                    </td>
                                    <td className={`${cellClass} text-right font-mono text-blue-600 ${isPnlAdjust ? pnlAdjustStyle : ''}`}>
                                        {liabilityItem ? formatCurrency(Math.abs(liabilityItem.closing_balance)) : ''}
                                    </td>
                                    
                                    {/* Assets Side (DR) */}
                                    <td className={cellClass}>
                                        {assetItem?.ledger_name || ''}
                                    </td>
                                    <td className={`${cellClass} text-right font-mono text-blue-800`}>
                                        {assetItem ? formatCurrency(assetItem.closing_balance) : ''}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        {/* Grand Total Row (Must match on both sides) */}
                        <tr className={totalRowClass}>
                            <td className="p-3 font-extrabold text-gray-900 border-r border-gray-500">TOTAL LIABILITIES</td>
                            <td className={totalCellClass + " border-r border-gray-500"}>
                                {formatCurrency(grandTotal)}
                            </td>
                            <td className="p-3 font-extrabold text-gray-900 border-r border-gray-500">TOTAL ASSETS</td>
                            <td className={totalCellClass}>
                                {formatCurrency(grandTotal)}
                            </td>
                        </tr>
                        
                        {/* Final Balance Check */}
                        {Math.abs(totals.assets - totals.liabilities - netProfitLoss) > 0.01 && (
                            <tr className="bg-red-100 text-red-800 font-bold text-sm">
                                <td colSpan={4} className="p-3 text-center">
                                    *** CRITICAL WARNING: Statements do not balance. Difference: {formatCurrency(Math.abs(totals.assets - totals.liabilities - netProfitLoss))} ***
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

// --- Main Combined Component ---

export default function FinancialStatementsView() {
    const [startDate, setStartDate] = React.useState(moment(new Date()).format('YYYY-MM-DD'));
    const [endDate, setEndDate] = React.useState(moment(new Date()).format('YYYY-MM-DD'));
    const [data, setData] = React.useState(null); 
    const [loading, setLoading] = React.useState(false); 
    const [company, setCompany] = React.useState('duniya');

    // --- Data Processing ---
    const incomeData = data?.Income || [];
    const expenditureData = data?.Expenditure || [];
    const assetsData = data?.Assets || [];
    const liabilitiesData = data?.Liabilities || [];

    // 1. P&L Calculation
    const incomeTotals = calculateTotalBalance(incomeData);
    const expenditureTotals = calculateTotalBalance(expenditureData);
    const netProfitLoss = incomeTotals.balance - expenditureTotals.balance;
    
    // 2. Balance Sheet Calculation
    const assetsTotals = calculateTotalBalance(assetsData);
    const liabilitiesTotals = calculateTotalBalance(liabilitiesData);
    
    // The Balance Sheet Grand Total must be Assets or (Liabilities + Net Profit/Loss)
    const totalLiabilitiesWithPnl = liabilitiesTotals.balance + netProfitLoss;
    const bsGrandTotal = Math.max(assetsTotals.balance, totalLiabilitiesWithPnl);
    
    // --- API Fetch Handler (Unchanged) ---
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
        const url = `${API_BASE_URL}/v1/financial-report?company=${company}&from=${startDate}&to=${moment(endDate).add(1, 'days').format('YYYY-MM-DD')}`;
        
        try {
            const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const result = await response.json();
            setData(result);
    
        } catch (err) {
            console.error('Fetch failed:', err);
            Swal.fire('Connection Failed', 'Could not load financial data. Try later.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const handleClearClick = () => {
        setStartDate('');
        setEndDate('');
        setData(null); 
    };

    // --- Render ---

    return (
        <div className="min-h-screen p-6 bg-gray-100 font-sans text-gray-800">
            
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">Comprehensive Financial Statements 📝</h1>
            <hr className="mb-6 border-gray-300"/>

            {/* Date Filters Row */}
            <div className="flex justify-start items-end mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
                {/* Inputs and Buttons here (omitted for brevity, assume they are present) */}
                <div className="flex flex-col mr-3">
                    <label className="text-sm font-medium text-gray-600 mb-1" htmlFor="startDate">From Date</label>
                    <input type="date" id="startDate" className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Start Date"/>
                </div>
                <div className="flex flex-col mr-4">
                    <label className="text-sm font-medium text-gray-600 mb-1" htmlFor="endDate">To Date</label>
                    <input type="date" id="endDate" className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="End Date"/>
                </div>
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
                        {/* <option value="care">Care2Connect</option>
                        <option value="gold">Gold App</option> */}
                    </select>
                </div>  
                
                <button 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg shadow-sm hover:bg-blue-900 transition-colors duration-150 h-10 disabled:bg-gray-400" 
                    onClick={handleFilterClick}
                    disabled={loading || !startDate || !endDate}
                >
                    {loading ? 'Generating...' : 'Generate Statements'}
                </button>
                <button 
                    className="ml-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-150 h-10" 
                    onClick={handleClearClick}
                >
                    Clear
                </button>
            </div>
            
            {/* Conditional Content */}
            {loading ? (
                <div className="text-center p-8 text-lg font-medium text-blue-600">Loading Financial Data...</div>
            ) : data ? (
                <>
                    <PnlTAccountView 
                        incomeData={incomeData} 
                        expenditureData={expenditureData} 
                        netProfitLoss={netProfitLoss}
                        totals={{ income: incomeTotals.balance, expenditure: expenditureTotals.balance }}
                    />
                    
                    <BalanceSheetTAccountView 
                        assetsData={assetsData} 
                        liabilitiesData={liabilitiesData} 
                        netProfitLoss={netProfitLoss}
                        totals={{ assets: assetsTotals.balance, liabilities: liabilitiesTotals.balance }}
                        grandTotal={bsGrandTotal}
                    />
                </>
            ) : (
                <div className="text-center p-8 text-lg text-gray-500 bg-white rounded-xl shadow-md">
                    Select a date range and click **Generate Statements** to view the combined P&L and Balance Sheet.
                </div>
            )}
        </div>
    );
}
