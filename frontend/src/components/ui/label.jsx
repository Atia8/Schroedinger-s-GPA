import React from "react";

export function Label({ children }) {
  return (
    <label style={{ fontWeight: "600", display: "block" }}>
      {children}
    </label>
  );
}
