import React, { useEffect, useState } from 'react';
import { 
  User, 
  BookOpen, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import useApi from "../../api/useApi";
// Mock Data
const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 'c2', name: 'Global Tech Solutions', industry: 'Software' },
  { id: 'c3', name: 'Bright Future Edu', industry: 'Education' },
  { id: 'c4', name: 'HealthFirst Inc', industry: 'Healthcare' },
  { id: 'c5', name: 'Starlight Retail', industry: 'Retail' },
];

const MOCK_LEDGERS = [
  { id: 'l1', name: 'Sales Revenue', code: 'REV-101' },
  { id: 'l2', name: 'Accounts Receivable', code: 'ASSET-201' },
  { id: 'l3', name: 'Operational Expenses', code: 'EXP-301' },
  { id: 'l4', name: 'Taxes Payable', code: 'LIAB-401' },
  { id: 'l5', name: 'Marketing Budget', code: 'EXP-302' },
  { id: 'l6', name: 'Consulting Fees', code: 'REV-102' },
];

export default function AssignPersonalLedger() {
    const {getData,postData}= useApi()
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedLedgerIds, setSelectedLedgerIds] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
 const [employees, setemployee] = useState([])
  const selectedCustomer = employees.find(c => c._id === selectedCustomerId);

    const [groups, setGroups] = useState([]);
  const [accounts, setAccounts] = useState([]); // List of all available ledgers

     const [formData, setFormData] = useState({
    grouptype: "",
    group_id: "",
  });

  useEffect(() => {
  const Customer = employees.find(c => c._id === selectedCustomerId);
  setSelectedLedgerIds(Customer?.plist??[])
  console.log(Customer?.plist)
  }, [selectedCustomerId])
  
 
      const fetchdata1 = async () => {
          try {
            const res2 = await getData("/trade/search-data");
            console.log(res2)
            if (Array.isArray(res2)) {
              setemployee(res2);
            } 
          } catch (error) {
            console.error("Failed to load appointments:", error);
          }
        };
    useEffect(() => {
          fetchdata1();
        }, []);

           // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    try {
      const g = await getData("/groups");
      const res = await getData("/ledgers");
      if (Array.isArray(g)) setGroups(g);
      if (Array.isArray(res)) setAccounts(res);
    } catch (e) {
      showErrorAlert("Error", "Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

   // ---------------- HANDLE CHANGE ----------------
  const handleChange1 = (e) => {
    const { name, value } = e.target;

    if (name === "grouptype") {
      setFormData({
        _id: "",
        grouptype: value,
        group_id: "",
        subgroupname: "",
        ledgername: "",
      });
    } else if (name === "group_id") {
      setFormData((p) => ({
        ...p,
        group_id: value,
        subgroupname: "",
        ledgername: "",
      }));
    } else if (name === "subgroupname") {
      setFormData((p) => ({
        ...p,
        subgroupname: value,
        ledgername: "",
      }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddLedger = (ledgerId) => {
    if (!ledgerId) return;
    if (selectedLedgerIds.includes(ledgerId)) {
      showNotification('Ledger already added to this batch', 'error');
      return;
    }
    setSelectedLedgerIds([...selectedLedgerIds, ledgerId]);
    console.log([...selectedLedgerIds, ledgerId])
  };

  const removeLedger = (id) => {
    setSelectedLedgerIds(selectedLedgerIds.filter(lid => lid !== id));
  };

  const handleFinalSubmit = async() => {
    if (!selectedCustomerId) {
      showNotification('Please select a customer first', 'error');
      return;
    }
    if (selectedLedgerIds.length === 0) {
      showNotification('Please add at least one ledger', 'error');
      return;
    }

    setIsSubmitting(true);
    await postData(`/trade/assign-data/${selectedCustomerId}`,{usertype:selectedCustomer.usertype,plist:selectedLedgerIds})
    showNotification(`Successfully assigned ${selectedLedgerIds.length} ledgers to ${selectedCustomer.name}`);
    setSelectedLedgerIds([]);
    setSelectedCustomerId('');
    setIsSubmitting(false);
  };
  
  const filteredGroups = groups.filter((g) => g.GroupType === formData.grouptype);
  const filteredaccounts = accounts.filter((s) => s.Group_id === formData.group_id);


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden transition-all">
          
          {/* Header */}
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <ArrowRightLeft size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Assign Ledgers</h1>
            </div>
            <p className="text-slate-400 text-sm">Select a customer and link multiple financial ledgers to their account.</p>
          </div>

          <div className="p-8 space-y-8">
            
            {/* Step 1: Customer */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-blue-500" /> Select Customer
              </label>
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-lg font-medium"
              >
                <option value="">Choose Customer...</option>
                {employees.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-blue-500" /> GroupType
              </label>
              <select 
                value={formData.grouptype}
                name='grouptype'
                onChange={handleChange1}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-lg font-medium"
              >
                 <option value="">Select</option>
                 {["Income", "Assets", "Expenditure", "Liabilities"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-blue-500" />  GroupName
              </label>
              <select 
                value={formData.group_id}
                name='group_id'
                onChange={handleChange1}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-lg font-medium"
              >
                 <option value="">Select</option>
                  {filteredGroups.map((g) => (
                      <option key={g._id} value={g._id}>{g.GroupName}</option>
                    ))}
              </select>
            </div>

            {/* Step 2: Ledgers */}
            <div className={`space-y-4 transition-all ${!selectedCustomerId ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={14} className="text-blue-500" /> Add Ledgers
              </label>
              
              <div className="flex gap-2">
                <select 
                  onChange={(e) => handleAddLedger(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-medium"
                >
                  <option value="">Select Ledger to Add...</option>
                  {filteredaccounts.map((acc, idx) => (
                  <option key={idx} value={acc.Code}>
                    {acc.LedgerName}
                  </option>
                ))}
                </select>
              </div>

              {/* Ledger Chips Container */}
              <div className="min-h-[100px] p-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-wrap gap-2 items-start content-start">
                {selectedLedgerIds.length > 0 ? (
                  selectedLedgerIds.map(id => {
                    const ledger = accounts.find(l => l.Code === id);
                    if(ledger){ return (
                      <div 
                        key={id} 
                        className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm group hover:border-blue-200 transition-all animate-in zoom-in-95"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-blue-600 leading-none mb-1">{ledger.Code}</span>
                          <span className="text-sm font-semibold text-slate-700">{ledger.LedgerName}</span>
                        </div>
                        <button 
                          onClick={() => removeLedger(id)}
                          className="ml-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm italic">
                    No ledgers added yet...
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-4">
              <button 
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !selectedCustomerId || selectedLedgerIds.length === 0}
                className={`w-full py-5 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                  isSubmitting || !selectedCustomerId || selectedLedgerIds.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirm Assignment
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 border ${
            notification.type === 'error' 
              ? 'bg-red-50 text-red-800 border-red-200' 
              : 'bg-green-50 text-green-800 border-green-200'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-bold">{notification.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}