import React, { useState } from "react";
import Swal from "sweetalert2";

const doctors = [
  { id: "D001", name: "Dr. Arjun Sharma" },
  { id: "D002", name: "Dr. Meera Kapoor" },
  { id: "D003", name: "Dr. Rajesh Gupta" },
  { id: "D004", name: "Dr. Simran Kaur" },
  { id: "D005", name: "Dr. Anil Verma" },
];

const appointments = [
  {
    _id: "68a86cee3d850b284daa8db3",
    patient_name: "Amber Kaur",
    doctor_name: "Dr. Arjun Sharma",
    date_of_appointment: "2025-08-23",
    pay_id: "pay_R8OcB1KBcazmqk",
    amount: 220,
  },
  {
    _id: "68a885fc3d850b284daa8db4",
    patient_name: "Hargun Kaur Sidhu",
    doctor_name: "Dr. Arjun Sharma",
    date_of_appointment: "2025-08-23",
    pay_id: "pay_R8QFfsoxRn4sIc",
    amount: 220,
  },
  {
    _id: "68a921023d850b284daa8db5",
    patient_name: "Alina",
    doctor_name: "Dr. Meera Kapoor",
    date_of_appointment: "2025-08-23",
    pay_id: "pay_R8bWZeh3pfyuXR",
    amount: 220,
  },
  {
    _id: "68a926b63d850b284daa8db6",
    patient_name: "Kiyansh Singla",
    doctor_name: "Dr. Rajesh Gupta",
    date_of_appointment: "2025-08-23",
    pay_id: "pay_R8bunWVuttK9Pv",
    amount: 220,
  },
  {
    _id: "68a9e3b73d850b284daa8db7",
    patient_name: "Chirag Bansal",
    doctor_name: "Dr. Arjun Sharma",
    date_of_appointment: "2025-08-24",
    pay_id: "pay_R8pfPmCnd04UXX",
    amount: 220,
  },
  {
    _id: "68abcba83d850b284daa8dbb",
    patient_name: "Guggu",
    doctor_name: "Dr. Simran Kaur",
    date_of_appointment: "2025-08-25",
    pay_id: "pay_R9P80vF63PVmch",
    amount: 220,
  },
];

export default function DoctorPaymentDistribution() {
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedAppointments, setSelectedAppointments] = useState([]);

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredAppointments = appointments.filter(
    (appt) =>
      (!selectedDoctor || appt.doctor_name === selectedDoctor) &&
      (!fromDate || new Date(appt.date_of_appointment) >= new Date(fromDate)) &&
      (!toDate || new Date(appt.date_of_appointment) <= new Date(toDate))
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAppointments(filteredAppointments.map((a) => a._id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedAppointments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalAmount = filteredAppointments
    .filter((a) => selectedAppointments.includes(a._id))
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const handleCreateVoucher = () => {
    const selectedData = filteredAppointments.filter((a) =>
      selectedAppointments.includes(a._id)
    );

    if (selectedData.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Appointments Selected",
        text: "Please select at least one appointment.",
        confirmButtonColor: "#249CA2",
      });
      return;
    }

    console.log("Selected Appointments:", selectedData);

    Swal.fire({
      icon: "success",
      title: "Payment Voucher Created",
      text: `${selectedData.length} appointments selected. Total: ₹${totalAmount}`,
      confirmButtonColor: "#249CA2",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        DOCTOR PAYMENT DISTRIBUTION
      </h2>

      <div className="flex flex-wrap gap-4 justify-between bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8">
<div className="flex-1 min-w-[250px] relative">
  <label className="block font-semibold text-gray-700 mb-2">
    Select Doctor
  </label>
  <input
    type="text"
    value={doctorSearch}
    onChange={(e) => setDoctorSearch(e.target.value)}
    onFocus={() => setIsDropdownOpen(true)} 
    placeholder="Search doctor..."
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
  />

  {isDropdownOpen && (
    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-auto shadow-md">
      <li
        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
          selectedDoctor === "" ? "bg-gray-100" : ""
        }`}
        onClick={() => {
          setSelectedDoctor("");
          setDoctorSearch("");
          setIsDropdownOpen(false); 
        }}
      >
        All Doctors
      </li>
      {filteredDoctors.length > 0 ? (
        filteredDoctors.map((doc) => (
          <li
            key={doc.id}
            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
              selectedDoctor === doc.name ? "bg-gray-100" : ""
            }`}
            onClick={() => {
              setSelectedDoctor(doc.name);
              setDoctorSearch(doc.name);
              setIsDropdownOpen(false); 
            }}
          >
            {doc.name}
          </li>
        ))
      ) : (
        <li className="px-4 py-2 text-gray-500">No results found</li>
      )}
    </ul>
  )}
</div>

        <div className="flex-1 min-w-[200px]">
          <label className="block font-semibold text-gray-700 mb-2">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block font-semibold text-gray-700 mb-2">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 text-gray-800 uppercase text-sm">
              <th className="px-6 py-3 font-bold">S No</th>
              <th className="px-6 py-3 font-bold">Date</th>
              <th className="px-6 py-3 font-bold">Patient Name</th>
              <th className="px-6 py-3 font-bold">Doctor Name</th>
              <th className="px-6 py-3 font-bold">Payment ID</th>
               <th className="px-6 py-3 font-bold">Amount</th>
              <th className="px-6 py-3 font-bold text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    filteredAppointments.length > 0 &&
                    selectedAppointments.length === filteredAppointments.length
                  }
                />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt, index) => (
                <tr key={appt._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{index + 1}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {appt.date_of_appointment}
                  </td>
                  <td className="px-6 py-3 font-medium">{appt.patient_name}</td>
                  <td className="px-6 py-3">{appt.doctor_name}</td>
                  <td className="px-6 py-3 text-gray-600">{appt.pay_id}</td>
                  <td className="px-6 py-3 font-semibold text-green-600">₹{appt.amount}</td>
                  <td className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedAppointments.includes(appt._id)}
                      onChange={() => handleCheckboxChange(appt._id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <p className="text-lg font-semibold text-gray-800">
          Total Amount: ₹{totalAmount}
        </p>
        <button
          onClick={handleCreateVoucher}
          className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition transform hover:scale-105"
        >
          CREATE PAYMENT VOUCHER
        </button>
      </div>
    </div>
  );
}
