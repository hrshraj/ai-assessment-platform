import React, { useState } from 'react';

const SubjectiveSession = ({ onComplete, questions }) => {
    const [answer, setAnswer] = useState('');

    const questionText = questions && questions.length > 0
        ? questions[0].text
        : "Describe how you would design a scalable notification system for a social media platform with 10M+ active users. Consider database choice, message queues, and client delivery methods.";

    return (
        <div className="h-[600px] bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl flex flex-col max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Stage 2: Architectural Thinking</h2>

            <p className="text-gray-400 mb-6 leading-relaxed">
                {questionText}
            </p>

            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your design approach here..."
                className="flex-1 w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-300 outline-none focus:border-purple-500/50 transition-colors resize-none font-sans leading-relaxed"
            />

            <div className="flex justify-between items-center mt-6">
                <span className="text-xs text-gray-500">{answer.length} chars</span>
                <button
                    onClick={() => onComplete({
                        questionId: questions?.[0]?.id || 'subjective_1',
                        answer
                    })}
                    disabled={answer.length < 50}
                    className={`px-8 py-3 rounded-lg font-bold transition-all ${answer.length >= 50 ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_white]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Submit Architecture
                </button>
            </div>
        </div>
    );
};

export default SubjectiveSession;
