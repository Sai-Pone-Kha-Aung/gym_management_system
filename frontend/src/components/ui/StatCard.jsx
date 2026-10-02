import React from "react";

export const StatCard = ({ title, value, change, icon, subtitle }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {(subtitle || change) && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            {change && <span className="font-medium text-emerald-600">{change}</span>}
            {subtitle}
          </p>
        )}
      </div>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 text-xl">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
