import React from "react";

export function Button({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        background: "#4f46e5",
        color: "white",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      {children}
    </button>
  );
}
