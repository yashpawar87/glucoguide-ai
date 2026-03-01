import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
    Pill,
    Plus,
    Clock,
    Trash2,
    X,
    Calendar
} from "lucide-react";

interface Medication {
    id: number;
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    taken_today: boolean;
}

const MedicineTracker = () => {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const [newMed, setNewMed] = useState({
        name: "",
        dosage: "",
        frequency: "Daily",
        time: "08:00 AM"
    });

    useEffect(() => {
        fetchMedications();
    }, []);

    const fetchMedications = async () => {
        try {
            const res = await api.get("/medications");
            setMedications(res.data);
        } catch (err: any) {
            console.error("Failed to fetch medications", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedication = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post("/medications", newMed);
            setMedications([...medications, res.data]);
            setShowAddForm(false);
            setNewMed({ name: "", dosage: "", frequency: "Daily", time: "08:00 AM" });
        } catch (err: any) {
            console.error("Failed to add medication", err);
        }
    };

    const toggleTaken = async (id: number) => {
        try {
            const res = await api.put(`/medications/${id}/toggle`);
            setMedications(medications.map(m => m.id === id ? res.data : m));
        } catch (err) {
            console.error("Failed to toggle medication", err);
        }
    };

    const deleteMedication = async (id: number) => {
        if (!window.confirm("Are you sure you want to remove this medication?")) return;
        try {
            await api.delete(`/medications/${id}`);
            setMedications(medications.filter(m => m.id !== id));
        } catch (err) {
            console.error("Failed to delete medication", err);
        }
    };

    return (
        <div>
            <Navbar title="Medicine Cabinet" subtitle="Manage your prescriptions" />

            <div className="px-8 pb-8 max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-gray-900">Your Medications</h2>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Medication
                    </button>
                </div>

                {/* Add Form Modal/Overlay */}
                {showAddForm && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black">Add New Medication</h3>
                                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddMedication} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">Medication Name</label>
                                    <input
                                        type="text"
                                        value={newMed.name}
                                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                                        placeholder="e.g. Metformin"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-200"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-1">Dosage</label>
                                        <input
                                            type="text"
                                            value={newMed.dosage}
                                            onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                            placeholder="e.g. 500mg"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-1">Time</label>
                                        <input
                                            type="text"
                                            value={newMed.time}
                                            onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                                            placeholder="e.g. 08:00 AM"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">Frequency</label>
                                    <select
                                        value={newMed.frequency}
                                        onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-200"
                                    >
                                        <option>Daily</option>
                                        <option>Twice Daily</option>
                                        <option>Weekly</option>
                                        <option>As Needed</option>
                                    </select>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" className="w-full btn-primary py-4 text-sm">
                                        Save Medication
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Medication List */}
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading your cabinet...</div>
                ) : medications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 border-dashed">
                        <Pill size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="font-bold text-gray-400">No medications added yet.</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="mt-4 text-purple-600 font-bold hover:underline"
                        >
                            Add your first medication
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {medications.map(med => (
                            <div key={med.id} className={`group bg-white rounded-3xl p-6 border transition-all hover:shadow-md ${med.taken_today ? 'border-green-100 bg-green-50/30' : 'border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${med.taken_today ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                        <Pill size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleTaken(med.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${med.taken_today ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'}`}
                                        >
                                            {med.taken_today ? 'Taken' : 'Mark Taken'}
                                        </button>
                                        <button
                                            onClick={() => deleteMedication(med.id)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-black text-lg text-gray-900">{med.name}</h3>
                                    <div className="text-sm font-bold text-gray-400 mb-4">{med.dosage}</div>

                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-purple-400" />
                                            {med.time}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-purple-400" />
                                            {med.frequency}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicineTracker;
