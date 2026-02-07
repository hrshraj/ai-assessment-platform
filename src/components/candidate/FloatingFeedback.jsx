import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ThumbsUp, Sparkles, Send } from 'lucide-react';

const FloatingSlider = ({ label, value, onChange }) => (
    <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block">{label}</label>
        <div className="relative h-2 bg-gray-800 rounded-full group cursor-pointer">
            <input
                type="range"
                min="0"
                max="10"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${value * 10}%` }}
            ></div>
            <motion.div
                className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] pointer-events-none"
                style={{ left: `${value * 10}%` }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
            />
        </div>
    </div>
);

const FloatingFeedback = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [ratings, setRatings] = useState({ usability: 8, fairness: 9 });

    const handleSubmit = () => {
        setIsSubmitted(true);
        setTimeout(() => setIsOpen(false), 2000);
    };

    return (
        <>
            <motion.button
                whileHover={{ y: -5 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 left-8 p-4 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full text-gray-400 hover:text-white hover:border-purple-500/50 transition-all z-40 group"
            >
                <MessageSquare size={24} className="group-hover:animate-bounce" />
            </motion.button>

            <AnimatePresence>
                {isOpen && !isSubmitted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-24 left-8 w-80 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)] z-50"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-400" />
                                Transmission
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">&times;</button>
                        </div>

                        <FloatingSlider
                            label="Interface Zero-Gravity"
                            value={ratings.usability}
                            onChange={(v) => setRatings({ ...ratings, usability: v })}
                        />
                        <FloatingSlider
                            label="Assessment Fairness"
                            value={ratings.fairness}
                            onChange={(v) => setRatings({ ...ratings, fairness: v })}
                        />

                        <button
                            onClick={handleSubmit}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <Send size={16} /> Transmit
                        </button>
                    </motion.div>
                )}

                {isSubmitted && isOpen && (
                    <motion.div
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                        transition={{ duration: 1.5 }}
                        className="fixed bottom-24 left-8 z-50 pointer-events-none"
                    >
                        <div className="flex items-center gap-2 text-green-400 font-bold text-xl">
                            <ThumbsUp size={24} /> Signal Received
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingFeedback;
