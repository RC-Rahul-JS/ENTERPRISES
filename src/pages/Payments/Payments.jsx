import React, { useEffect, useState } from "react";
import useApi from "../../api/useApi";
import Swal from "sweetalert2";

const Payments = () => {
  const { getData } = useApi();
  const [appointments, setAppointments] = useState([]);
  const [filterDoctor, setFilterDoctor] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await getData("/appointments/get");
        if (Array.isArray(res)) {
          setAppointments(res);
        } else {
          setAppointments([]);
        }
      } catch (error) {
        console.error("Failed to load Payments:", error);
        Swal.fire("Error", "Could not load Payment data.", "error");
      }
    };
    fetchAppointments();
  }, []);

  const uniqueDoctors = [...new Set(appointments.map((a) => a.doctor_name))];

  // Convert date string to Date object safely
  const parseDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // // Format date to dd-mm-yyyy
  // const formatDate = (dateStr) => {
  //   const d = new Date(dateStr);
  //   if (isNaN(d.getTime())) return "N/A";
  //   const day = String(d.getDate()).padStart(2, "0");
  //   const month = String(d.getMonth() + 1).padStart(2, "0");
  //   const year = d.getFullYear();
  //   return `${day}-${month}-${year}`;
  // };

  const filteredAppointments = appointments.filter((appt) => {
    const apptDate = parseDate(appt.created_at);
    const from = parseDate(fromDate);
    const to = parseDate(toDate);

    const doctorMatch = filterDoctor ? appt.doctor_name === filterDoctor : true;
    const fromMatch = from ? apptDate >= from : true;
    const toMatch = to ? apptDate <= to : true;

    return doctorMatch && fromMatch && toMatch;
  });

  let runningBalance = 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Receipt Report</h2>
        {/* <button className="bg-purple-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-md">
          Download Report
        </button> */}
      </div>

      <div className="p-4 flex flex-wrap items-center gap-4">
        {/* Doctor filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Doctor:</label>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">All</option>
            {uniqueDoctors.map((doctor, idx) => (
              <option key={idx} value={doctor}>
                {doctor || "N/A"}
              </option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">S No</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Payment ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt, index) => {
                const hasPayment = appt.pay_id ? true : false;
                const amount = hasPayment ? appt.amount : 0;
                runningBalance += amount;

                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {/* {formatDate(appt.created_at)} */}
                      {new Date(appt.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {appt.patient_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {appt.doctor_name}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap font-medium ${
                        hasPayment ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {appt.pay_id || "N/A"}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap font-medium ${
                        hasPayment ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {hasPayment ? `+${appt.amount}` : "+0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">
                      {runningBalance}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No Payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
