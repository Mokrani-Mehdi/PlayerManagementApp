import React from "react";
import "./Field.css";

interface FieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export function Field({ label, children, required }: FieldProps) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      {children}
    </label>
  );
}
