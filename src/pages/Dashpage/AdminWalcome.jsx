import React, { useState } from 'react';
import { 
  FileText, 
  ArrowUpRight,
  File,
  BookOpen,
  PackagePlus,
  IndianRupee,
  CheckCheck,
  ShieldCheck,
  Lock,
  LayoutDashboard
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
const App = () => {
  // Mock navigation state
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('welcome');

  const quickActions = [
    { 
      title: "View Vouchers", 
      desc: "Financial records", 
      icon: <BookOpen className="text-red-600" />, 
      color: "bg-red-50",
      route: '/accounting/vouchers'
    },
    { 
      title: "View Ledgers", 
      desc: "Account summaries", 
      icon: <File className="text-blue-600" />, 
      color: "bg-blue-50",
      route: '/accounting'
    },
    { 
      title: "View Statements", 
      desc: "Personal reports", 
      icon: <FileText className="text-yellow-600" />, 
      color: "bg-yellow-50",
      route: '/reports/personal_statement'
    },
    { 
      title: "Journal Voucher", 
      desc: "Internal entries", 
      icon: <PackagePlus className="text-violet-600" />, 
      color: "bg-violet-50",
      route: '/accounting/journal_voucher1'
    },
    { 
      title: "Payment Voucher", 
      desc: "Cash outflows", 
      icon: <IndianRupee className="text-amber-600" />, 
      color: "bg-amber-50",
      route: '/accounting/payment_voucher1'
    },
    { 
      title: "Receipt Voucher", 
      desc: "Cash inflows", 
      icon: <CheckCheck className="text-emerald-600" />, 
      color: "bg-emerald-50",
      route: '/accounting/reciept_voucher'
    }
  ];

  const handleNavigate = (route) => {
   navigate(route)
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-900 flex flex-col">
      
     

      {/* Main Content Area - Full Size */}
      <main className="flex-1 w-full flex flex-col p-6 md:p-12 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Welcome Back, Administrator</h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Quickly access your accounting modules, generate statements, and manage financial vouchers from your central dashboard.
          </p>
        </div>

        {/* Quick Action Grid - Full width scaling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {quickActions.map((action, idx) => (
            <button 
              onClick={() => handleNavigate(action.route)}
              key={idx} 
              className="group flex items-start gap-5 text-left bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:border-blue-300 hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 active:scale-[0.98]"
            >
              {/* Compact Icon Box */}
              <div className={`${action.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shrink-0 shadow-sm`}>
                {React.cloneElement(action.icon, { size: 24 })}
              </div>
              
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800 text-base">
                    {action.title}
                  </h3>
                  <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>

      </main>


     
    </div>
  );
};

export default App;