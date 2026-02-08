import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SubjectiveSession = ({ onComplete, questions }) => {
    const [answer, setAnswer] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [collectedAnswers, setCollectedAnswers] = useState([]);

    const displayQuestions = questions && questions.length > 0 ? questions : [
        {
            id: 'subjective_mock',
            text: "Describe how you would design a scalable notification system for a social media platform with 10M+ active users. Consider database choice, message queues, and client delivery methods."
        }
    ];

    const currentQuestion = displayQuestions[currentIndex];

    const handleSubmit = () => {
        const answerObj = {
            questionId: currentQuestion.id || 'subjective_1',
            answer
        };

        const updatedAnswers = [...collectedAnswers, answerObj];
        setCollectedAnswers(updatedAnswers);

        if (currentIndex < displayQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setAnswer('');
        } else {
            onComplete(answerObj);
        }
    };

    return (
        <div className="h-[600px] bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl flex flex-col max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Stage 2: Architectural Thinking</h2>
                <span className="text-sm text-gray-500 font-mono">
                    {currentIndex + 1} / {displayQuestions.length}
                </span>
            </div>

            <motion.p
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-gray-400 mb-6 leading-relaxed"
            >
                {currentQuestion.text}
            </motion.p>

            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="flex-1 w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-300 outline-none focus:border-purple-500/50 transition-colors resize-none font-sans leading-relaxed"
            />

            <div className="flex justify-between items-center mt-6">
                <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">{answer.length} chars</span>
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
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={answer.length < 50}
                    className={`px-8 py-3 rounded-lg font-bold transition-all ${answer.length >= 50 ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_white]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {currentIndex < displayQuestions.length - 1 ? 'Next Question' : 'Submit Answer'}
                </button>
            </div>
        </div>
    );
};

export default SubjectiveSession;
