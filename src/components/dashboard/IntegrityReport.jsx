import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Clock, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import RecruiterService from '../../services/RecruiterService';

const IntegrityReport = ({ submissionId, onClose }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('snapshots');

    useEffect(() => {
        const fetchReport = async () => {
            if (!submissionId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await RecruiterService.getIntegrityReport(submissionId);
                setReport(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching integrity report:', err);
                setError('Failed to load integrity data.');
                setLoading(false);
            }
        };

        fetchReport();
    }, [submissionId]);

    useEffect(() => {
        if (activeTab === 'replay' && report?.events?.length > 0) {
            const container = document.getElementById('rrweb-player-container');
            if (container) {
                container.innerHTML = ''; // Clear previous
                new rrwebPlayer({
                    target: container,
                    props: {
                        events: report.events,
                        width: container.clientWidth,
                        height: 400,
                    },
                });
            }
        }
    }, [activeTab, report]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
                <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg p-12 rounded-3xl flex flex-col items-center space-y-4">
                    <Loader2 className="animate-spin text-purple-500" size={48} />
                    <p className="text-gray-400 font-medium tracking-wider">Decrypting Candidate Activity...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
                <div className="bg-[#0a0a0a] border border-red-500/20 w-full max-w-lg p-12 rounded-3xl flex flex-col items-center space-y-4">
                    <AlertCircle className="text-red-400" size={48} />
                    <p className="text-red-400 font-medium">{error}</p>
                    <button onClick={onClose} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a0a0a] border border-white/10 w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="text-yellow-500" />
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-bold text-white">Trust Intelligence Report</h2>
                            <p className="text-xs text-gray-500 font-mono">Submission ID: {submissionId}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('snapshots')}
                        className={`px-8 py-4 font-bold text-sm transition-colors ${activeTab === 'snapshots' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        Snapshot Timeline
                    </button>
                    <button
                        onClick={() => setActiveTab('replay')}
                        className={`px-8 py-4 font-bold text-sm transition-colors ${activeTab === 'replay' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        Session Playback
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-[#050505]">
                    {activeTab === 'snapshots' && (
                        <div className="space-y-8">
                            <h3 className="text-xl font-bold text-white mb-4">Integrity Snapshots</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {!report?.snapshots || report.snapshots.length === 0 ? (
                                    <p className="text-gray-500">No snapshots recorded for this session.</p>
                                ) : (
                                    report.snapshots.map((snap) => (
                                        <div key={snap.id} className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all hover:scale-[1.02]">
                                            <img src={snap.image} alt="Snapshot" className="w-full h-40 object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <div className="p-3 bg-black/40 backdrop-blur-md">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} /> +{snap.timeOffset}s</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${snap.reason?.includes('Suspect') ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                        {snap.reason}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] font-mono text-gray-600">{snap.timestamp}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'replay' && (
                        <div className="h-full flex flex-col">
                            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Play size={16} className="text-purple-400" /> Interaction Replay
                                </h3>
                                {!report?.events || report.events.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                                        No event recording data available.
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div id="rrweb-player-container" className="rounded-xl border border-white/10 overflow-hidden bg-black shadow-2xl"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default IntegrityReport;
