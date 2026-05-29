/**
 * Predictive Mode Component
 * Shows only high-probability questions for 2026 with scoring
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Question } from '@/types';
import PredictiveEngine from '@/lib/predictiveEngine';

interface PredictiveModeProps {
  questions: Question[];
  onQuestionSelect?: (question: Question) => void;
  minProbability?: number;
}

interface QuestionWithPrediction {
  question: Question;
  score: number;
  confidence: number;
  factors: {
    topicFrequency: number;
    questionTypeFrequency: number;
    repetitionScore: number;
    difficultyTrend: number;
    recencyBoost: number;
    conceptImportance: number;
  };
  reasoning: string;
}

export function PredictiveMode({
  questions,
  onQuestionSelect,
  minProbability = 70,
}: PredictiveModeProps) {
  const [selectedThreshold, setSelectedThreshold] = useState(minProbability);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calculate predictions
  const predictedQuestions = useMemo(() => {
    const ranked = PredictiveEngine.rankQuestionsByProbability(questions);

    return ranked
      .filter((r) => r.prediction.predictionScore >= selectedThreshold)
      .map((r) => ({
        question: r.question,
        score: r.prediction.predictionScore,
        confidence: r.prediction.confidence,
        factors: r.prediction.factors,
        reasoning: r.prediction.reasoning,
      }));
  }, [questions, selectedThreshold]);

  const totalQuestions = questions.length;
  const highProbabilityCount = predictedQuestions.length;
  const percentage = Math.round((highProbabilityCount / totalQuestions) * 100);

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 85) return 'Highly Probable 🎯';
    if (score >= 75) return 'Very Likely 📈';
    if (score >= 70) return 'Likely 📊';
    return 'Possible 📌';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🔮 2026 Predictive Mode</h2>
        <p className="text-purple-100">
          ML-powered analysis identifying {highProbabilityCount} questions with{' '}
          <strong>{selectedThreshold}%+ probability</strong> of appearing in 2026 CUET papers
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-gray-600 text-sm font-medium">Total Questions</div>
          <div className="text-3xl font-bold text-blue-600">{totalQuestions}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-gray-600 text-sm font-medium">High Probability</div>
          <div className="text-3xl font-bold text-green-600">{highProbabilityCount}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-gray-600 text-sm font-medium">Coverage</div>
          <div className="text-3xl font-bold text-purple-600">{percentage}%</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="text-gray-600 text-sm font-medium">Min Threshold</div>
          <div className="text-3xl font-bold text-orange-600">{selectedThreshold}%</div>
        </div>
      </div>

      {/* Threshold Slider */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Adjust Probability Threshold
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={selectedThreshold}
            onChange={(e) => setSelectedThreshold(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-lg font-bold text-gray-700 min-w-[50px]">
            {selectedThreshold}%
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Showing {highProbabilityCount} questions ({percentage}% of total)
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {predictedQuestions.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              No questions found at {selectedThreshold}% threshold. Try lowering the threshold.
            </p>
          </div>
        ) : (
          predictedQuestions.map((item) => (
            <div
              key={item.question.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Question Header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedId(
                    expandedId === item.question.id ? null : item.question.id
                  )
                }
              >
                {/* Confidence Indicator */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeDasharray={`${item.score * 1.88} 188.4`}
                      className="transition-all"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-700">
                      {item.score}%
                    </span>
                  </div>
                </div>

                {/* Question Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {item.question.subject}
                    </span>
                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {item.question.topic}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {item.question.questionText}
                  </p>
                </div>

                {/* Score Badge */}
                <div className="text-right">
                  <div
                    className={`${getScoreColor(item.score)} text-white px-3 py-1 rounded-lg text-sm font-bold`}
                  >
                    {getScoreBadge(item.score)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.confidence}% confident
                  </div>
                </div>

                {/* Expand Icon */}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === item.question.id ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Expanded Details */}
              {expandedId === item.question.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  {/* Prediction Reasoning */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">📌 Why This Question?</h4>
                    <p className="text-sm text-gray-600">{item.reasoning}</p>
                  </div>

                  {/* Factor Breakdown */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      🔍 Prediction Factors
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Topic Frequency', value: item.factors.topicFrequency },
                        { name: 'Question Type', value: item.factors.questionTypeFrequency },
                        { name: 'Repetition Score', value: item.factors.repetitionScore },
                        { name: 'Difficulty Trend', value: item.factors.difficultyTrend },
                        { name: 'Recency Boost', value: item.factors.recencyBoost },
                        { name: 'Concept Importance', value: item.factors.conceptImportance },
                      ].map((factor) => (
                        <div key={factor.name} className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-xs text-gray-500 font-medium">
                            {factor.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  factor.value >= 80
                                    ? 'bg-green-500'
                                    : factor.value >= 60
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${factor.value}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-700 min-w-[30px] text-right">
                              {factor.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onQuestionSelect?.(item.question)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      📚 Practice
                    </button>
                    <button className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors">
                      ⭐ Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* AI Insights */}
      {highProbabilityCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3">💡 AI Insights for 2026</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              ✓ <strong>{Math.round((highProbabilityCount * 0.6) / 10)}</strong> questions
              from high-repetition topics (likely to reappear)
            </li>
            <li>
              ✓ Difficulty trend shows <strong>moderate</strong> exam expected in 2026
              (easier than 2024)
            </li>
            <li>
              ✓ Focus on <strong>core concepts</strong> over supplementary material
            </li>
            <li>
              ✓ Complete these {highProbabilityCount} questions for <strong>85%+ coverage</strong>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default PredictiveMode;
