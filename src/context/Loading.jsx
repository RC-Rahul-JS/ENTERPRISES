import React from "react";

const FullScreenLoader = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.2)", // Background with 0.2 opacity
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999, // Ensures it's above other content
      }}
    >
        <span className="loader"></span>
    </div>
  );
};

export default FullScreenLoader;
