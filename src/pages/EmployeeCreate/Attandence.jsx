import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Trash2, 
  Edit3, 
  X,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  UserCheck,
  Phone,
  Home
} from 'lucide-react';
import useApi from "../../api/useApi";
import moment from 'moment/moment';
// --- Mock Data ---
const INITIAL_EMPLOYEES = [
  { id: 1, name: 'Sarah Johnson', role: 'Senior Product Designer', email: 'sarah.j@company.com', phone: '+1 (555) 123-4567', address: '123 Maple Ave, San Francisco, CA', department: 'Design', status: 'Active', avatar: 'SJ' },
  { id: 2, name: 'Michael Chen', role: 'Full Stack Developer', email: 'm.chen@company.com', phone: '+1 (555) 987-6543', address: '456 Oak St, Seattle, WA', department: 'Engineering', status: 'Active', avatar: 'MC' },
  { id: 3, name: 'Elena Rodriguez', role: 'HR Manager', email: 'elena.r@company.com', phone: '+1 (555) 246-1357', address: '789 Pine Rd, Austin, TX', department: 'People', status: 'On Leave', avatar: 'ER' },
  { id: 4, name: 'David Smith', role: 'Marketing Specialist', email: 'd.smith@company.com', phone: '+1 (555) 369-2580', address: '101 Cedar Ln, New York, NY', department: 'Marketing', status: 'Active', avatar: 'DS' },
  { id: 5, name: 'Jessica Lee', role: 'DevOps Engineer', email: 'jlee@company.com', phone: '+1 (555) 159-7531', address: '202 Birch Blvd, Denver, CO', department: 'Engineering', status: 'Active', avatar: 'JL' },
  { id: 6, name: 'Marcus Taylor', role: 'Sales Lead', email: 'marcus.t@company.com', phone: '+1 (555) 753-9514', address: '303 Spruce Ct, Chicago, IL', department: 'Sales', status: 'Inactive', avatar: 'MT' },
];

const INITIAL_LEAVE_REQUESTS = [
  { id: 101, name: 'Michael Chen', type: 'Annual Leave', duration: '3 Days', date: 'Oct 12 - Oct 15', status: 'Pending', avatar: 'MC' },
  { id: 102, name: 'Jessica Lee', type: 'Sick Leave', duration: '1 Day', date: 'Oct 10', status: 'Pending', avatar: 'JL' },
];

const DEPARTMENTS = ['All', 'Engineering', 'Design', 'Marketing', 'People', 'Sales'];

// Helper to generate mock activity for the calendar
const getMockActivity = (day, month, year, at) => {
  // const seed = day + month + year;
  // console.log(at)

  const match = at.filter((item)=>(item.month===month&&item.day===day&&item.year===year))
  if (match.length===0) return null;
  if (match[0].status==='P') return 'attendance';
  if (match[0].status==='L') return 'leave';
  if (match[0].status==='O') return 'duty';


  // if (day % 7 === 0 || day % 7 === 6) return null; // Weekends
  // if (seed % 15 === 0) return 'leave';
  // if (seed % 12 === 0) return 'duty';
  // if (seed % 2 === 0) return 'attendance';
  return null;
};

// --- Sub-Components ---

const Badge = ({ children, status }) => {
  const styles = {
    Active: 'bg-green-100 text-green-700 border-green-200',
    'On Leave': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Inactive: 'bg-gray-100 text-gray-700 border-gray-200',
    Pending: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status] || styles.Inactive}`}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in fade-in zoom-in duration-200`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[85vh]">{children}</div>
      </div>
    </div>
  );
};

const CalendarWidget = ({ employee , at}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 border border-slate-50 bg-slate-50/30"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const type = getMockActivity(d, currentDate.getMonth(), currentDate.getFullYear(), at);
      let dotColor = "";
      if (type === 'attendance') dotColor = "bg-green-500";
      if (type === 'leave') dotColor = "bg-amber-500";
      if (type === 'duty') dotColor = "bg-indigo-500";

      days.push(
        <div key={d} className="h-12 border border-slate-50 relative flex items-center justify-center hover:bg-slate-50 transition-colors cursor-default group">
          <span className="text-sm font-medium text-slate-600 z-10">{d}</span>
          {dotColor && (
            <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${dotColor} shadow-sm`}></div>
          )}
          {type && (
            <div className="absolute inset-1 rounded-lg opacity-0 group-hover:opacity-10 bg-slate-900 transition-opacity"></div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-4 bg-slate-50 flex items-center justify-between">
        <h4 className="font-bold text-slate-800 text-sm">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 active:scale-90">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 active:scale-90">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center border-b border-slate-50">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-white">{renderDays()}</div>
      <div className="p-4 border-t border-slate-50 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Duty</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
      const { getData, postData } = useApi();
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [AttandenceData, setAttandenceData] = useState({})

  const [formData, setFormData] = useState({ 
    name: '', 
    role: '', 
    email: '', 
    phone: '', 
    address: '', 
    department: 'Engineering', 
    status: 'Active' 
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           emp.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, deptFilter]);

  const handleOpenEditModal = (e, emp = null) => {
    e.stopPropagation();
    if (emp) {
      setEditingEmployee(emp);
      setFormData({ ...emp });
    } else {
      setEditingEmployee(null);
      setFormData({ name: '', role: '', email: '', phone: '', address: '', department: 'Engineering', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleViewEmployee = async(emp) => {
    const res = await getData(`/staff/api/get-attendance/${emp.phone}`);
    setAttandenceData(res.data)
    setViewingEmployee(emp);
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (editingEmployee) {
      setEmployees(employees.map(emp => emp._id === editingEmployee._id ? { ...formData, _id: emp._id, avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase() } : emp));
    } else {

        try {
            const data = {
    name: formData.name,
    phone: formData.phone,
    dob: formData.phone,
    age: formData.phone,
    address: formData.address,
    designation: '699adeffef0f329d90a0f35e',
    password: "123456",
    confirmPassword: "123456",
    photo: null,
    pAccount:'A17',
    profile_id:'x',
    department: 'Engineering', 
    status: 'Active' ,
    email:formData.email,
    role: formData.role

  }

  console.log(data)
                await postData(`/staff/create`, data );
                
        } catch (error) {
                  console.error("Failed to save group:", error);
                //   showErrorAlert("Error", "Could not save. Please try again.");   
        }   
        

      const newEmp = { ...formData, _id: Date.now(), avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase() };
      setEmployees([newEmp, ...employees]);
    }
    setIsModalOpen(false);
  };

  const deleteEmployee = (e, id) => {
    e.stopPropagation();
    setEmployees(employees.filter(emp => emp._id !== id));
  };


  const fetchdata = async () => {
        try {
        //   const res = await getData("/staff/designations");
          const res2 = await getData("/staff");
          const req = await getData("/staff/api/get-attendance-req");
          console.log(res2)
          setLeaveRequests(req.data)
          if (Array.isArray(res2)) {
            // setDesignations(res);
            setEmployees(res2.filter((item)=>(item.designation==='699adeffef0f329d90a0f35e')));
          } 
        } catch (error) {
          console.error("Failed to load appointments:", error);
        //   showErrorAlert("Error", "Could not load Data. Please try again."); 
        }
      };
      useEffect(() => {
            fetchdata();
          }, []);


          const updatestatus=async(id,s)=>{
            await postData("/staff/api/update-attendance-status",{attendance_id:id,status:s});
            fetchdata();
          }



  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <Users className="text-indigo-600" size={32} />
              Attandence
            </h1>
            <p className="text-slate-500 mt-1">Manage personnel records, contact details, and attendance.</p>
          </div>
          <button 
            onClick={(e) => handleOpenEditModal(e)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
          >
            <Plus size={20} />
            Add Employee
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-13 gap-8 items-start">
          
          {/* Employee Directory */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search members..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="w-full sm:w-40 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-medium"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    {/* <th className="px-6 py-4 text-right"></th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEmployees.map((emp) => (
                    <tr 
                      key={emp._id} 
                      onClick={() => handleViewEmployee(emp)}
                      className="hover:bg-indigo-50/30 transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs">
                            {emp?.name?.charAt(0)?.toUpperCase() || ""}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{emp.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10} /> {emp.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700 font-medium text-sm">{emp.role}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{emp.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={emp.status}>{emp.status}</Badge>
                      </td>
                      {/* <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => handleOpenEditModal(e, emp)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg"><Edit3 size={16} /></button>
                          <button onClick={(e) => deleteEmployee(e, emp._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900"><Clock size={18} className="text-amber-500" />Requests</div>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{leaveRequests.length} Pending</span>
              </div>
              <div className="p-4 space-y-3">
                {leaveRequests.map(req => (
                  <div key={req._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600">{req?.name?.charAt(0)?.toUpperCase() || ""}</div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{req.name}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">{req.phone}</div>
                        <div className={req.status==='RL'?"text-[9px] text-red-500 font-bold uppercase":"text-[9px] text-amber-500 font-bold uppercase"}>{req.status==='RL'?'for leave':'for official duty'} - {moment(req.date).format("DD MMM YYYY")}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>updatestatus(req._id,req.status==='RL'?'L':'O')} className="p-1.5 bg-white border border-slate-200 text-green-600 rounded-lg hover:bg-green-50"><CheckCircle2 size={14} /></button>
                      <button onClick={()=>updatestatus(req._id,'X')} className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500"><XCircle size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Details & Calendar Modal */}
      <Modal 
        isOpen={!!viewingEmployee} 
        onClose={() => setViewingEmployee(null)} 
        title="Employee Profile"
        maxWidth="max-w-3xl"
      >
        {viewingEmployee && (
          <div className="p-8 pt-2 space-y-8">
            {/* Profile Header */}
            <div className="flex items-start gap-8">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-100">
                {viewingEmployee?.name?.charAt(0)?.toUpperCase() || ""}
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-black text-slate-900">{viewingEmployee.name}</h2>
                  <Badge status={viewingEmployee.status}>{viewingEmployee.status}</Badge>
                </div>
                <p className="text-slate-500 font-semibold flex items-center gap-1.5 mb-4">
                  <UserCheck size={18} className="text-indigo-500" />
                  {viewingEmployee.role} • {viewingEmployee.department}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                     <Mail size={14} className="text-indigo-400" /> {viewingEmployee.email}
                   </div>
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                     <Phone size={14} className="text-indigo-400" /> {viewingEmployee.phone}
                   </div>
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 col-span-2">
                     <Home size={14} className="text-indigo-400" /> {viewingEmployee.address}
                   </div>
                </div>
              </div>
            </div>

            {/* Attendance & Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CalendarIcon size={16} className="text-indigo-600" />
                  Monthly Attendance
                </h3>
                <CalendarWidget employee={viewingEmployee} at={AttandenceData}/>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock size={16} className="text-indigo-600" />
                  Key Statistics
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                    <div>
                      <div className="text-green-700 font-black text-2xl leading-none mb-1">{AttandenceData.filter((item)=>(item.status==='P')).length} Days</div>
                      <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider opacity-60">Avg. Attendance</div>
                    </div>
                    <CheckCircle2 className="text-green-200" size={40} />
                  </div>
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                    <div>
                      <div className="text-amber-700 font-black text-2xl leading-none mb-1">{AttandenceData.filter((item)=>(item.status==='L')).length} Days</div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider opacity-60">Leave Remaining</div>
                    </div>
                    <CalendarIcon className="text-amber-200" size={40} />
                  </div>
                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="text-indigo-700 font-black text-2xl leading-none mb-1">{AttandenceData.filter((item)=>(item.status==='O')).length} Shifts</div>
                      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider opacity-60">Official Duties</div>
                    </div>
                    <MapPin className="text-indigo-200" size={40} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEmployee ? 'Edit Member Profile' : 'Register New Member'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Personal Information</label>
            <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="Role / Position" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
              {DEPARTMENTS.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contact Details</label>
            <div className="grid grid-cols-2 gap-3">
              <input required type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input required type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="Mobile Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Residential Address</label>
            <textarea required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none h-20" placeholder="Street, City, State, ZIP Code" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Work Status</label>
            <div className="flex gap-2">
              {['Active', 'On Leave', 'Inactive'].map((s) => (
                <button key={s} type="button" onClick={() => setFormData({...formData, status: s})} className={`flex-1 py-2 text-[11px] font-bold rounded-lg border transition-all ${formData.status === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>{s}</button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4 transform active:scale-[0.98]">
            {editingEmployee ? 'Update Profile' : 'Confirm Registration'}
          </button>
        </form>
      </Modal>

    </div>
  );
}