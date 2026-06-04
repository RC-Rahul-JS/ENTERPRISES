import React from 'react';
import { 
  FileText, 
  UploadCloud, 
  Calendar, 
  ShieldCheck, 
  MessageSquare, 
  Download, 
  ArrowUpRight,
  CreditCard
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
const CAWalcome = () => {
      const navigate = useNavigate();
  const quickActions = [
    { 
      title: "Trial Balance", 
      desc: "Trial Balance Report", 
      icon: <FileText className="text-blue-600" />, 
      color: "bg-blue-50",
      route: '/'
    },
    { 
      title: "Financial", 
      desc: "Financial Statements", 
      icon: <UploadCloud className="text-purple-600" />, 
      color: "bg-purple-50",
      route: '/financial_report'
    },
    // { 
    //   title: "GST Report", 
    //   desc: "GST Report", 
    //   icon: <Calendar className="text-emerald-600" />, 
    //   color: "bg-emerald-50",
    //   route: '/gst_subledger'
    // },
    { 
      title: "GST Reports", 
      desc: "GST Reports", 
      icon: <Download className="text-amber-600" />, 
      color: "bg-amber-50",
      route: '/c2c_gst'
    },
     { 
      title: "RCM Reports", 
      desc: "RCM Reports", 
      icon: <Download className="text-amber-600" />, 
      color: "bg-amber-50",
      route: '/rcm'
    },
    // { 
    //   title: "Check Status", 
    //   desc: "Live Case Tracking", 
    //   icon: <ShieldCheck className="text-rose-600" />, 
    //   color: "bg-rose-50"
    // },
    // { 
    //   title: "Billings & Pay", 
    //   desc: "Invoices & Receipts", 
    //   icon: <CreditCard className="text-indigo-600" />, 
    //   color: "bg-indigo-50"
    // },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        
        {/* Main Content Area */}
        <div className="p-8 md:p-16">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <ShieldCheck size={14} /> Premier CA Client Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Welcome back, CA 👋
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Your financial dashboard is ready. 
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {quickActions.map((action, idx) => (
              <button 
              onClick={()=>{if(action.route==='/c2c_gst'||action.route==='/rcm'){navigate(`/reports${action.route}`)}else{}}}
                key={idx} 
                className="group flex flex-col items-center text-center bg-slate-50/50 p-8 rounded-[32px] border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all active:scale-95"
              >
                <div className={`${action.color} p-5 rounded-2xl mb-5 group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(action.icon, { size: 32 })}
                </div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-1">
                  {action.title}
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 -translate-y-1 transition-all" />
                </h3>
                <p className="text-sm text-slate-500">{action.desc}</p>
              </button>
            ))}
          </div>

        </div>

        {/* Minimal Footer */}
        <div className="bg-slate-50 px-8 py-4 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100">
          <span>Secure 256-bit Encryption</span>
          <span>© 2025 Duniyape Technologies Private Limited</span>
        </div>
      </div>
    </div>
  );
};

export default CAWalcome;