import React from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Briefcase, Activity, Zap, ArrowUpRight } from 'lucide-react';
import ScoreBreakdown from './ScoreBreakdown';

const DashboardModule = ({ children, className, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        whileHover={{
            boxShadow: "0 0 30px -5px rgba(139, 92, 246, 0.2)"
        }}
        className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group transition-all ${className}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        {children}
    </motion.div>
);

const CandidateDashboard = ({ onLogout }) => {
    const radarData = [
        { subject: 'Coding', A: 120, fullMark: 150 },
        { subject: 'System', A: 98, fullMark: 150 },
        { subject: 'Comms', A: 86, fullMark: 150 },
        { subject: 'Problem', A: 99, fullMark: 150 },
        { subject: 'Algo', A: 85, fullMark: 150 },
        { subject: 'Debug', A: 65, fullMark: 150 },
    ];

    return (
        <div className="min-h-screen pt-24 px-8 pb-12 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-7xl mx-auto"
            >
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Mission Control</h1>
                        <p className="text-gray-400">Status: <span className="text-green-400 font-mono">ONLINE</span></p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Module A: Active Applications */}
                    <DashboardModule className="md:col-span-2 h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Briefcase className="text-blue-400" size={20} /> Active Missions
                            </h2>
                            <button className="text-xs px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition-colors">View All</button>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {[
                                { role: "Senior Engineer", company: "DevScoreAI", status: "Test Ready", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
                                { role: "ML Architect", company: "NeuralNet", status: "Processing", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
                                { role: "Frontend Lead", company: "Vercel", status: "Applied", color: "text-gray-400 border-gray-500/30 bg-gray-500/10" },
                            ].map((job, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors group/item">
                                    <div>
                                        <h3 className="font-bold text-white">{job.role}</h3>
                                        <p className="text-sm text-gray-500">{job.company}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-mono border ${job.color} flex items-center gap-2`}>
                                            {job.status === 'Test Ready' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>}
                                            {job.status}
                                        </span>
                                        <ArrowUpRight className="text-gray-600 group-hover/item:text-white transition-colors" size={18} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DashboardModule>

                    {/* Module B: AI Insight (Summary) */}
                    <DashboardModule delay={0.1} className="h-[400px] md:col-span-1 bg-gradient-to-br from-purple-900/10 to-blue-900/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                            <Zap className="text-yellow-400" size={20} /> AI Insight
                        </h2>
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    Your profile strength has increased by <span className="text-green-400 font-bold">+12%</span> this week. High engagement detected in System Design modules.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-2">Recommended Focus</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Graph Theory', 'React Server Components', 'Distributed Systems'].map(tag => (
                                        <span key={tag} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DashboardModule>

                    {/* Module C: Skill Radar */}
                    <DashboardModule delay={0.2} className="md:col-span-1 h-[350px]">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                            <Activity className="text-green-400" size={20} /> Skill Matrix
                        </h2>
                        <div className="h-[250px] w-full -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                                    <Radar
                                        name="Skills"
                                        dataKey="A"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fill="#8b5cf6"
                                        fillOpacity={0.2}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardModule>

                    {/* Module D: Transparent Score Breakdown */}
                    <DashboardModule delay={0.3} className="md:col-span-2">
                        <ScoreBreakdown />
                    </DashboardModule>

                </div>
            </motion.div>
        </div>
    );
};

export default CandidateDashboard;
