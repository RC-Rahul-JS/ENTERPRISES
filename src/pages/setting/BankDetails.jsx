import React, { useEffect, useState } from 'react';
import useApi from '../../api/useApi';
import { Link, useParams } from 'react-router';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import axios from 'axios';

// Helper components for icons
const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path> <circle cx="12" cy="12" r="3"></circle> </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path> <line x1="1" y1="1" x2="23" y2="23"></line> </svg>
);

export default function BankDetails() {
  // State variables
  const [holderName, setHolderName] = useState("");
  const [account, setAccount] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [error, setError] = useState("");
  const [bankDetails, setBankDetails] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showConfirmAccount, setShowConfirmAccount] = useState(false);


    const {id}=useParams()
  const [fee, setFee] = useState('');

  // Fetch current appointment fee
  useEffect(() => {
    const fetchdata = async () => {
      try {
    const response = await axios.get(`https://api.care2connect.in/get_doctor/${id}/`);
    console.log(response.data); // yaha doctors ka list milega
    
  } catch (error) {
    console.error("Error fetching doctors:", error);
  }
    };
    fetchdata();
  }, []);


  // --- API Call for IFSC Verification ---
  const handleVerify = async () => {
    setError("");
    setBankDetails(null);
    if (!ifsc) {
      setError("Please enter an IFSC code to verify.");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (!res.ok) throw new Error("Invalid or incorrect IFSC Code.");
      const data = await res.json();
      setBankDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // --- Form Submission Handler ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = { holderName, account, ifsc, bankDetails: { bank: bankDetails.BANK, branch: bankDetails.BRANCH } };
    alert("Form Submitted Successfully!\n" + JSON.stringify(formData, null, 2));
  };
  
  // --- Validation ---
  const accountMatchError = account && confirmAccount && account !== confirmAccount;
  const isFormValid = holderName && account && !accountMatchError && bankDetails;

  // --- Inline CSS Styles ---
  const styles = {
    pageContainer: {
      display: "flex",
      justifyContent: "center",
    //   alignItems: "center",
    //   minHeight: "80vh",
      padding: "20px",
      backgroundColor: "#ffffffff",
      fontFamily: `'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif`,
    },
    form: {
      backgroundColor: "#ffffff",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      width: "80%", // Takes 80% of screen width
      maxWidth: "900px", // With a max limit for very large screens
    },
    header: {
      textAlign: "center",
      color: "#0056b3",
      marginBottom: "30px",
      fontSize: "26px",
      fontWeight: "bold",
    },
    // NEW: Style for side-by-side fields
    twoColumnLayout: {
      display: "flex",
      gap: "20px",
      marginBottom: "20px",
    },
    // NEW: Style for each column in the layout
    column: {
      flex: 1, // Each column takes equal space
    },
    inputGroup: {
      marginBottom: "20px",
    },
    inputWrapper: {
      position: "relative",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      color: "#333",
      fontWeight: "600",
      fontSize: "14px",
    },
    input: {
      width: "100%",
      padding: "12px 15px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      fontSize: "16px",
      boxSizing: "border-box",
      transition: "border-color 0.3s, box-shadow 0.3s",
    },
    eyeIcon: {
      position: "absolute",
      top: "50%",
      right: "15px",
      transform: "translateY(-50%)",
      cursor: "pointer",
      color: "#888",
    },
    verifyButton: {
      padding: "12px 20px",
      border: "none",
      backgroundColor: "#007bff",
      color: "white",
      borderRadius: "0 8px 8px 0",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "14px",
      whiteSpace: "nowrap",
    },
    submitButton: {
      width: "100%",
      padding: "15px",
      border: "none",
      borderRadius: "8px",
      color: "white",
      fontWeight: "bold",
      fontSize: "16px",
      cursor: "pointer",
      marginTop: "10px",
      transition: "transform 0.2s ease-in-out, background-color 0.3s",
      backgroundColor: isFormValid ? "#28a745" : "#a9a9a9",
      transform: isSubmitHovered && isFormValid ? "scale(1.03)" : "scale(1)",
    },
    errorMessage: {
      color: "#dc3545",
      fontSize: "13px",
      marginTop: "5px",
    },
    verifiedDetails: {
      marginTop: "25px",
      padding: "20px",
      backgroundColor: "#f0fff4",
      borderLeft: "5px solid #28a745",
      borderRadius: "8px",
    },
    verifiedHeader: {
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "10px",
      color: "#1e7e34",
    },
    detailItem: {
      fontSize: "14px",
      color: "#555",
      lineHeight: "1.6",
      wordBreak: "break-word",
    }
  };

  // Special style tag to control placeholder color, as it can't be done with inline styles
  const placeholderStyle = `
    .custom-placeholder::placeholder {
      color: #bbb;
      opacity: 1; /* For Firefox */
    }
  `;

  return (
    <div style={styles.pageContainer}>
      <style>{placeholderStyle}</style>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h2 style={styles.header}>🏦 Bank Details</h2>

        {/* --- ROW 1: Account Holder Name --- */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Account Holder Name</label>
          <input
            type="text"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="e.g., Rahul Choudhary"
            style={styles.input}
            className="custom-placeholder" // Apply custom placeholder style
          />
        </div>
        
        {/* --- ROW 2: Account Numbers (Side-by-Side) --- */}
        <div style={styles.twoColumnLayout}>
          <div style={styles.column}>
            <label style={styles.label}>Account Number</label>
            <div style={styles.inputWrapper}>
              <input
                type={showAccount ? "text" : "password"}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Enter account number"
                style={styles.input}
              />
              <span style={styles.eyeIcon} onClick={() => setShowAccount(!showAccount)}>
                {showAccount ? <EyeOpenIcon /> : <EyeOffIcon />}
              </span>
            </div>
          </div>
          <div style={styles.column}>
            <label style={styles.label}>Re-enter Account Number</label>
            <div style={styles.inputWrapper}>
              <input
                type={showConfirmAccount ? "text" : "password"}
                value={confirmAccount}
                onChange={(e) => setConfirmAccount(e.target.value)}
                placeholder="Re-enter account number"
                style={{ ...styles.input, borderColor: accountMatchError ? 'red' : '#ccc' }}
              />
              <span style={styles.eyeIcon} onClick={() => setShowConfirmAccount(!showConfirmAccount)}>
                {showConfirmAccount ? <EyeOpenIcon /> : <EyeOffIcon />}
              </span>
            </div>
            {accountMatchError && (
              <p style={styles.errorMessage}>❌ Account numbers do not match!</p>
            )}
          </div>
        </div>

        {/* --- ROW 3: IFSC Code --- */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>IFSC Code</label>
          <div style={{ display: "flex" }}>
            <input
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              placeholder="e.g., SBIN0000691"
              style={{ ...styles.input, borderRadius: "8px 0 0 8px", borderRight: "none" }}
            />
            <button type="button" onClick={handleVerify} style={styles.verifyButton} disabled={isVerifying}>
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>

        {/* Error Message Display */}
        {error && <p style={{...styles.errorMessage, textAlign: 'center'}}>{error}</p>}

        {/* Verified Bank Details */}
        {bankDetails && (
          <div style={styles.verifiedDetails}>
            <h3 style={styles.verifiedHeader}>✅ Bank Verified Successfully</h3>
            <p style={styles.detailItem}><strong>Bank:</strong> {bankDetails.BANK}</p>
            <p style={styles.detailItem}><strong>Branch:</strong> {bankDetails.BRANCH}</p>
            <p style={styles.detailItem}><strong>IFSC:</strong> {bankDetails.IFSC}</p>
            <p style={styles.detailItem}><strong>Address:</strong> {bankDetails.ADDRESS}</p>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          style={styles.submitButton}
          onMouseEnter={() => setIsSubmitHovered(true)}
          onMouseLeave={() => setIsSubmitHovered(false)}
          disabled={!isFormValid}
        >
          Submit Details
        </button>
      </form>
    </div>
  );
}