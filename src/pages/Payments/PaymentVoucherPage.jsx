import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function PayDoctorVoucherPage() {
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctor_id: '',
    voucher_date: new Date().toISOString().split('T')[0],
    payment_mode: 'Bank',
    narration: '',
  });

  const [payableAmount, setPayableAmount] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          'https://api.care2connect.in/v1/doctor/67ee5e1bde4cb48c515073ee'
        );
        const data = await res.json();

        if (data.doctor_id === "67ee5e1bde4cb48c515073ee") {
          data.name = "Dr. Neeraj Bansal";
        }

        setDoctors([data]);
        setFormData((prev) => ({ ...prev, doctor_id: data.doctor_id }));
        setPayableAmount(Math.abs(data.closing_balance));
        setPaidAmount(Math.abs(data.closing_balance).toString());
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to fetch doctor details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, []);
  const handleDoctorChange = async (e) => {
    const doctorId = e.target.value;
    setFormData({ ...formData, doctor_id: doctorId });
    setPayableAmount(null);
    setPaidAmount('');

    if (!doctorId) return;

    try {
      setLoading(true);
      const res = await fetch(`https://api.care2connect.in/v1/doctor/${doctorId}`);
      const data = await res.json();

      // 🔹 Force override name if this doctorId
      if (data.doctor_id === "67ee5e1bde4cb48c515073ee") {
        data.name = "Dr. Neeraj Bansal";
      }

      setDoctors([data]);
      setPayableAmount(Math.abs(data.closing_balance));
      setPaidAmount(Math.abs(data.closing_balance).toString());
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch doctor details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    const { doctor_id, voucher_date, payment_mode } = formData;
    const amount = parseFloat(paidAmount);

    if (!doctor_id || !amount || isNaN(amount) || amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Please select doctor and enter valid amount.',
      });
      return;
    }

    if (amount > payableAmount) {
      Swal.fire({
        icon: 'error',
        title: 'Excess Payment',
        text: `You cannot pay more than the payable balance of ₹${payableAmount}.`,
      });
      return;
    }

    const selectedDoctor = doctors.find((d) => d.doctor_id === doctor_id);

    Swal.fire({
      title: 'Confirm Payment?',
      html: `
        <div class="text-left space-y-2 mt-2">
          <p><strong>Doctor:</strong> ${selectedDoctor?.name || selectedDoctor?.doctor_id}</p>
          <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
          <p><strong>Date:</strong> ${voucher_date}</p>
          <p><strong>Mode:</strong> ${payment_mode}</p>
          <p class="mt-3 text-sm text-gray-600">This will record a payment and reduce payable balance.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Pay Now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#249CA2',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const payload = {
            doctorId: selectedDoctor.doctor_id,
            amount: amount,
            paymentId: `pay_${Date.now()}`,
            ledgerCode: 'A4',
            ledgerName: 'IDFC Bank',
          };

          const res = await fetch('https://api.care2connect.in/doctor-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error('Payment request failed');
          const resultData = await res.json();
          console.log('Payment Response:', resultData);

          Swal.fire({
            icon: 'success',
            title: 'Payment Recorded!',
            html: `
              <p><strong>Doctor:</strong> ${selectedDoctor?.name || selectedDoctor?.doctor_id}</p>
              <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
              <p><strong>Mode:</strong> ${payment_mode}</p>
            `,
            confirmButtonText: 'OK',
          });

          setFormData({
            doctor_id: '',
            voucher_date: new Date().toISOString().split('T')[0],
            payment_mode: 'Bank',
            narration: '',
          });
          setPaidAmount('');
          setPayableAmount(null);
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: 'error',
            title: 'Payment Failed',
            text: error.message || 'An error occurred while processing the payment.',
          });
        }
      }
    });
  };

  const selectedDoctor = doctors.find((d) => d.doctor_id === formData.doctor_id);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Pay Doctor</h2>
      <p className="text-center text-gray-600 mb-8">
        Create a payment voucher to settle doctor's fee payable.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Doctor</label>
          <select
            value={formData.doctor_id}
            onChange={handleDoctorChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose Doctor</option>
            {doctors.map((doc) => (
              <option key={doc.doctor_id} value={doc.doctor_id}>
                {doc.name || `Doctor ${doc.doctor_id}`}
              </option>
            ))}
          </select>

          {loading && selectedDoctor && (
            <div className="flex items-center mt-3 text-blue-600">
              <span className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full mr-2"></span>
              Fetching payable balance...
            </div>
          )}

          {payableAmount !== null && !loading && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm">
                <strong>Payable Balance:</strong>{' '}
                <span className="font-bold text-green-700">₹{payableAmount.toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>

        {payableAmount !== null && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date</label>
                <input
                  type="date"
                  name="voucher_date"
                  value={formData.voucher_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                <select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bank">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount to Pay (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Narration (Optional)</label>
              <input
                type="text"
                name="narration"
                value={formData.narration}
                onChange={handleChange}
                placeholder="e.g., August 2025 settlement"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Doctor:</strong> {selectedDoctor?.name || selectedDoctor?.doctor_id}</p>
                <p><strong>Payable:</strong> ₹{payableAmount.toFixed(2)}</p>
                <p><strong>Payment:</strong> ₹{paidAmount || '0.00'}</p>
                <p><strong>Mode:</strong> {formData.payment_mode}</p>
                <p><strong>Voucher Type:</strong> <span className="font-bold">Payment</span></p>
              </div>
            </div>
          </>
        )}
      </form>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={() => {
            setFormData({ doctor_id: '', voucher_date: new Date().toISOString().split('T')[0], payment_mode: 'Bank', narration: '' });
            setPaidAmount('');
            setPayableAmount(null);
          }}
          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
        >
          Reset
        </button>
        {payableAmount !== null && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium"
          >
            🧾 Create Payment Voucher
          </button>
        )}
      </div>
    </div>
  );
}
