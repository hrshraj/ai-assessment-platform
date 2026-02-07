import React from 'react';
import Spline from '@splinetool/react-spline';
import { Code2, Sparkles } from 'lucide-react';

const Hero = () => {
    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-black">
            {/* Spline on the right side - no overlays */}
            <div className="absolute right-0 top-0 h-screen w-full lg:w-3/5 z-0">
                <Spline scene="https://prod.spline.design/UlxyOXYGIxmqwwlP/scene.splinecode" />
            </div>
            
            {/* Content on the left */}
            <div className="relative z-20 min-h-screen flex flex-col justify-center px-8 lg:px-20 w-full lg:w-2/5">
                {/* Hero Logo */}
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Code2 className="text-white" size={26} strokeWidth={2.5} />
                    </div>
                    <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                            DevScore
                        </span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            .ai
                        </span>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="inline-block px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-4">
                        ✨ Revolutionizing Recruitment with AI
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
                        Hire on <span className="text-purple-400">Skill</span>, <br />
                        Not Just Resumes.
                    </h1>

                    <p className="text-xl text-gray-300 max-w-md leading-relaxed">
                        Our AI analyzes role requirements to generate role-specific assessments, ensuring you find the perfect match based on actual capability.
                    </p>

                    <div className="flex items-center space-x-8 pt-4">
                        <button className="bg-white text-black text-sm font-bold px-8 py-4 rounded-lg hover:bg-gray-200 transition-colors">
                            Get Started
                        </button>
                    </div>

                    <div className="flex items-center space-x-8 pt-8">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`w-10 h-10 rounded-full border-2 border-black bg-gray-700 flex items-center justify-center text-xs text-white`}>
                                    User
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-gray-300">
                            Trusted by <span className="text-white font-semibold">500+</span> companies
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
