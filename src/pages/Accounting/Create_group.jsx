// src/pages/GroupManagement.jsx
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2'; // 🔥 Import SweetAlert2
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';
import useApi from '../../api/useApi';

const GroupManagement = () => {
  const { postData,getData } = useApi();
  let id = null; 
  const [formData, setFormData] = useState({
    grouptype: '',
    groupname: '',
  });

  const [list, setList] = useState([
    { GroupName: 'Sales', GroupType: 'Income' },
    { GroupName: 'Furniture', GroupType: 'Assets' },
    { GroupName: 'Utilities', GroupType: 'Expenditure' },
  ]);
  const fetchdata = async () => {
    try {
      const res = await getData("/groups");
      console.log(res)
      if (Array.isArray(res)) {
        setList(res);
      } 
    } catch (error) {
      console.error("Failed to load appointments:", error);
      showErrorAlert("Error", "Could not load Data. Please try again."); 
    }
  };
   useEffect(() => {
      fetchdata();
    }, []);

  const handleChange = (e) => { 
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    const { grouptype, groupname } = formData;

    if (!grouptype || !groupname.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please select group type and enter group name.',
        confirmButtonText: 'Got it',
        confirmButtonColor: '#249CA2',
      });
      return;
    }

    // Check for duplicates
    const exists = list.some(
      (item) => item.GroupName.toLowerCase() === groupname.trim().toLowerCase()
    );

    if (exists) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Found',
        text: `A group named "${groupname}" already exists.`,
        confirmButtonText: 'Close',
      });
      return;
    }
    try {
    await postData(`/groups`, formData);
    showSuccessAlert('Success!', formData._id?"Updated Successfully":'Created successfully');
    setFormData({ grouptype: '', groupname: '' });
    fetchdata()
    } catch (error) {
      console.error("Failed to save group:", error);
      showErrorAlert("Error", "Could not save. Please try again.");   
    }
  };

  const handleEdit = (index) => {
    const item = list[index];
    id=index
    setFormData({ grouptype: item.GroupType, groupname: item.GroupName,_id:item?._id });
    // Optional: Show feedback
    Swal.fire({
      icon: 'info',
      title: 'Editing Mode',
      text: `Now editing: ${item.GroupName}`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">CREATE GROUP</h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-4 justify-between bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8"
      >
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Head</label>
          <select
            name="grouptype"
            value={formData.grouptype}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            <option value="Income">Income</option>
            <option value="Assets">Assets</option>
            <option value="Expenditure">Expenditure</option>
            <option value="Liabilities">Liabilities</option>
          </select>
        </div>

        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Group Name</label>
          <input
            type="text"
            name="groupname"
            value={formData.groupname}
            onChange={handleChange}
            placeholder="Enter group name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full flex justify-center mt-4">
          <button
            type="submit"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition transform hover:scale-105"
          >
            SUBMIT
          </button>
        </div>
      </form>

      {/* Ledger Table */}
      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 text-gray-800 uppercase text-sm">
              <th className="px-6 py-3 font-bold">S No</th>
              <th className="px-6 py-3 font-bold">Group Name</th>
              <th className="px-6 py-3 font-bold">Group Type</th>
              <th className="px-6 py-3 font-bold text-center">Edit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.length > 0 ? (
              list.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{index + 1}</td>
                  <td className="px-6 py-3 font-medium">{item.GroupName}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize
                        ${item.GroupType === 'Income' && 'bg-green-100 text-green-800'}
                        ${item.GroupType === 'Assets' && 'bg-blue-100 text-blue-800'}
                        ${item.GroupType === 'Expenditure' && 'bg-orange-100 text-orange-800'}
                        ${item.GroupType === 'Liabilities' && 'bg-red-100 text-red-800'}
                      `}
                    >
                      {item.GroupType}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Edit ${item.GroupName}`}
                    >
                      <svg className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No groups found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupManagement;