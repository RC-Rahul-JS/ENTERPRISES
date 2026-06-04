import moment from "moment";
import React, { useState, useEffect } from "react";
import { data } from "react-router-dom";
import Swal from "sweetalert2";

export default function PaymentMultiple() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [payments, setPayments] = useState({});
  const [transitions, setTransitions] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
const banks = ["IDFC Bank"];

const [date, setdate] = useState(moment().format('YYYY-MM-DD'))


const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.care2connect.in/multiple_payment_doctor?from=2025-09-01&to=${moment(date).add(1, 'days').format('YYYY-MM-DD')}`
      );
      const data = await res.json();

      setDoctors(data);

      // ✅ Initialize payments with default closing_balance
      const defaultPayments = {};
      data.forEach((doc) => {
        defaultPayments[doc.doctor_id] = parseFloat(doc.closing_balance) * -1; // convert to positive if needed
      });
      setPayments(defaultPayments);

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch doctors", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch all doctors list
  useEffect(() => {
  

  fetchDoctors();
}, []);


const handleTransitionChange = (doctorId, value) => {
  setTransitions((prev) => ({
    ...prev,
    [doctorId]: value,
  }));
};

  // ✅ Handle checkbox toggle
  const handleSelectDoctor = (doctorId) => {
    setSelectedDoctors((prev) =>
      prev.includes(doctorId)
        ? prev.filter((id) => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  // ✅ Handle amount input change
  // const handleAmountChange = (doctorId, value) => {
  //   setPayments((prev) => ({
  //     ...prev,
  //     [doctorId]: value,
  //   }));
  // };

  const handleAmountChange = (doctorId, value) => {
  const doctor = doctors.find((d) => d.doctor_id === doctorId);
  const payable = parseFloat(doctor.closing_balance) * -1;
  const entered = parseFloat(value);

  if (entered > payable) {
    Swal.fire(
      "Amount Too High",
      `Entered amount (₹${entered}) cannot be more than payable (₹${payable}).`,
      "warning"
    );
    return; // ❌ Stop updating the input
  }

  setPayments((prev) => ({
    ...prev,
    [doctorId]: value,
  }));
};

const [submitloading, setsubmitloading] = useState(false)

  // ✅ Handle final submit
  const handleSubmit = async() => {
  
const selectedData = doctors
  .filter((doc) => selectedDoctors.includes(doc.doctor_id))
  .map((doc) => ({
    doctorId: doc.doctor_id,
    id:doc.id,
    phone:doc.phone_number,
    amount: payments[doc.doctor_id] || 0,
    paymentId: transitions[doc.doctor_id] || "",
    ledgerName: "IDFC Bank",
    ledgerCode: "A4",
    status:'pending',
    name:doc.doctor_name,
    nareshan : `Settlement for ${doc.id}` ,
    currentbalance : parseFloat(doc.closing_balance)*-1-payments[doc.doctor_id] ,
  }));


    if (selectedData.length === 0) {
      Swal.fire("No Doctor Selected", "Please select at least one doctor", "warning");
      return;
    }

//     if (!selectedBank) {
//   Swal.fire("Select Bank", "Please select a bank for payment", "warning");
//   return;
// }


try {
           setsubmitloading(true)

          const res = await fetch('https://api.care2connect.in/multiple_doctor-payment-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedData),
          });

          if (!res.ok) throw new Error('Payment request failed');
          const resultData = await res.json();
  setsubmitloading(false)
Swal.fire("Success", "Payments submitted successfully!", "success");
fetchDoctors();
setSelectedDoctors([])
        } catch (error) {
          console.error(error);
            setsubmitloading(false)
          Swal.fire({
            icon: 'error',
            title: 'Payment Failed',
            text: error.message || 'An error occurred while processing the payment.',
          });
        }




    
  };


  const totalAmount = selectedDoctors.reduce((total, doctorId) => {
  const amt = parseFloat(payments[doctorId]) || 0;
  return total + amt;
}, 0);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-center mb-6">
        Bulk Payment
      </h2>

      {loading && <p className="text-blue-600">Loading...</p>}

 <div className="flex items-end gap-4 mb-6">
       <div>
          <label className="block text-gray-700 text-sm mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setdate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

          <button
          onClick={fetchDoctors}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Search
        </button></div>

      {doctors.length === 0 ? (
        <p className="text-gray-500 text-center">No doctors found</p>
      ) : (
        doctors.map((doctor) => {
          const amount = payments[doctor.doctor_id] || "";

          return (
            <div
              key={doctor.doctor_id}
              className={`flex items-center justify-between p-4 my-3 rounded-2xl shadow-md border transition ${
                selectedDoctors.includes(doctor.doctor_id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Left Side */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedDoctors.includes(doctor.doctor_id)}
                  onChange={() => handleSelectDoctor(doctor.doctor_id)}
                  className="w-5 h-5 accent-blue-500 rounded-md cursor-pointer"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {doctor.doctor_name || "Doctor"}
                  </h3>
                  <p className="text-gray-600">
                    ID -{" "}
                    <span className="font-bold text-green-600">
                      {doctor.id}
                    </span>
                  </p>
                </div>
              </div>


 <p className="text-gray-600">
                    Payable Amount -{" "}
                    <span className="font-bold text-green-600">
                      ₹ {parseFloat(doctor.closing_balance)*-1}
                    </span>
                  </p>
    

              {/* Right Side */}
              <div className="flex items-center space-x-2">

               



                <label className="font-semibold text-gray-800">
                  Amount to Pay (₹)<br/>
                 {parseFloat(doctor.closing_balance)*-1-payments[doctor.doctor_id]>0&& <label className="text-red-600 text-xs">Outstanding Amount : ₹{parseFloat(doctor.closing_balance)*-1-payments[doctor.doctor_id]}</label>}
                </label>
                <input
                  type="number"
                  value={payments[doctor.doctor_id] || ""}
  onChange={(e) =>
    handleAmountChange(doctor.doctor_id, e.target.value)
  }
                  className="border border-gray-300 rounded-lg px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter"
                />
              </div>
              
            </div>
          );
        })
      )}

<div className="flex justify-between items-center mt-4 mr-2">
 

  {/* Bank Dropdown */}
  {/* <div><label className="m-2">Select Bank</label>
  <select
    value={selectedBank}
    onChange={(e) => setSelectedBank(e.target.value)}
    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
  >
    <option value="">Select Bank</option>
    {banks.map((bank) => (
      <option key={bank} value={bank}>
        {bank}
      </option>
    ))}
  </select>
  </div> */}

   {/* Total Amount */}
  <span className="font-bold text-lg text-gray-800">
    Total Amount: ₹ {totalAmount.toFixed(2)}
  </span>
</div>


      {/* ✅ Submit Button */}
      <div className="text-center mt-6">
        {!submitloading?<button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
        >
          Submit Payments
        </button>: <p>Please Wait...</p>}
      </div>
    </div>
  );
}
