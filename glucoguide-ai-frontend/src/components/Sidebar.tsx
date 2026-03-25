import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Settings,
  Activity,
  LogOut,
  Pill,
  MessageCircle,
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/submit-report", label: "Lab Reports", icon: FileText },
  { path: "/daily-log", label: "Daily Log", icon: TrendingUp },
  { path: "/medicines", label: "Medicines", icon: Pill },
  { path: "/chatbot", label: "Chat", icon: MessageCircle },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 flex flex-col gap-2 pr-4 h-screen bg-[#F9FAFC] p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6 mb-4">
        <div className="bg-purple-600 p-2 rounded-xl text-white shadow-lg">
          <Activity size={24} />
        </div>
        <span className="text-2xl font-black text-purple-950 tracking-tighter">GlucoGuide</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all no-underline ${isActive
                ? "bg-white text-purple-600 shadow-sm font-bold"
                : "text-gray-500 hover:bg-gray-100"
                }`}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Health GPS Score */}
      <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col gap-1 pb-4">
        <div className="mx-4 p-4 bg-purple-900 rounded-2xl text-white mb-4">
          <div className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest text-center">
            Health GPS
          </div>
          <div className="text-2xl font-black text-center">840</div>
          <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-purple-400 w-[84%]" />
          </div>
        </div>

        <Link
          to="#"
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-gray-500 hover:bg-gray-100 no-underline"
        >
          <Settings size={18} />
          <span className="text-sm">Settings</span>
        </Link>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-gray-500 hover:bg-red-50 hover:text-red-500 w-full text-left"
        >
          <LogOut size={18} />
          <span className="text-sm">Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
