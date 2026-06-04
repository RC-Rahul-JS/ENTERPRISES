import moment from 'moment';
import React, { useRef, useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useReactToPrint } from "react-to-print";

const API_BASE_URL = import.meta.env.VITE_API_URL; // Empty as per instructions, environment provides it

// --- Helper Functions ---

/**
 * Groups flat ledger data into { [group]: { [subgroup]: [ledgers] } }
 */
const organizeByHierarchy = (items) => {
    if (!items) return {};
    return items.reduce((acc, item) => {
        const group = item.group_name || 'Uncategorized';
        const subgroup = item.subgroupname || '-';
        
        if (!acc[group]) acc[group] = {};
        if (!acc[group][subgroup]) acc[group][subgroup] = [];
        
        acc[group][subgroup].push(item);
        return acc;
    }, {});
};

const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
    return Math.abs(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// --- Sub-Components ---

const TradingAccountView = ({ incomeData, expenditureData, netProfitLoss, totals }) => {
    const isProfit = netProfitLoss >= 0;
    const grandTotal = Math.max(totals.income, totals.expenditure);
    const balancingFigure = Math.abs(netProfitLoss);

    const cellClass = "p-2 border-r border-gray-300 text-xs";
    const headerClass = "bg-slate-700 text-white font-bold text-center text-xs p-2 border-r border-gray-300";
    
    const maxItems = Math.max(incomeData.length, expenditureData.length);
    const rows = Array.from({ length: maxItems });

    return (
        <div className="rounded-lg overflow-hidden bg-white shadow border border-gray-200 mb-6">
            <h2 className="bg-slate-800 text-white p-3 text-lg font-bold text-center">Trading Account</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th colSpan={2} className={headerClass}>DEBIT (Particulars)</th>
                            <th colSpan={2} className={headerClass}>CREDIT (Particulars)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((_, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className={cellClass}>{expenditureData[index]?.ledger_name || ''}</td>
                                <td className={`${cellClass} text-right font-mono`}>
                                    {expenditureData[index] ? formatCurrency(expenditureData[index].closing_balance) : ''}
                                </td>
                                <td className={cellClass}>{incomeData[index]?.ledger_name || ''}</td>
                                <td className={`${cellClass} text-right font-mono`}>
                                    {incomeData[index] ? formatCurrency(incomeData[index].closing_balance) : ''}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td className={`${cellClass} font-bold`}>{isProfit ? 'Gross Profit c/o' : ''}</td>
                            <td className={`${cellClass} text-right font-mono font-bold`}>{isProfit ? formatCurrency(balancingFigure) : ''}</td>
                            <td className={`${cellClass} font-bold`}>{!isProfit ? 'Gross Loss c/o' : ''}</td>
                            <td className={`${cellClass} text-right font-mono font-bold`}>{!isProfit ? formatCurrency(balancingFigure) : ''}</td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                        <tr>
                            <td className={cellClass}>Total</td>
                            <td className={`${cellClass} text-right font-mono`}>{formatCurrency(grandTotal)}</td>
                            <td className={cellClass}>Total</td>
                            <td className={`${cellClass} text-right font-mono`}>{formatCurrency(grandTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

const PnlTAccountView = ({ incomeData, expenditureData, netProfitLoss, totals }) => {
    const isProfit = netProfitLoss >= 0;
    const grandTotal = Math.max(totals.income, totals.expenditure);
    const balancingFigure = Math.abs(netProfitLoss);

    const cellClass = "p-2 border-r border-gray-300 text-xs";
    const headerClass = "bg-green-700 text-white font-bold text-center text-xs p-2 border-r border-gray-300";

    const maxItems = Math.max(incomeData.length, expenditureData.length);
    const rows = Array.from({ length: maxItems });

    return (
        <div className="rounded-lg overflow-hidden bg-white shadow border border-gray-200 mb-6">
            <h2 className="bg-green-800 text-white p-3 text-lg font-bold text-center">Profit & Loss Statement</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th colSpan={2} className={headerClass}>EXPENDITURE (DR)</th>
                            <th colSpan={2} className={headerClass}>INCOME (CR)</th>
                        </tr>
                    </thead>
                         
                    <tbody>
                        {rows.map((_, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className={cellClass}>{expenditureData[index]?.ledger_name || ''}</td>
                                <td className={`${cellClass} text-right font-mono text-red-600`}>
                                    {expenditureData[index] ? formatCurrency(expenditureData[index].closing_balance) : ''}
                                </td>
                                <td className={cellClass}>{incomeData[incomeData.length - 1 - index]?.ledger_name || ''}</td>
                                <td className={`${cellClass} text-right font-mono text-green-600`}>
                                    {incomeData[incomeData.length - 1 - index] ? formatCurrency(incomeData[incomeData.length - 1 - index].closing_balance) : ''}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td className={`${cellClass} font-bold text-green-700`}>{isProfit ? 'Net Profit transferred to Capital' : ''}</td>
                            <td className={`${cellClass} text-right font-mono font-bold text-green-700`}>{isProfit ? formatCurrency(balancingFigure) : ''}</td>
                            <td className={`${cellClass} font-bold text-red-700`}>{!isProfit ? 'Net Loss transferred to Capital' : ''}</td>
                            <td className={`${cellClass} text-right font-mono font-bold text-red-700`}>{!isProfit ? formatCurrency(balancingFigure) : ''}</td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                        <tr>
                            <td className={cellClass}>Total</td>
                            <td className={`${cellClass} text-right font-mono`}>{formatCurrency(grandTotal)}</td>
                            <td className={cellClass}>Total</td>
                            <td className={`${cellClass} text-right font-mono`}>{formatCurrency(grandTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

const BalanceSheetSection = ({ title, data, netProfitLoss, isLiabilitySide }) => {
    const hierarchy = organizeByHierarchy(data);
    
    // Inject Profit/Loss into Capital Account or appropriate group if liability side
    if (isLiabilitySide && netProfitLoss !== 0) {
        const pnlItem = {
            ledger_name: netProfitLoss > 0 ? "Add: Net Profit for the year" : "Less: Net Loss for the year",
            closing_balance: netProfitLoss,
            isPnl: true
        };
        
        // Try to find "Liabilities Current" or just put it in the first group found
        const targetGroup = Object.keys(hierarchy).find(g => g.toLowerCase().includes('capital')) || Object.keys(hierarchy)[0] || 'Capital & Surplus';
        if (!hierarchy[targetGroup]) hierarchy[targetGroup] = {};
        if (!hierarchy[targetGroup]['-']) hierarchy[targetGroup]['-'] = [];
        hierarchy[targetGroup]['Unsecured Loan'].push(pnlItem);
    }

    return (
        <div className="flex-1">
            <div className="bg-gray-50 border-b border-gray-300 p-2 font-bold text-center text-sm uppercase tracking-wider">
                {title}
            </div>
            {Object.entries(hierarchy).map(([group, subgroups]) => {
                const groupTotal = Object.values(subgroups).flat().reduce((sum, item) => sum + (item.closing_balance || 0), 0);
                
                return (
                    <div key={group} className="border-b border-gray-200">
                        <div className="bg-gray-100 px-3 py-1.5 flex justify-between items-center text-xs font-extrabold text-blue-900 border-b border-gray-200">
                            <span>{group}</span>
                            <span>{formatCurrency(groupTotal)}</span>
                        </div>
                        {Object.entries(subgroups).map(([subgroup, ledgers]) => {
                            const subTotal = ledgers.reduce((sum, item) => sum + (item.closing_balance || 0), 0);
                            
                            return (
                                <div key={subgroup} className="pl-2">
                                    {subgroup !== '-' && (
                                        <div className="bg-white px-3 py-1 flex justify-between items-center text-[11px] font-bold text-gray-600 italic border-b border-gray-100">
                                            <span>{subgroup}</span>
                                            <span className="text-gray-400">{formatCurrency(subTotal)}</span>
                                        </div>
                                    )}
                                    {ledgers.map((ledger, idx) => (
                                        <div key={idx} className={`px-4 py-1.5 flex justify-between text-xs border-b border-gray-50 last:border-0 ${ledger.isPnl ? 'bg-blue-50 text-blue-800 font-semibold' : ''}`}>
                                            <span className={ledger.isPnl ? 'pl-2' : ''}>{ledger.ledger_name}</span>
                                            <span className="font-mono">{formatCurrency(ledger.closing_balance)}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

const BalanceSheetTAccountView = ({ assetsData, liabilitiesData, netProfitLoss, totals }) => {
    const finalAssetsTotal = totals.assets;
    const finalLiabilitiesTotal = totals.liabilities + netProfitLoss;
    const diff = Math.abs(finalAssetsTotal - finalLiabilitiesTotal);

    return (
        <div className="rounded-lg overflow-hidden bg-white shadow border border-gray-200">
            <h2 className="bg-blue-900 text-white p-3 text-lg font-bold text-center uppercase tracking-widest">Balance Sheet</h2>
            
            <div className="flex divide-x divide-gray-300 min-h-[400px]">
                {/* Liabilities Side */}
                <BalanceSheetSection 
                    title="Liabilities & Capital" 
                    data={liabilitiesData} 
                    netProfitLoss={netProfitLoss} 
                    isLiabilitySide={true}
                />
                
                {/* Assets Side */}
                <BalanceSheetSection 
                    title="Assets" 
                    data={assetsData} 
                    netProfitLoss={0} 
                    isLiabilitySide={false}
                />
            </div>

            <div className="flex divide-x divide-gray-300 border-t-2 border-gray-500 bg-gray-100 font-extrabold text-sm">
                <div className="flex-1 p-3 flex justify-between items-center">
                    <span>TOTAL LIABILITIES</span>
                    <span className="font-mono text-lg">{formatCurrency(finalLiabilitiesTotal)}</span>
                </div>
                <div className="flex-1 p-3 flex justify-between items-center">
                    <span>TOTAL ASSETS</span>
                    <span className="font-mono text-lg">{formatCurrency(finalAssetsTotal)}</span>
                </div>
            </div>

            {diff > 1 && (
                <div className="bg-red-600 text-white p-2 text-center text-xs font-bold animate-pulse">
                    DIFFERENCE IN BALANCE SHEET: {formatCurrency(diff)}
                </div>
            )}
        </div>
    );
};

// --- Main Application ---

export default function FinancialStatementsView() {
    const printRef = useRef(null);
    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState('duniya');

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Financial_Statement_${company}_${startDate}_to_${endDate}`,
    });

    const stats = useMemo(() => {
        if (!data) return null;

        const sum = (arr) => arr?.reduce((acc, item) => acc + (item.closing_balance || 0), 0) || 0;

        const tradingDr = sum(data.TradingDR);
        const tradingCr = sum(data.TradingCR);
        const grossProfit = tradingCr - tradingDr;

        const income = sum(data.Income);
        const expense = sum(data.Expenditure);
        // Net profit is Gross Profit + Other Income - Other Expenses
        // Note: Your P&L component handles calculation based on its specific array props
        const netProfit = income - expense;

        const assets = sum(data.Assets);
        const liabilities = sum(data.Liabilities);

        return { tradingDr, tradingCr, grossProfit, income, expense, netProfit, assets, liabilities };
    }, [data]);

    const handleFilterClick = async (e) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            Swal.fire('Error', 'Please select a valid date range', 'error');
            return;
        }

        setLoading(true);
        // Simulate API or use provided logic
        const url = `${API_BASE_URL}/v1/financial-report-trading?company=${company}&from=${startDate}&to=${moment(endDate).add(1, 'days').format('YYYY-MM-DD')}`;
        
        try {
            // Placeholder: Since I don't have a real backend, I'll log and wait. 
            // In a real environment, this fetch would execute.
            const response = await fetch(url);
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to fetch data. Ensure API is running.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* Header Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-wrap items-end gap-4 no-print">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase">From</label>
                        <input 
                            type="date" 
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase">To</label>
                        <input 
                            type="date" 
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Entity</label>
                        <select 
                            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                            value={company}
                            onChange={e => setCompany(e.target.value)}
                        >
                            <option value="duniya">Duniya Enterprises</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleFilterClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Generate Reports'}
                        </button>
                        <button 
                            onClick={handlePrint}
                            disabled={!data}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div ref={printRef} className="print:p-4 bg-white p-1">
                    {data && (
                        <div className="text-center mb-8 border-b-2 border-gray-100 pb-6">
                            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">{company} Enterprises</h1>
                            <p className="text-gray-500 font-medium">Financial Statements for Period: {moment(startDate).format('DD MMM YYYY')} — {moment(endDate).format('DD MMM YYYY')}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium">Compiling Ledger Data...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-10">
                            <TradingAccountView 
                                incomeData={data.TradingCR} 
                                expenditureData={data.TradingDR} 
                                netProfitLoss={stats.grossProfit}
                                totals={{ income: stats.tradingCr, expenditure: stats.tradingDr }}
                            />

                            <PnlTAccountView 
                                incomeData={data.Income} 
                                expenditureData={data.Expenditure} 
                                netProfitLoss={stats.netProfit}
                                totals={{ income: stats.income, expenditure: stats.expense }}
                            />

                            <BalanceSheetTAccountView 
                                assetsData={data.Assets} 
                                liabilitiesData={data.Liabilities} 
                                netProfitLoss={stats.netProfit}
                                totals={{ assets: stats.assets, liabilities: stats.liabilities }}
                            />
                        </div>
                    ) : (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-12 text-center">
                            <div className="text-blue-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-blue-900 mb-2">No Statement Generated</h3>
                            <p className="text-blue-700/60 max-w-md mx-auto">Select your reporting dates and click the "Generate Reports" button to view your automated financial statements.</p>
                        </div>
                    )}
                </div>

                {data && (
                    <footer className="mt-12 text-center text-gray-400 text-xs no-print">
                        Computer generated report • {moment().format('LLL')}
                    </footer>
                )}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; margin: 0; padding: 0; }
                    .rounded-lg { border-radius: 0 !important; box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}