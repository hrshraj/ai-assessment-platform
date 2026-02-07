import React from 'react';
import { Mail, MessageCircle, HelpCircle, Linkedin, Twitter, Github, Code2 } from 'lucide-react';

const Footer = ({ onNavigate }) => {
    return (
        <footer className="w-full bg-black border-t border-white/10 py-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6">
                {/* Brand */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Code2 className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                                DevScore
                            </span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                .ai
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Revolutionizing recruitment with AI-driven skill assessments. Find the right talent faster and smarter.
                    </p>
                    <div className="flex space-x-4 pt-2">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github size={20} /></a>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><button className="hover:text-white transition-colors" onClick={() => onNavigate('landing')}>Home</button></li>
                        <li><button className="hover:text-white transition-colors" onClick={() => onNavigate('about')}>About Us</button></li>
                        <li><button className="hover:text-white transition-colors" onClick={() => onNavigate('contact')}>Contact</button></li>
                        <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
                        <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
                    </ul>
                </div>

                {/* Resources */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Resources</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><button className="hover:text-white transition-colors">Blog</button></li>
                        <li><button className="hover:text-white transition-colors">Case Studies</button></li>
                        <li><button className="hover:text-white transition-colors">Documentation</button></li>
                        <li><button className="hover:text-white transition-colors">Support Center</button></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Contact Us</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li>
                            <a href="mailto:partnerships@devscoreai.com" className="flex items-center space-x-2 hover:text-white transition-colors">
                                <Mail size={16} />
                                <span>Send Email</span>
                            </a>
                        </li>
                        <li>
                            <a href="mailto:support@devscoreai.com" className="flex items-center space-x-2 hover:text-white transition-colors">
                                <HelpCircle size={16} />
                                <span>Get Help</span>
                            </a>
                        </li>
                        <li>
                            <a href="mailto:feedback@devscoreai.com" className="flex items-center space-x-2 hover:text-white transition-colors">
                                <MessageCircle size={16} />
                                <span>Share Feedback</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 px-6">
                    <p>© {new Date().getFullYear()} DevScoreAI. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <button className="hover:text-white transition-colors">Privacy Policy</button>
                        <button className="hover:text-white transition-colors">Terms of Service</button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
