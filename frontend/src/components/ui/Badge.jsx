import React from "react";
import { STATUS_COLORS } from "../../utils/constants";

export const Badge = ({ status, children, className = "" }) => {
  const colorClass =
    STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;
