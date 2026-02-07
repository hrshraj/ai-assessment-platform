import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import RecruiterService from '../../services/RecruiterService';

const Leaderboard = ({ assessmentId, onSelectCandidate }) => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!assessmentId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await RecruiterService.getLeaderboard(assessmentId);
                setCandidates(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
                setError('Failed to load leaderboard data.');
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [assessmentId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="animate-spin text-purple-500" size={40} />
                <p className="text-gray-400 font-medium">Downloading Neural Results...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <AlertCircle className="text-red-400" size={32} />
                <p className="text-red-400 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <h2 className="text-2xl font-bold text-white mb-6">Talent Intelligence Leaderboard</h2>

            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-sm">
                        <tr>
                            <th className="p-4 font-medium">Rank</th>
                            <th className="p-4 font-medium">Candidate</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Score</th>
                            <th className="p-4 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {candidates.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-gray-500">
                                    No candidates have completed this assessment yet.
                                </td>
                            </tr>
                        ) : (
                            candidates.map((candidate, idx) => (
                                <motion.tr
                                    key={candidate.candidateId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-4 text-gray-500 font-mono">#{idx + 1}</td>
                                    <td className="p-4 font-medium text-white flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold shadow-lg shadow-purple-500/20">
                                            {candidate.candidateName?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{candidate.candidateName}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{candidate.email}</span>
                                        </div>
                                        {idx === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded ml-2 border border-yellow-500/30 animate-pulse">Top Candidate</span>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] px-2 py-1 rounded-full border ${candidate.status === 'HIRED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                candidate.status === 'PASSED' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                            }`}>
                                            {candidate.status || 'EVALUATING'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="relative w-10 h-10 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="20" cy="20" r="16" stroke="gray" strokeWidth="2" fill="transparent" className="opacity-10" />
                                                    <circle
                                                        cx="20" cy="20" r="16"
                                                        stroke={candidate.score > 90 ? '#10b981' : candidate.score > 80 ? '#3b82f6' : '#eab308'}
                                                        strokeWidth="2"
                                                        fill="transparent"
                                                        strokeDasharray={100}
                                                        strokeDashoffset={100 - (candidate.score || 0)}
                                                        strokeLinecap="round"
                                                        className="transition-all duration-1000"
                                                    />
                                                </svg>
                                                <span className="absolute text-[10px] font-bold text-white">{candidate.score || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => onSelectCandidate(candidate)}
                                            className="text-white hover:text-purple-400 p-2 rounded-full hover:bg-white/10 transition-colors"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
