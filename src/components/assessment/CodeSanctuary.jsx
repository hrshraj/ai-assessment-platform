import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Code, Terminal, Save, FileText, ChevronDown, ChevronRight, Lightbulb, AlertCircle, Zap } from 'lucide-react';
import * as rrweb from 'rrweb';
import { proctorService } from '../../services/ProctorService';

const DifficultyBadge = ({ difficulty }) => {
    const config = {
        easy: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
        medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
        hard: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    };
    const c = config[(difficulty || '').toLowerCase()] || config.medium;
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
            {difficulty || 'Medium'}
        </span>
    );
};

const CodeSanctuary = ({ onComplete, onAnomaly, problem, submissionId }) => {
    const defaultCode = `def solve_problem(input_data):\n    # Write your optimal solution here\n    pass`;
    const [code, setCode] = useState(problem?.starterCode || defaultCode);
    const [output, setOutput] = useState('');
    const [showProblem, setShowProblem] = useState(true);
    const [showHints, setShowHints] = useState(false);
    const [selectedLang, setSelectedLang] = useState('python');
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
        return () => {
            if (stopFnRef.current) stopFnRef.current();
        };
    }, []);

    const handlePaste = (e) => {
        e.preventDefault();
        onAnomaly('Mass Paste Detected');
    };

    const runCode = () => {
        const testCases = problem?.testCases || [];
        if (testCases.length > 0) {
            const visibleTests = testCases.filter(tc => !tc.is_hidden);
            const output = visibleTests.map((tc, i) =>
                `Test Case ${i + 1}: Input: ${tc.input || 'N/A'} → Expected: ${tc.expected_output || 'N/A'} ... SIMULATED`
            ).join('\n');
            setOutput(`Running ${visibleTests.length} visible test cases...\n${output}\n\n(Full execution happens on submit)`);
        } else {
            setOutput('Running test cases...\nTest Case 1: PASSED\nTest Case 2: PASSED\nTest Case 3: PASSED');
        }
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
            questionId: problem?.id,
            codeAnswer: code,
            language: selectedLang
        });
    };

    const testCases = problem?.testCases || [];
    const visibleTestCases = testCases.filter(tc => !tc.is_hidden);
    const hiddenCount = testCases.filter(tc => tc.is_hidden).length;
    const constraints = problem?.constraints || [];
    const hints = problem?.hints || [];
    const languages = problem?.languageOptions || ['python', 'javascript', 'java'];

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] rounded-2xl border border-white/10 overflow-hidden relative group">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-white/5">
                <div className="flex items-center space-x-3">
                    <Code size={16} className="text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">
                        {problem?.codingTitle || 'Coding Challenge'}
                    </span>
                    <DifficultyBadge difficulty={problem?.difficulty} />
                    <span className="text-xs text-red-500 animate-pulse">● REC</span>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Language selector */}
                    <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        className="bg-gray-800 border border-white/10 text-gray-300 text-xs rounded px-2 py-1.5 outline-none cursor-pointer"
                    >
                        {languages.map(lang => (
                            <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                        ))}
                    </select>
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
                {/* Problem Statement Panel - LeetCode Style */}
                {showProblem && (
                    <div className="w-2/5 border-r border-white/10 overflow-y-auto bg-[#1a1a2e]">
                        {/* Problem Title & Difficulty */}
                        <div className="p-5 border-b border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-lg font-bold text-white">
                                    {problem?.codingTitle || 'Problem'}
                                </h3>
                                <DifficultyBadge difficulty={problem?.difficulty} />
                            </div>

                            {/* Problem Statement */}
                            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {problem?.text || 'No problem statement available.'}
                            </div>
                        </div>

                        {/* Test Cases */}
                        {visibleTestCases.length > 0 && (
                            <div className="p-5 border-b border-white/5">
                                <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Zap size={12} className="text-blue-400" />
                                    Examples
                                </h4>
                                <div className="space-y-3">
                                    {visibleTestCases.map((tc, idx) => (
                                        <div key={idx} className="bg-black/30 rounded-xl p-4 border border-white/5">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Example {idx + 1}</div>
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-[10px] text-gray-500 font-mono">Input: </span>
                                                    <code className="text-sm font-mono text-green-400 bg-green-500/5 px-1.5 py-0.5 rounded">
                                                        {typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}
                                                    </code>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-gray-500 font-mono">Output: </span>
                                                    <code className="text-sm font-mono text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded">
                                                        {typeof tc.expected_output === 'object' ? JSON.stringify(tc.expected_output) : tc.expected_output}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {hiddenCount > 0 && (
                                    <p className="text-xs text-gray-600 mt-2 italic">
                                        + {hiddenCount} hidden test case{hiddenCount > 1 ? 's' : ''} will run on submission
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Constraints */}
                        {constraints.length > 0 && (
                            <div className="p-5 border-b border-white/5">
                                <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <AlertCircle size={12} className="text-yellow-400" />
                                    Constraints
                                </h4>
                                <ul className="space-y-1.5">
                                    {constraints.map((c, idx) => (
                                        <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                            <span className="text-gray-600 mt-0.5">•</span>
                                            <code className="font-mono text-xs text-gray-300">{c}</code>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Hints (collapsible) */}
                        {hints.length > 0 && (
                            <div className="p-5">
                                <button
                                    onClick={() => setShowHints(!showHints)}
                                    className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-widest hover:text-yellow-400 transition-colors w-full"
                                >
                                    <Lightbulb size={12} className="text-yellow-400" />
                                    Hints ({hints.length})
                                    {showHints ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                                {showHints && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-3 space-y-2"
                                    >
                                        {hints.map((hint, idx) => (
                                            <div key={idx} className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 text-sm text-yellow-200/80">
                                                <span className="text-yellow-500 font-bold text-xs mr-2">Hint {idx + 1}:</span>
                                                {hint}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Editor */}
                <div className={`${showProblem ? 'w-3/5' : 'w-full'} relative flex flex-col`}>
                    <div className="flex-1 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-white/5 flex flex-col items-end py-2 pr-2 text-gray-600 text-xs font-mono select-none">
                            {Array.from({ length: 50 }, (_, i) => i + 1).map(n => <div key={n} className="leading-6">{n}</div>)}
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
                            {output || <span className="text-gray-600 italic">Click RUN to test your solution...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeSanctuary;
