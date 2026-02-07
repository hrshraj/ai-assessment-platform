import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Send } from 'lucide-react';

const OrbSlider = ({ label, value, onChange }) => {
    return (
        <div className="flex flex-col items-center space-y-8 h-[400px] relative group">
            {/* The Orb */}
            <div className="relative h-full w-full flex items-end justify-center pb-12">
                <motion.div
                    animate={{
                        y: -value * 25, // Moves up based on value
                        scale: 1 + (value * 0.05), // Grows slightly
                        filter: `blur(${(10 - value) * 1}px) brightness(${0.5 + (value * 0.1)})` // Focuses as it rises
                    }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 shadow-[0_0_50px_-10px_rgba(168,85,247,0.5)] relative z-10 backdrop-blur-md"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                </motion.div>

                {/* Track Line */}
                <div className="absolute bottom-12 left-1/2 w-0.5 h-[250px] bg-gradient-to-t from-white/20 to-transparent -translate-x-1/2 z-0"></div>
            </div>

            {/* Controls */}
            <div className="w-full text-center z-20">
                <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="w-32 accent-purple-500 cursor-pointer"
                />
                <p className="text-gray-400 mt-2 font-mono text-sm uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
        </div>
    );
};

const FeedbackPage = () => {
    const [ratings, setRatings] = useState({ fairness: 7, usability: 8, experience: 9 });
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">

            {!submitted ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
                    className="w-full max-w-5xl z-10"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Transmission Frequency</h2>
                        <p className="text-gray-400">Tune your experience feedback parameters.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <OrbSlider
                            label="Fairness"
                            value={ratings.fairness}
                            onChange={(v) => setRatings({ ...ratings, fairness: v })}
                        />
                        <OrbSlider
                            label="Usability"
                            value={ratings.usability}
                            onChange={(v) => setRatings({ ...ratings, usability: v })}
                        />
                        <OrbSlider
                            label="Overall Exp"
                            value={ratings.experience}
                            onChange={(v) => setRatings({ ...ratings, experience: v })}
                        />
                    </div>

                    <div className="flex justify-center mt-12">
                        <button
                            onClick={() => setSubmitted(true)}
                            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_-5px_white]"
                        >
                            <Send size={20} /> Transmit Signal
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center z-10"
                >
                    <Zap size={80} className="text-yellow-400 mx-auto mb-6 animate-bounce" fill="currentColor" />
                    <h2 className="text-5xl font-bold text-white mb-4">Signal Received</h2>
                    <p className="text-xl text-gray-400">Your data has been merged with the core.</p>
                </motion.div>
            )}
        </div>
    );
};

export default FeedbackPage;
