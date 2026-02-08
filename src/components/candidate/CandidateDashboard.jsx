import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Zap, ArrowUpRight, CheckCircle, Clock, AlertTriangle, RefreshCw, BarChart3, Shield } from 'lucide-react';
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

const StatusBadge = ({ status }) => {
    const config = {
        EVALUATED: { color: 'text-green-400 border-green-500/30 bg-green-500/10', icon: CheckCircle, label: 'Evaluated' },
        SUBMITTED: { color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', icon: Clock, label: 'Processing' },
    };
    const c = config[status] || config.SUBMITTED;
    const Icon = c.icon;
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-mono border ${c.color} flex items-center gap-2`}>
            <Icon size={12} />
            {c.label}
        </span>
    );
};

const CandidateDashboard = ({ onLogout }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const fetchSubmissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await CandidateService.getSubmissions();
            setSubmissions(data);
            if (data.length > 0) setSelectedSubmission(data[0]);
        } catch (err) {
            console.error('Failed to fetch submissions:', err);
            setError('Failed to load submission history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    // Parse JSON fields safely
    const parseJson = (jsonStr) => {
        if (!jsonStr) return null;
        try { return JSON.parse(jsonStr); } catch { return null; }
    };

    const evaluatedCount = submissions.filter(s => s.status === 'EVALUATED').length;
    const avgScore = evaluatedCount > 0
        ? Math.round(submissions.filter(s => s.status === 'EVALUATED').reduce((sum, s) => sum + (s.score || 0), 0) / evaluatedCount)
        : 0;
    const avgIntegrity = evaluatedCount > 0
        ? Math.round(submissions.filter(s => s.integrityScore != null).reduce((sum, s) => sum + s.integrityScore, 0) / evaluatedCount)
        : 0;

    // Build skill data from the selected submission
    const skillScores = selectedSubmission ? parseJson(selectedSubmission.skillScoresJson) : null;
    const strengths = selectedSubmission ? parseJson(selectedSubmission.strengthsJson) : null;
    const weaknesses = selectedSubmission ? parseJson(selectedSubmission.weaknessesJson) : null;

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
                    <button
                        onClick={fetchSubmissions}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-sm transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </header>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <DashboardModule className="!p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Tests Taken</p>
                                <p className="text-3xl font-bold text-white">{submissions.length}</p>
                            </div>
                            <Briefcase className="text-blue-400" size={28} />
                        </div>
                    </DashboardModule>
                    <DashboardModule className="!p-5" delay={0.05}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Avg Score</p>
                                <p className="text-3xl font-bold text-white">{avgScore}<span className="text-lg text-gray-500">/100</span></p>
                            </div>
                            <BarChart3 className="text-purple-400" size={28} />
                        </div>
                    </DashboardModule>
                    <DashboardModule className="!p-5" delay={0.1}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Avg Integrity</p>
                                <p className="text-3xl font-bold text-white">{avgIntegrity}<span className="text-lg text-gray-500">%</span></p>
                            </div>
                            <Shield className="text-green-400" size={28} />
                        </div>
                    </DashboardModule>
                </div>

                {loading ? (
                    <DashboardModule className="flex items-center justify-center h-[300px]">
                        <div className="text-center">
                            <RefreshCw size={32} className="text-purple-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading your submissions...</p>
                        </div>
                    </DashboardModule>
                ) : error ? (
                    <DashboardModule className="flex items-center justify-center h-[300px]">
                        <div className="text-center">
                            <AlertTriangle size={32} className="text-yellow-400 mx-auto mb-4" />
                            <p className="text-gray-400">{error}</p>
                            <button onClick={fetchSubmissions} className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors">
                                Retry
                            </button>
                        </div>
                    </DashboardModule>
                ) : submissions.length === 0 ? (
                    <DashboardModule className="flex items-center justify-center h-[300px]">
                        <div className="text-center">
                            <Briefcase size={48} className="text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No Submissions Yet</h3>
                            <p className="text-gray-400">Browse available assessments and take your first test!</p>
                        </div>
                    </DashboardModule>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Submission List */}
                        <DashboardModule className="md:col-span-2 flex flex-col" style={{ minHeight: '400px' }}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Briefcase className="text-blue-400" size={20} /> Assessment History
                                </h2>
                                <span className="text-xs text-gray-500">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {submissions.map((sub) => (
                                    <div
                                        key={sub.id}
                                        onClick={() => setSelectedSubmission(sub)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                                            selectedSubmission?.id === sub.id
                                                ? 'bg-purple-500/10 border-purple-500/30'
                                                : 'bg-black/20 border-white/5 hover:bg-white/5'
                                        }`}
                                    >
                                        <div>
                                            <h3 className="font-bold text-white">{sub.assessmentTitle}</h3>
                                            <p className="text-sm text-gray-500">
                                                {sub.companyName} &middot; {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {sub.status === 'EVALUATED' && (
                                                <span className="text-lg font-bold text-white">{sub.score}<span className="text-sm text-gray-500">/100</span></span>
                                            )}
                                            <StatusBadge status={sub.status} />
                                            <ArrowUpRight className="text-gray-600" size={18} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DashboardModule>

                        {/* Detail Panel */}
                        <DashboardModule delay={0.1} className="md:col-span-1 flex flex-col">
                            {selectedSubmission ? (
                                <>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                        <Zap className="text-yellow-400" size={20} /> Submission Details
                                    </h2>

                                    <div className="space-y-5 flex-1 overflow-y-auto">
                                        {/* Score */}
                                        <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Score</p>
                                            <p className="text-4xl font-bold text-white">
                                                {selectedSubmission.score ?? '--'}
                                                <span className="text-lg text-gray-500">/100</span>
                                            </p>
                                        </div>

                                        {/* Integrity */}
                                        {selectedSubmission.integrityScore != null && (
                                            <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Integrity Score</p>
                                                <div className="flex items-center gap-3">
                                                    <Shield size={18} className={selectedSubmission.integrityScore >= 80 ? 'text-green-400' : 'text-yellow-400'} />
                                                    <span className="text-2xl font-bold text-white">{Math.round(selectedSubmission.integrityScore)}%</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Feedback */}
                                        {selectedSubmission.aiFeedback && (
                                            <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">AI Feedback</p>
                                                <p className="text-gray-300 text-sm leading-relaxed">{selectedSubmission.aiFeedback}</p>
                                            </div>
                                        )}

                                        {/* Skill Scores */}
                                        {skillScores && Object.keys(skillScores).length > 0 && (
                                            <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Skill Breakdown</p>
                                                <div className="space-y-2">
                                                    {Object.entries(skillScores).map(([skill, score]) => (
                                                        <div key={skill}>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-gray-400">{skill}</span>
                                                                <span className="text-white font-mono">{typeof score === 'number' ? Math.round(score) : score}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-purple-500 rounded-full transition-all"
                                                                    style={{ width: `${typeof score === 'number' ? Math.min(score, 100) : 0}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Strengths */}
                                        {strengths && strengths.length > 0 && (
                                            <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Strengths</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {strengths.map((s, i) => (
                                                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Weaknesses */}
                                        {weaknesses && weaknesses.length > 0 && (
                                            <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Areas to Improve</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {weaknesses.map((w, i) => (
                                                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">{w}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <p>Select a submission to view details</p>
                                </div>
                            )}
                        </DashboardModule>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default CandidateDashboard;
