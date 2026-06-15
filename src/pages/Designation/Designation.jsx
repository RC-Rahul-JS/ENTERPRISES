import React, { useEffect, useState } from "react";
import { showErrorAlert, showSuccessAlert } from "../../utils/alerts";
import useApi from '../../api/useApi';

const DesignationPage = () => {
  const [designation, setDesignation] = useState("");
  const [designations, setDesignations] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [modalPermissions, setModalPermissions] = useState([]);
  const { getData, postData } = useApi();

  const permissionGroups = [
    {
      sidebar: 'Share Holders',
      tabs: ['Share Holders', 'DESIGNATION', 'ASSIGN PERSONAL LEDGER', 'STAFF']
    },
    {
      sidebar: 'Accounting',
      tabs: ['CREATE LEDGER', 'CREATE SUBGROUP', 'CREATE GROUP', 'JOURNAL VOUCHER', 'PAYMENT VOUCHER', 'RECEIPT VOUCHER']
    },
    {
      sidebar: 'Reports',
      tabs: ['TRIAL BALANCE', 'TRIAL BALANCE_2', 'FINANCIAL', 'TRADING A/c V2', 'STATEMENTS', 'GST SUBLEDGER', 'RCM']
    },
    {
      sidebar: 'Trade',
      tabs: ['ADD PRODUCT', 'CATEGORIES', 'CUSTOMERS', 'VENDORS', 'CREATE BILL', 'RETURN BILL', 'EXPENSE BOOKING', 'EXPENSE LIST', 'INVENTORY']
    },
    {
      sidebar: 'Settings',
      tabs: []
    }
  ];

  // Helper to extract all permissions (sidebars + tabs) as strings
  const allPermissionsList = permissionGroups.flatMap(group => [
    `Sidebar: ${group.sidebar}`,
    ...group.tabs.map(t => `Tab: ${t}`)
  ]);

  const fetchdata = async () => {
    try {
      const res = await getData("/trade/designations");
      console.log(res)
      if (Array.isArray(res)) {
        setDesignations(res);
      } 
    } catch (error) {
      console.error("Failed to load appointments:", error);
      showErrorAlert("Error", "Could not load Data. Please try again."); 
    }
  };
  useEffect(() => {
        fetchdata();
      }, []);
  

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (designation.trim() === "") return;
     try {
        await postData(`/trade/designation`, { name: designation.trim(),permissions: modalPermissions });
        showSuccessAlert('Success!', editIndex?"Updated Successfully":'Created successfully');
        setDesignation("");
        fetchdata()
        } catch (error) {
          console.error("Failed to save group:", error);
          showErrorAlert("Error", "Could not save. Please try again.");   
        }    
  };

  const handleDelete = (index) => {
    setDesignations(designations.filter((_, i) => i !== index));
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditValue(designations[index].name);
  };

  const handleSave = async(index) => {
    if (editValue.trim() === "") return;
    const updated = [...designations];
    updated[index].name = editValue;
     try {
        await postData(`/trade/designation`, updated[index]);
        showSuccessAlert('Success!', 'Updated Successfully');
        fetchdata()
        setDesignation("");
        setEditIndex(null);
        setEditValue("");
        } catch (error) {
          console.error("Failed to save group:", error);
          showErrorAlert("Error", "Could not save. Please try again.");   
        } 
 
  };

  const handleOpenPermissions = (index) => {
    setSelectedIndex(index);
    setModalPermissions([...designations[index]?.permissions] || []);
    setShowModal(true);
  };

  const handleCheckboxChange = (type, value, group = null) => {
    const permString = `${type}: ${value}`;
    
    setModalPermissions((prevPermissions) => {
      let newPerms = new Set(prevPermissions);
      
      if (newPerms.has(permString)) {
        // Unchecking
        newPerms.delete(permString);
        // If unchecking a Sidebar, also uncheck all its tabs
        if (type === 'Sidebar' && group) {
          group.tabs.forEach(t => newPerms.delete(`Tab: ${t}`));
        }
      } else {
        // Checking
        newPerms.add(permString);
        // If checking a Tab, also ensure its parent Sidebar is checked
        if (type === 'Tab' && group) {
          newPerms.add(`Sidebar: ${group.sidebar}`);
        }
      }
      
      return Array.from(newPerms);
    });
  };

  const handleSavePermissions = async() => {
    if (selectedIndex !== null) {
      const updated = [...designations];
      updated[selectedIndex].permissions = modalPermissions;
      try {
        await postData(`/trade/designation`, {_id: updated[selectedIndex]._id, permissions: modalPermissions,name: updated[selectedIndex].name });
        showSuccessAlert('Success!',"Updated Successfully");
        fetchdata()
        setDesignation("");
        setEditIndex(null);
        setEditValue("");
        } catch (error) {
          console.error("Failed to save group:", error);
          showErrorAlert("Error", "Could not save. Please try again.");   
        } 
      setDesignations(updated);
    }
    setShowModal(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-6xl mx-auto p-6">
      {/* Add Form */}
      <div className="p-4 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full max-w-md">
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Enter designation..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm"
          >
            Add
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">S No</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Designation</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Permissions</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {designations.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No designations added yet
                </td>
              </tr>
            ) : (
              designations.map((des, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editIndex === index ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
                      />
                    ) : (
                      des.name
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenPermissions(index)}
                      className="bg-indigo-500 text-white px-3 py-1 rounded-lg hover:bg-indigo-600 transition text-sm shadow-sm"
                    >
                      Set Permissions
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    {editIndex === index ? (
                      <button
                        onClick={() => handleSave(index)}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition text-sm shadow-sm"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(index)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition text-sm shadow-sm"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition text-sm shadow-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Permissions Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-center">
              Set Permissions for{" "}
              <span className="text-indigo-600">
                {selectedIndex !== null ? designations[selectedIndex].name : ""}
              </span>
            </h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {permissionGroups.map((group, i) => {
                const sidebarPerm = `Sidebar: ${group.sidebar}`;
                const isSidebarChecked = modalPermissions.includes(sidebarPerm);

                return (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    {/* Sidebar Header Checkbox */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSidebarChecked}
                          onChange={() => handleCheckboxChange('Sidebar', group.sidebar, group)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="font-semibold text-gray-800 text-sm">{group.sidebar}</span>
                      </label>
                    </div>

                    {/* Tabs Checkboxes (only shown if sidebar is checked and has tabs) */}
                    {isSidebarChecked && group.tabs.length > 0 && (
                      <div className="px-4 py-3 bg-white grid grid-cols-1 gap-2">
                        {group.tabs.map((tab, j) => {
                          const tabPerm = `Tab: ${tab}`;
                          return (
                            <label key={j} className="flex items-center gap-3 cursor-pointer pl-6">
                              <input
                                type="checkbox"
                                checked={modalPermissions.includes(tabPerm)}
                                onChange={() => handleCheckboxChange('Tab', tab, group)}
                                className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-400 border-gray-200"
                              />
                              <span className="text-sm text-gray-600 font-medium">{tab}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition text-sm shadow-sm"
              >
                Close
              </button>
              <button
                onClick={handleSavePermissions}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationPage;
