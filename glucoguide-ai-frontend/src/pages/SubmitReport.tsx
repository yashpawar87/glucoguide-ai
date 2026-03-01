import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
    Upload,
    AlertCircle,
    Loader2,
    Stethoscope,
} from "lucide-react";

const mockPlan = {
    risk_analysis: "Pre-Diabetic Hyperglycemia with Dyslipidemia — Moderate-High Risk",
    routine: [
        { time: "06:00", activity: "Fasted morning walk — 30min brisk pace", priority: "Mandatory" },
        { time: "07:00", activity: "High-fiber breakfast: oats, flaxseed, green tea", priority: "Mandatory" },
        { time: "10:00", activity: "Mid-morning snack: nuts + fruit", priority: "Recommended" },
        { time: "13:00", activity: "Lunch: grilled protein + leafy greens", priority: "Mandatory" },
        { time: "16:00", activity: "Resistance training — 25–30 min", priority: "Priority" },
        { time: "19:00", activity: "Light dinner: soup, salad, lean protein", priority: "Mandatory" },
        { time: "21:30", activity: "Wind down: no screens, herbal tea", priority: "Recommended" },
    ],
    restrictions: ["No refined sugar", "No alcohol", "Limit sodium to <2000mg", "No trans fats"],
    monitoring_focus: ["Fasting glucose (daily)", "Post-meal glucose (2hr)", "Triglycerides (weekly)"],
};

const SubmitReport = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [plan, setPlan] = useState<typeof mockPlan | null>(null);
    const [error, setError] = useState("");

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.type === "application/pdf") {
            setFile(dropped);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setProcessing(true);
        setError("");
        setPlan(null);

        const token = localStorage.getItem("token");

        // DEMO MODE: If no token, simulate AI processing
        if (!token) {
            navigate("/");
            return;
        }

        // REAL MODE: Backend call
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post("/reports/upload", formData);
            setPlan(res.data.plan);

            // Navigate to dashboard option is below
        } catch (err: any) {
            console.error(err);
            if (err.response) {
                if (err.response.status === 401) {
                    localStorage.removeItem("token");
                    setError("Session expired. Please log in again.");
                } else {
                    setError(`Upload failed: ${err.response.data?.detail || err.response.statusText}`);
                }
            } else {
                setError(`Network Error: ${err.message}. Is the backend server running?`);
            }
        } finally {
            if (token && processing) setProcessing(false);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case "Mandatory": return "bg-pink-100 text-pink-700";
            case "Priority": return "bg-purple-100 text-purple-700";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div>
            <Navbar title="Lab Reports" subtitle="Upload and analyze clinical data" />

            <div className="px-8 pb-8 max-w-4xl mx-auto">
                {/* Upload Zone */}
                {!plan && (
                    <div
                        className={`rounded-3xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${dragging
                            ? "border-purple-400 bg-purple-50"
                            : "border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50"
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("file-input")?.click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-2xl flex items-center justify-center">
                            <Upload size={28} className="text-purple-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-800 mb-2">
                            {file ? file.name : "Drop your lab report here"}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {file
                                ? `${(file.size / 1024).toFixed(1)} KB — Ready to process`
                                : "Supports PDF files · Click or drag to upload"}
                        </p>
                    </div>
                )}

                {/* Upload Button */}
                {file && !plan && !processing && (
                    <div className="mt-6 text-center">
                        <button onClick={handleUpload} className="btn-primary">
                            <Stethoscope size={18} />
                            Analyze Report with AI
                        </button>
                    </div>
                )}

                {/* Processing State */}
                {processing && (
                    <div className="mt-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
                            <Loader2 size={28} className="text-purple-600 animate-spin" />
                        </div>
                        <h3 className="text-lg font-black text-gray-800 mb-2">
                            AI Agent Processing
                        </h3>
                        <p className="text-sm text-gray-400">
                            Extracting biomarkers and generating your lifestyle protocol...
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-6 p-4 bg-pink-50 border border-pink-100 rounded-2xl flex items-center gap-3">
                        <AlertCircle size={18} className="text-pink-500" />
                        <span className="text-sm font-bold text-pink-700">{error}</span>
                    </div>
                )}

                {/* Results */}
                {plan && (
                    <div className="space-y-6 mt-6">
                        {/* Risk Analysis */}
                        <div className="p-6 bg-pink-50 border border-pink-100 rounded-3xl">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={18} className="text-pink-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">
                                    Risk Assessment
                                </span>
                            </div>
                            <div className="text-lg font-black text-pink-700">
                                {plan.risk_analysis}
                            </div>
                        </div>

                        {/* 7-Day Routine */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                            <h3 className="font-black text-lg mb-6">7-Day Intervention Plan</h3>
                            <div className="space-y-3">
                                {plan.routine.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100"
                                    >
                                        <div className="text-sm font-black text-purple-600 w-14">
                                            {item.time}
                                        </div>
                                        <div className="flex-1 text-sm font-bold text-gray-800">
                                            {item.activity}
                                        </div>
                                        <span
                                            className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${getPriorityColor(
                                                item.priority
                                            )}`}
                                        >
                                            {item.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Restrictions + Monitoring */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <h4 className="font-black text-sm mb-4 text-pink-600 uppercase tracking-widest">
                                    Restrictions
                                </h4>
                                <div className="space-y-2">
                                    {plan.restrictions.map((r, i) => (
                                        <div key={i} className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                            {r}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <h4 className="font-black text-sm mb-4 text-purple-600 uppercase tracking-widest">
                                    Monitoring Focus
                                </h4>
                                <div className="space-y-2">
                                    {plan.monitoring_focus.map((m, i) => (
                                        <div key={i} className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="text-sm font-bold text-white bg-purple-600 px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                            >
                                View in Dashboard →
                            </button>
                            <button
                                onClick={() => { setFile(null); setPlan(null); }}
                                className="text-sm font-bold text-gray-500 hover:text-purple-600 px-4 py-3"
                            >
                                Upload another report
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmitReport;
