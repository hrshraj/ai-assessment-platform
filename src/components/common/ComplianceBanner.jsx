import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';

const ComplianceBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-black/80 backdrop-blur-md border-t border-white/10"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-500/10 rounded-full border border-green-500/20">
                            <Shield size={20} className="text-green-400" />
                        </div>
                        <div className="text-sm">
                            <strong className="text-white block mb-0.5">Ethical AI & Privacy Notice</strong>
                            <p className="text-gray-400">
                                This assessment follows strict Ethical AI guidelines. Your data is encrypted end-to-end and used strictly for recruitment analysis.
                                All snapshots and recordings are automatically deleted after 30 days.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ComplianceBanner;
