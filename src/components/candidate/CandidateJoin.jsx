import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, Shield, ArrowRight, Camera, Mic, FileText } from 'lucide-react';
import AuthService from '../../services/AuthService';
import { useToast } from '../../context/ToastContext';

const PermissionIcon = ({ icon: Icon, label, active, onClick }) => (
    <motion.button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 ${active
            ? 'bg-green-500/10 border border-green-500/50 shadow-[0_0_15px_-5px_#22c55e]'
            : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
    >
        <Icon size={24} className={active ? 'text-green-400' : 'text-gray-400'} />
        <span className="text-[10px] mt-1.5 uppercase tracking-wider text-gray-500">{label}</span>
        {active && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        )}
    </motion.button>
);

const CandidateJoin = ({ onJoin, onSwitchToLogin }) => {
    let toast = null;
    try {
        toast = useToast();
    } catch (e) {
        // ToastProvider not available, skip toast notification
    }
    const [permissions, setPermissions] = useState({ camera: false, mic: false, terms: false });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        githubProfile: '',
        password: '',
        phone: '' // Added phone to state as it's in the form
    });
    const [resumeFile, setResumeFile] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setResumeFile(file);
            setIsUploading(true);
            // Simulate upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setUploadProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    setUploadProgress(100);
                    if (toast) {
                        toast.success(`Resume "${file.name}" uploaded successfully!`);
                    }
                }
            }, 50);
        }
    };

    const togglePermission = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleUpload = () => {
        setIsUploading(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setUploadProgress(100);
            }
        }, 50);
    };

    const isPermitted = Object.values(permissions).every(Boolean);
    const isReady = isPermitted && uploadProgress === 100;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return;

        setIsLoading(true);
        setError('');

        try {
            await AuthService.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                githubProfile: formData.githubProfile,
                role: 'CANDIDATE',
                companyName: null
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
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-sans pt-20">
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
                                <Shield className="text-white" size={28} />
                            )}
                        </div>
                        <h2 className="text-2xl font-semibold text-white">
                            Join as Candidate
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Create your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}
                        {/* Permission Dock */}
                        <div className="flex justify-center gap-3 mb-6">
                            <PermissionIcon
                                icon={Camera}
                                label="Camera"
                                active={permissions.camera}
                                onClick={() => togglePermission('camera')}
                            />
                            <PermissionIcon
                                icon={Mic}
                                label="Audio"
                                active={permissions.mic}
                                onClick={() => togglePermission('mic')}
                            />
                            <PermissionIcon
                                icon={FileText}
                                label="Terms"
                                active={permissions.terms}
                                onClick={() => togglePermission('terms')}
                            />
                        </div>

                        {/* CV Upload */}
                        <div
                            className={`relative h-20 rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex items-center justify-center group
                            ${uploadProgress === 100
                                    ? 'border-green-500 bg-green-500/20 shadow-[0_0_20px_-5px_#22c55e]'
                                    : isUploading
                                        ? 'border-purple-500/50 bg-purple-500/5 border-dashed'
                                        : 'border-gray-700 hover:border-gray-500 hover:bg-white/5 border-dashed'}`}
                        >
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />

                            {/* Progress Bar */}
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 transform -translate-x-full transition-transform duration-300 pointer-events-none"
                                style={{ transform: `translateX(${uploadProgress - 100}%)` }}
                            ></div>

                            <div className="relative z-10 flex items-center pointer-events-none px-4 w-full justify-center">
                                {uploadProgress === 100 ? (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex items-center text-green-400 font-medium space-x-2"
                                    >
                                        <div className="bg-green-500/20 p-1.5 rounded-full">
                                            <Check size={18} strokeWidth={3} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-xs text-green-300 uppercase tracking-wider font-bold">Upload Complete</span>
                                            {resumeFile && (
                                                <span className="text-white text-sm truncate max-w-[200px]">{resumeFile.name}</span>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        {isUploading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-purple-300 text-sm font-medium">Uploading... {uploadProgress}%</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                                                <div className="flex items-center space-x-2 text-gray-400 group-hover:text-white transition-colors">
                                                    <Upload size={24} />
                                                    <span className="font-medium">Upload CV/Resume</span>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

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
                                placeholder="Email ID"
                                className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:border-opacity-50 transition-colors"
                                required
                            />
                            <input
                                type="text"
                                name="githubProfile"
                                value={formData.githubProfile}
                                onChange={handleChange}
                                placeholder="GitHub Profile URL"
                                className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:border-opacity-50 transition-colors"
                                required
                            />
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone Number"
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
                            disabled={!isReady || isLoading || isSuccess}
                            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-300
                            ${isSuccess
                                    ? 'bg-green-500 text-black'
                                    : isReady
                                        ? 'bg-white text-black hover:bg-gray-100'
                                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
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
                        * CV/Resume upload is compulsory
                    </div>
                </div>
            </motion.div >
        </div >
    );
};

export default CandidateJoin;
