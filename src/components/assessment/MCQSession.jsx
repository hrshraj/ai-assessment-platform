import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle } from 'lucide-react';

const MCQSession = ({ onComplete, questions }) => {
    const [selected, setSelected] = useState(null);

    // Fallback if no questions provided
    const displayQuestions = questions && questions.length > 0 ? questions : [
        {
            id: 'mock-1',
            text: "Which of the following is NOT a core principle of Redux?",
            options: [
                "Single source of truth",
                "State is read-only",
                "Changes are made with pure functions",
                "State is distributed across components"
            ],
            correctIndex: 3
        }
    ];

    const currentQuestion = displayQuestions[0]; // Currently handling single question for simplicity

    const handleSubmit = () => {
        if (selected !== null) {
            onComplete({
                questionId: currentQuestion.id || 'id_not_found',
                selectedOption: currentQuestion.options[selected]
            });
        }
    };

    return (
        <div className="h-[600px] bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl flex flex-col justify-center items-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Stage 1: Knowledge Check</h2>

            <div className="w-full space-y-6">
                <p className="text-xl text-gray-300 font-medium">{currentQuestion.text}</p>

                <div className="space-y-4">
                    {currentQuestion.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelected(idx)}
                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${selected === idx
                                ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                : 'bg-black/20 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <span className={selected === idx ? 'text-white' : 'text-gray-400'}>{opt}</span>
                            {selected === idx ? (
                                <CheckCircle className="text-purple-400" size={20} />
                            ) : (
                                <Circle className="text-gray-600 group-hover:text-gray-400" size={20} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex justify-end mt-8">
                    <button
                        onClick={handleSubmit}
                        disabled={selected === null}
                        className={`px-8 py-3 rounded-lg font-bold transition-all ${selected !== null ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_white]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Confirm Answer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MCQSession;
