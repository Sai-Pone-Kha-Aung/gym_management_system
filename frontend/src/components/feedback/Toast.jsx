import React from "react";

export const Toast = ({ message, type = "info", onClose }) => {
  const typeStyles = {
    success: "bg-emerald-800 text-white",
    error: "bg-rose-800 text-white",
    info: "bg-gray-900 text-white",
    warning: "bg-amber-800 text-white",
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg text-sm animate-in slide-in-from-top-2 duration-200 ${
        typeStyles[type] || typeStyles.info
      }`}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white font-semibold cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Toast;
