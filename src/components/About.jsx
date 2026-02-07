import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Zap, Shield, BarChart, Brain, Code, CheckCircle } from 'lucide-react';

const About = () => {
    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto"
            >
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl font-bold text-white mb-6"
                    >
                        About Us
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-gray-400 max-w-3xl mx-auto"
                    >
                        Redefining Recruitment Through Skill-First Evaluation
                    </motion.p>
                </div>

                {/* Problem Statement */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-16"
                >
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Modern recruitment is often hindered by resume exaggeration, fake applications, and inefficient screening processes that fail to reflect a candidate's true capabilities. CODEVERSITY is an AI-powered assessment platform designed to bridge this gap by prioritizing job-relevant skills over traditional resume-based filtering.
                        </p>
                    </div>
                </motion.section>

                {/* Vision */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mb-16"
                >
                    <div className="flex items-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mr-4">
                            <Eye className="text-purple-400" size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-white">Our Vision</h2>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Our goal is to eliminate unqualified applications and ensure a fair, transparent, and data-backed hiring process for every role. We believe that by using intelligent testing and objective ranking, we can help recruiters find the perfect match while giving candidates a genuine stage to showcase their talents.
                        </p>
                    </div>
                </motion.section>

                {/* What We Offer */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="mb-16"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">What We Offer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* AI-Driven Precision */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-3">
                                    <Brain className="text-cyan-400" size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">AI-Driven Precision</h3>
                            </div>
                            <p className="text-gray-400">
                                Automatically interpret job descriptions to generate role-aligned assessments.
                            </p>
                        </motion.div>

                        {/* Adaptive Testing */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                                    <Zap className="text-purple-400" size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Adaptive Testing</h3>
                            </div>
                            <p className="text-gray-400">
                                From technical coding challenges to AI-driven interview rounds that evaluate communication and problem-solving.
                            </p>
                        </motion.div>

                        {/* Integrity Without Overhead */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.6 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                                    <Shield className="text-green-400" size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Integrity Without Overhead</h3>
                            </div>
                            <p className="text-gray-400">
                                Our lightweight monitoring—including intelligent snapshotting and DOM-based code activity replay—ensures assessment honesty without the heavy system requirements of video recording.
                            </p>
                        </motion.div>

                        {/* Actionable Insights */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.8 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center mr-3">
                                    <BarChart className="text-pink-400" size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Actionable Insights</h3>
                            </div>
                            <p className="text-gray-400">
                                Recruiters receive detailed leaderboards, skill heatmaps, and integrity reports to make data-driven hiring decisions.
                            </p>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Features Grid */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.0 }}
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Key Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: Code, title: 'Live Coding Environment', desc: 'Real-time code execution with instant feedback' },
                            { icon: Target, title: 'Skill-Based Matching', desc: 'AI-powered candidate-job alignment scoring' },
                            { icon: CheckCircle, title: 'Automated Evaluation', desc: 'Objective scoring without human bias' },
                            { icon: Brain, title: 'Explainable AI', desc: 'Transparent AI recommendations with reasoning' },
                            { icon: Shield, title: 'Proctoring', desc: 'Lightweight integrity monitoring' },
                            { icon: BarChart, title: 'Analytics Dashboard', desc: 'Comprehensive recruitment insights' },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="flex items-start space-x-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="text-purple-400" size={16} />
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                                    <p className="text-gray-500 text-sm">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
};

export default About;
