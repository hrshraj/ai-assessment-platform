import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Check } from 'lucide-react';
import AuthService from '../services/AuthService';

const RecruiterJoin = ({ onJoin, onSwitchToLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        companyName: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await AuthService.register({
                ...formData,
                role: 'RECRUITER',
                githubProfile: null
            });

            setIsLoading(false);
            setIsSuccess(true);
            setTimeout(onJoin, 1500);
        } catch (err) {
            setIsLoading(false);
            setError(err.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md"
            >
                <div className="relative bg-[#0A0A0A] rounded-xl border border-white/10 p-8 shadow-xl">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-[#1A1A2E] rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/10">
                            {isSuccess ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-green-500 rounded-full p-2"
                                >
                                    <Check className="text-black" size={20} strokeWidth={3} />
                                </motion.div>
                            ) : (
                                <ShieldCheck className="text-white" size={28} />
                            )}
                        </div>
                        <h2 className="text-2xl font-semibold text-white">
                            Join as Recruiter
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Create your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Full Name"
                                className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:border-opacity-50 transition-colors"
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Official Email ID"
                                className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:border-opacity-50 transition-colors"
                                required
                            />
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="Company Name"
                                className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:border-opacity-50 transition-colors"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:border-opacity-50 transition-colors"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isSuccess}
                            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-300
                            ${isSuccess
                                    ? 'bg-green-500 text-black'
                                    : 'bg-white text-black hover:bg-gray-100'
                                }`}
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                            ) : isSuccess ? (
                                <span>Account Created</span>
                            ) : (
                                <>
                                    <span>Join Now</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>


                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-purple-400 hover:text-purple-300"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>

                    <div className="mt-4 text-center text-xs text-gray-600">
                        Secure • Encrypted • Verified
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RecruiterJoin;
