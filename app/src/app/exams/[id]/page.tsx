'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ActiveExam() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [test, setTest] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetch(`/api/tests?id=${testId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setTest(res.data);
          setTimeLeft(res.data.duration * 60);
          setDuration(res.data.duration * 60);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch test:', err);
        setLoading(false);
      });
  }, [testId]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || !test || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Auto submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, test, timeLeft]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">Setting up Exam Console...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-white gap-4">
        <p className="text-xl font-bold text-red-500">Test not found!</p>
        <Link href="/dashboard" className="bg-blue-600 px-6 py-2 rounded-lg font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentQ = test.questions[currentIdx];

  const handleSelectOption = (qId: string, optionKey: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [qId]: optionKey
    }));
  };

  const handleToggleFlag = (qId: string) => {
    setFlagged(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleSubmit = (auto = false) => {
    if (submitting) return;
    if (!auto && !confirm('Are you sure you want to submit your exam now?')) return;
    
    setSubmitting(true);
    const timeSpentTotal = duration - timeLeft;

    const formattedAnswers = test.questions.map((q: any) => ({
      questionId: q.id,
      selectedOption: selectedOptions[q.id] || null,
      timeSpent: Math.round(timeSpentTotal / test.questions.length)
    }));

    fetch('/api/attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        testId,
        answers: formattedAnswers,
        duration: timeSpentTotal
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          router.push(`/results/${res.data.attempt.id}`);
        } else {
          alert('Submission failed. Please try again.');
          setSubmitting(false);
        }
      })
      .catch(err => {
        console.error('Submission error:', err);
        setSubmitting(false);
      });
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      
      {/* Top Console Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="space-y-0.5 max-w-[40%] sm:max-w-none">
          <h2 className="font-extrabold text-white text-sm sm:text-lg line-clamp-1">{test.title}</h2>
          <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
            CUET Session
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="text-right">
            <p className="hidden sm:block text-[10px] text-slate-500 font-semibold uppercase">Time Left</p>
            <p className={`text-lg sm:text-2xl font-mono font-extrabold ${timeLeft < 120 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
          <button 
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-extrabold px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl transition text-xs sm:text-sm uppercase tracking-wide shadow"
          >
            {submitting ? '...' : 'Submit'}
          </button>
        </div>
      </header>

      {/* Main Container Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto p-4 lg:p-6 gap-6">
        
        {/* Left Side: Active Question */}
        <main className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col justify-between shadow-xl">
          
          <div className="space-y-6 sm:space-y-8">
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <span className="text-xs sm:text-sm font-semibold text-slate-400">
                Question {currentIdx + 1} of {test.questions.length}
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline text-xs bg-slate-800 px-2 py-0.5 rounded capitalize text-slate-300">
                  Topic: {currentQ.topic || 'General'}
                </span>
                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded capitalize font-bold ${
                  currentQ.difficulty === 'HARD' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                  (currentQ.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
                }`}>
                  {currentQ.difficulty}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-xl font-bold text-white leading-relaxed">
              {currentQ.questionText}
            </div>

            {/* Options List */}
            <div className="space-y-3 sm:space-y-4">
              {currentQ.options.map((option: any) => {
                const isSelected = selectedOptions[currentQ.id] === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => handleSelectOption(currentQ.id, option.key)}
                    className={`w-full text-left p-3.5 sm:p-5 rounded-xl border transition flex gap-3 sm:gap-4 items-center ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500 text-white font-bold' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-blue-400' 
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}>
                      {option.key}
                    </span>
                    <span className="text-xs sm:text-base leading-relaxed">{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Action Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mt-8 sm:mt-12 pt-6 border-t border-slate-800">
            <button
              onClick={() => handleToggleFlag(currentQ.id)}
              className={`flex items-center justify-center gap-2 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border transition w-full sm:w-auto ${
                flagged[currentQ.id]
                  ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                  : 'border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              🚩 {flagged[currentQ.id] ? 'Flagged' : 'Flag for Review'}
            </button>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-slate-700 transition text-center"
              >
                Previous
              </button>
              {currentIdx === test.questions.length - 1 ? (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition text-center"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(prev => Math.min(test.questions.length - 1, prev + 1))}
                  className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition text-center"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right Side: Navigation Panel */}
        <aside className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-base">Question Navigator</h3>
            <p className="text-xs text-slate-500">Track your progress across this mock paper</p>
          </div>

          {/* Grid Panel */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-h-60 lg:max-h-none overflow-y-auto pr-1">
            {test.questions.map((q: any, i: number) => {
              const isCurrent = i === currentIdx;
              const isAnswered = !!selectedOptions[q.id];
              const isFlagged = flagged[q.id];

              let bgClass = 'bg-slate-950 border-slate-800 text-slate-500';
              if (isAnswered) bgClass = 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold';
              if (isFlagged) bgClass = 'bg-yellow-500/20 border-yellow-500 text-yellow-400 font-bold';
              if (isCurrent) bgClass = 'bg-slate-100 border-white text-slate-950 font-extrabold';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`aspect-square rounded-xl border flex items-center justify-center text-sm transition hover:scale-105 ${bgClass}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Grid Legend */}
          <div className="border-t border-slate-800 pt-4 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Legend</h4>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-800"></span>
                <span>Unattempted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-blue-600/20 border border-blue-500"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-yellow-500/20 border border-yellow-500"></span>
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-white"></span>
                <span>Current</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
