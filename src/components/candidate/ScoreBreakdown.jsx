import React from 'react';
import { motion } from 'framer-motion';
import { Info, ShieldCheck, Code, Zap, GitBranch } from 'lucide-react';

const ScoreItem = ({ label, score, weight, icon: Icon, color }) => (
    <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
            <div className="flex items-center space-x-2">
                <Icon size={16} className={`text-${color}-400`} />
                <span className="text-sm font-medium text-gray-300">{label}</span>
                <div className="group relative">
                    <Info size={12} className="text-gray-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Contributes {weight}% to your total DevScore.
                    </div>
                </div>
            </div>
            <span className="text-sm font-bold text-white">{score}/100</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-${color}-500 shadow-[0_0_10px_rgba(var(--${color}-500),0.5)]`}
                style={{ backgroundColor: color === 'purple' ? '#a855f7' : color === 'blue' ? '#3b82f6' : color === 'green' ? '#22c55e' : '#ec4899' }}
            />
        </div>
    </div>
);

const ScoreBreakdown = () => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={100} className="text-white" />
            </div>

            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">Transparent Ranking</span>
            </h3>

            <div className="space-y-2">
                <ScoreItem
                    label="Code Quality & Syntax"
                    score={85}
                    weight={40}
                    icon={Code}
                    color="blue"
                />
                <ScoreItem
                    label="Time Complexity (Big O)"
                    score={72}
                    weight={20}
                    icon={Zap}
                    color="purple"
                />
                <ScoreItem
                    label="Logic & Architecture"
                    score={90}
                    weight={30}
                    icon={GitBranch}
                    color="pink"
                />
                <ScoreItem
                    label="Proctored Integrity"
                    score={100}
                    weight={10}
                    icon={ShieldCheck}
                    color="green"
                />
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-400">Why this breakdown?</strong> DevScoreAI analyzes your code efficiency, pattern usage, and test integrity to generate a fair, unbiased score. Proctored Integrity impacts your credibility but not your technical rank.
            </div>
        </div>
    );
};

export default ScoreBreakdown;
