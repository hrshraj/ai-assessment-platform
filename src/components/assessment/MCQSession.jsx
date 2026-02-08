import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle } from 'lucide-react';

const MCQSession = ({ onComplete, questions }) => {
    const [selected, setSelected] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [collectedAnswers, setCollectedAnswers] = useState([]);

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

    const currentQuestion = displayQuestions[currentIndex];

    const handleSubmit = () => {
        if (selected === null) return;

        const answer = {
            questionId: currentQuestion.id || 'id_not_found',
            selectedOption: currentQuestion.options[selected]
        };

        const updatedAnswers = [...collectedAnswers, answer];
        setCollectedAnswers(updatedAnswers);

        // If there are more MCQ questions, go to next one
        if (currentIndex < displayQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelected(null);
        } else {
            // All MCQs done — send last answer to trigger stage advance
            onComplete(answer);
        }
    };

    return (
        <div className="min-h-[600px] bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl flex flex-col justify-center items-center max-w-3xl mx-auto">
            <div className="w-full flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Stage 1: Knowledge Check</h2>
                <span className="text-sm text-gray-500 font-mono">
                    {currentIndex + 1} / {displayQuestions.length}
                </span>
            </div>

            <div className="w-full space-y-6">
                <motion.p
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl text-gray-300 font-medium"
                >
                    {currentQuestion.text}
                </motion.p>

                <motion.div
                    key={`options-${currentIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    {currentQuestion.options && currentQuestion.options.length > 0 ? (
                        currentQuestion.options.map((opt, idx) => (
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
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">No options available for this question.</p>
                    )}
                </motion.div>

                <div className="flex justify-between items-center mt-8">
                    {/* Progress dots */}
                    <div className="flex space-x-2">
                        {displayQuestions.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    idx < currentIndex ? 'bg-green-500' :
                                    idx === currentIndex ? 'bg-purple-500 w-4' :
                                    'bg-gray-700'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={selected === null}
                        className={`px-8 py-3 rounded-lg font-bold transition-all ${selected !== null ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_white]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {currentIndex < displayQuestions.length - 1 ? 'Next Question' : 'Confirm Answer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MCQSession;
