import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import useApi from '../../api/useApi';
import { ChevronDown, Printer, FileText } from 'lucide-react';
import InvoiceView from './InvoiceView';

const ReturnBill = () => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [billDetails, setBillDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState({});
    const { postData } = useApi();

    const handleSearch = async () => {
        if (!invoiceNumber) {
            Swal.fire('Error', 'Please enter an invoice number', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`https://api.care2connect.in/duniya_enterprises/trade/get_bill_by_invoice/${invoiceNumber}`);
            
            const invoiceData = response.data?.invoice || response.data;
            if (invoiceData && (invoiceData.id || invoiceData._id || invoiceData.items)) {
                setBillDetails(invoiceData);
                // Initialize selected items with 0 return quantity
                const initialSelected = {};
                (invoiceData.items || []).forEach(item => {
                    initialSelected[item._id || item.id] = { ...item, returnQty: 0, isSelected: false };
                });
                setSelectedItems(initialSelected);
            } else {
                Swal.fire('Not Found', 'Bill not found for this invoice number', 'info');
                setBillDetails(null);
            }
        } catch (error) {
            console.error('Error fetching bill:', error);
            Swal.fire('Error', 'Failed to fetch bill details', 'error');
            setBillDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const handleItemToggle = (itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                isSelected: !prev[itemId].isSelected,
                returnQty: !prev[itemId].isSelected ? 1 : 0 // default return qty to 1 when selected
            }
        }));
    };

    const handleQtyChange = (itemId, qty) => {
        const value = parseFloat(qty);
        if (value < 0) return;
        
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                returnQty: value
            }
        }));
    };

    const handleCreateReturnBill = async () => {
        const itemsToReturn = Object.values(selectedItems).filter(item => item.isSelected && item.returnQty > 0);
        
        if (itemsToReturn.length === 0) {
            Swal.fire('Error', 'Please select at least one item and specify return quantity', 'warning');
            return;
        }

        // Validate quantities
        let isValid = true;
        itemsToReturn.forEach(item => {
            if (item.returnQty > item.qty) {
                isValid = false;
            }
        });

        if (!isValid) {
            Swal.fire('Error', 'Return quantity cannot exceed billed quantity', 'error');
            return;
        }

        try {
            // Recalculate totals for the return bill
            const subtotal = itemsToReturn.reduce((sum, item) => sum + (parseFloat(item.rate || 0) * parseFloat(item.returnQty || 0)), 0);
            
            const payload = {
                ...billDetails, // Keep client address, gstin, etc.
                id: `RET-${Date.now()}`,
                originalInvoiceId: billDetails.id || billDetails._id,
                invoiceNumber: invoiceNumber,
                clientName: billDetails.clientName,
                items: itemsToReturn, // Used by InvoiceView
                returnDate: new Date().toISOString(),
                invoiceDate: new Date().toISOString(),
                subtotalAmount: subtotal,
                totalAmount: subtotal, // simplified for demo
                gstsummary: {}, // simplified for demo
                status: "returned"
            };
            
            // Assuming there's an endpoint to post return bill. You can update this based on actual API.
            // await postData('/trade/return_bill', payload);
            console.log('Return bill payload:', payload);
            
            Swal.fire('Success', 'Return bill created successfully (Demo)', 'success');
            
            // Add to recent returns list
            setRecentReturnInvoices(prev => [payload, ...prev]);
            
            setBillDetails(null);
            setInvoiceNumber('');
        } catch (error) {
            console.error('Error creating return bill:', error);
            Swal.fire('Error', 'Failed to create return bill', 'error');
        }
    };

    const [viewingInvoice, setViewingInvoice] = useState(null);
    const [recentReturnInvoices, setRecentReturnInvoices] = useState([]); // Could be populated from API

    const handlePrintToPDF = () => {
        if (!viewingInvoice) return;
        const invoiceElement = document.getElementById("invoice-to-print");
        if (!invoiceElement) return;

        const printContent = invoiceElement.outerHTML;
        const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style")).map((item) => item.outerHTML).join("");
        const tailwindScript = `<script src="https://cdn.tailwindcss.com"></script>`;

        const htmlToPrint = `<!DOCTYPE html><html><head><title>Return Invoice ${viewingInvoice.id || viewingInvoice._id}</title><meta name="viewport" content="width=device-width, initial-scale=1.0">${tailwindScript}${styles}<style>body{margin:0;padding:0;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif}@page{margin:0.05in !important}#invoice-to-print{width:100%;max-width:none;margin:0 auto;box-shadow:none;padding:1rem !important}p,li{line-height:1.3}</style></head><body><div class="p-4 sm:p-8">${printContent}</div></body></html>`;

        const printWindow = window.open("", "_blank", "height=600,width=800");
        printWindow.document.write(htmlToPrint);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 100);
        };
        if (printWindow.document.readyState === "complete") {
            printWindow.print();
            setTimeout(() => printWindow.close(), 100);
        }
    };

    if (viewingInvoice) {
        return (
            <div className="p-4 sm:p-8 min-h-screen print-view-wrapper">
                <div className="no-print mb-6 max-w-4xl mx-auto flex justify-between items-center">
                    <button onClick={() => setViewingInvoice(null)} className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium p-2 rounded-lg bg-white shadow-md transition duration-150">
                        <ChevronDown className="h-5 w-5 rotate-90" />
                        <span>Back to Return Bills</span>
                    </button>

                    <button onClick={handlePrintToPDF} className="flex items-center space-x-2 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg shadow-xl hover:bg-indigo-700 transition duration-150">
                        <Printer className="h-5 w-5" />
                        <span>Generate & Print PDF</span>
                    </button>
                </div>

                <InvoiceView invoiceData={viewingInvoice} title="RETURN INVOICE" />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Return Form */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-2xl border border-gray-100 no-print">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                        Create Return Bill
                    </h2>
                    
                    <div className="flex space-x-4 mb-8">
                        <input 
                            type="text" 
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            placeholder="Enter Invoice Number (e.g. 2025-01-05-5)" 
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button 
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {billDetails && (
                        <div>
                            <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                    <h3 className="font-semibold text-lg text-gray-700">Original Invoice Details</h3>
                                </div>
                                <div className="p-4 scale-[0.85] origin-top bg-gray-100">
                                    <InvoiceView invoiceData={billDetails} title="TAX INVOICE" />
                                </div>
                            </div>

                            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm mb-6">
                                <h3 className="font-semibold text-xl text-gray-800 mb-4 border-b pb-2">Select Products to Return</h3>
                                <div className="overflow-x-auto mb-6">
                                    <table className="min-w-full divide-y divide-gray-200 border">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Billed Qty</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {(billDetails.items || []).map((item, index) => {
                                                const id = item._id || item.id;
                                                const isSelected = selectedItems[id]?.isSelected || false;
                                                const returnQty = selectedItems[id]?.returnQty || 0;
                                                return (
                                                    <tr key={id || index} className={isSelected ? "bg-indigo-50" : ""}>
                                                        <td className="px-4 py-3 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSelected}
                                                                onChange={() => handleItemToggle(id)}
                                                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.description}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 text-center">₹{item.rate}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 text-center font-semibold">{item.qty}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                max={item.qty}
                                                                step="0.1"
                                                                value={returnQty}
                                                                onChange={(e) => handleQtyChange(id, e.target.value)}
                                                                disabled={!isSelected}
                                                                className="w-24 p-2 border border-gray-300 rounded-lg text-center disabled:opacity-50 disabled:bg-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-indigo-700"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <button 
                                        onClick={handleCreateReturnBill}
                                        className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition duration-150 flex items-center"
                                    >
                                        <FileText className="w-5 h-5 mr-2" />
                                        Create Return Bill
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Return Invoices List */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-2xl border border-gray-100 no-print">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                        Recent Returns ({recentReturnInvoices.length})
                    </h2>

                    <div className="space-y-3">
                        {recentReturnInvoices.length === 0 ? (
                            <p className="text-gray-500 p-4 border border-dashed rounded-lg text-center">
                                No return invoices saved yet.
                            </p>
                        ) : (
                            recentReturnInvoices.map((invoice) => (
                                <div key={invoice.id || invoice._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition duration-150">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-indigo-700 truncate">{invoice.clientName}</p>
                                        <p className="text-xs text-gray-500 mt-1">Returned: {new Date(invoice.returnDate || invoice.createdAt).toLocaleDateString("en-GB")} | Orig: {invoice.invoiceNumber}</p>
                                    </div>
                                    <button onClick={() => setViewingInvoice(invoice)} className="ml-4 flex-shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition duration-150 shadow-md">View/Print</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReturnBill;
