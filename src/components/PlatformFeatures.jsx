import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Eye, PlayCircle, Mic, ShieldCheck, Lock } from 'lucide-react';

const FeatureCard = ({ feature, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
    >
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
            <feature.icon className="text-white" size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
    </motion.div>
);

const PlatformFeatures = () => {
    const features = [
        {
            title: "Adaptive AI Assessments",
            desc: "Dynamically generated questions that adjust difficulty in real-time to match the candidate's true skill level.",
            icon: BrainCircuit,
            gradient: "from-purple-500 to-indigo-500"
        },
        {
            title: "Intelligent Snapshot Monitoring",
            desc: "Lightweight 'Lazy Camera' technology triggers base64 snapshots on tab switches or suspicious activity.",
            icon: Eye,
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            title: "Ghost Replay (DOM)",
            desc: "Watch a high-fidelity playback of the candidate's coding session. See every keystroke and paste event.",
            icon: PlayCircle,
            gradient: "from-green-500 to-emerald-500"
        },
        {
            title: "AI-Driven Video Interviews",
            desc: "Automated final rounds focusing on communication and logic, analyzed for sentiment and confidence.",
            icon: Mic,
            gradient: "from-yellow-500 to-orange-500"
        },
        {
            title: "Explainable AI Scoring",
            desc: "Transparent ranking logic. See exactly how syntax, logic, and efficiency contributed to the final score.",
            icon: ShieldCheck,
            gradient: "from-pink-500 to-rose-500"
        },
        {
            title: "Enterprise-Grade Security",
            desc: "Role-Based Access Control (RBAC) and end-to-end data encryption ensure ethical and secure hiring.",
            icon: Lock,
            gradient: "from-red-500 to-pink-500"
        }
    ];

    return (
        <section className="py-24 bg-gradient-to-b from-black to-purple-900/10 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-4">Platform Capabilities</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Built for the future of hiring. Secure, Intelligent, and biased towards skill.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <FeatureCard key={idx} feature={feature} index={idx} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PlatformFeatures;
