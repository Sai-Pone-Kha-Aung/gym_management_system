import React from "react";

export const Card = ({ children, className = "", title, action }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
