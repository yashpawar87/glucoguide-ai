import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
    Plus,
    CheckCircle2,
    Activity,
    Moon,
    Droplets,
    Utensils,
    Flame,
    TrendingUp,
} from "lucide-react";

/* ─── Helper Functions ────────────────────────────────────────── */

const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 40) return "bg-yellow-100 text-yellow-700";
    return "bg-pink-100 text-pink-700";
};

const DailyLog = () => {
    const [form, setForm] = useState({
        exercise_min: "",
        steps: "",
        sleep_hours: "",
        fasting_glucose: "",
        diet_score: "",
        alcohol_units: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get("/logs/history");
            setLogs(res.data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const calculateScore = () => {
        const ex = Number(form.exercise_min);
        const steps = Number(form.steps);
        const sl = Number(form.sleep_hours);
        const gl = Number(form.fasting_glucose);
        const di = Number(form.diet_score);
        const al = Number(form.alcohol_units);
        let pts = 0;
        if (ex >= 30) pts += 20;
        if (steps >= 8000) pts += 10; // Bonus for steps
        if (sl >= 7 && sl <= 9) pts += 20;
        if (gl < 130) pts += 20;
        if (di >= 7) pts += 20;
        if (al === 0) pts += 20;
        return Math.min(pts, 100); // Cap at 100
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Local calculation for immediate feedback
        const s = calculateScore();
        setScore(s);

        const payload = {
            exercise_minutes: Number(form.exercise_min) || 0,
            steps: Number(form.steps) || 0,
            sleep_hours: Number(form.sleep_hours) || 0,
            alcohol_units: Number(form.alcohol_units) || 0,
            fasting_glucose: Number(form.fasting_glucose) || 0,
            diet_score: Number(form.diet_score) || 0
        };

        try {
            await api.post("/logs/", payload);
            setSubmitted(true);
            fetchHistory(); // Refresh list
        } catch (err) {
            console.error("Failed to submit log", err);
            alert("Failed to save log. Please try again.");
        }
    };

    const fields = [
        { name: "exercise_min", label: "Exercise", unit: "min", icon: Activity, placeholder: "30" },
        { name: "steps", label: "Google Fit Steps", unit: "steps", icon: Activity, placeholder: "8432" },
        { name: "sleep_hours", label: "Sleep", unit: "hrs", icon: Moon, placeholder: "7.5" },
        { name: "fasting_glucose", label: "Fasting Glucose", unit: "mg/dL", icon: Droplets, placeholder: "118" },
        { name: "diet_score", label: "Diet Quality", unit: "/10", icon: Utensils, placeholder: "7" },
        { name: "alcohol_units", label: "Alcohol", unit: "units", icon: Flame, placeholder: "0" },
    ];

    return (
        <div>
            <Navbar title="Daily Log" subtitle="Track your metabolic health daily" />

            <div className="px-8 pb-8 max-w-5xl mx-auto">
                <div className="grid grid-cols-12 gap-8">
                    {/* ── LEFT: Log Form ────────────────────────────────── */}
                    <div className="col-span-5">
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="font-black text-lg mb-6">Log Today's Metrics</h3>
                                <div className="space-y-4">
                                    {fields.map((f) => {
                                        const Icon = f.icon;
                                        return (
                                            <div key={f.name}>
                                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                                    <Icon size={12} />
                                                    {f.label}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        name={f.name}
                                                        value={(form as any)[f.name]}
                                                        onChange={handleChange}
                                                        placeholder={f.placeholder}
                                                        required
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                                                    />
                                                    <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">
                                                        {f.unit}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button type="submit" className="btn-primary mt-6 w-full">
                                    <Plus size={18} /> Submit Log
                                </button>
                            </form>
                        ) : (
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={28} className="text-green-600" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">Logged!</h3>
                                <div className={`inline-block text-3xl font-black px-6 py-2 rounded-2xl mb-4 ${getScoreColor(score || 0)}`}>
                                    {score}%
                                </div>
                                <p className="text-sm text-gray-400 mb-6">
                                    {(score || 0) >= 80
                                        ? "Excellent adherence today! Keep it up 🎯"
                                        : (score || 0) >= 40
                                            ? "Good effort. Try to hit all 5 targets tomorrow 💪"
                                            : "Tough day — focus on basics: walk, sleep, no alcohol 🌱"}
                                </p>
                                <button
                                    onClick={() => { setSubmitted(false); setScore(null); setForm({ exercise_min: "", steps: "", sleep_hours: "", fasting_glucose: "", diet_score: "", alcohol_units: "" }); }}
                                    className="text-sm font-bold text-purple-600 hover:underline"
                                >
                                    ← Log another entry
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Log History ────────────────────────────── */}
                    <div className="col-span-7">
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-lg">Recent Logs</h3>
                                <div className="flex items-center gap-1 text-purple-600">
                                    <TrendingUp size={14} />
                                    <span className="text-xs font-black">7-day view</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <th className="text-left pb-4">Date</th>
                                            <th className="text-left pb-4">Exercise</th>
                                            <th className="text-left pb-4">Steps</th>
                                            <th className="text-left pb-4">Sleep</th>
                                            <th className="text-left pb-4">Glucose</th>
                                            <th className="text-right pb-4">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">Loading logs...</td>
                                            </tr>
                                        ) : logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">No logs found. Start tracking today!</td>
                                            </tr>
                                        ) : (
                                            logs.map((log: any, i) => (
                                                <tr key={i} className="border-t border-gray-50">
                                                    <td className="py-3 font-bold text-gray-800">
                                                        {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td className="py-3 text-gray-600">{log.exercise_minutes || 0} min</td>
                                                    <td className="py-3 text-gray-600">{log.steps ? log.steps.toLocaleString() : 0}</td>
                                                    <td className="py-3 text-gray-600">{log.sleep_hours || 0} hrs</td>
                                                    <td className="py-3 text-gray-600">{log.fasting_glucose || '--'}</td>
                                                    <td className="py-3 text-right">
                                                        <span className={`inline-block text-xs font-black px-3 py-1 rounded-full ${getScoreColor(log.adherence_score)}`}>
                                                            {log.adherence_score}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyLog;
