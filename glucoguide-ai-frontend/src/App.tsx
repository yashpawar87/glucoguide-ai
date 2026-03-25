import { Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import SubmitReport from "./pages/SubmitReport";
import DailyLog from "./pages/DailyLog";
import MedicineTracker from "./pages/MedicineTracker";
import Chatbot from "./pages/Chatbot";
import Sidebar from "./components/Sidebar";
import "./App.css";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        {children}
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/submit-report" element={<SubmitReport />} />
        <Route path="/daily-log" element={<DailyLog />} />
        <Route path="/medicines" element={<MedicineTracker />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
