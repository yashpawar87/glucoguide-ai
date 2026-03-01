import { Footprints } from "lucide-react";

interface NavbarProps {
  title?: string;
  subtitle?: string;
  subtitleHighlight?: string;
  steps?: number; // Added steps prop
}

const Navbar = ({ title = "Dashboard", subtitle, subtitleHighlight, steps = 0 }: NavbarProps) => {
  return (
    <header className="flex justify-between items-center mb-8 px-8 pt-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-400 font-medium">
            {subtitle}{" "}
            {subtitleHighlight && (
              <span className="text-pink-600 font-bold">{subtitleHighlight}</span>
            )}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end bg-gray-50 px-4 py-2 rounded-2xl">
          <div className="flex items-center gap-1 text-green-600">
            <Footprints size={14} />
            <span className="text-xs font-black uppercase">Google Fit</span>
          </div>
          <span className="text-lg font-black text-gray-800">{steps.toLocaleString()} Steps</span>
        </div>
        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-purple-50">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
