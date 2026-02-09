import * as React from "react";

export function Dialog({ children, open }) {
  if (!open) return null;

  return (
    <div style={overlay}>
      <div style={dialog}>{children}</div>
    </div>
  );
}

export function DialogContent({ children }) {
  return <div>{children}</div>;
}

export function DialogHeader({ children }) {
  return <div style={{ marginBottom: "10px" }}>{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 style={{ margin: 0 }}>{children}</h2>;
}

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dialog = {
    position: "relative",
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  minWidth: "300px",
};
