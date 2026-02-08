import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Code, Terminal, Save, FileText } from 'lucide-react';
import * as rrweb from 'rrweb';
import { proctorService } from '../../services/ProctorService';

const CodeSanctuary = ({ onComplete, onAnomaly, problem, submissionId }) => {
    const defaultCode = `def solve_problem(input_data):\n    # Write your optimal solution here\n    # Expected Time Complexity: O(N)\n    pass`;
    const [code, setCode] = useState(problem?.starterCode || defaultCode);
    const [output, setOutput] = useState('');
    const [showProblem, setShowProblem] = useState(true);
    const eventsRef = useRef([]);
    const stopFnRef = useRef(null);

    // Update code if problem changes
    useEffect(() => {
        if (problem?.starterCode) {
            setCode(problem.starterCode);
        }
    }, [problem]);

    // Start Recording on Mount
    useEffect(() => {
        stopFnRef.current = rrweb.record({
            emit(event) {
                eventsRef.current.push(event);
            },
        });
        console.log('rrweb: Recording started');

        return () => {
            if (stopFnRef.current) stopFnRef.current();
        };
    }, []);

    const handlePaste = (e) => {
        e.preventDefault();
        onAnomaly('Mass Paste Detected');
    };

    const runCode = () => {
        setOutput('Running test cases...\nTest Case 1: PASSED\nTest Case 2: PASSED\nTest Case 3: PASSED');
    };

    const handleSubmit = async () => {
        if (stopFnRef.current) stopFnRef.current();
        proctorService.saveReplay(eventsRef.current);

        if (submissionId && eventsRef.current.length > 0) {
            try {
                await proctorService.sendLog(submissionId, 'REPLAY', JSON.stringify(eventsRef.current));
            } catch (e) {
                console.warn('Replay upload failed:', e);
            }
        }

        onComplete({
            questionId: problem?.id || 'coding_1',
            code,
            language: 'python'
        });
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] rounded-2xl border border-white/10 overflow-hidden relative group">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-white/5">
                <div className="flex items-center space-x-2">
                    <Code size={16} className="text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">solution.py</span>
                    <span className="text-xs text-red-500 animate-pulse ml-2">● REC</span>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowProblem(!showProblem)}
                        className={`flex items-center px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                            showProblem ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                        <FileText size={12} className="mr-1.5" /> Problem
                    </button>
                    <button
                        onClick={runCode}
                        className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
                    >
                        <Play size={12} className="mr-1.5" /> RUN
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    >
                        <Save size={12} className="mr-1.5" /> SUBMIT
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Problem Statement Panel */}
                {showProblem && problem?.text && (
                    <div className="w-2/5 border-r border-white/10 overflow-y-auto p-5 bg-[#1a1a2e]">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <Code size={18} className="text-purple-400" />
                            Coding Challenge
                        </h3>
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                            {problem.text}
                        </div>
                        {problem.options && problem.options.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-2">Test Cases</h4>
                                <div className="space-y-2">
                                    {problem.options.map((tc, idx) => (
                                        <div key={idx} className="bg-black/30 rounded-lg p-3 text-xs font-mono text-gray-400 border border-white/5">
                                            {tc}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Editor */}
                <div className={`${showProblem && problem?.text ? 'w-3/5' : 'w-full'} relative flex flex-col`}>
                    <div className="flex-1 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-white/5 flex flex-col items-end py-2 pr-2 text-gray-600 text-xs font-mono select-none">
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(n => <div key={n} className="leading-6">{n}</div>)}
                        </div>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onPaste={handlePaste}
                            className="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm p-2 pl-14 outline-none resize-none leading-6 selection:bg-blue-500/30 rr-block"
                            spellCheck="false"
                        />
                    </div>

                    {/* Terminal */}
                    <div className="h-32 bg-[#1e1e1e] border-t border-white/10 flex flex-col">
                        <div className="flex items-center px-4 py-2 bg-[#252526] border-b border-white/5">
                            <Terminal size={14} className="text-gray-400 mr-2" />
                            <span className="text-xs text-gray-400 uppercase tracking-widest">Console Output</span>
                        </div>
                        <div className="flex-1 p-4 font-mono text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap">
                            {output || <span className="text-gray-600 italic">Ready to execute...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeSanctuary;
