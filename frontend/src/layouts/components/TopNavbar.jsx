import React from "react";
import useAuth from "../../hooks/useAuth";

export const TopNavbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          ● System Online
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-800">
            {user?.name || "Staff Member"}
          </p>
          <p className="text-[11px] text-gray-500 capitalize">
            {user?.role || "Administrator"}
          </p>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
