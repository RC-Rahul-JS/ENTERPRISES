import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CameraScanner({ onScanSuccess, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Create instance of the scanner
    const scanner = new Html5QrcodeScanner(
      "reader", // Element ID where video renders
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }, // Rectangular box optimized for barcodes
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // 0 means camera-based scanning only
      },
      /* verbose= */ false
    );

    const successCallback = (decodedText) => {
      onScanSuccess(decodedText);
    };

    const errorCallback = (err) => {
      // Solitary frame errors can be ignored safely to prevent logs bloating
    };

    scanner.render(successCallback, errorCallback);
    scannerRef.current = scanner;

    // Cleanup: Stop scanning when component disappears
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner on unmount.", error);
        });
      }
    };
  }, [onScanSuccess]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', 
      alignItems: 'center', zIndex: 1000
    }}>
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h3>📷 Align Barcode Inside Box</h3>
          <button onClick={onClose} style={{ padding: '5px 10px', cursor: 'pointer' }}>Close</button>
        </div>
        
        {/* The video stream injects here */}
        <div id="reader" style={{ width: '100%' }}></div>
        
      </div>
    </div>
  );
}

