import React from 'react';
import sign from "../../assets/sign.png";

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);

const InvoiceView = ({ invoiceData, title = "TAX INVOICE" }) => {
  if (!invoiceData) return null;
  const { clientAddress = {},gstsummary={} } = invoiceData;
  const isInterState=clientAddress.state ? clientAddress.state.toLowerCase()!=="punjab" : false;

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
          <h1 className="text-3xl font-extrabold text-indigo-700">{title}</h1>
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
          <p className="text-gray-700"><span className="font-semibold">Invoice Date:</span> {new Date(invoiceData.invoiceDate || invoiceData.date || Date.now()).toLocaleDateString()}</p>
          <p className="text-gray-700"><span className="font-semibold">Due Date:</span> {new Date(new Date(invoiceData.invoiceDate || invoiceData.date || Date.now()).setDate(new Date(invoiceData.invoiceDate || invoiceData.date || Date.now()).getDate() + 30)).toLocaleDateString()}</p>
          <p className="mt-2 text-green-600 font-bold text-sm">STATUS: {(invoiceData.status || "paid").toUpperCase()}</p>
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
            <tr key={item._id || item.id || index}>
              <td className="px-3 py-2 whitespace-normal text-sm font-medium text-gray-900">{item.description}</td>
              <td className="px-3 py-2 text-center text-sm text-gray-500">{item.hsnCode || "-"}</td>
              <td className="px-3 py-2 text-center text-sm text-gray-500">{formatCurrency(item.rate)}</td>
              <td className="px-3 py-2 text-center text-sm text-gray-500">{(parseFloat(item.qty || item.returnQty) || 0).toFixed(2)}</td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.qty || item.returnQty) || 0))}</td>
            </tr>
          ))}

          {(!invoiceData.items || invoiceData.items.length === 0) && (
            <tr><td colSpan="5" className="px-3 py-2 text-center text-sm text-gray-500">No services listed.</td></tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-between gap-8 mb-6">

  {/* LEFT SIDE – GST SUMMARY TABLE */}
  <div className="w-1/2">
    <h3 className="text-md font-semibold mb-2 text-gray-800">GST Summary</h3>
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
          <tr className="bg-indigo-50 font-semibold">
            <td className="py-2 px-3">Total</td>
            <td className="py-2 px-3 text-right">
              {formatCurrency(
                Object.values(gstsummary).reduce(
                  (acc, row) => acc + (row.taxableValue || 0),
                  0
                )
              )}
            </td>
            <td className="py-2 px-3 text-right">
              {formatCurrency(
                Object.values(gstsummary).reduce(
                  (acc, row) => acc + (isInterState ? (row.igst || 0) : (row.cgst || 0)),
                  0
                )
              )}
            </td>
            {!isInterState && (
              <td className="py-2 px-3 text-right">
                {formatCurrency(
                  Object.values(gstsummary).reduce(
                    (acc, row) => acc + (row.sgst || 0),
                    0
                  )
                )}
              </td>
            )}
            <td className="py-2 px-3 text-right">
              {formatCurrency(
                Object.values(gstsummary).reduce(
                  (acc, row) => acc + (row.totalGST || 0),
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
            (acc, row) => acc + (row.totalGST || 0),
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

export default InvoiceView;
