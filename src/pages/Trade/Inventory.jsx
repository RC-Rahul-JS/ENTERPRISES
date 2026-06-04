import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  FileText, 
  Layers, 
  Tag, 
  Calendar,
  BarChart3,
  Boxes,
  ShoppingCart,
  TrendingUp,
  Calculator,
  Wallet,
  Filter,
  Coins
} from 'lucide-react';
import useApi from '../../api/useApi';

// const rawData = {
//   "count": 4,
//   "data": [
//     {
//       "category": "Software",
//       "cgst": 9.0,
//       "date": "2026-03-29",
//       "gstRate": 18,
//       "hsnCode": "76",
//       "igst": 18.0,
//       "party_id": "69c904841dea96f17c68ecb4",
//       "party_name": "test",
//       "price": "767",
//       "productName": "test1",
//       "quantity": 15,
//       "sgst": 9.0,
//       "taxable_value": 650.0,
//       "total": "11505.00",
//       "type": "purchase",
//       "voucher_number": "JRV-2026-03-29-1"
//     },
//     {
//       "category": "Software",
//       "cgst": 9.0,
//       "date": "2026-03-29",
//       "gstRate": 18,
//       "hsnCode": "7",
//       "igst": 18.0,
//       "party_id": "69c904841dea96f17c68ecb4",
//       "party_name": "test",
//       "price": 50,
//       "productName": "test2",
//       "quantity": 4,
//       "sgst": 9.0,
//       "taxable_value": 42.3725,
//       "total": 200,
//       "type": "purchase",
//       "voucher_number": "JRV-2026-03-29-2"
//     },
//     {
//       "category": "Software",
//       "cgst": 9.0,
//       "date": "2026-03-29",
//       "gstRate": 18,
//       "hsnCode": "76",
//       "igst": 18.0,
//       "party_id": "69c904841dea96f17c68ecb4",
//       "party_name": "test",
//       "price": 30,
//       "productName": "test1",
//       "quantity": 2,
//       "sgst": 9.0,
//       "taxable_value": 25.425,
//       "total": 60,
//       "type": "purchase",
//       "voucher_number": "JRV-2026-03-29-2"
//     },
//     {
//       "category": null,
//       "cgst": 90,
//       "date": "2026-03-29",
//       "gstRate": 18.0,
//       "hsnCode": "7",
//       "igst": 0,
//       "party_id": "69c9194b95a077607d64f4c7",
//       "party_name": "testcust",
//       "price": 500,
//       "productName": "test2",
//       "quantity": 2,
//       "sgst": 90,
//       "taxable_value": 500.0,
//       "total": 1000,
//       "type": "sale",
//       "voucher_number": "D1002"
//     }
//   ],
//   "product": [
//     {
//       "_id": "69c904a41dea96f17c68ecb6",
//       "category": "Software",
//       "cgst": "9.00",
//       "gstPercentage": "18",
//       "hsnCode": "76",
//       "igst": "18.00",
//       "price": "767",
//       "productName": "test1",
//       "sgst": "9.00",
//       "type": "billable"
//     },
//     {
//       "_id": "69c9072b95a077607d64f4c5",
//       "category": "Software",
//       "cgst": "9.00",
//       "gstPercentage": "18",
//       "hsnCode": "7",
//       "igst": "18.00",
//       "price": "8786",
//       "productName": "test2",
//       "sgst": "9.00",
//       "type": "billable"
//     },
//     {
//       "_id": "69c927fb95a077607d64f4cd",
//       "category": "tewww",
//       "cgst": "17.00",
//       "gstPercentage": "34",
//       "hsnCode": "whew",
//       "igst": "34.00",
//       "price": "32434",
//       "productName": "were",
//       "sgst": "17.00",
//       "type": "billable"
//     }
//   ],
//   "status": "success"
// };

const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? "0.00" : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("all");

  const [rawData, setrawData] = useState()

  const {getData,postData}= useApi()

  useEffect(() => {
    const func=async()=>{
        const res = await getData('/trade/get_all_items')
        console.log(res)
        setrawData(res)
        }
  func()  
  }, [])

  /**
   * FIFO Valuation Logic
   * Calculates remaining stock value by tracking purchase batches
   */
  const inventoryMap = useMemo(() => {
      if (!rawData || !rawData.data) return {};
    const map = {};
    
    // Sort data by date to ensure chronological FIFO processing
    const sortedData = [...rawData.data].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedData.forEach(item => {
      const name = item.productName;
      if (!map[name]) {
        map[name] = { 
          purchased: 0, 
          sold: 0, 
          purchaseBatches: [], 
          fifoValue: 0 
        };
      }

      if (item.type === 'purchase') {
        map[name].purchased += item.quantity;
        // Add a new batch to the queue: quantity and unit taxable value
        map[name].purchaseBatches.push({
          qty: parseFloat(item.quantity),
          unitTax: parseFloat(item.taxable_value)
        });
      } else if (item.type === 'sale') {
        map[name].sold += item.quantity;
        let saleQty = parseFloat(item.quantity);
        
        // Consume batches from the front (First In)
        while (saleQty > 0 && map[name].purchaseBatches.length > 0) {
          const firstBatch = map[name].purchaseBatches[0];
          if (firstBatch.qty <= saleQty) {
            saleQty -= firstBatch.qty;
            map[name].purchaseBatches.shift(); // Exhausted batch removed
          } else {
            firstBatch.qty -= saleQty;
            saleQty = 0; // Partial batch remains
          }
        }
      }
    });

    // Calculate current stock value for all products
    Object.keys(map).forEach(key => {
      map[key].fifoValue = map[key].purchaseBatches.reduce((acc, b) => acc + (b.qty * b.unitTax), 0);
    });

    return map;
  }, [rawData]);

  const products = useMemo(() => {
     if (!rawData || !rawData.product) return [];
    const unique = [];
    const names = new Set();
    rawData.product.forEach(p => {
      if (!names.has(p.productName)) {
        names.add(p.productName);
        const inv = inventoryMap[p.productName] || { purchased: 0, sold: 0, fifoValue: 0 };
        unique.push({
          ...p,
          stock: inv.purchased - inv.sold,
          taxableValue: inv.fifoValue
        });
      }
    });
    return unique;
  }, [inventoryMap, rawData]);

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const productStats = useMemo(() => {
    if (!selectedProduct) return null;
    const stats = inventoryMap[selectedProduct.productName] || { purchased: 0, sold: 0, fifoValue: 0 };
    return {
      ...stats,
      current: stats.purchased - stats.sold
    };
  }, [selectedProduct, inventoryMap]);

  const transactions = useMemo(() => {
    if (!selectedProduct || !rawData || !rawData.data) return [];
    if (!selectedProduct) return [];
    let base = rawData.data.filter(t => t.productName === selectedProduct.productName);
    if (ledgerFilter !== 'all') {
      base = base.filter(t => t.type === ledgerFilter);
    }
    return base;
  }, [selectedProduct, ledgerFilter, rawData]);

    const grandTotalTaxableValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.taxableValue || 0), 0);
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-indigo-200 shadow-lg">
            <Boxes size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Inventory Pro</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">FIFO Valuation Engine</p>
          </div>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">





        {/* Sidebar Product List */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">

<div className="p-4 bg-indigo-600 text-white shadow-inner">
            <div className="flex items-center gap-2 opacity-80 mb-1">
              <Coins size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Grand Total Value</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-medium opacity-80">₹</span>
              <span className="text-2xl font-black font-mono leading-none">
                {formatCurrency(grandTotalTaxableValue)}
              </span>
            </div>
            <p className="text-[9px] mt-2 opacity-60 font-medium">Aggregate taxable value of all stock items</p>
          </div>


          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="uppercase text-[11px] font-bold text-slate-400 tracking-wider">Product Master</span>
            <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-600">{filteredProducts.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredProducts.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  setSelectedProduct(p);
                  setLedgerFilter('all'); // Reset filter on product change
                }}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  selectedProduct?._id === p._id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold text-sm ${selectedProduct?._id === p._id ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {p.productName}
                  </h3>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    p.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    STK: {p.stock}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-2">
                   <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Taxable Value</span>
                    <span className="font-mono text-[11px] font-bold text-indigo-600">₹{formatCurrency(p.taxableValue)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Dashboard Content */}
        <section className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {selectedProduct ? (
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Product Info & Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
                  <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedProduct.productName}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                      HSN: {selectedProduct.hsnCode}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">
                      {selectedProduct.category || 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                      <Calculator size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Stock</p>
                      <h4 className="text-2xl font-black text-slate-800">{productStats.current} <span className="text-xs font-normal text-slate-400">units</span></h4>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Total Purchases: {productStats.purchased}</span>
                    <span className="text-slate-400">Total Sales: {productStats.sold}</span>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between border-l-4 border-l-indigo-500">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                      <Wallet size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Available Taxable Value</p>
                      <h4 className="text-2xl font-black text-slate-800 font-mono">₹{formatCurrency(productStats.fifoValue)}</h4>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded">
                    Calculated via FIFO (Cost Basis)
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Movement Ledger</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chronological stock entries</p>
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                    {[
                      { id: 'all', label: 'All', icon: Filter },
                      { id: 'purchase', label: 'Purchases', icon: ShoppingCart },
                      { id: 'sale', label: 'Sales', icon: TrendingUp }
                    ].map((btn) => {
                      const Icon = btn.icon;
                      const isActive = ledgerFilter === btn.id;
                      return (
                        <button
                          key={btn.id}
                          onClick={() => setLedgerFilter(btn.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                            isActive 
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                            : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Icon size={12} />
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] uppercase text-slate-400 font-bold tracking-widest bg-slate-50/80">
                        <th className="px-6 py-4 border-b border-slate-100">Transaction Date</th>
                        <th className="px-6 py-4 border-b border-slate-100">Category</th>
                        <th className="px-6 py-4 border-b border-slate-100 text-center">Movement</th>
                        <th className="px-6 py-4 border-b border-slate-100">Unit Taxable</th>
                        {/* <th className="px-6 py-4 border-b border-slate-100 text-right">Value</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map((t, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-700 font-semibold">{t.date}</div>
                            {/* <div className="text-[10px] text-slate-400 font-mono mt-0.5">{t.voucher_number}</div> */}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${
                              t.type === 'purchase' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-orange-50 text-orange-700 border border-orange-100'
                            }`}>
                              {t.type === 'purchase' ? <ShoppingCart size={12} /> : <TrendingUp size={12} />}
                              {t.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className={`text-sm font-black ${t.type === 'purchase' ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {t.type === 'purchase' ? `+${t.quantity}` : `-${t.quantity}`}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-slate-600 font-mono">₹{formatCurrency(t.taxable_value)}</div>
                            {/* <div className="text-[9px] text-slate-400">{t.gstRate}%</div> */}
                          </td>
                          {/* <td className="px-6 py-4 text-right">
                            <div className="text-sm font-bold text-slate-900 font-mono">₹{formatCurrency(t.total)}</div>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {transactions.length === 0 && (
                  <div className="p-20 text-center bg-slate-50/20">
                    <Package size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No {ledgerFilter !== 'all' ? ledgerFilter : ''} ledger entries found.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-inner">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-8 border border-indigo-100">
                <Boxes size={48} className="text-indigo-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Enterprise Ledger</h3>
              <p className="mt-3 text-slate-400 max-w-sm text-sm font-medium leading-relaxed">
                Select a product from the master list to trigger the FIFO valuation engine and audit transaction history.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}