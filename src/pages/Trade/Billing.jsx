// src/pages/InvoiceApp.jsx
import React, { useState, useEffect, useCallback, useMemo,useRef } from "react";
import {
  ChevronDown,
  FileText,
  Printer,
  Save,
  IndianRupee,
  Clock,
  User,
  Briefcase,
  Calendar,
  MapPin,
  Map,
  Plus,
  X,
  Tag,
  Camera, 
} from "lucide-react";
import useApi from "../../api/useApi";
import Swal from "sweetalert2";
import sign from "../../assets/sign.png";
import moment from "moment";
import CameraScanner from "./CameraScanner";

/**
 * Full fixed App component (hook-order safe).
 * - All hooks are declared at the top.
 * - No early return before hooks.
 * - Keeps autocomplete, items editor, invoice view & print logic.
 */

/* ----------------------------- Constants ----------------------------- */
const LOCAL_STORAGE_KEY = "duniyape_invoices";
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);

const calculateTotals = (items) => {
//   console.log(calculateSlabWiseGST(items,'Punjab',"Punjab"))
  const subtotal = (items || []).reduce(
    (sum, item) => sum + (parseFloat(item.rate || 0) * parseFloat(item.qty || 0)),
    0
  );
  const cgstAmount = subtotal * CGST_RATE;
  const sgstAmount = subtotal * SGST_RATE;
  const totalAmount = subtotal + cgstAmount + sgstAmount;
  return { subtotal, cgstAmount, sgstAmount, totalAmount };
};
const calculateSlabWiseGST = (items, supplierState, clientState) => {
  const slabSummary = {};
  const isInterState = supplierState !== clientState;
  items.forEach(item => {
    const rate = parseFloat(item.rate || 0);
    const qty = parseFloat(item.qty || 0);
    const amount = rate * qty;

    let slab = item.gstslab; // "18", "5", "0"

    // If slab is 0 → treat as EXEMPTED
    const isExempted = parseFloat(slab) === 0;

    if (isExempted) slab = "Exempted";

    const gstRate = parseFloat(item.gstslab);
    const halfRate = gstRate / 2 / 100;

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

    if (!isExempted) {
      if (isInterState) {
        igstAmount = amount * (gstRate / 100);
      } else {
        cgstAmount = amount * halfRate;
        sgstAmount = amount * halfRate;
      }
    }

    if (!slabSummary[slab]) {
      slabSummary[slab] = {
        slab,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalGST: 0,
      };
    }

    slabSummary[slab].taxableValue += amount;
    slabSummary[slab].cgst += cgstAmount;
    slabSummary[slab].sgst += sgstAmount;
    slabSummary[slab].igst += igstAmount;
    slabSummary[slab].totalGST += cgstAmount + sgstAmount + igstAmount;
  });
  const totals = Object.values(slabSummary).reduce(
  (acc, item) => {
    acc.taxableValue += item.taxableValue;
    acc.cgst += item.cgst;
    acc.sgst += item.sgst;
    acc.igst += item.igst;
    acc.totalGST += item.totalGST;
    return acc;
  },
  { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalGST: 0 }
);
  return {summary:slabSummary,totals:{...totals,totalAmount:totals.taxableValue+totals.totalGST}};
};


/* ----------------------------- Custom Hooks ----------------------------- */
const useInvoiceApi = () => {
  const { getData, postData } = useApi();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = (await getData("/trade/billing")) || [];
      // Normalize IDs and sort by createdAt desc if available
      const normalized = res.map((r) => ({ ...r, id: r.id || r._id || uuid() }));
      normalized.sort((a, b) => new Date(b.createdAt || b.invoiceDate || 0) - new Date(a.createdAt || a.invoiceDate || 0));
      setInvoices(normalized);
    } catch (err) {
      console.error("Failed to load bills", err);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [getData]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNewInvoice = useCallback(
    async (newInvoice) => {
      try {
        // Add createdAt & id (server may override)
        const payload = { ...newInvoice, id: newInvoice.id || uuid(), createdAt: new Date().toISOString(), date: new Date(newInvoice.invoiceDate).toISOString() };
        await postData("/trade/billing", payload);
        await load();
        return payload;
      } catch (err) {
        console.error("Failed to post invoice", err);
        throw err;
      }
    },
    [postData, load]
  );

  return { invoices, saveNewInvoice, isLoading, reload: load };
};

/* ----------------------------- Small UI Helpers ----------------------------- */
const InputGroup = ({ icon: Icon, label, id, type = "text", value, onChange, size, ...props }) => (
  <div>
    <label htmlFor={id} className={`block ${size === "sm" ? "text-xs" : "text-sm"} font-medium text-gray-700 mb-1 flex items-center`}>
      {Icon && <Icon className="w-4 h-4 mr-1 text-gray-500" />}
      {label}
    </label>
    <input
    onWheel={(e) => e.target.blur()}
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full ${size === "sm" ? "p-2 text-sm" : "p-3"} border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150`}
      {...props}
    />
  </div>
);

/* ----------------------------- Invoice View ----------------------------- */
const InvoiceView = ({ invoiceData }) => {
  if (!invoiceData) return null;
  const { clientAddress = {},gstsummary={} } = invoiceData;
  const isInterState=clientAddress.state.toLowerCase()!=="punjab"

  return (
    <div id="invoice-to-print" className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl lg:p-10 max-w-4xl mx-auto border border-gray-100 print:shadow-none print:border-none print:max-w-full">
      <style>
        {`@media print {
            @page { margin: 0.25in !important; }
            #invoice-to-print { padding: 1rem !important; box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; }
            p, li { line-height: 1.3 !important; }
            .no-print { display: none !important; }
            .bg-gray-100, .bg-indigo-50 { -webkit-print-color-adjust: exact; color-adjust: exact; }
        }`}
      </style>

      <header className="flex justify-between items-start border-b pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-700">TAX INVOICE</h1>
          <p className="text-xs text-gray-500 mt-1">Invoice #{(invoiceData.id || "").toString().substring(0, 8).toUpperCase()}</p>
        </div>
        <div className="text-right text-sm">
          <h2 className="text-lg font-bold text-gray-800">Duniya Enterprises</h2>
          <p className="text-xs text-gray-600">MNC Headquarters, Silicon Valley Rd.</p>
          <p className="text-xs text-gray-600">Global Hub, Suite 400</p>
          <p className="text-xs text-gray-600">billing@duniyape.com</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1 text-xs">BILL TO:</h3>
          <p className="font-medium text-gray-800 text-sm">{invoiceData.clientName}</p>
          {clientAddress && (
            <>
              <p className="text-gray-600 text-xs mt-1">{clientAddress.address1}</p>
              <p className="text-gray-600 text-xs">{clientAddress.city}, {clientAddress.state} - {clientAddress.pincode}</p>
              {clientAddress.gstin && <p className="text-gray-600 mt-1 font-mono text-xs">**GSTIN:** {clientAddress.gstin}</p>}
            </>
          )}
        </div>
        <div className="text-right text-xs">
          <p className="text-gray-700"><span className="font-semibold">Invoice Date:</span> {new Date(invoiceData.invoiceDate).toLocaleDateString()}</p>
          <p className="text-gray-700"><span className="font-semibold">Due Date:</span> {new Date(new Date(invoiceData.invoiceDate).setDate(new Date(invoiceData.invoiceDate).getDate() + 30)).toLocaleDateString()}</p>
          <p className="mt-2 text-green-600 font-bold text-sm">STATUS: {(invoiceData.status || "unpaid").toUpperCase()}</p>
        </div>
      </section>

      <table className="min-w-full divide-y divide-gray-200 mb-6">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (INR)</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (INR)</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(invoiceData.items || []).map((item, index) => (
            <tr key={item._id || index}>
              <td className="px-3 py-2 whitespace-normal text-sm font-medium text-gray-900">{item.description}</td>
              <td className="px-3 py-2 text-center text-sm text-gray-500">{item.hsnCode || "-"}</td>
              <td className="px-3 py-2 text-center text-sm text-gray-500">{formatCurrency(item.rate)}</td>
              <td className="px-3 py-2 text-center text-sm text-gray-500">{(parseFloat(item.qty) || 0).toFixed(2)}</td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.qty) || 0))}</td>
            </tr>
          ))}

          {(!invoiceData.items || invoiceData.items.length === 0) && (
            <tr><td colSpan="5" className="px-3 py-2 text-center text-sm text-gray-500">No services listed.</td></tr>
          )}
        </tbody>
      </table>

      {/* <div className="flex justify-between mb-6">
        <div></div>
      
        <div className="w-full max-w-xs">
          <div className="flex justify-between py-1 border-t border-gray-200 text-sm">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-medium text-gray-900">{formatCurrency(invoiceData.subtotalAmount)}</span>
          </div>
            <div className="flex justify-between py-0.5 text-sm"><span className="text-gray-700">GST:</span><span className="font-medium text-gray-900">{formatCurrency((invoiceData.sgstAmount || 0) + (invoiceData.cgstAmount || 0))}</span></div>
          <div className="flex justify-between py-2 border-t-2 border-indigo-600 bg-indigo-50 px-3 rounded-lg mt-2">
            <span className="text-md font-bold text-indigo-800">TOTAL DUE (INR):</span>
            <span className="text-lg font-extrabold text-indigo-800">{formatCurrency(invoiceData.totalAmount)}</span>
          </div>
        </div>
      </div> */}
      <div className="flex justify-between gap-8 mb-6">

  {/* LEFT SIDE – GST SUMMARY TABLE */}
  <div className="w-1/2">
    <h3 className="text-md font-semibold mb-2 text-gray-800">GST Summary</h3>

    {/* EMPTY DIV WHERE GST TABLE WILL RENDER */}
    <div className="border border-gray-300 rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="py-2 px-3 text-left">Slab</th>
            <th className="py-2 px-3 text-right">Taxable</th>
            <th className="py-2 px-3 text-right">
              {isInterState ? "IGST" : "CGST"}
            </th>
            {!isInterState && (
              <th className="py-2 px-3 text-right">SGST</th>
            )}
            <th className="py-2 px-3 text-right">Total GST</th>
          </tr>
        </thead>

        <tbody>
          {/* DYNAMIC GST ROWS */}
          {gstsummary && Object.values(gstsummary).map((row) => (
            <tr key={row.slab} className="border-b last:border-0">
              <td className="py-2 px-3">
                {row.slab === "Exempted" ? "Exempted (0%)" : `${row.slab}%`}
              </td>
              <td className="py-2 px-3 text-right">
                {formatCurrency(row.taxableValue)}
              </td>
              <td className="py-2 px-3 text-right">
                {isInterState
                  ? formatCurrency(row.totalGST)
                  : formatCurrency(row.totalGST/2)}
              </td>

              {!isInterState && (
                <td className="py-2 px-3 text-right">
                  {formatCurrency(row.totalGST/2)}
                </td>
              )}

              <td className="py-2 px-3 text-right font-medium">
                {formatCurrency(row.totalGST)}
              </td>
            </tr>
          ))}

          {/* TOTAL ROW */}
          <tr className="bg-indigo-50 font-semibold">
            <td className="py-2 px-3">Total</td>
            <td className="py-2 px-3 text-right">
              {formatCurrency(
                Object.values(gstsummary).reduce(
                  (acc, row) => acc + row.taxableValue,
                  0
                )
              )}
            </td>
            <td className="py-2 px-3 text-right">
              {formatCurrency(
                Object.values(gstsummary).reduce(
                  (acc, row) => acc + (isInterState ? row.igst : row.cgst),
                  0
                )
              )}
            </td>

            {!isInterState && (
              <td className="py-2 px-3 text-right">
                {formatCurrency(
                  Object.values(gstsummary).reduce(
                    (acc, row) => acc + row.sgst,
                    0
                  )
                )}
              </td>
            )}

            <td className="py-2 px-3 text-right">
              {formatCurrency(
                Object.values(gstsummary).reduce(
                  (acc, row) => acc + row.totalGST,
                  0
                )
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* RIGHT SIDE – TOTALS */}
  <div className="w-1/2 max-w-xs ml-auto">
    <div className="flex justify-between py-1 border-t border-gray-200 text-sm">
      <span className="text-gray-700">Subtotal:</span>
      <span className="font-medium text-gray-900">
        {formatCurrency(invoiceData.subtotalAmount)}
      </span>
    </div>

    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-700">Total GST:</span>
      <span className="font-medium text-gray-900">
        {formatCurrency(
          Object.values(gstsummary).reduce(
            (acc, row) => acc + row.totalGST,
            0
          )
        )}
      </span>
    </div>

    <div className="flex justify-between py-2 border-t-2 border-indigo-600 bg-indigo-50 px-3 rounded-lg mt-2">
      <span className="text-md font-bold text-indigo-800">TOTAL DUE (INR):</span>
      <span className="text-lg font-extrabold text-indigo-800">
        {formatCurrency(invoiceData.totalAmount)}
      </span>
    </div>
  </div>
</div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t pt-4">
        <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
          <h4 className="font-bold text-gray-700 mb-2 text-sm border-b pb-1">Bank Transfer Details</h4>
          <div className="text-xs text-gray-800 space-y-1">
            <p className="flex justify-between"><span className="font-semibold text-gray-600">A/C Name:</span> <span className="font-mono text-gray-900">Duniya Enterprises</span></p>
            <p className="flex justify-between"><span className="font-semibold text-gray-600">A/C No.:</span> <span className="font-mono text-gray-900">987654321098765</span></p>
            <p className="flex justify-between"><span className="font-semibold text-gray-600">IFSC Code:</span> <span className="font-mono text-gray-900">IDBI0000123</span></p>
            <p className="flex justify-between"><span className="font-semibold text-gray-600">Bank & Branch:</span> <span className="font-mono text-gray-900">IDBI Bank, Mumbai</span></p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-gray-700 mb-2 text-sm border-b pb-1">Payment Terms & Notes</h4>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside ml-2">
            <li>Payment is due within 30 days of the Invoice Date.</li>
            <li>This invoice includes 18% GST (9% CGST + 9% SGST).</li>
            <li>Please reference the Invoice ID in your payment details.</li>
            <li>Interest may be charged on outstanding amounts after the due date.</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-3 text-xs text-gray-500 border-t text-right">
        <div className="flex justify-end">
          <img className="w-40 h-40 -mt-12" src={sign} alt="sign" />
        </div>
        <p className="font-bold text-gray-700 text-sm -mt-8">For Duniya Enterprises</p>
        <div className="inline-block border-b border-gray-400 pb-2">
          <span className="text-xl font-serif text-gray-900">Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------- Service Row ----------------------------- */
const ServiceItemRow = ({ item, handleItemChange, handleRemoveItem, canRemove, products = [] }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    handleItemChange(item._id, "description", value);

    if (value.length > 1 && Array.isArray(products)) {
      const matches = products
        .filter((p) => (p.productName || "").toString().toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectService = (service) => {
    handleItemChange(item._id, "description", service.productName || "");
    handleItemChange(item._id, "hsnCode", service.hsnCode || "");
    handleItemChange(item._id, "rate", parseFloat(service.price || service.rate || 0));
    handleItemChange(item._id, "gstslab", service.gstPercentage || "");
    setShowSuggestions(false);
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 relative">
      <div className="relative">
        <label className="block text-xs font-medium text-gray-700 mb-1">Service Description</label>
        <input
          id={`desc-${item._id}`}
          type="text"
          required
          value={item.description}
          onChange={handleDescriptionChange}
          onFocus={() => item.description.length > 1 && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          placeholder="e.g., Web Development, Cloud Setup, etc."
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-40 overflow-y-auto mt-1">
            {suggestions.map((service) => (
              <li
                key={service._id || service.id || service.productName}
                onMouseDown={() => selectService(service)}
                className="p-3 text-sm text-gray-800 hover:bg-indigo-50 cursor-pointer transition duration-100 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-indigo-700">{service.productName}</div>
                <div className="text-xs text-gray-500">HSN: {service.hsnCode}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* <div className="md:col-span-3 mt-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Billing Type</label>
          <div className="relative">
             <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <select
                value={item.billingType}
                onChange={(e) => {handleItemChange(item.id, "billingType", e.target.value);handleItemChange(item.id, "qty", 1)}}
                className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Rate</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>  */}

      <div className="grid grid-cols-2 gap-3 mt-2">
        <InputGroup
          icon={IndianRupee}
          label={'Amount (INR)'}
          id={`rate-${item._id}`}
          type="number"
          value={item.rate}
          onChange={(e) => handleItemChange(item._id, "rate", parseFloat(e.target.value || ""))}
          min="0"
          step="0.01"
          size="sm"
          required
        />

       <InputGroup
          icon={Clock}
          label="Total qty"
          id={`qty-${item._id}`}
          type="number"
          value={item.qty}
          onChange={(e) => handleItemChange(item._id, "qty", parseFloat(e.target.value || ""))}
          min="0"
          step="0.5"
          size="sm"
          required
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => handleRemoveItem(item._id)}
          disabled={!canRemove}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition duration-150 flex items-center"
          title="Remove item"
        >
          <X className="w-3 h-3 mr-1" /> Remove Item
        </button>
      </div>
    </div>
  );
};

// /* ----------------------------- Item Editor ----------------------------- */
// const ItemEditor = ({ items, setItems, products }) => {
//   const handleItemChange = (id, field, value) => {
//     setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
//   };

//   const handleAddItem = () =>
//     setItems((prev) => [
//       ...prev,
//       {
//         id: uuid(),
//         description: "",
//         rate: 0.0,
//         qty: 1,
//         gstslab:18
//       },
//     ]);

//   const handleRemoveItem = (id) => setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));

//   return (
//     <div className="space-y-3 pt-4">
//       <h3 className="text-md font-semibold text-gray-700 flex justify-between items-center pb-2 border-b border-gray-200">
//         <span>Line Items / Services</span>
//         <button type="button" onClick={handleAddItem} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition duration-150">
//           <Plus className="w-4 h-4 mr-1" /> Add Item
//         </button>
//       </h3>

//       {items.map((item) => (
//         <ServiceItemRow key={item.id} item={item} handleItemChange={handleItemChange} handleRemoveItem={handleRemoveItem} canRemove={items.length > 1} products={products} />
//       ))}
//     </div>
//   );
// };

const ItemEditor = ({ items, setItems, products }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Core Billing Logic: Process a scanned barcode string from your Camera module
  const handleBarcodeScanned = (barcode) => {
    setIsCameraActive(false); // Close camera on scan
    const matchedProduct = products?.find(
      (p) => String(p.barcode) === String(barcode) || String(p.sku) === String(barcode)
    );

    if (!matchedProduct) {
      console.warn(`Product not found for barcode: ${barcode}`);
      alert(`No product found for scanned code: ${barcode}`); // Simple alert fallback
      return; // Tip: Add an audio beep or UI notification toast here
    }

    alert(matchedProduct.productName || matchedProduct.description || "Unnamed Product"); // Debug alert - replace with better UI feedback

    setItems((prevItems) => {
      // 1. Check if the product is already in the billing list
      const existingItemIndex = prevItems.findIndex(
        (it) => it._id === matchedProduct._id || it.barcode === matchedProduct.barcode
      );

      if (existingItemIndex !== -1) {
        // Product exists -> Increment its quantity
        return prevItems.map((it, idx) =>
          idx === existingItemIndex ? { ...it, qty: Number(it.qty) + 1 } : it
        );
      }

      // 2. Check if the current last line item row is completely untouched
      const lastItem = prevItems[prevItems.length - 1];
      const isLastItemEmpty = lastItem && !lastItem.description && Number(lastItem.rate) === 0;

      const newRowData = {
        _id: matchedProduct._id,
        barcode: matchedProduct.barcode,
        description: matchedProduct.productName || matchedProduct.description,
        rate: Number(matchedProduct.price || matchedProduct.rate || 0),
        gstslab: Number(matchedProduct.gstslab || 18),
        qty: 1,
      };
      alert("New row data to add:", newRowData)

      if (isLastItemEmpty) {
        // Overwrite the open empty row
        return prevItems.map((it) => (it._id === lastItem._id ? { ...it, ...newRowData } : it));
      }

      // 3. Append as a completely new line item
      return [
        ...prevItems,
        {
          ...newRowData,
        },
      ];
    });
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it._id !== id) return it;

        // Auto-fill details if selected via a dropdown within ServiceItemRow
        if (field === '_id' && products) {
          const selectedProd = products.find((p) => p._id === value);
          if (selectedProd) {
            return {
              ...it,
              _id: selectedProd._id,
              barcode: selectedProd.barcode || '',
              description: selectedProd.productName || selectedProd.description,
              rate: Number(selectedProd.price || selectedProd.rate || 0),
              gstslab: Number(selectedProd.gstslab || 18),
              qty: 1,
            };
          }
        }
        return { ...it, [field]: value };
      })
    );
  };

  const handleAddItem = () =>
    setItems((prev) => [
      ...prev,
      { _id: "", barcode: "", description: "", rate: 0.0, qty: 1, gstslab: 18 },
    ]);

  const handleRemoveItem = (id) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it._id !== id) : prev));

  return (
    <div className="space-y-4 pt-4">
      {/* Module Header Controls */}
      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
        <h3 className="text-md font-semibold text-gray-700">Line Items / Services</h3>
        
        <div className="flex items-center space-x-2">
          {/* Camera Scan Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCameraActive(true)}
            className="flex items-center text-sm font-medium px-3 py-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
          >
            <Camera className="w-4 h-4 mr-1" /> Scan via Camera
          </button>
          
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition duration-150 px-2 py-1.5"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </button>
        </div>
      </div>

      {/* Your Reusable Camera Module Implementation */}
      {isCameraActive && (
        <CameraScanner 
          onScanSuccess={handleBarcodeScanned} 
          onClose={() => setIsCameraActive(false)} 
        />
      )}

      {/* Item Rendering Output Rows */}
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <ServiceItemRow
            key={item._id}
            item={item}
            handleItemChange={handleItemChange}
            handleRemoveItem={handleRemoveItem}
            canRemove={items.length > 1}
            products={products}
          />
        ))}
      </div>
    </div>
  );
};

/* ----------------------------- Beautiful Checkbox ----------------------------- */
const BeautifulCheckbox = ({ label, isChecked, onToggle }) => {
  const baseClasses = "w-full md:w-[48%] flex items-center space-x-4 cursor-pointer select-none p-4 rounded-xl transition-all duration-300 ease-in-out border-2";
  const checkedClasses = "bg-purple-50 border-purple-600 shadow-lg shadow-purple-200/50";
  const uncheckedClasses = "bg-white border-gray-200 hover:border-purple-400 hover:shadow-md";

  return (
    <div className={`${baseClasses} ${isChecked ? checkedClasses : uncheckedClasses}`} onClick={onToggle} role="radio" aria-checked={isChecked} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}>
      <div className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all duration-300 ease-in-out flex-shrink-0 ${isChecked ? "bg-purple-600 border-purple-700" : "bg-white border-gray-400"}`}>
        <div className={`w-2 h-2 rounded-full bg-white transition-transform duration-300 ease-in-out ${isChecked ? "scale-100" : "scale-0"}`}></div>
      </div>
      <span className="text-lg font-semibold text-gray-800 flex-grow">{label}</span>
    </div>
  );
};

/* ----------------------------- MAIN APP (HOOKS AT TOP) ----------------------------- */
const App = () => {
  /* ----------------------------- Hooks - ALL AT TOP ----------------------------- */
  const { getData, postData } = useApi();

  // Invoice API
  const { invoices, saveNewInvoice, isLoading, reload } = useInvoiceApi();

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const getTodayDate = () => new Date().toISOString().substring(0, 10);
  const [invoiceDate, setInvoiceDate] = useState(getTodayDate());

  const [items, setItems] = useState([
    { id: uuid(), description: "", rate: 0.0, qty: 1 , gstslab:18},
  ]);

  const [clientAddress1, setClientAddress1] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientState, setClientState] = useState("");
  const [clientPincode, setClientPincode] = useState("");
  const [clientGSTIN, setClientGSTIN] = useState("");

  const [status, setStatus] = useState({ type: "info", message: "Ready to create an invoice." });
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);



  const [paymentMethod, setPaymentMethod] = useState("cash");
const [bankName, setBankName] = useState("");
const [referenceNo, setReferenceNo] = useState(""); // cheque no / bank ref
const [chequeDate, setChequeDate] = useState("");

  // Client autocomplete
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Customer/product lists from API
  const [scustomerdata, setScustomerdata] = useState([]);
  const [products, setProducts] = useState([]);

  // Advance/payout related
  const [advance, setAdvance] = useState(0);
  const [payoutAmount, setPayoutAmount] = useState(0.0);
  const options = ["Adjustment", "Not Adjustment"];
  const [selectedGender, setSelectedGender] = useState("Not Adjustment");

  /* ----------------------------- Derived Totals ----------------------------- */
  const { subtotal, cgstAmount, sgstAmount, totalAmount } = calculateTotals(items);
  const {summary,totals} = calculateSlabWiseGST(items,'Punjab',clientState)
  console.log(summary,totals)

  const { calculatedDeduction, netPayout } = useMemo(() => {
    const deductionValue = (advance || 0) - (payoutAmount || 0);
    const finalDeduction = Math.max(0, deductionValue);
    return { calculatedDeduction: finalDeduction, netPayout: payoutAmount || 0 };
  }, [advance, payoutAmount]);

  /* ----------------------------- Hooks/Effects to load data ----------------------------- */
  useEffect(() => {
    // Load customers
    const getCustomers = async () => {
      try {
        const res = (await getData("/trade/customer")) || [];
        setScustomerdata(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch customers", err);
        setScustomerdata([]);
      }
    };

    // Load products
    const getProducts = async () => {
      try {
        const res = (await getData("/trade/products")) || [];
        console.log("Fetched products:", res);
        setProducts(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setProducts([]);
      }
    };

    getCustomers();
    getProducts();
  }, [getData]);

  /* ----------------------------- Helper functions ----------------------------- */
  const resetForm = useCallback(() => {
    setClientName("");
    setClientId("");
    setInvoiceDate(getTodayDate());
    setItems([{ id: uuid(), description: "", rate: 0.0, qty: 1 , gstslab:18}]);
    setClientAddress1("");
    setClientCity("");
    setClientState("");
    setClientPincode("");
    setClientGSTIN("");
    setPayoutAmount(0);
    setSelectedGender("Not Adjustment");
  }, []);

  const handleGenderSelect = (gender) => {
    setSelectedGender((prev) => (prev === gender ? null : gender));
  };

  const handleClientNameChange = (e) => {
    const value = e.target.value;
    setClientName(value);

    if ((value || "").length > 1) {
      const matches = (scustomerdata || [])
        .filter((client) => (client.name || "").toString().toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setClientSuggestions(matches);
      setShowClientSuggestions(matches.length > 0);
    } else {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
    }
  };

  const fillClientDetails = (clientData) => {
    if (!clientData) return;
    setClientName(clientData.name || "");
    setClientId(clientData._id || clientData.id || "");
    setClientAddress1(clientData.address || clientData.address1 || "");
    setClientCity(clientData.city || "");
    setClientState(clientData.state || "");
    setClientPincode(clientData.pincode || "");
    setClientGSTIN(clientData.gstin || "");
    setShowClientSuggestions(false);
    setStatus({ type: "success", message: `Details for ${clientData.name} loaded from records.` });
    // Fetch advance (ledger) if available
    fetchAdvanceForCustomer(clientData._id || clientData.id || clientData.custid);
  };

  const fetchAdvanceForCustomer = async (custId) => {
    if (!custId) return setAdvance(0);
    try {
      const url = `/v1/ledger2/A19/${custId}?from=${moment().add(1, "days").format("YYYY-MM-DD")}&to=${moment().add(2, "days").format("YYYY-MM-DD")}`;
      const res = await getData(url);
      // Many APIs return objects or arrays — guard accordingly
      const opening = res && typeof res.opening_balance !== "undefined" ? res.opening_balance : (Array.isArray(res) && res[0] && res[0].opening_balance ? res[0].opening_balance : 0);
      setAdvance(-(opening || 0));
    } catch (err) {
      console.error("Failed to fetch advance:", err);
      setAdvance(0);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const cleanValue = (value || "").toString().replace(/[^0-9.]/g, "");
    let floatValue = parseFloat(cleanValue);
    if (isNaN(floatValue)) {
      setPayoutAmount(0.0);
      return;
    }
    if (floatValue > advance) floatValue = advance;
    if (floatValue < 0) floatValue = 0;
    setPayoutAmount(floatValue);
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();

    // validation
    if (!clientName) {
      setStatus({ type: "error", message: "Please add client name." });
      return;
    }
    if (items.length === 0 || items.some((it) => !it.description || (parseFloat(it.rate || 0) <= 0) || (parseFloat(it.qty || 0) <= 0))) {
      setStatus({ type: "error", message: "Please ensure all line items have a description, positive rate, and qty." });
      return;
    }

    setIsSaving(true);
    setStatus({ type: "info", message: "Sending invoice data to API..." });

    const sanitizedItems = items.map((item) => ({ ...item, rate: parseFloat(item.rate || 0), qty: parseFloat(item.qty || 0) }));
    const newInvoice = {
        
      adjustmentVoucher: selectedGender === "Adjustment" ? "yes" : "no",
      advance: payoutAmount || 0,
      clientName,
      invoiceDate,
      items: sanitizedItems,
      custid: clientId,
      clientAddress: {
        address1: clientAddress1,
        city: clientCity,
        state: clientState,
        pincode: clientPincode,
        gstin: clientGSTIN,
      },
      gstsummary:summary,
      totalgst:totals.totalGST,
      subtotalAmount: subtotal,
      cgstAmount:totals.totalGST/2,
      sgstAmount:totals.totalGST/2,
      totalAmount:totals.totalAmount,
      status: "unpaid",
      paymentMethod,
      bankref:referenceNo,
      projectName: sanitizedItems.length > 0 ? (sanitizedItems[0].description || "").substring(0, 50) + "..." : "Multiple Services",
    };

    try {
      const saved = await saveNewInvoice(newInvoice);
      setStatus({ type: "success", message: `Invoice for ${clientName} saved successfully!` });
      setViewingInvoice(saved);
      resetForm();
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to save invoice. Check console for details." });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintToPDF = () => {
    if (!viewingInvoice) return;
    const invoiceElement = document.getElementById("invoice-to-print");
    if (!invoiceElement) return;

    const printContent = invoiceElement.outerHTML;
    const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style")).map((item) => item.outerHTML).join("");
    const tailwindScript = `<script src="https://cdn.tailwindcss.com"></script>`;

    const htmlToPrint = `<!DOCTYPE html><html><head><title>Invoice ${viewingInvoice.id}</title><meta name="viewport" content="width=device-width, initial-scale=1.0">${tailwindScript}${styles}<style>body{margin:0;padding:0;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif}@page{margin:0.05in !important}#invoice-to-print{width:100%;max-width:none;margin:0 auto;box-shadow:none;padding:1rem !important}p,li{line-height:1.3}</style></head><body><div class="p-4 sm:p-8">${printContent}</div></body></html>`;

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

  const getStatusClasses = (type) => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-400 text-green-700";
      case "error":
        return "bg-red-100 border-red-400 text-red-700";
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-700";
      case "info":
      default:
        return "bg-blue-100 border-blue-400 text-blue-700";
    }
  };

  /* ----------------------------- RENDER: Conditional view AFTER hooks ----------------------------- */

  // Viewing invoice isolated view
  if (viewingInvoice) {
    return (
      <div className="p-4 sm:p-8 min-h-screen print-view-wrapper">
        <div className="no-print mb-6 max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => setViewingInvoice(null)} className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium p-2 rounded-lg bg-white shadow-md transition duration-150">
            <ChevronDown className="h-5 w-5 rotate-90" />
            <span>Back to Invoice List</span>
          </button>

          <button onClick={handlePrintToPDF} className="flex items-center space-x-2 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg shadow-xl hover:bg-indigo-700 transition duration-150">
            <Printer className="h-5 w-5" />
            <span>Generate & Print PDF</span>
          </button>
        </div>

        <InvoiceView invoiceData={viewingInvoice} />

        <div className="no-print text-center mt-6 text-sm text-gray-600 max-w-4xl mx-auto p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="font-semibold text-yellow-800">Single Page Optimization Note:</p>
          <p>The print layout uses aggressive margins (0.25in) and minimal padding to maximize content area for a clean, single-page PDF output.</p>
        </div>
      </div>
    );
  }

  /* ----------------------------- MAIN FORM VIEW ----------------------------- */
  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {status.message && (
          <div className={`p-4 rounded-lg border mb-6 no-print ${getStatusClasses(status.type)}`} role="alert">
            <p className="font-medium">{status.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice creation */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-2xl h-fit border border-gray-100 no-print">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Save className="w-5 h-5 mr-2 text-indigo-500" />
              Generate New Bill
            </h2>

            <form onSubmit={handleSaveInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <InputGroup
                    icon={User}
                    label="Client Name"
                    id="client-name"
                    type="text"
                    value={clientName}
                    onChange={handleClientNameChange}
                    onFocus={() => clientName.length > 1 && clientSuggestions.length > 0 && setShowClientSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                    placeholder="Start typing..."
                    required
                  />
                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                      {clientSuggestions.map((client) => (
                        <li key={client._id || client.id} onMouseDown={() => fillClientDetails(client)} className="p-3 text-sm text-gray-800 hover:bg-indigo-50 cursor-pointer transition duration-100 border-b border-gray-100 last:border-b-0">
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-gray-500">{client.address}, {client.city}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <InputGroup icon={Calendar} label="Invoice Date" id="invoice-date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
              </div>

              <h3 className="text-md font-semibold text-gray-700 mt-6 mb-3 border-t pt-4">Client Billing Details (India)</h3>

              <InputGroup icon={Briefcase} label="GSTIN" id="client-gstin" type="text" value={clientGSTIN} onChange={(e) => setClientGSTIN(e.target.value)} placeholder="GSTIN (e.g., 27ABCDE1234F1Z)" />

              <InputGroup icon={MapPin} label="Address Line 1" id="address-1" type="text" value={clientAddress1} onChange={(e) => setClientAddress1(e.target.value)} placeholder="Building/Street" required />

              <div className="grid grid-cols-3 gap-3">
                <InputGroup icon={Map} label="City" id="city" type="text" value={clientCity} onChange={(e) => setClientCity(e.target.value)} placeholder="Mumbai" required />
                <InputGroup icon={Map} label="State" id="state" type="text" value={clientState} onChange={(e) => setClientState(e.target.value)} placeholder="MH" required />
                <InputGroup icon={MapPin} label="Pincode" id="pincode" type="text" value={clientPincode} onChange={(e) => setClientPincode(e.target.value)} placeholder="400001" pattern="\d{6}" maxLength="6" required />
              </div>

              <ItemEditor items={items} setItems={setItems} products={products} />

              <div className="space-y-4 pt-4 border-t">
                {advance > 0 && (
                  <div className="flex items-start justify-center font-sans">
                    <div className="w-full bg-white rounded-xl p-6 space-y-6">
                      <h1 className="text-2xl font-extrabold text-gray-800 border-b pb-3 mb-2">Advance Settlement</h1>

                      <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded-lg text-blue-800 font-semibold space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>BASE ADVANCE AMOUNT:</span>
                          <span className="text-blue-600 font-mono text-xl">{formatCurrency(advance)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-start gap-3">
                        {options.map((option) => (
                          <BeautifulCheckbox key={option} label={option} isChecked={selectedGender === option} onToggle={() => handleGenderSelect(option)} />
                        ))}
                      </div>

                      <div className="space-y-3 pt-4">
                        <h2 className="text-lg font-bold text-gray-700 border-b pb-1">Enter Adjustment Amount</h2>

                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200">
                          <label htmlFor="payout" className="text-indigo-700 font-medium whitespace-nowrap">Adjustment Amount (≤ {formatCurrency(advance)}):</label>
                          <div className="relative w-full max-w-[140px]">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-500 font-mono">₹</span>
                            <input id="payout" type="text" value={payoutAmount === 0 ? "" : payoutAmount} onChange={handleInputChange} placeholder={formatCurrency(advance)} className="w-full pl-6 pr-2 py-2 border border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-right font-mono text-indigo-700 bg-white transition duration-150" />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-indigo-50 border-l-4 border-indigo-600 rounded-lg text-indigo-800 font-semibold space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm"><span>GST:</span><span>{formatCurrency(totals.totalGST)}</span></div>
                  <div className="flex justify-between font-bold border-t border-indigo-300 pt-1 mt-1">
                    <span>GRAND TOTAL:</span>
                    <span>{formatCurrency(totals.totalAmount)}</span>
                  </div>
                </div>


                <h3 className="text-md font-semibold text-gray-700 mt-6 mb-3 border-t pt-4">
  Payment Details
</h3>

<div className="grid grid-cols-2 gap-4">

  {/* Payment Method */}
  <div>
    <label className="text-sm font-medium text-gray-700">Payment Method</label>
    <select
      value={paymentMethod}
      onChange={(e) => setPaymentMethod(e.target.value)}
      className="w-full p-3 border border-gray-300 rounded-lg"
    >
      <option value="cash">Cash</option>
      <option value="bank">Bank Transfer</option>
      <option value="cheque">Cheque</option>
      <option value="credit">Credit</option>
    </select>
  </div>


  

  {/* Bank Name */}
 

  {/* Reference / Cheque No */}
  {(paymentMethod === "bank" || paymentMethod === "cheque") && (
<>

<div>
    <label className="text-sm font-medium text-gray-700">Select Bank</label>
    <select
      value={paymentMethod}
      onChange={(e) => setPaymentMethod(e.target.value)}
      className="w-full p-3 border border-gray-300 rounded-lg"
    >
      <option value="IDBI Bank">IDBI Bank</option>
    </select>
  </div>


    <InputGroup
      label="Cheque No / Bank Ref."
      value={referenceNo}
      onChange={(e) => setReferenceNo(e.target.value)}
    /></>
  )}

  {/* Cheque Date */}
  {(paymentMethod === "bank" || paymentMethod === "cheque") && (
    <InputGroup
      type="date"
      label="Date"
      value={chequeDate}
      onChange={(e) => setChequeDate(e.target.value)}
    />
  )}
</div>


                

                <button type="submit" disabled={isSaving} className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out disabled:bg-indigo-400">
                  {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save className="w-5 h-5" />}
                  <span>{isSaving ? "Saving..." : "Save & Finalize Invoice"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent invoices */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-2xl border border-gray-100 no-print">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" />
              Recent Invoices ({(invoices || []).length})
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-indigo-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <span>Loading invoices...</span>
              </div>
            ) : (
              <div id="saved-invoices-list" className="space-y-3">
                {(!invoices || invoices.length === 0) ? (
                  <p className="text-gray-500 p-4 border border-dashed rounded-lg text-center">
                    No invoices saved yet. Your bills will appear here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id || invoice._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition duration-150">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-indigo-700 truncate">{invoice.clientName} - {invoice.projectName}</p>
                          <p className="text-xs text-gray-500 mt-1">Issued: {new Date(invoice.invoiceDate).toLocaleDateString("en-GB")} | Invoice: {invoice.id}</p>
                        </div>
                        <button onClick={() => setViewingInvoice(invoice)} className="ml-4 flex-shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition duration-150 shadow-md">View/Print</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;
