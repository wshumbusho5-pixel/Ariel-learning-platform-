'use client';

import { useState } from 'react';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  answer: string;
  explanation?: string;
  detailedExplanation?: string;
  onNext: () => void;
}

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  answer,
  explanation,
  detailedExplanation,
  onNext
}: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleReveal = () => {
    setShowAnswer(true);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setShowDetails(false);
    onNext();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i < questionNumber - 1
                    ? 'bg-green-500'
                    : i === questionNumber - 1
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            {question}
          </h2>
        </div>

        {/* Answer section */}
        {!showAnswer ? (
          <button
            onClick={handleReveal}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Show Answer
          </button>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            {/* The Answer - Clean and prominent */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-lg">
              <p className="text-xl font-semibold text-green-900">
                {answer}
              </p>
            </div>

            {/* Optional brief explanation */}
            {explanation && (
              <div className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg">
                {explanation}
              </div>
            )}

            {/* Toggle for detailed explanation */}
            {detailedExplanation && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showDetails ? 'Hide' : 'Show'} detailed explanation
                </button>
                {showDetails && (
                  <div className="mt-3 text-gray-700 text-sm bg-blue-50 p-4 rounded-lg">
                    {detailedExplanation}
                  </div>
                )}
              </div>
            )}

            {/* Next button */}
            <button
              onClick={handleNext}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {questionNumber < totalQuestions ? (
                <>
                  Next Question
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              ) : (
                'Complete'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
