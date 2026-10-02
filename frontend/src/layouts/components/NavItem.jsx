import React from "react";
import { NavLink } from "react-router-dom";

export const NavItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? "bg-gray-900 text-white shadow-xs"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`
      }
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

export default NavItem;
