import React from 'react';
import { Search, Sparkles } from 'lucide-react';

const SearchInput = () => {
    return (
        <div className="relative group max-w-2xl w-full">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>

            <div className="relative flex items-center bg-black rounded-xl border border-white/10 p-2">
                <div className="pl-4 text-purple-400">
                    <Sparkles size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Describe the role you're hiring for..."
                    className="w-full bg-transparent text-white px-4 py-3 focus:outline-none placeholder-gray-500 font-medium"
                />
                <button className="bg-white text-black hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg transition-transform hover:scale-105 active:scale-95 flex items-center space-x-2">
                    <span>Analyze</span>
                    <Search size={16} />
                </button>
            </div>

            {/* Tagline below input */}
            <div className="absolute top-full left-4 mt-2 flex items-center space-x-2 text-xs text-gray-400">
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>AI Agent active & ready to parse JDs</span>
            </div>
        </div>
    );
};

export default SearchInput;
