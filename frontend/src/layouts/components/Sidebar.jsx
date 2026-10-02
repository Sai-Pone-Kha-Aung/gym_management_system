import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CreditCard,
  CalendarDays,
  UserCog,
  LogOut,
} from "lucide-react";
import NavItem from "./NavItem";
import useAuth from "../../hooks/useAuth";

export const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      to: "/members",
      label: "Members",
      icon: <Users size={18} />,
    },
    {
      to: "/trainers",
      label: "Trainers",
      icon: <Dumbbell size={18} />,
    },
    {
      to: "/memberships",
      label: "Memberships",
      icon: <CreditCard size={18} />,
    },
    {
      to: "/sessions",
      label: "Training Sessions",
      icon: <CalendarDays size={18} />,
    },
    { to: "/users", label: "Users & Staff", icon: <UserCog size={18} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col justify-between p-4 shrink-0">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-3 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            G
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
              GYMPRO
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Management System
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            if (!isAdmin && item.to === "/users") return null;
            return <NavItem key={item.to} {...item} />;
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
            {user?.name ? user.name[0].toUpperCase() : "A"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-gray-800 truncate">
              {user?.name || "Admin Staff"}
            </span>
            <span className="text-[11px] text-gray-500 truncate">
              {user?.email || "admin@gym.com"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <span>
            <LogOut size={18} />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
