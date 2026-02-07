import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';
import AuthService from '../services/AuthService';

const RecruiterLogin = ({ onLogin, onSwitchToJoin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState('');
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await AuthService.login(credentials.email, credentials.password);

            setIsLoading(false);
            setIsVerified(true);
            // Wait for verify animation then login
            setTimeout(onLogin, 1500);
        } catch (err) {
            setIsLoading(false);
            setError(err.message || 'Login failed. Please check your credentials.');
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
                            {isVerified ? (
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
                            Recruiter Access
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <input
                                type="email"
                                name="email"
                                value={credentials.email}
                                onChange={handleChange}
                                placeholder="Email ID"
                                className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:border-opacity-50 transition-colors"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="Password"
                                className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:border-opacity-50 transition-colors"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isVerified}
                            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-300
                            ${isVerified
                                    ? 'bg-green-500 text-black'
                                    : 'bg-white text-black hover:bg-gray-100'
                                }`}
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                            ) : isVerified ? (
                                <span>Access Granted</span>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>


                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            Don't have an account?{' '}
                            <button
                                onClick={onSwitchToJoin}
                                className="text-purple-400 hover:text-purple-300"
                            >
                                Join Now
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

export default RecruiterLogin;
