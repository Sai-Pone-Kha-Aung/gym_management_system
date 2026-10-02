import React from "react";

export const Input = ({
  label,
  id,
  error,
  helperText,
  className = "",
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3 py-2 text-sm rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all ${
          error ? "border-rose-500 focus:ring-rose-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
      {helperText && !error && (
        <span className="text-xs text-gray-500">{helperText}</span>
      )}
    </div>
  );
};

export default Input;
