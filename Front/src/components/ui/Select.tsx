import React from "react";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={"field-input" + (className ? " " + className : "")}>
      {children}
    </select>
  );
}
