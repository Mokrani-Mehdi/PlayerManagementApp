import React from "react";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={"field-input" + (className ? " " + className : "")} />;
}
