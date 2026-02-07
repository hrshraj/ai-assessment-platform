import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import Webcam from 'react-webcam';
import { proctorService } from '../../services/ProctorService';

const OrbitingProctor = ({ onAnomaly, submissionId }) => {
    const webcamRef = useRef(null);
    const [stats, setStats] = useState({ focus: 100, tabSwitches: 0 });

    // Start Auto-Flushing on Mount
    useEffect(() => {
        if (submissionId) {
            proctorService.startAutoFlush(submissionId);
        }
        return () => proctorService.stopAutoFlush();
    }, [submissionId]);

    // Capture Snapshot Helper
    const capture = useCallback((reason, isAnomaly = false) => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                proctorService.saveSnapshot(imageSrc, reason);

                // Determine LogType based on reason
                const logType = isAnomaly ? 'ANOMALY' : 'SNAPSHOT';

                // Controller expects raw Base64 for SNAPSHOT, JSON for others
                const data = logType === 'SNAPSHOT'
                    ? imageSrc
                    : JSON.stringify({ reason, timestamp: new Date().toISOString() });

                proctorService.sendLog(submissionId, logType, data);
            }
        }
    }, [webcamRef, submissionId]);

    // Routine Check Interval
    useEffect(() => {
        const interval = setInterval(() => {
            capture('Routine Check');

            // Randomly fluctuate focus score for realism
            setStats(prev => ({
                ...prev,
                focus: Math.max(80, Math.min(100, prev.focus + (Math.random() > 0.5 ? 2 : -2)))
            }));
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [capture]);

    // Event Listeners: Visibility Change & Blur
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setStats(prev => ({ ...prev, tabSwitches: prev.tabSwitches + 1, focus: Math.max(0, prev.focus - 10) }));
                capture('Suspect: Tab Switch', true);
                onAnomaly('Tab Switch Detected');
                proctorService.sendLog(submissionId, 'TAB_SWITCH', JSON.stringify({
                    activity: 'Tab Switched',
                    count: stats.tabSwitches + 1
                }));
            }
        };

        const handleBlur = () => {
            // Also capture on window blur (alt-tab)
            capture('Suspect: Window Blur', true);
            proctorService.sendLog(submissionId, 'BLUR', JSON.stringify({ activity: 'Window Lost Focus' }));
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [capture, onAnomaly, submissionId]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed top-8 right-8 z-50 flex flex-col items-end pointer-events-none"
        >
            {/* Live Camera Feed */}
            <div className="relative w-32 h-32 mb-4 group pointer-events-auto">
                <div className="absolute inset-0 border-2 border-dashed border-green-500/30 rounded-full animate-[spin_10s_linear_infinite] z-20"></div>
                <div className="absolute inset-4 rounded-full bg-black border border-white/10 overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.2)] z-10">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={200}
                        height={200}
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-green-500/10 mix-blend-overlay pointer-events-none"></div>
                </div>

                <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-black z-30"></div>
                <div className="absolute bottom-[-20px] left-0 right-0 text-center">
                    <span className="text-[10px] font-mono text-green-500 tracking-widest bg-black/50 px-2 py-1 rounded">SECURE</span>
                </div>
            </div>

            {/* Integrity HUD */}
            <div className="w-48 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 space-y-3 pointer-events-auto hover:bg-black/60 transition-colors">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Focus Score</span>
                        <span className={`font-bold ${stats.focus > 80 ? 'text-green-400' : 'text-yellow-400'}`}>{stats.focus}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Tab Switches</span>
                        <span className="text-red-400 font-bold">{stats.tabSwitches}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default OrbitingProctor;
