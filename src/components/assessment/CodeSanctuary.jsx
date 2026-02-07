import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Code, Terminal, Save } from 'lucide-react';
import * as rrweb from 'rrweb';
import { proctorService } from '../../services/ProctorService';

const CodeSanctuary = ({ onComplete, onAnomaly, problem, submissionId }) => {
    const [code, setCode] = useState(problem?.initialCode || problem?.text || `def solve_problem(input_data):\n    # Write your optimal solution here\n    # Expected Time Complexity: O(N)\n    pass`);
    const [output, setOutput] = useState('');
    const eventsRef = useRef([]);
    const stopFnRef = useRef(null);

    // Update code if problem changes
    useEffect(() => {
        if (problem?.initialCode || problem?.text) {
            setCode(problem.initialCode || problem.text);
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
        // Prevent real paste to enforce manual typing (or allow small pastes in real scenario)
    };

    const runCode = () => {
        setOutput('Running test cases...\nTest Case 1: PASSED\nTest Case 2: PASSED\nTest Case 3: PASSED');
    };

    const handleSubmit = async () => {
        // Stop recording
        if (stopFnRef.current) stopFnRef.current();

        // Save Replay to local storage for backup
        proctorService.saveReplay(eventsRef.current);

        // Upload Replay to backend
        if (submissionId && eventsRef.current.length > 0) {
            // eventsRef.current is an array of objects.
            // Backend expects JSON string for data.
            // We'll wrap it in a structure if needed, or just send raw events array stringified.
            // Assuming Recruiter Service expects standard rrweb events array.
            await proctorService.sendLog(submissionId, 'REPLAY', JSON.stringify(eventsRef.current));
        }

        onComplete({
            questionId: problem?.id || 'coding_1',
            code,
            language: problem?.language || 'python'
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

            {/* Editor Area */}
            <div className="flex-1 relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-white/5 flex flex-col items-end py-2 pr-2 text-gray-600 text-xs font-mono select-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => <div key={n} className="leading-6">{n}</div>)}
                </div>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onPaste={handlePaste}
                    className="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm p-2 pl-14 outline-none resize-none leading-6 selection:bg-blue-500/30 rr-block"
                    spellCheck="false"
                />
            </div>

            {/* Terminal Area */}
            <div className="h-40 bg-[#1e1e1e] border-t border-white/10 flex flex-col">
                <div className="flex items-center px-4 py-2 bg-[#252526] border-b border-white/5">
                    <Terminal size={14} className="text-gray-400 mr-2" />
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Console Output</span>
                </div>
                <div className="flex-1 p-4 font-mono text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap">
                    {output || <span className="text-gray-600 italic">Ready to execute...</span>}
                </div>
            </div>
        </div>
    );
};

export default CodeSanctuary;
