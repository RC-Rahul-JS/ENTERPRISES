import React, { useEffect, useState } from "react";
import { showErrorAlert, showSuccessAlert } from "../../utils/alerts";
import useApi from "../../api/useApi";

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dob: "",
    age: "",
    address: "",
    designation: "",
    password: "",
    confirmPassword: "",
    photo: null,
  });
  const [search, setSearch] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [designations, setDesignations] = useState([])
  const { getData, postData } = useApi();

  const fetchdata = async () => {
      try {
        const res = await getData("/staff/designations");
        const res2 = await getData("/staff");
        console.log(res,res2)
        if (Array.isArray(res)&&Array.isArray(res2)) {
          setDesignations(res);
          setEmployees(res2.filter((item)=>(item.designation!=='699adeffef0f329d90a0f35e')));
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
    const { name, value, files } = e.target;
    if (name === "photo") {
      const file = files[0];
      if (file) {
        setForm({ ...form, photo: file });
        setPreview(URL.createObjectURL(file));
      }
    } else if (name === "dob") {
      const birthDate = new Date(value);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      setForm({ ...form, dob: value, age });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validateForm = () => {
    setValidationMessage("");
    const nameRegex = /^[A-Za-z ]{3,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!nameRegex.test(form.name)) {
      setValidationMessage("Invalid Name. Must contain at least 3 letters.");
      return false;
    }
    if (!phoneRegex.test(form.phone)) {
      setValidationMessage("Invalid Phone Number. Must be a 10-digit number starting with 6, 7, 8, or 9.");
      return false;
    }
    if (!form.dob) {
      setValidationMessage("Date of Birth is required.");
      return false;
    }
    if (!form.address) {
      setValidationMessage("Address is required.");
      return false;
    }
    if (!form.designation) {
      setValidationMessage("Please select a Designation.");
      return false;
    }
    if (form.password.length < 6) {
      setValidationMessage("Password must be at least 6 characters.");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setValidationMessage("Passwords do not match.");
      return false;
    }
    if (!form.photo) {
      setValidationMessage("Photo is required.");
      return false;
    }

    return true;
  };

  const uploadImage = async (img) => {
  try {
    // Create FormData to send file as multipart/form-data
    const formData = new FormData();
    formData.append("file", img); // Ensure field name matches Flask API
    // Make POST request
    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Failed to upload: ${res.statusText}`);
    }
    const data = await res.json();
    console.log("Upload successful:", data);
    return data.file_id; // contains message and file_id
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // if (editingId) {
    //   setEmployees(
    //     employees.map((emp) =>
    //       emp.id === editingId ? { ...form, id: editingId } : emp
    //     )
    //   );
    // } else {
    //   setEmployees([...employees, { ...form, id: Date.now() }]);
    // }
    const profile_id = await uploadImage(form.photo);
    try {
        await postData(`/staff/create`, {...form,profile_id, pAccount:'A17'} );
        showSuccessAlert('Success!', editingId?"Updated Successfully":'Created successfully');
        fetchdata()
        resetForm();
        } catch (error) {
          console.error("Failed to save group:", error);
          showErrorAlert("Error", "Could not save. Please try again.");   
        }   

  };
  
  const handleEdit = (id) => {
    console.log("Editing employee with ID:", id);
    const employeeToEdit = employees.find((emp) => emp._id === id);
    if (employeeToEdit) {
      setEditingId(id);
      setForm(employeeToEdit);
      // if (employeeToEdit.photo) {
      //   setPreview(URL.createObjectURL(employeeToEdit.photo));
      // } else {
      //   setPreview(null);
      // }
      setShowModal(true);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      dob: "",
      age: "",
      address: "",
      designation: "",
      password: "",
      confirmPassword: "",
      photo: null,
    });
    setPreview(null);
    setEditingId(null);
    setValidationMessage("");
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setEmployeeToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setEmployees(employees.filter((emp) => emp.id !== employeeToDelete));
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 min-h-screen bg-white-100 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Share Holders</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
        >
          + Create Share Holder
        </button>
      </div>

      <input
        type="text"
        placeholder="Search employees..."
        className="border border-gray-300 rounded-lg px-4 py-2 mb-6 w-full md:w-1/3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Employee Table */}
      <div className="overflow-x-auto shadow-xl rounded-2xl bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="p-4 border-b-2">S No</th>
              <th className="p-4 border-b-2">Photo</th>
              <th className="p-4 border-b-2">Name</th>
              <th className="p-4 border-b-2">Phone</th>
              <th className="p-4 border-b-2">Age</th>
              <th className="p-4 border-b-2">Designation</th>
              <th className="p-4 border-b-2">Address</th>
              <th className="p-4 border-b-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp, index) => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{index + 1}</td>
                <td className="p-4">
                  {emp.photo && (
                    <img
                      src={emp.profile_id}
                      alt="profile"
                      className="h-12 w-12 rounded-full object-cover border-2 border-blue-300"
                    />
                  )}
                </td>
                <td className="p-4">{emp.name}</td>
                <td className="p-4">{emp.phone}</td>
                <td className="p-4">{emp.age}</td>
                <td className="p-4">{emp.designation_name}</td>
                <td className="p-4">{emp.address}</td>
                <td className="p-4 space-x-2">
                  <button
                    onClick={() => handleEdit(emp._id)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(emp._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={resetForm}
          ></div>

          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative z-10">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={resetForm}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {editingId ? "Edit Employee" : "Create Employee"}
            </h2>
            {validationMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {validationMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium text-sm">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium text-sm">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium text-sm">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium text-sm">Age</label>
                  <input
                    type="text"
                    name="age"
                    value={form.age}
                    disabled
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium text-sm">Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium text-sm">Designation</label>
                <select
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Designation --</option>
                  {designations.map((des, idx) => (
                    <option key={idx} value={des._id}>
                      {des.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium text-sm">Set Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium text-sm">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium text-sm mb-2">Upload Photo</label>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handleChange}
                  id="photo-upload"
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-300 transition text-sm"
                >
                  Choose File
                </label>
                {preview && (
                  <img
                    src={preview}
                    alt="preview"
                    className="h-16 w-16 mt-4 rounded-full object-cover border-2 border-blue-500"
                  />
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition text-sm"
                >
                  {editingId ? "Update Employee" : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full relative z-10 text-center">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this employee?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;
