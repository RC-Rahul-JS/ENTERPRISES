import React, { useEffect, useState } from "react";
import useApi from "../../api/useApi";
import Swal from "sweetalert2";

const Reports = () => {
  const { getData } = useApi();
  const [reports, setReports] = useState([]);
  const [filterDoctor, setFilterDoctor] = useState("");
  const [fromDate, setFromDate] = useState(moment(new Date()).format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(moment(new Date()).format('YYYY-MM-DD'));

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await getData("/appointments/get");
        if (Array.isArray(res)) setReports(res);
        else setReports([]);
      } catch (error) {
        console.error("Failed to load Reports:", error);
        Swal.fire("Error", "Could not load Report data.", "error");
      }
    };
    fetchReports();
  }, []);

  const uniqueDoctors = [...new Set(reports.map((a) => a.doctor_name))];

  const parseDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredReports = reports.filter((appt) => {
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
        <h2 className="text-lg font-semibold text-gray-800">Ledger</h2>
      </div>

      <div className="p-4 flex flex-wrap items-center gap-4">
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

        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>

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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">S No</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Payment ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Dr</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cr</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReports.length > 0 ? (
              filteredReports.map((appt, index) => {
                const hasPayment = !!appt.pay_id;
                const crAmount = hasPayment ? appt.amount : 0;

                // Only add to balance when there is a positive credit
                if (hasPayment && crAmount > 0) runningBalance += crAmount;

                const showCrSuffix = crAmount > 0; // append " Cr" only when this row has a credit

                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(appt.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {appt.doctor_name}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        hasPayment ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {appt.pay_id || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-500 font-medium">0</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                      +{crAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">
                      {showCrSuffix ? `${runningBalance} Cr` : `${runningBalance}`}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No Reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
