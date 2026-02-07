import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, FileText, Cpu, Trophy, Target, MessageSquare, CheckCircle } from 'lucide-react';

const Step = ({ step, index, align }) => (
    <motion.div
        initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.2, duration: 0.6 }}
        className={`flex items-center mb-16 ${align === 'left' ? 'flex-row' : 'flex-row-reverse'} relative`}
    >
        {/* Connection Line */}
        <div className="absolute left-1/2 -translate-x-px top-full h-16 w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent -mb-16 last:hidden"></div>

        {/* Content Box */}
        <div className={`w-1/2 ${align === 'left' ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
        </div>

        {/* Center Icon */}
        <div className="relative z-10 w-12 h-12 rounded-full bg-black border border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center shrink-0">
            <step.icon size={20} className="text-purple-400" />
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
        </div>

        {/* Empty Space for alignment */}
        <div className="w-1/2"></div>
    </motion.div>
);

const HowItWorks = () => {
    const [role, setRole] = useState('recruiter');

    const flows = {
        recruiter: [
            { title: "AI Job Parsing", desc: "Upload any JD. Our AI instantly extracts core competencies and required skills, ignoring buzzwords.", icon: FileText },
            { title: "Assessment Generation", desc: "The engine builds a custom 4-stage test (MCQ, Subjective, Code, Interview) tailored specifically to the role.", icon: Cpu },
            { title: "Rank & Review", desc: "Access the dashboard to see candidates ranked by actual skill. Watch 'Ghost Replays' of their code.", icon: Trophy },
        ],
        candidate: [
            { title: "Skill-First Application", desc: "Apply to roles based on what you can actually do. No resume filtering bots blocking your path.", icon: Target },
            { title: "Multi-Stage Assessment", desc: "Prove yourself in a fair, sequential testing environment. Coding, Architecture, and Soft Skills.", icon: CheckCircle },
            { title: "Transparent Feedback", desc: "Get a detailed Score Breakdown. Understand your strengths and weaknesses instantly.", icon: MessageSquare },
        ]
    };

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-6">How SkillRank Works</h2>

                    {/* Toggle */}
                    <div className="inline-flex bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
                        <button
                            onClick={() => setRole('recruiter')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${role === 'recruiter' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><Briefcase size={14} /> For Recruiters</span>
                        </button>
                        <button
                            onClick={() => setRole('candidate')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${role === 'candidate' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><User size={14} /> For Candidates</span>
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {/* Central Vertical Line */}
                    <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-white/10"></div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={role}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            {flows[role].map((step, idx) => (
                                <Step key={idx} step={step} index={idx} align={idx % 2 === 0 ? 'left' : 'right'} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
