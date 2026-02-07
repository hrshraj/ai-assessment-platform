import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, MapPin, Globe, Headphones, Send, ExternalLink } from 'lucide-react';

const Contact = () => {
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
                        Contact Us
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-gray-400 max-w-3xl mx-auto"
                    >
                        Have questions or need a demo? We're here to help!
                    </motion.p>
                </div>

                {/* Intro */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-16"
                >
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                        <p className="text-gray-300 text-lg leading-relaxed text-center">
                            Whether you are a recruiter looking to streamline your hiring pipeline or a candidate with feedback on our platform, our team is ready to assist you.
                        </p>
                    </div>
                </motion.section>

                {/* Contact Options */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mb-16"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Get in Touch</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Official Inquiries */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mr-4">
                                    <Mail className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Official Inquiries</h3>
                                    <p className="text-gray-500 text-sm">For company partnerships</p>
                                </div>
                            </div>
                            <p className="text-gray-400 mb-4">
                                For company partnerships and recruiter access, please reach out via your official company email.
                            </p>
                            <a href="mailto:partnerships@devscoreai.com" className="w-full py-3 rounded-lg bg-white text-black font-medium flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <Send size={16} className="mr-2" />
                                Send Email
                            </a>
                        </motion.div>

                        {/* Support */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mr-4">
                                    <Headphones className="text-cyan-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Support</h3>
                                    <p className="text-gray-500 text-sm">Technical assistance</p>
                                </div>
                            </div>
                            <p className="text-gray-400 mb-4">
                                For technical issues regarding test access, camera permissions, or dashboard navigation.
                            </p>
                            <a href="mailto:support@devscoreai.com" className="w-full py-3 rounded-lg bg-white text-black font-medium flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <MessageCircle size={16} className="mr-2" />
                                Get Help
                            </a>
                        </motion.div>

                        {/* Feedback */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mr-4">
                                    <Globe className="text-green-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Feedback</h3>
                                    <p className="text-gray-500 text-sm">Share your thoughts</p>
                                </div>
                            </div>
                            <p className="text-gray-400 mb-4">
                                We value your input on test experience, platform usability, and evaluation fairness.
                            </p>
                            <a href="mailto:feedback@devscoreai.com" className="w-full py-3 rounded-lg bg-white text-black font-medium flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <MessageCircle size={16} className="mr-2" />
                                Share Feedback
                            </a>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Find Us */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="mb-16"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Find Us</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-3">
                                    <MapPin className="text-purple-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Website</p>
                                    <p className="text-white font-medium">Home of Skill-Based Hiring</p>
                                </div>
                            </div>
                            <div className="hidden md:block h-12 w-px bg-white/10"></div>
                            <button className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
                                <Globe size={20} className="mr-2" />
                                Visit Website
                                <ExternalLink size={14} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </motion.section>

                {/* Copyright */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 }}
                >
                    <p className="text-center text-gray-600 text-sm">
                        © {new Date().getFullYear()} DevScoreAI. All rights reserved.
                    </p>
                </motion.section>
            </motion.div>
        </div>
    );
};

export default Contact;
