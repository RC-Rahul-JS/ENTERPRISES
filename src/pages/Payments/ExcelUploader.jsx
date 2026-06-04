import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import Swal from "sweetalert2";
import moment from "moment";

export default function ExcelUploader() {
  const [excelData, setExcelData] = useState([]);
  const [dateWiseTotals, setDateWiseTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState({ fee: 0, tax: 0, gataway: 0 });

  const [loading, setLoading] = useState(false);

  // ✅ Excel Serial Date to JS Date (YYYY-MM-DD only)

function convertDateFormat(dateStr) {
  // Input format: YYYY-MM-DD
  const [year, month, day] = dateStr.split("-");
  return `${year}-${day}-${month}`;
}
const excelDateToJSDate = (value) => {
  if (!value) return "";

  // Case 1: Excel serial number (numeric)
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return convertDateFormat(`${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`)

      // return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }

  // Case 2: Already string
  if (typeof value === "string") {
    let d;

    // Try ISO or US style parsing
    d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }

    // Try manual parse if DD/MM/YYYY or DD/MM/YYYY HH:mm:ss
    const parts = value.split(/[/\s:]/); 
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (day && month && year) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }

  return "";
};



  // ✅ Parse Excel File
  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log(jsonData)

      // Headers
      const headers = jsonData[0];
      const requiredColumns = ["entity_created_at", "entity_id", "credit", "fee (exclusive tax)", "tax"];
      const indices = requiredColumns.map((col) => headers.indexOf(col));

      // Add gst header
      const newHeaders = [...requiredColumns, "Total"];

      // Process rows
      const filteredData = jsonData.slice(1).map((row) => {
        const values = indices.map((i, idx) => {
          if (requiredColumns[idx] === "entity_created_at") {
            console.log(row[i])
            return excelDateToJSDate(row[i]);
          }
          return row[i];
        });

        const fee = Number(row[headers.indexOf("fee (exclusive tax)")]) || 0;
        const tax = Number(row[headers.indexOf("tax")]) || 0;
        // const gst = fee - tax;


        const credit = Number(row[headers.indexOf("credit")]) || 0;
        const razor = (fee + credit + tax).toFixed(2);

        return [...values, razor];
      });
      // Save Excel data for table
      setExcelData([newHeaders, ...filteredData]);

      // ✅ Group data by date + calculate Grand Total
      const totals = {};
      let totalbank = 0,
       totalFee = 0,
        totalTax = 0,
        // totalGataway = 0,
        totalrazarpay = 0;

      filteredData.forEach((row) => {
        const date = row[0]; // created_at
        const bank = Number(row[2]) || 0;
        const fee = Number(row[3]) || 0;
        const tax = Number(row[4]) || 0;
        // const gataway = Number(row[5]) || 0;
        const razarpay = Number(row[5]) || 0;

        if (!totals[date]) {
          totals[date] = {bank: 0, fee: 0, tax: 0, gataway: 0, razarpay: 0 };
        }

        totals[date].bank += bank;
        totals[date].fee += fee;
        totals[date].tax += tax;
        // totals[date].gataway += gataway;
        totals[date].razarpay += razarpay;

        // Grand Totals
        totalbank += bank;
        totalFee += fee;
        totalTax += tax;
        // totalGataway += gataway;
        totalrazarpay += razarpay;
      });

      setDateWiseTotals(totals);
      setGrandTotal({bank: totalbank, fee: totalFee, tax: totalTax, razarpay:totalrazarpay});
    };
    reader.readAsArrayBuffer(file);
  };

  // ✅ Dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "application/vnd.ms-excel": [],
      "text/csv": [],
    },
    onDrop: (acceptedFiles) => {
      handleFile(acceptedFiles[0]);
    },
  });




  const submit = async() => {
  const result = Object.entries(dateWiseTotals).map(([date, totals]) => {
    // उस date की सारी rows filter कर लो
    const entries = excelData
      .slice(1) // header हटाना
      .filter((row) => row[0] === date) // केवल उसी date की rows
      .map((row) => ({
        Payment_id: row[1], // entity_id
        settlemant: Number(row[2]) || 0,
        razorpay: Number(row[5]) || 0,
        tax: Number(row[4]) || 0,
        gataway_charges: Number(row[3]) || 0,
      }));

    return {
      date,
      amount: parseFloat(parseFloat(totals.razarpay).toFixed(2)), // ✅ या केवल totals.fee चाहिए तो बदल सकते हो
      bankamount: parseFloat(totals.bank).toFixed(2), // ✅ या केवल totals.fee चाहिए तो बदल सकते हो
      entries,
    };
  });

  console.log("Final JSON:", result);

  setLoading(true)

  try {
    const res = await axios.post('https://api.care2connect.in/excel_razorpay_tax',result)
    console.log(res.data)

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Vouchers created successfully!",
      showConfirmButton: false,
      timer: 2000,
    });
  setLoading(false)

    setExcelData([])
  setDateWiseTotals({})
  setGrandTotal({ fee: 0, tax: 0, gataway: 0 })

  } catch (error) {
    console.log(error)
  setLoading(false)


    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.response?.data?.error || "Something went wrong!",
    });
    
  }

};




  return (
    <div className="p-4">
      {/* Drag and Drop Box */}
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #007bff",
          borderRadius: "10px",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
          background: isDragActive ? "#eaf4ff" : "#f9f9f9",
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the Excel file here...</p>
        ) : (
          <p>Drag & Drop Excel file here, or click to upload</p>
        )}
      </div>

      {/* Excel Data Table */}
      {excelData.length > 0 && (
        <div style={{ marginTop: "20px", overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              border: "1px solid #ddd",
            }}
          >
            <tbody>
              {excelData.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        background: i === 0 ? "#f2f2f2" : "white",
                        fontWeight: i === 0 ? "bold" : "normal",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ✅ Show Date-Wise Totals */}
          <h2 style={{ marginTop: "20px" }}>📊 Date-wise Totals</h2>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              border: "1px solid #ddd",
              marginTop: "10px",
            }}
          >
            <thead>
              <tr style={{ background: "#f2f2f2" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Date
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Bank Settlement
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Total Fee
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  GST ITC
                </th>
                {/* <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Gateway Charges
                </th> */}
                 <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Total Razorpay
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dateWiseTotals).map(([date, totals]) => (
                <tr key={date}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {moment(date).format('YYYY-MM-DD')}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    ₹{totals.bank.toFixed(2)}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    ₹{totals.fee.toFixed(2)}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    ₹{totals.tax.toFixed(2)}
                  </td>
                  {/* <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    ₹{totals.gataway.toFixed(2)}
                  </td> */}
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    ₹{totals.razarpay.toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* ✅ Grand Total Row */}
              <tr style={{ background: "#e0ffe0", fontWeight: "bold" }}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Grand Total
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  ₹{grandTotal.bank.toFixed(2)}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  ₹{grandTotal.fee.toFixed(2)}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  ₹{grandTotal.tax.toFixed(2)}
                </td>
                {/* <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  ₹{grandTotal.gataway.toFixed(2)}
                </td> */}
                 <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  ₹{grandTotal.razarpay.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

  {  excelData.length > 0&&  <div className="flex justify-center mt-6">
{!loading ? <button
    onClick={submit}
    type="submit"
    className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition transform hover:scale-105"
  >
    Create Vouchers
  </button> : <p>Wait...</p>}
</div>}

    </div>
  );
}
