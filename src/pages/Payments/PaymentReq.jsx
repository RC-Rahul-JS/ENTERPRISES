import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function PaymentReq() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [payments, setPayments] = useState({});
  const [transitions, setTransitions] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState({});
const banks = ["IDFC Bank"];

  const [fromDate, setFromDate] = useState("2025-10-01");
  const [toDate, setToDate] = useState("2025-12-30");
  const [status, setStatus] = useState("pending");

const [submitLoading, setsubmitLoading] = useState(false)

const fetchDoctors = async () => {
   

    try {
      setLoading(true);
      const res = await fetch(
    `https://api.care2connect.in/multiple_doctor-payment-request?from=${fromDate}&to=${toDate}&status=${status}`
      );
      const data = await res.json();
      if (!data.error){
        setDoctors(data);

      console.log(data)
      }else{
        setDoctors([]);
      }
      

      // ✅ Initialize payments with default closing_balance
    //   const defaultPayments = {};
    //   data.forEach((doc) => {
    //     defaultPayments[doc.doctor_id] = parseFloat(doc.closing_balance) * -1; // convert to positive if needed
    //   });
    //   setPayments(defaultPayments);

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch doctors", "error");
      setDoctors([]);
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

const handleBankChange = (doctorId, value) => {
  setSelectedBank((prev) => ({
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
  const handleAmountChange = (doctorId, value) => {
    setPayments((prev) => ({
      ...prev,
      [doctorId]: value,
    }));
  };

  // ✅ Handle final submit
  const handleSubmit = async(s) => {
const selectedData = doctors
  .filter((doc) => selectedDoctors.includes(doc._id))
  .map((doc) => ({
    doctorId: doc.doctorId,
    amount: doc.amount,
    paymentId: doc.paymentId,
    transactionId: transitions[doc._id] || "1234",
    ledgerName: doc.ledgerName,
    ledgerCode: doc.ledgerCode,
    name: doc.name,
    id: doc.id,
    phone: doc.phone,
    _id: doc._id,
    status:s,
    nareshan:doc.nareshan
  }));


    if (selectedData.length === 0) {
      Swal.fire("No Doctor Selected", "Please select at least one doctor", "warning");
      return;
    }


console.log(selectedData)


try {
         
setsubmitLoading(true)
          const res = await fetch('https://api.care2connect.in/multiple_doctor-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedData),
          });

          if (!res.ok) throw new Error('Payment request failed');
          const resultData = await res.json();
setsubmitLoading(false)

Swal.fire("Success", "Payments submitted successfully!", "success");
fetchDoctors();
setSelectedDoctors([])
        } catch (error) {
setsubmitLoading(false)

          console.error(error);
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
        Payment Requests
      </h2>


{/* 🔍 Filters */}
      <div className="flex items-end gap-4 mb-6">
        <div>
          <label className="block text-gray-700 text-sm mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => {setStatus(e.target.value); setDoctors([])}}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="approve">Approved</option>
            <option value="reject">Rejected</option>
          </select>
        </div>

  <button
          onClick={fetchDoctors}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Search
        </button>
      </div>


      {loading && <p className="text-blue-600">Loading...</p>}

      {doctors.length === 0 || !doctors? (
        <p className="text-gray-500 text-center">No doctors found</p>
      ) : (
        doctors.map((doctor) => {

          return (
            <div
              key={doctor.doctorId}
              className={`flex items-center justify-between p-4 my-3 rounded-2xl shadow-md border transition ${
                selectedDoctors.includes(doctor._id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Left Side */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedDoctors.includes(doctor._id)}
                  onChange={() => handleSelectDoctor(doctor._id)}
                  className="w-5 h-5 accent-blue-500 rounded-md cursor-pointer"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {doctor.name || "Doctor"}
                  </h3>
                  <p className="text-gray-600">
                    ID -{" "}
                    <span className="font-bold text-green-600">
                      {doctor.id}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">

  <div>
    <h3 className="text-[10px] text-gray-900">
      Payment ID - {doctor.paymentId || "Doctor"}
    </h3>
    <p className="text-gray-600 text-[14px]">
      Amount -{" "}
      <span className="font-bold text-green-600 text-[14px]">
        ₹ {parseFloat(doctor.amount).toFixed(2)}
      </span>
    </p>
  </div>

</div>


    

              {/* Right Side */}
              <div className="flex items-center space-x-2">
                


                <label className="font-semibold text-gray-800 text-[12px]">
                  Transaction ID
                </label>
                <input
                  type="text"
                   value={transitions[doctor._id] || ""}
  onChange={(e) =>
    handleTransitionChange(doctor._id, e.target.value)
  }
                  className="text-[12px] border border-gray-300 rounded-lg px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-400 mr-5"
                  placeholder="Enter"
                />

              </div>


              <div className="flex items-center space-x-2">
  <label className="font-semibold text-gray-800 text-[12px]">
    Bank
  </label>

  <select
    value={transitions[doctor._id] || ""}
    onChange={(e) => handleBankChange(doctor._id, e.target.value)}
    className="text-[12px] border border-gray-300 rounded-lg px-3 py-2 w-25 focus:outline-none focus:ring-2 focus:ring-blue-400 mr-5"
  >
    <option value="IDFC Bank">IDFC Bank</option>
  </select>
</div>

              {/* <div className="flex items-center space-x-2">


                <label className="font-semibold text-gray-800">
                  Bank
                </label>
                <input
                  type="text"
                   value={transitions[doctor._id] || ""}
  onChange={(e) =>
    handleBankChange(doctor._id, e.target.value)
  }
                  className="border border-gray-300 rounded-lg px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-400 mr-5"
                  placeholder="Enter"
                />

              </div> */}
              
            </div>
          );
        })
      )}




      {/* ✅ Submit Button */}
{   status==='pending' &&  <div className="text-center mt-6">
      { !submitLoading&& <button
          onClick={()=>handleSubmit('reject')}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition mr-5"
        >
          Reject Payments
        </button>
}
       { !submitLoading? <button
          onClick={()=>handleSubmit('approve')}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
        >
          Approve Payments
        </button>:<p>Please Wait...</p>}
      </div>}
    </div>
  );
}
