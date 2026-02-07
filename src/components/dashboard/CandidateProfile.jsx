import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Award, ShieldAlert, Play, ArrowLeft, Loader2 } from 'lucide-react';
import RecruiterService from '../../services/RecruiterService';
import IntegrityReport from './IntegrityReport';

const CandidateProfile = ({ candidate, onBack }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showIntegrityModal, setShowIntegrityModal] = useState(false);

    useEffect(() => {
        const fetchIntegrity = async () => {
            try {
                setLoading(true);
                // In this context, candidateId is the submission ID
                const data = await RecruiterService.getIntegrityReport(candidate.candidateId);
                setReport(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching integrity for candidate:', err);
                setLoading(false);
            }
        };

        if (candidate?.candidateId) {
            fetchIntegrity();
        }
    }, [candidate]);

    const snapshots = report?.snapshots || [];
    const eventsCount = report?.events?.length || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Return to Leaderboard</span>
            </button>

            {/* Header Card */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full -mr-32 -mt-32 backdrop-pulse"></div>
                <div className="relative flex items-center gap-8">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-purple-500/20">
                        {candidate.candidateName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-4xl font-bold text-white tracking-tight">{candidate.candidateName}</h2>
                                <p className="text-xl text-gray-400 font-medium font-mono lowercase">{candidate.email}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Status</span>
                                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 text-xs font-bold">
                                    {candidate.status || 'EVALUATING'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Evaluation Score</span>
                                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{candidate.score}% Match</span>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Integrity Grade</span>
                                <span className="text-2xl font-bold text-white">Platinum</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Explainable AI Section */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                                <Award size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">AI Neural Analysis</h3>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-6 border border-white/10 relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg tracking-tighter uppercase">
                            AI Verdict
                        </div>
                        <p className="text-gray-400 leading-relaxed italic font-medium">
                            "The candidate demonstrates an elite mental model of complex architectures.
                            Neural signals indicate high confidence in coding problem-solving with minimal
                            deviation from optimal pathing."
                        </p>
                    </div>

                    <div className="flex-1 h-80 min-h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { subject: 'Coding', A: 95, fullMark: 100 },
                                { subject: 'Architecture', A: 88, fullMark: 100 },
                                { subject: 'Security', A: 92, fullMark: 100 },
                                { subject: 'Reliability', A: 85, fullMark: 100 },
                                { subject: 'Speed', A: 98, fullMark: 100 },
                            ]}>
                                <PolarGrid stroke="#374151" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Skills" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Integrity Report Section */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                <ShieldAlert size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Security Intelligence</h3>
                        </div>
                        <button
                            onClick={() => setShowIntegrityModal(true)}
                            className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-widest border-b border-purple-500/30 pb-0.5 transition-colors"
                        >
                            Open Deep Report
                        </button>
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin text-purple-500" size={32} />
                            <p className="text-gray-500 text-xs font-mono uppercase">Streaming Logs...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Live Surveillance Timeline</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {snapshots.length === 0 ? (
                                        <div className="col-span-2 h-40 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center">
                                            <p className="text-gray-600 text-sm">No visual anomalies detected</p>
                                        </div>
                                    ) : (
                                        snapshots.slice(0, 4).map((snap) => (
                                            <motion.div
                                                key={snap.id}
                                                whileHover={{ scale: 1.02 }}
                                                className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 shadow-lg"
                                            >
                                                <img src={snap.image} alt="Snapshot" className="w-full h-24 object-cover opacity-70" />
                                                <div className="p-3 bg-black/50 border-t border-white/5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] text-gray-500 font-mono tracking-tighter">T+{snap.timeOffset}s</span>
                                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${snap.reason?.includes('Suspect') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/10 text-green-500/70'}`}>
                                                            {snap.reason}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#050505] rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <Play size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white tracking-wide">Behavioral Replay</h4>
                                        <p className="text-xs text-gray-500">{eventsCount} telemetry points captured</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowIntegrityModal(true)}
                                    className="w-full bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-100 transition-all shadow-xl shadow-white/5"
                                >
                                    Enter Quantum Player
                                </button>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-sm font-bold text-white tracking-wide uppercase">Trust Index</span>
                                    </div>
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">AAA+</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showIntegrityModal && (
                    <IntegrityReport
                        submissionId={candidate.candidateId}
                        onClose={() => setShowIntegrityModal(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CandidateProfile;
