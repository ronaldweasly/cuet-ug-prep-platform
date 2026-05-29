/**
 * Smart Exam Builder
 * Auto-generates 2026-focused mock exams using predictive scoring
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Question, Subject } from '@/types';
import PredictiveEngine from '@/lib/predictiveEngine';

interface SmartExamBuilderProps {
  questions: Question[];
  onExamGenerated?: (exam: Question[]) => void;
}

interface ExamConfig {
  totalQuestions: number;
  minProbability: number;
  bySubject: {
    Business_Studies: number;
    Economics: number;
    English: number;
    General_Test: number;
  };
}

const DEFAULT_CONFIG: ExamConfig = {
  totalQuestions: 120,
  minProbability: 70,
  bySubject: {
    Business_Studies: 40,
    Economics: 35,
    English: 20,
    General_Test: 25,
  },
};

export function SmartExamBuilder({ questions, onExamGenerated }: SmartExamBuilderProps) {
  const [config, setConfig] = useState<ExamConfig>(DEFAULT_CONFIG);
  const [generatedExam, setGeneratedExam] = useState<Question[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const statistics = useMemo(() => {
    const stats = {
      totalBySubject: {
        Business_Studies: 0,
        Economics: 0,
        English: 0,
        General_Test: 0,
      },
      highProbabilityBySubject: {
        Business_Studies: 0,
        Economics: 0,
        English: 0,
        General_Test: 0,
      },
    };

    const subjectMap = {
      'Business_Studies': Subject.BUSINESS_STUDIES,
      'Economics': Subject.ECONOMICS,
      'English': Subject.ENGLISH,
      'General_Test': Subject.GENERAL_TEST
    };

    for (const subject of [
      'Business_Studies',
      'Economics',
      'English',
      'General_Test',
    ] as const) {
      const mappedSubject = subjectMap[subject];
      const subjectQs = questions.filter((q) => q.subject === mappedSubject);
      stats.totalBySubject[subject] = subjectQs.length;

      const highProb = PredictiveEngine.filterHighProbabilityQuestions(
        subjectQs,
        config.minProbability
      );
      stats.highProbabilityBySubject[subject] = highProb.length;
    }

    return stats;
  }, [questions, config.minProbability]);

  const generateExam = () => {
    setIsGenerating(true);

    // Simulate generation with slight delay for UX
    setTimeout(() => {
      const exam = PredictiveEngine.generatePredictiveMockExam(questions, {
        questionsPerSubject: config.bySubject,
        minProbability: config.minProbability,
      });

      setGeneratedExam(exam);
      onExamGenerated?.(exam);
      setIsGenerating(false);
    }, 500);
  };

  const handleUpdateSubjectCount = (
    subject: keyof typeof config.bySubject,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      bySubject: {
        ...prev.bySubject,
        [subject]: value,
      },
      totalQuestions: Object.values({
        ...prev.bySubject,
        [subject]: value,
      }).reduce((a, b) => a + b),
    }));
  };

  const canGenerate =
    config.totalQuestions > 0 &&
    Object.values(config.bySubject).every((count) => count > 0);

  const subjectColors = {
    Business_Studies: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    Economics: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    English: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    General_Test: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">⚡ Smart Exam Builder 2026</h2>
        <p className="text-blue-100">
          Auto-generate mock exams using AI predictions of high-probability questions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-800">Exam Configuration</h3>

          {/* Probability Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Minimum Probability Threshold: {config.minProbability}%
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={config.minProbability}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  minProbability: Number(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="mt-2 text-xs text-gray-500">
              Only questions with ≥{config.minProbability}% probability of appearing
            </div>
          </div>

          {/* Total Questions Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Total Questions</div>
            <div className="text-3xl font-bold text-blue-600">
              {config.totalQuestions}
            </div>
          </div>

          {/* Subject Configuration */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Questions per Subject</h4>
            <div className="space-y-3">
              {(
                [
                  'Business_Studies',
                  'Economics',
                  'English',
                  'General_Test',
                ] as const
              ).map((subject) => {
                const colors = subjectColors[subject];
                const available = statistics.highProbabilityBySubject[subject];
                const requested = config.bySubject[subject];

                return (
                  <div key={subject} className={`${colors.bg} border ${colors.border} rounded-lg p-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-medium ${colors.text}`}>
                        {subject.replace('_', ' ')}
                      </label>
                      <span className="text-xs text-gray-600">
                        {requested} / {available} available
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={available}
                      value={requested}
                      onChange={(e) =>
                        handleUpdateSubjectCount(subject, Number(e.target.value))
                      }
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min="0"
                        max={available}
                        value={requested}
                        onChange={(e) =>
                          handleUpdateSubjectCount(subject, Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-xs text-gray-500">
                        {Math.round((requested / config.totalQuestions) * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Configurations */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Quick Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfig(DEFAULT_CONFIG)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
              >
                📋 CUET Standard
              </button>
              <button
                onClick={() =>
                  setConfig({
                    totalQuestions: 60,
                    minProbability: 80,
                    bySubject: {
                      Business_Studies: 20,
                      Economics: 15,
                      English: 10,
                      General_Test: 15,
                    },
                  })
                }
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
              >
                ⚡ Quick Practice
              </button>
              <button
                onClick={() =>
                  setConfig({
                    totalQuestions: 180,
                    minProbability: 65,
                    bySubject: {
                      Business_Studies: 60,
                      Economics: 55,
                      English: 30,
                      General_Test: 35,
                    },
                  })
                }
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
              >
                📚 Full Practice
              </button>
              <button
                onClick={() =>
                  setConfig({
                    totalQuestions: 90,
                    minProbability: 85,
                    bySubject: {
                      Business_Studies: 30,
                      Economics: 25,
                      English: 15,
                      General_Test: 20,
                    },
                  })
                }
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
              >
                🎯 High Confidence
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateExam}
            disabled={!canGenerate || isGenerating}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
              canGenerate && !isGenerating
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🚀 Generate 2026 Predictive Exam
              </span>
            )}
          </button>
        </div>

        {/* Statistics Panel */}
        <div className="space-y-4">
          {/* Available Questions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Available Questions</h3>
            <div className="space-y-3">
              {(['Business_Studies', 'Economics', 'English', 'General_Test'] as const).map(
                (subject) => {
                  const total = statistics.totalBySubject[subject];
                  const highProb = statistics.highProbabilityBySubject[subject];
                  const percentage = Math.round((highProb / total) * 100);

                  return (
                    <div key={subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {subject.replace('_', ' ')}
                        </span>
                        <span className="text-gray-600">
                          {highProb} / {total} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
            <h3 className="text-lg font-bold text-green-800 mb-3">✨ AI Recommendations</h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>
                ✓ Use <strong>80%+ threshold</strong> for last-minute revision
              </li>
              <li>
                ✓ Use <strong>65%+ threshold</strong> for comprehensive practice
              </li>
              <li>
                ✓ Balance: <strong>35% BS, 30% Eco, 15% Eng, 20% GT</strong>
              </li>
              <li>
                ✓ 20+ mock exams recommended before 2026 papers
              </li>
            </ul>
          </div>

          {/* Generated Exam Summary */}
          {generatedExam && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-3">✅ Exam Generated!</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div>
                  <strong>{generatedExam.length}</strong> questions selected
                </div>
                <div>
                  Threshold: <strong>{config.minProbability}%+</strong>
                </div>
                <button
                  onClick={() => onExamGenerated?.(generatedExam)}
                  className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  📝 Start Exam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartExamBuilder;
