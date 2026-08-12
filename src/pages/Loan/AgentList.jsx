import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, RefreshCw, X } from 'lucide-react';
import Swal from 'sweetalert2';
import useApi from '../../api/useApi';

const AgentList = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState(null);

  const { getData } = useApi();

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await getData('/localprime/agents');
      const list = res?.data || [];
      setAgents(list);
    } catch (error) {
      console.error('Error fetching agents:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch agent list.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter((ag) => {
    const search = searchTerm.toLowerCase();
    const code = (ag.agentCode || ag.AgentCode || '').toLowerCase();
    
    // Extract name robustly
    const fName = ag.FirstName || ag.first_name || '';
    const lName = ag.LastName || ag.last_name || '';
    const computedName = (ag.agentName || ag.AgentName || ag.name || ag.Name || ag.memberName || ag.MemberName || `${fName} ${lName}`.trim() || '').toLowerCase();
    
    const phone = (ag.MobileNo || '').toLowerCase();
    
    const matchesSearch = code.includes(search) || computedName.includes(search) || phone.includes(search);

    // Status Filter
    const st = (ag.agentStatus || 'active').toLowerCase();
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus = st === statusFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Agent List</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and view approved agents.</p>
          </div>
          <button
            onClick={fetchAgents}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Agent Code, Name or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
            />
          </div>
          <div className="w-full sm:w-48 relative">
            <Filter className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm appearance-none bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Agent Code</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Mobile</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Designation</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Branch</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                        Loading agents...
                      </div>
                    </td>
                  </tr>
                ) : filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                      No agents found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((ag) => (
                    <tr key={ag._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-medium text-indigo-600">
                        {ag.agentCode || ag.AgentCode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {ag.agentName || ag.AgentName || ag.name || ag.Name || ag.memberName || ag.MemberName || `${ag.FirstName || ag.first_name || ''} ${ag.LastName || ag.last_name || ''}`.trim() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{ag.MobileNo || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600">{ag.designationName || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600">{ag.BranchName || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            (ag.agentStatus || '').toLowerCase() === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {ag.agentStatus || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedAgent(ag)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Agent Details</h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Agent Code</label>
                  <p className="font-medium text-slate-800">{selectedAgent.agentCode || selectedAgent.AgentCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
                  <p className="font-medium text-slate-800">{selectedAgent.agentName || selectedAgent.AgentName || selectedAgent.name || selectedAgent.Name || selectedAgent.memberName || selectedAgent.MemberName || `${selectedAgent.FirstName || selectedAgent.first_name || ''} ${selectedAgent.LastName || selectedAgent.last_name || ''}`.trim() || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Mobile</label>
                  <p className="font-medium text-slate-800">{selectedAgent.MobileNo || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                  <p className="font-medium text-slate-800">{selectedAgent.Email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Designation</label>
                  <p className="font-medium text-slate-800">{selectedAgent.designationName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Branch</label>
                  <p className="font-medium text-slate-800">{selectedAgent.BranchName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                  <p className="font-medium text-slate-800 capitalize">{selectedAgent.agentStatus || 'Active'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Joining Date</label>
                  <p className="font-medium text-slate-800">
                    {selectedAgent.joiningDate ? new Date(selectedAgent.joiningDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentList;
