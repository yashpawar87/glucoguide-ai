import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  Utensils,
  Ban,
  ChefHat,
  Dumbbell,
  Send,
  Waves,
  Droplets,
  Activity,
  Footprints,
  Loader2,
  Pill,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  Tooltip,
} from "recharts";

/* ─── Default / Demo Data ──────────────────────────────────────── */

const DEFAULT_CLINICAL_REPORTS: ClinicalMarker[] = [];

const DEFAULT_ACTIONS: ActionItem[] = [];

const DEFAULT_NUTRITION: NutritionData = {
  eat: [],
  avoid: [],
  aiNote: "",
};

const DEFAULT_EXERCISE: ExerciseData = {
  suggested: "",
  duration: "",
  intensity: "",
  aiNote: "",
};

const GLUCOSE_LOGS: { time: string; val: number }[] = [];

/* ─── Type definitions ─────────────────────────────────────────── */

interface ActionItem {
  id: number;
  label: string;
  type: string;
  completed: boolean;
  time: string;
  isMedication?: boolean;
}

interface NutritionData {
  eat: string[];
  avoid: string[];
  aiNote: string;
}

interface ExerciseData {
  suggested: string;
  duration: string;
  intensity: string;
  aiNote: string;
}

interface ClinicalMarker {
  label: string;
  value: number;
  unit: string;
  threshold: number;
  severity: string;
}

/* ─── Sub-components ───────────────────────────────────────────── */

const RiskCard = ({ marker }: { marker: ClinicalMarker }) => {
  const isCritical =
    marker.value > marker.threshold * 2 || marker.severity === "critical";
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${isCritical ? "bg-pink-50 border-pink-100" : "bg-white border-gray-100"
        }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {marker.label}
        </span>
        {isCritical && <AlertCircle size={14} className="text-pink-500" />}
      </div>
      <div
        className={`text-xl font-black ${isCritical ? "text-pink-600" : "text-gray-900"
          }`}
      >
        {marker.value}{" "}
        <span className="text-xs font-medium opacity-60">{marker.unit}</span>
      </div>
      <div className="text-[9px] font-bold mt-1 uppercase opacity-50">
        Limit: {marker.threshold}
      </div>
    </div>
  );
};

const ActionCard = ({
  action,
  onToggle,
}: {
  action: ActionItem;
  onToggle: (id: number) => void;
}) => {
  const isMedication = action.type === "Medication";
  return (
    <div
      onClick={() => onToggle(action.id)}
      className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.completed
          ? "bg-green-100 text-green-600"
          : isMedication
            ? "bg-purple-100 text-purple-600"
            : "bg-white text-gray-400"
          }`}
      >
        {action.completed ? (
          <CheckCircle2 size={20} />
        ) : isMedication ? (
          <Pill size={20} />
        ) : (
          <Clock size={20} />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-gray-800">{action.label}</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          {action.time} • {action.type}
          {isMedication && !action.completed && (
            <span className="ml-1 text-purple-600 animate-pulse">• Take now</span>
          )}
        </div>
      </div>
      {!action.completed ? (
        <Plus size={16} className="text-gray-300 group-hover:text-purple-600" />
      ) : (
        <span className="text-[10px] font-black text-green-500">DONE</span>
      )}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4 p-6">
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    <div className="space-y-3">
      <div className="h-12 bg-gray-100 rounded-xl"></div>
      <div className="h-12 bg-gray-100 rounded-xl"></div>
      <div className="h-12 bg-gray-100 rounded-xl"></div>
    </div>
  </div>
);

/* ─── Dashboard Page ───────────────────────────────────────────── */

const Dashboard = () => {
  const [mealInput, setMealInput] = useState("");
  const [waterIntake, setWaterIntake] = useState(5);
  const waterGoal = 8;
  const [todaySteps, setTodaySteps] = useState<number>(0);

  // AI-driven state
  const [actions, setActions] = useState<ActionItem[]>(DEFAULT_ACTIONS);
  const [nutrition, setNutrition] = useState<NutritionData>(DEFAULT_NUTRITION);
  const [exercise, setExercise] = useState<ExerciseData>(DEFAULT_EXERCISE);
  const [clinicalReports, setClinicalReports] = useState<ClinicalMarker[]>(DEFAULT_CLINICAL_REPORTS);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<"ai" | "default" | "demo">("demo");

  useEffect(() => {
    fetchDailyRecommendations();
    fetchTodayStats();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const res = await api.get("/logs/history?limit=1");
      if (res.data && res.data.length > 0) {
        // Check if the log is from today
        const log = res.data[0];
        const logDate = new Date(log.date).toDateString();
        const today = new Date().toDateString();
        if (logDate === today) {
          setTodaySteps(log.steps || 0);
          setWaterIntake(log.water_intake || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch today's stats", err);
    }
  };

  const syncWater = async (newVal: number) => {
    try {
      await api.post("/logs/", { water_intake: newVal });
    } catch (err) {
      console.error("Failed to sync water", err);
    }
  };

  const fetchDailyRecommendations = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      // Parallel fetch: Recommendations + Medications
      const [resRecs, resMeds] = await Promise.all([
        api.get("/recommendations/daily"),
        api.get("/medications")
      ]);

      const data = resRecs.data;
      const userMeds = resMeds.data;

      // 1. Map AI Actions
      let aiActions: ActionItem[] = [];
      if (data.recommendations?.actions) {
        aiActions = data.recommendations.actions.map(
          (a: { time: string; task: string; category: string }, i: number) => ({
            id: i + 1000, // Offset ID to avoid collision with meds
            label: a.task,
            type: a.category.charAt(0) + a.category.slice(1).toLowerCase(),
            completed: false,
            time: a.time,
            isMedication: false
          })
        );
      }

      // 2. Map Medications to Actions
      const medActions: ActionItem[] = userMeds.map((m: any) => ({
        id: m.id, // Use actual DB ID
        label: `Take ${m.name} (${m.dosage})`,
        type: "Medication",
        completed: m.taken_today,
        time: m.time || "Daily",
        isMedication: true
      }));

      // 3. Merge and Sort by time (naive sort)
      const allActions = [...medActions, ...aiActions];
      setActions(allActions);

      // Update nutrition from AI
      if (data.recommendations?.nutrition) {
        const n = data.recommendations.nutrition;
        setNutrition({
          eat: n.eat || DEFAULT_NUTRITION.eat,
          avoid: n.avoid || DEFAULT_NUTRITION.avoid,
          aiNote: n.ai_reasoning || DEFAULT_NUTRITION.aiNote,
        });
      }

      // Update movement plan from AI
      if (data.recommendations?.movement) {
        const m = data.recommendations.movement;
        setExercise({
          suggested: m.target_type || DEFAULT_EXERCISE.suggested,
          duration: m.daily_goal || DEFAULT_EXERCISE.duration,
          intensity: m.intensity || DEFAULT_EXERCISE.intensity,
          aiNote: m.clinical_logic || DEFAULT_EXERCISE.aiNote,
        });
      }

      // Update clinical snapshot if available
      if (data.clinical_snapshot) {
        const snap = data.clinical_snapshot;
        setClinicalReports([
          { label: "Triglycerides", value: snap.triglycerides, unit: "mg/dL", threshold: 150, severity: snap.triglycerides > 300 ? "critical" : "elevated" },
          { label: "HbA1c", value: snap.hba1c, unit: "%", threshold: 6.5, severity: snap.hba1c > 7 ? "high" : "normal" },
          { label: "HDL", value: snap.hdl, unit: "mg/dL", threshold: 40, severity: snap.hdl < 40 ? "low" : "normal" },
          { label: "Fasting Glucose", value: snap.fasting_glucose, unit: "mg/dL", threshold: 100, severity: snap.fasting_glucose > 126 ? "elevated" : "normal" },
        ]);
      }

      setSource(data.source || "ai");
    } catch (err) {
      console.error("Failed to fetch data:", err);
      // Fallback to empty states on error
      setActions([]);
      setNutrition({ eat: [], avoid: [], aiNote: "" });
      setExercise({ suggested: "", duration: "", intensity: "", aiNote: "" });
      setClinicalReports([]);
      setSource("default");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAction = async (id: number) => {
    // Find the action
    const action = actions.find(a => a.id === id);
    if (!action) return;

    // Optimistic Update
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );

    // If it's a medication, call API
    if (action.type === "Medication" && (action as any).isMedication) {
      try {
        await api.put(`/medications/${id}/toggle`);
      } catch (err) {
        console.error("Failed to toggle medication", err);
        // Revert on failure
        setActions((prev) =>
          prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
        );
      }
    }
  };

  const completedCount = actions.filter((a) => a.completed).length;
  const medCount = actions.filter((a) => a.type === "Medication").length;
  const medDoneCount = actions.filter((a) => a.type === "Medication" && a.completed).length;

  const logWater = () => {
    if (waterIntake < 12) {
      const newVal = waterIntake + 1;
      setWaterIntake(newVal);
      syncWater(newVal);
    }
  };

  return (
    <div>
      <Navbar
        title="Health Command"
        subtitle="Monitoring"
        subtitleHighlight="Critical Triglycerides"
        steps={todaySteps}
      />

      <div className="grid grid-cols-12 gap-8 px-8 pb-8">
        {/* ── LEFT COLUMN ────────────────────────────────────── */}
        <div className="col-span-4 flex flex-col gap-8">
          {/* Today's Actions */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg">Today's Actions</h3>
              <div className="flex items-center gap-2">
                {source === "ai" && (
                  <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    AI Generated
                  </span>
                )}
                <span className="text-xs font-bold text-gray-400">
                  {completedCount}/{actions.length}
                </span>
              </div>
            </div>

            {/* Medicine Tracker Badge */}
            {medCount > 0 && (
              <div className={`flex items-center gap-2 mb-4 p-2.5 rounded-xl border ${medDoneCount === medCount
                ? "bg-green-50 border-green-100"
                : "bg-purple-50 border-purple-100"
                }`}>
                <Pill size={14} className={medDoneCount === medCount ? "text-green-600" : "text-purple-600"} />
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                  Medication: {medDoneCount}/{medCount} taken
                </span>
                {medDoneCount === medCount && (
                  <CheckCircle2 size={12} className="text-green-500 ml-auto" />
                )}
              </div>
            )}

            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="flex flex-col gap-3">
                {actions.length > 0 ? (
                  actions.map((a) => (
                    <ActionCard key={a.id} action={a} onToggle={toggleAction} />
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Start by generating a plan
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🍎 Food Logger */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat size={18} className="text-purple-600" />
              <h3 className="font-black text-lg">Food Logger</h3>
            </div>
            <div className="relative">
              <input
                type="text"
                value={mealInput}
                onChange={(e) => setMealInput(e.target.value)}
                placeholder="What did you eat?"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <button className="absolute right-3 top-3 p-1.5 bg-purple-600 text-white rounded-xl">
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* 🌊 Hydration Log */}
          <div className="bg-blue-50 rounded-3xl border border-blue-100 p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-blue-100 group-hover:rotate-12 transition-transform">
              <Waves size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Droplets size={18} className="text-blue-600" />
                  <h3 className="font-black text-lg text-blue-900">Hydration</h3>
                </div>
                <button
                  onClick={logWater}
                  className="p-1.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-8 rounded-md border-2 transition-all ${i < waterIntake
                      ? "bg-blue-500 border-blue-500 shadow-sm"
                      : "bg-white border-blue-200"
                      }`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                  Goal: {waterGoal} glasses
                </div>
                <div className="text-xl font-black text-blue-900">
                  {waterIntake}{" "}
                  <span className="text-xs font-bold text-blue-400">Glasses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-indigo-950 rounded-[2rem] p-6 text-white shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xs uppercase tracking-widest opacity-60">
                Activity Summary
              </h3>
              <Footprints size={16} className="text-indigo-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-black">{todaySteps.toLocaleString()}</div>
                  <div className="text-[10px] font-bold opacity-60 uppercase">
                    Steps (Fit)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black">{Math.round(todaySteps * 0.04)}</div>
                  <div className="text-[10px] font-bold opacity-60 uppercase">
                    kcal burned
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${Math.min((todaySteps / 10000) * 100, 100)}%` }} />
              </div>
              <div className="text-[10px] text-indigo-300 text-center mt-2">
                Synced with Google Fit
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────────── */}
        <div className="col-span-8 flex flex-col gap-8">
          {/* Nutrition + Exercise Intelligence */}
          <div className="grid grid-cols-2 gap-8">
            {/* Nutrition Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Utensils size={120} />
              </div>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <h3 className="font-black text-lg">Nutrition Guide</h3>
                    {source === "ai" && (
                      <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
                        AI
                      </span>
                    )}
                  </div>
                  {nutrition.eat.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-[10px] font-black uppercase text-green-600">
                            What to Eat
                          </div>
                          {nutrition.eat.map((item) => (
                            <div
                              key={item}
                              className="text-xs font-bold text-gray-800 flex items-center gap-1"
                            >
                              <Plus size={10} className="text-green-500" /> {item}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-black uppercase text-pink-600">
                            Strict Avoid
                          </div>
                          {nutrition.avoid.map((item) => (
                            <div
                              key={item}
                              className="text-xs font-bold text-gray-800 flex items-center gap-1"
                            >
                              <Ban size={10} className="text-pink-500" /> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      {nutrition.aiNote && (
                        <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-100 text-[10px] font-medium text-pink-700 leading-relaxed">
                          <strong>AI AGENT:</strong> {nutrition.aiNote}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-8 text-xs">
                      No nutrition plan generated yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Exercise Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Dumbbell size={120} />
              </div>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-purple-600" />
                    <h3 className="font-black text-lg">Movement Plan</h3>
                    {source === "ai" && (
                      <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-auto">
                        AI
                      </span>
                    )}
                  </div>
                  {exercise.suggested ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <span className="text-[10px] font-black uppercase text-gray-400">
                            Target Type
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            {exercise.suggested}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <span className="text-[10px] font-black uppercase text-gray-400">
                            Daily Goal
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            {exercise.duration}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-gray-400">
                            Intensity
                          </span>
                          <span className="text-xs font-bold text-purple-600">
                            {exercise.intensity}
                          </span>
                        </div>
                      </div>
                      {exercise.aiNote && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-100 text-[10px] font-medium text-purple-700 leading-relaxed">
                          <strong>CLINICAL LOGIC:</strong> {exercise.aiNote}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-8 text-xs">
                      No movement plan generated yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Clinical Risk Panel */}
          <div className="flex flex-col gap-4">
            <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest">
              Clinical Risk Panel
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {clinicalReports.length > 0 ? (
                clinicalReports.map((marker, i) => (
                  <RiskCard key={i} marker={marker} />
                ))
              ) : (
                <div className="col-span-4 text-center text-gray-400 py-4 text-xs">
                  No clinical biomarkers available.
                </div>
              )}
            </div>
          </div>

          {/* Metabolic Trends */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-xl">Metabolic Trends</h3>
              <div className="flex gap-4">
                <div className="text-center px-4 border-r border-gray-100">
                  <div className="text-xs font-bold text-green-600">74%</div>
                  <div className="text-[8px] font-black uppercase text-gray-400">
                    In Range
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-purple-600">124</div>
                  <div className="text-[8px] font-black uppercase text-gray-400">
                    Avg mg/dL
                  </div>
                </div>
              </div>
            </div>
            <div className="h-40 w-full flex items-center justify-center">
              {GLUCOSE_LOGS.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={GLUCOSE_LOGS}>
                    <Bar dataKey="val" radius={[4, 4, 4, 4]} barSize={32}>
                      {GLUCOSE_LOGS.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.val > 140 ? "#F472B6" : "#9333EA"}
                          fillOpacity={entry.val > 140 ? 0.9 : 0.4}
                        />
                      ))}
                    </Bar>
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#9CA3AF" }}
                      dy={10}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #f3f4f6",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 text-xs">
                  No glucose trend data available (Plan: Integrate with backend logs)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay for initial AI fetch */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-white border border-purple-100 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 z-50">
          <Loader2 size={16} className="animate-spin text-purple-600" />
          <span className="text-xs font-bold text-gray-600">
            AI Agent analyzing your records...
          </span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
