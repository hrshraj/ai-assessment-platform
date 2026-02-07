import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Briefcase, Activity, Zap, ArrowUpRight, Loader2 } from 'lucide-react';
import ScoreBreakdown from './ScoreBreakdown';
import CandidateService from '../../services/CandidateService';

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
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await CandidateService.getSubmissions();
                setSubmissions(data);
            } catch (err) {
                console.error('Failed to load submissions:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Build radar data from latest submission's skill scores
    const latestSubmission = submissions[0];
    const skillScores = latestSubmission?.skillScores || {};
    const radarData = Object.entries(skillScores).length > 0
        ? Object.entries(skillScores).map(([key, val]) => ({
            subject: key.length > 8 ? key.substring(0, 8) : key,
            A: Number(val),
            fullMark: 100
        }))
        : [
            { subject: 'Coding', A: 0, fullMark: 100 },
            { subject: 'System', A: 0, fullMark: 100 },
            { subject: 'Logic', A: 0, fullMark: 100 },
        ];

    const strengths = latestSubmission?.strengths || [];
    const weaknesses = latestSubmission?.weaknesses || [];

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
                <span className="ml-3 text-gray-400">Loading dashboard...</span>
            </div>
        );
    }

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
                        <p className="text-gray-400">Status: <span className="text-green-400 font-mono">ONLINE</span> | {submissions.length} assessment{submissions.length !== 1 ? 's' : ''} completed</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Module A: Past Submissions */}
                    <DashboardModule className="md:col-span-2 h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Briefcase className="text-blue-400" size={20} /> Your Assessments
                            </h2>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {submissions.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No assessments completed yet. Browse available assessments to get started!</p>
                                </div>
                            ) : (
                                submissions.map((sub, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors group/item">
                                        <div>
                                            <h3 className="font-bold text-white">{sub.assessmentTitle}</h3>
                                            <p className="text-sm text-gray-500">Score: {sub.score}/100 | Integrity: {sub.integrityScore ? `${sub.integrityScore}%` : 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-mono border ${
                                                sub.score >= 80 ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                                                sub.score >= 60 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                                                'text-red-400 border-red-500/30 bg-red-500/10'
                                            }`}>
                                                {sub.score >= 80 ? 'Excellent' : sub.score >= 60 ? 'Good' : 'Needs Work'}
                                            </span>
                                            <ArrowUpRight className="text-gray-600 group-hover/item:text-white transition-colors" size={18} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DashboardModule>

                    {/* Module B: AI Insight */}
                    <DashboardModule delay={0.1} className="h-[400px] md:col-span-1 bg-gradient-to-br from-purple-900/10 to-blue-900/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                            <Zap className="text-yellow-400" size={20} /> AI Insight
                        </h2>
                        <div className="space-y-6">
                            {latestSubmission?.aiFeedback ? (
                                <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {latestSubmission.aiFeedback}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                    <p className="text-gray-500 text-sm">Complete an assessment to see AI-powered feedback about your performance.</p>
                                </div>
                            )}
                            <div>
                                <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-2">
                                    {weaknesses.length > 0 ? 'Areas to Improve' : 'Recommended Focus'}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(weaknesses.length > 0 ? weaknesses : ['Complete an assessment']).map(tag => (
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

                    {/* Module D: Score Breakdown */}
                    <DashboardModule delay={0.3} className="md:col-span-2">
                        <ScoreBreakdown submission={latestSubmission} />
                    </DashboardModule>

                </div>
            </motion.div>
        </div>
    );
};

export default CandidateDashboard;
