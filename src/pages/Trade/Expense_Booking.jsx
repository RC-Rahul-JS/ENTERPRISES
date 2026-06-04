import React, { useState, useEffect } from 'react';
import { Search, User, Package, Trash2, CheckCircle, Plus, X, Calculator , Upload, 
  Image as ImageIcon,
  FileText,
  Loader2} from 'lucide-react';
import useApi from '../../api/useApi';
import axios from 'axios';

const AccountingBillingUI = () => {
  // --- MOCK DATA ---
//   const vendorsDB = [{ id: 'V-01', name: 'Global Tech', city: 'Mumbai' }, { id: 'V-02', name: 'Standard Spares', city: 'Delhi' }];
  // const productsDB = [{ id: 'P-01', name: 'Industrial Motor', price: 5000 }, { id: 'P-02', name: 'Steel Pipe', price: 1200 }];
  // const ledgers = ["Purchase A/c", "Cash Account", "Inventory Inward"];
  const {getData,postData}= useApi()

  const [vendorsDB, setClients] = useState([]);
  const [ledgers, setledgers] = useState([]);
  const [productsDB, setproducts] = useState([]);

  const [Loading, setLoading] = useState(false)

    // --- IMAGE UPLOAD STATES ---
  const [billImage, setBillImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [GST, setGST] = useState('')
  const [personalLedgers, setpersonalLedgers] = useState([])
  const [POS, setPOS] = useState('')

  // --- STATES ---
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vSuggestions, setVSuggestions] = useState([]);

  const [director, setdirector] = useState('Harish Kumar Bhardwaj')

  const [selectedProd, setSelectedProd] = useState(null);
  const [prodSearch, setProdSearch] = useState('');
  const [pSuggestions, setPSuggestions] = useState([]);

  const [taxType, setTaxType] = useState('18'); // Default 18%
  const [calcMode, setCalcMode] = useState('Inclusive'); 
  const [itemsList, setItemsList] = useState([]);
  const [ledger, setLedger] = useState('');
  const [paymode, setpaymode] = useState('Credit');
  const [today, settoday] = useState(new Date().toISOString().slice(0, 10));
  const [InvoiceNo, setInvoiceNo] = useState('')

  const [CreditLedger, setCreditLedger] = useState('')

  const [bankdate, setbankdate] = useState('')
  const [bankref, setbankref] = useState('')

  const getproduct=async()=>{
                const res=await getData('/trade/vendors')
                const prod=await getData('/trade/products')
                const l = await getData("/ledgers");
                setproducts(prod)
                setledgers(l)
                setClients(res)
            }
        
    useEffect(() => {
    getproduct()
    }, [])


      // --- IMAGE HANDLING ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBillImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setBillImage(null);
    setImagePreview(null);
  };

  // --- SEARCH LOGIC ---
  useEffect(() => {
    setVSuggestions(vendorSearch && !selectedVendor ? vendorsDB.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase())) : []);
  }, [vendorSearch, selectedVendor]);

  useEffect(() => {
    setPSuggestions(prodSearch && !selectedProd ? productsDB.filter(p => p.productName.toLowerCase().includes(prodSearch.toLowerCase())) : []);
  }, [prodSearch, selectedProd]);

  // --- ADD ITEM LOGIC ---
  const handleAddItem = () => {
    if (!selectedProd) return;
    
    const isRcm = taxType === 'RCM';
    // const gstRate = isRcm ? 18 : parseInt(taxType);
    const gstRate = parseFloat(selectedProd.gstPercentage)
    let basePrice, gstAmount, total;

    if (calcMode === 'Exclusive') {
      basePrice = selectedProd.price;
      gstAmount = (basePrice * gstRate) / 100;
      total = parseFloat(basePrice) + parseFloat(gstAmount);
    } else {
      total = selectedProd.price;
      basePrice = total / (1 + gstRate / 100);
      gstAmount = total - basePrice;
    }

    total = Number(total).toFixed(2); // Round total to 2 decimals
    const newItem = {
      ...selectedProd,
      tempId: Date.now(),
      gstRate,
      isRcm,
      quantity: 1,
      calcMode,
      basePrice: Number(basePrice).toFixed(2),
      gstAmount: Number(gstAmount).toFixed(2),
      total,
    };

    setItemsList([...itemsList, newItem]);
    setSelectedProd(null);
    setProdSearch('');
  };

  // --- EDIT PRICE LOGIC ---
  const handlePriceChange = (tempId, newPrice) => {

    if (newPrice === '' || newPrice === '0') {
    setItemsList(itemsList.map(item => {
      if (item.tempId === tempId) {
        return {
          ...item,
          price: '',
          basePrice: 0,
          gstAmount: 0,
          total: 0
        };
      }
      return item;
    }));
    return;
  }

    const val = parseFloat(newPrice) || 0;
    setItemsList(itemsList.map(item => {
      if (item.tempId === tempId) {
        let newBase, newGst, newTotal;
        const currentRate = item.gstRate;

        const qty = item.quantity || 1;
        
        if (item.calcMode === 'Exclusive') {
          newBase = val * qty;
          newGst = (newBase * currentRate) / 100;
          newTotal = parseFloat(newBase) + parseFloat(newGst);
        } else {
          newTotal = val * qty;
          newBase = newTotal / (1 + currentRate / 100);
          newGst = newTotal - newBase;
        }
        return {
          ...item,
          price: val,
          basePrice: parseFloat(newBase.toFixed(2)),
          gstAmount: parseFloat(newGst.toFixed(2)),
          total: parseFloat(newTotal.toFixed(2))
        };
      }
      return item;
    }));
  };


  const handleQtyChange = (tempId, qty) => {
  const q = parseFloat(qty) || 1;

  setItemsList(itemsList.map(item => {
    if (item.tempId === tempId) {
      const price = parseFloat(item.price) || 0;
      const rate = item.gstRate;

      let base, gst, total;

      if (item.calcMode === 'Exclusive') {
        base = price * q;
        gst = (base * rate) / 100;
        total = base + gst;
      } else {
        total = price * q;
        base = total / (1 + rate / 100);
        gst = total - base;
      }

      return {
        ...item,
        quantity: q,
        basePrice: base.toFixed(2),
        gstAmount: gst.toFixed(2),
        total: total.toFixed(2),
      };
    }
    return item;
  }));
};

  const removeItem = (id) => setItemsList(itemsList.filter(i => i.tempId !== id));

  // --- CALCULATION HELPER ---
  const grandTotals = itemsList.reduce((acc, item) => ({
    total: parseFloat(acc.total) + parseFloat(item.total)
  }), { total: 0 });


 const handleUpload = async () => {
  if (!billImage) return null;

  const formData = new FormData();
  formData.append("image", billImage);

  try {
    const response = await axios.post(
      "https://api.care2connect.in/duniyape/aws/upload",
      formData
    );

    return response.data.url;
  } catch (error) {
    console.error(error.response?.data);
    return null;
  }
};

  // --- SUBMIT FUNCTIONALITY ---
  const handleSubmit = async() => {
    setLoading(true)
    const uri = await handleUpload()
    const finalInvoiceData = {
      invoiceId: InvoiceNo,
      vendor: selectedVendor,
      ledgerAccount: ledger,
      ledgerName: ledgers.filter(item=>item.Code===ledger)[0].LedgerName,
      paymentMode: paymode,
      items: itemsList,
      grandTotal: Number(grandTotals.total).toFixed(2),
      date: new Date(today).toISOString(),
       billImage: uri, // Sending base64 string
       bankref,
       bankdate,
       director,
       invType:taxType==="RCM"?'RCM':'GST',
       GST,
       POS,
       CreditLedger,
       CreditLedgerName:ledgers.filter(item=>item.Code===CreditLedger)[0].LedgerName
    };

    console.log("Saving Transaction Data...", finalInvoiceData);
    alert(`Success! Invoice ${finalInvoiceData.invoiceId} saved to database.`);
    await postData("/trade/api/calculate-expense", finalInvoiceData)

    // Reset UI
    setLoading(false)
    setItemsList([]);
    setSelectedVendor(null);
    setVendorSearch('');
    setBillImage(null);
    setImagePreview(null);
    setLedger('');
    settoday(new Date().toISOString().slice(0, 10));
    setInvoiceNo('');
setGST('');
setPOS('');
setCreditLedger('');
  };

  function gstToState(gstin,s) {
    if (!gstin || gstin.length < 2) {
        return s;
    }

    const stateCode = gstin.substring(0, 2);

    const stateCodes = {
        "01": "Jammu & Kashmir",
        "02": "Himachal Pradesh",
        "03": "Punjab",
        "04": "Chandigarh",
        "05": "Uttarakhand",
        "06": "Haryana",
        "07": "Delhi",
        "08": "Rajasthan",
        "09": "Uttar Pradesh",
        "10": "Bihar",
        "11": "Sikkim",
        "12": "Arunachal Pradesh",
        "13": "Nagaland",
        "14": "Manipur",
        "15": "Mizoram",
        "16": "Tripura",
        "17": "Meghalaya",
        "18": "Assam",
        "19": "West Bengal",
        "20": "Jharkhand",
        "21": "Odisha",
        "22": "Chhattisgarh",
        "23": "Madhya Pradesh",
        "24": "Gujarat",
        "25": "Daman & Diu",
        "26": "Dadra & Nagar Haveli",
        "27": "Maharashtra",
        "28": "Andhra Pradesh",
        "29": "Karnataka",
        "30": "Goa",
        "31": "Lakshadweep",
        "32": "Kerala",
        "33": "Tamil Nadu",
        "34": "Puducherry",
        "35": "Andaman & Nicobar Islands",
        "36": "Telangana",
        "37": "Andhra Pradesh (New)",
        "38": "Ladakh"
    };

    return stateCodes[stateCode] || s;
}

  useEffect(() => {
    if (selectedVendor) {
      setPOS(gstToState(selectedVendor.gstin,selectedVendor.state))
      setGST(selectedVendor.gstin)
      setpersonalLedgers(selectedVendor.plist?selectedVendor.plist:[])
    }
  }, [selectedVendor])
  

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* ENTRY PANEL */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

             <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Date</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  value={today}
                  onChange={(e) => settoday(e.target.value)}
                />
            </div>

             <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Invoice No.</label>
                <input
                  type="text"
                  placeholder="Invoice No...."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  value={InvoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
            </div>
            
            {/* VENDOR */}
            <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block"> Vendor</label>
              {!selectedVendor ? (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Vendor..."
                    className="w-full pl-3 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                  />
                  {vSuggestions.length > 0 && (
                    <div className="absolute z-30 w-full bg-white border rounded-lg shadow-xl mt-1 overflow-hidden">
                      {vSuggestions.map(v => (
                        <div key={v._id} onClick={() => setSelectedVendor(v)} className="p-2 hover:bg-blue-50 cursor-pointer text-xs flex justify-between">
                          <span className="font-bold">{v.name}</span>
                          {/* <span className="text-[10px] text-slate-400">{v.id}</span> */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-bold truncate">{selectedVendor.name}</span>
                  <button onClick={() => setSelectedVendor(null)}><X size={14}/></button>
                </div>
              )}
            </div>

            {/* PRODUCT */}
            <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block"> Product</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Find Product..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                />
                {pSuggestions.length > 0 && (
                  <div className="absolute z-30 w-full bg-white border rounded-lg shadow-xl mt-1 overflow-hidden">
                    {pSuggestions.map(p => (
                      <div key={p._id} onClick={() => {setSelectedProd(p); setProdSearch(p.productName); setPSuggestions([]);}} className="p-2 hover:bg-emerald-50 cursor-pointer text-xs flex justify-between border-b">
                        <span>{p.productName}</span>
                        <span className="font-bold">₹{p.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* GST RATE DROP DOWN (NOW INCLUDES RCM) */}
            <div className="lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">RCM Apply</label>
              <select 
                value={taxType} 
                onChange={(e) =>{ setTaxType(e.target.value); if (e.target.value==='RCM') {
                  setCalcMode('Exclusive')
                }else{
                  setCalcMode('Inclusive')
                }}} 
                className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg outline-none font-bold bg-white"
              >
                <option value="18">No</option>
                <option value="RCM">Yes</option>
              </select>
            </div>

             <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">GST</label>
                <input
                  type="text"
                  placeholder="GST..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  value={GST}
                  onChange={(e) => setGST(e.target.value)}
                />
            </div>

            <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">State of Supply</label>
                <input
                  type="text"
                  placeholder="Place of Supply..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  value={POS}
                  onChange={(e) => setPOS(e.target.value)}
                />
            </div>

            {/* MODE & ADD */}
            <div className="lg:col-span-4 flex gap-2">
              <div className="flex-grow">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block"> Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setCalcMode('Exclusive')} className={`flex-1 text-[10px] py-1 rounded-md font-bold transition-all ${calcMode === 'Exclusive' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Excl.</button>
                  <button onClick={() => setCalcMode('Inclusive')} className={`flex-1 text-[10px] py-1 rounded-md font-bold transition-all ${calcMode === 'Inclusive' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Incl.</button>
                </div>
              </div>
              <button 
                onClick={handleAddItem}
                disabled={!selectedProd}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-all disabled:opacity-20 self-end"
              >
                <Plus size={18}/>
              </button>
            </div>
          </div>
        </div>

        {/* LIST TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b tracking-widest">
                <th className="p-4">Item & Mode</th>
                <th className="p-4 text-right">Price (Edit)</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-center">Tax Info</th>
              {POS==='Punjab'?<><th className="p-4 text-right">CGST Amount</th>
                <th className="p-4 text-right">SGST Amount</th></> :<th className="p-4 text-right">IGST Amount</th>}
                <th className="p-4 text-right">Net Total</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsList.map((item) => (
                <tr key={item.tempId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold">{item.productName}</p>
                    <div className="flex gap-1 mt-1">
                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${item.calcMode === 'Inclusive' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{item.calcMode}</span>
                      {item.isRcm && <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-50 text-purple-600 uppercase">RCM</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <input 
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      className="w-20 text-right bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-mono font-bold"
                      value={item.price}
                      onChange={(e) => handlePriceChange(item.tempId, e.target.value)}
                    />
                  </td>
                  <td className="p-4 text-center">
  <input
    type="number"
    min="1"
    className="w-16 text-center border-b outline-none"
    value={item.quantity || 1}
    onChange={(e) => handleQtyChange(item.tempId, e.target.value)}
  />
</td>
                  <td className="p-4 text-center font-bold">
                    {item.isRcm ? `RCM (${item.gstRate}%)` : `${item.gstRate}%`}
                  </td>
              { POS==='Punjab'?<>  <td className="p-4 text-right font-mono text-slate-500">₹{item.gstAmount/2}</td>
                  <td className="p-4 text-right font-mono text-slate-500">₹{item.gstAmount/2}</td></> :<td className="p-4 text-right font-mono text-slate-500">₹{item.gstAmount}</td>}
                  <td className="p-4 text-right font-bold text-slate-900">₹{item.total}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => removeItem(item.tempId)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
              {itemsList.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-300 italic">No items added to list.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="bg-slate-50 p-4 border-t flex justify-end gap-8">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grand Total</p>
              <p className="text-xl font-black text-slate-900 italic">₹{Number(grandTotals.total).toFixed(2)}</p>
            </div>
          </div>
        </div>



        {/* BOTTOM ACTION BAR */}
               <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] p-4 md:relative md:bg-white md:rounded-2xl md:border md:shadow-sm md:p-6 mb-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
             

 {/* Bill Image Upload Component */}
            <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Attach Bill</label>
              {!imagePreview ? (
                <label className="flex items-center justify-center w-full h-[34px] border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-2">
                    <Upload size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500">Upload Image</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              ) : (
                <div className="relative h-[34px] w-[34px] rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={removeImage} className="text-white p-1 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>




          <div className="lg:col-span-3">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Select Ledger</div>
             <select 
               value={ledger} 
               onChange={(e) => setLedger(e.target.value)}
               className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all cursor-pointer"
             >
               <option value="">Select Ledger Account...</option>
               {ledgers.filter(item=>item.GroupType==="Expenditure").map(l => <option key={l._id} value={l.Code}>{l.LedgerName}</option>)}
             </select>
          </div>


           <div className="lg:col-span-3">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Payment Mode</div>
             <select 
               value={paymode} 
               onChange={(e) => setpaymode(e.target.value)}
               className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all cursor-pointer"
             >
               {/* <option value="">Select Ledger Account...</option> */}
               <option key='Cash' value='Cash'>Cash</option>
               <option key='Bank' value='Bank'>Bank</option>
               <option key='Credit' value='Credit'>Credit</option>
               {/* <option key='Director' value='Director'>Director</option> */}
               {/* <option key={l._id} value={l.Code}>{l.LedgerName}</option> */}
               {/* {ledgers.map(l => <option key={l._id} value={l.Code}>{l.LedgerName}</option>)} */}
             </select>
          </div>


        { paymode==='Credit'&& <><div className="lg:col-span-3">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Select Payable Ledger</div>
             <select 
               value={CreditLedger} 
               onChange={(e) => setCreditLedger(e.target.value)}
               className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all cursor-pointer"
             >
               <option value="">Select Ledger Account...</option>
               {ledgers.filter(item=>(personalLedgers.includes(item.Code))).map(l => <option key={l._id} value={l.Code}>{l.LedgerName}</option>)}
             </select>
          </div>
          
          {CreditLedger&&<div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Vender Account Name</label>
                <input
                  type="text"
                  disabled
                  placeholder="Vender Name..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  value={selectedVendor?.name +' - ' +ledgers.filter(item=>item.Code===CreditLedger)[0].LedgerName}
                  // onChange={(e) => setGST(e.target.value)}
                />
            </div>}
          </>
          }


          {paymode==='Bank'&& <>

         <div className="lg:col-span-3">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Select Bank</div>
             <select 
              //  value={director} 
              //  onChange={(e) => setdirector(e.target.value)}
               className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all cursor-pointer"
             >
               {/* <option value="">Select Ledger Account...</option> */}
               <option key='c' value='Harish Kumar Bhardwaj'>IDBI Bank</option>
               {/* <option key='b' value='Indrajeet Ajeet'>Indrajeet Ajit</option> */}
               {/* <option key={l._id} value={l.Code}>{l.LedgerName}</option> */}
               {/* {ledgers.map(l => <option key={l._id} value={l.Code}>{l.LedgerName}</option>)} */}
             </select>
          </div>
          
          
          
          
          

             <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Bank Ref./ Cheque No.</label>
                <input
                  type="text"
                  placeholder="Bank Ref./ Cheque No...."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  value={bankref}
                  onChange={(e) => setbankref(e.target.value)}
                />
            </div>

             <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Date</label>
                <input
                  type="date"
                  placeholder="Invoice No...."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  value={bankdate}
                  onChange={(e) => setbankdate(e.target.value)}
                />
            </div>
            </>
            }

          {paymode==='Director'&& <div className="lg:col-span-3">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Select Director</div>
             <select 
               value={director} 
               onChange={(e) => setdirector(e.target.value)}
               className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all cursor-pointer"
             >
               {/* <option value="">Select Ledger Account...</option> */}
               <option key='c' value='Harish Kumar Bhardwaj'>Harish Kumar Bhardwaj</option>
               <option key='b' value='Indrajeet Ajeet'>Indrajeet Ajit</option>
               {/* <option key={l._id} value={l.Code}>{l.LedgerName}</option> */}
               {/* {ledgers.map(l => <option key={l._id} value={l.Code}>{l.LedgerName}</option>)} */}
             </select>
          </div>}

          <div className="lg:col-span-12 mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={handleSubmit}
                  disabled={!selectedVendor || itemsList.length === 0 || !ledger || Loading}
                  className={`
                    w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest 
                    flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg
                    ${!selectedVendor || itemsList.length === 0 || !ledger 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 ring-4 ring-blue-500/10'
                    }
                  `}
                >
                  {Loading ? (
                    <>Processing <Loader2 size={16} className="animate-spin" /></>
                  ) : (
                    <>Submit & Save <CheckCircle size={16}/></>
                  )}
                </button>
              </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingBillingUI;