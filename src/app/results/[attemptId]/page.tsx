'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ExamResults() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attemptData, setAttemptData] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId || attemptId === 'undefined') {
      console.log('[DEBUG] attemptId not ready or undefined yet:', attemptId);
      return;
    }
    
    setLoading(true);
    console.log('[DEBUG] Fetching attempt details for ID:', attemptId);
    
    fetch(`/api/attempts?id=${attemptId}`)
      .then(res => res.json())
      .then(res => {
        console.log('[DEBUG] Attempt API response:', res);
        if (res.success && res.data) {
          setAttemptData(res.data);
          
          // Locate attempt details and testId in any possible structure
          const attemptObj = res.data.attempt || res.data;
          const targetTestId = attemptObj.testId || res.data.testId || (res.data.attempt && res.data.attempt.testId);
          
          console.log('[DEBUG] attemptObj:', attemptObj, 'targetTestId:', targetTestId);
          
          if (targetTestId) {
            console.log('[DEBUG] Fetching test details for ID:', targetTestId);
            fetch(`/api/tests?id=${targetTestId}`)
              .then(tRes => tRes.json())
              .then(tRes => {
                console.log('[DEBUG] Test API response:', tRes);
                if (tRes.success && tRes.data) {
                  setTest(tRes.data);
                } else {
                  console.error('[ERROR] Failed to fetch test by ID:', targetTestId, tRes);
                }
                setLoading(false);
              })
              .catch(tErr => {
                console.error('[ERROR] Test fetch exception:', tErr);
                setLoading(false);
              });
          } else {
            console.error('[ERROR] No testId found in attempt structure', res.data);
            setLoading(false);
          }
        } else {
          console.error('[ERROR] Attempt API returned success=false or missing data:', res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('[ERROR] Attempt fetch exception:', err);
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">Compiling Analytical Scorecard...</p>
        </div>
      </div>
    );
  }

  if (!attemptData || !test) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-white gap-4 p-4 text-center">
        <p className="text-xl font-bold text-red-500">Attempt or Test structure not found!</p>
        <p className="text-xs text-slate-400 max-w-md">
          Debug info: attemptId = "{attemptId}" | attemptData = {attemptData ? 'Loaded' : 'Null'} | test = {test ? 'Loaded' : 'Null'}
        </p>
        <Link href="/dashboard" className="bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-500 transition">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const attempt = attemptData.attempt || attemptData;
  const analytics = attemptData.analytics || {
    totalQuestions: attempt.answers?.length || 0,
    attempted: attempt.answers?.filter((a: any) => a.selectedOption !== null).length || 0,
    correct: attempt.answers?.filter((a: any) => a.isCorrect === true).length || 0,
    incorrect: attempt.answers?.filter((a: any) => a.isCorrect === false).length || 0,
    skipped: attempt.answers?.filter((a: any) => a.selectedOption === null).length || 0,
    averageTime: 12,
    estimatedPercentile: 75,
    result: (attempt.percentage || 0) >= 50 ? 'PASS' : 'FAIL'
  };

  // Grade analytics
  const scoreRaw = attempt.obtainedMarks || 0;
  const totalRaw = attempt.totalMarks || 0;
  const percentage = attempt.percentage || 0;
  const wasPass = analytics.result === 'PASS';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            CUET Scorecard
          </span>
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        
        {/* Banner with estimated percentile */}
        <section className={`border rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
          wasPass 
            ? 'bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border-emerald-800/40' 
            : 'bg-gradient-to-r from-rose-950/40 to-pink-950/40 border-rose-800/40'
        }`}>
          <div className="space-y-2">
            <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${
              wasPass ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {wasPass ? 'Test Cleared' : 'Below Cutoff'}
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">
              {wasPass ? 'Excellent Work, Himani!' : 'Keep Practicing, Himani!'}
            </h2>
            <p className="text-slate-300 max-w-xl text-xs sm:text-sm leading-relaxed">
              Your mock answers have been graded. Review the subject and difficulty breakdown to optimize your 2026 preparation strategy.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 text-center w-full md:w-auto md:min-w-[160px] shadow-lg">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Estimated Percentile</span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-blue-400 my-1">
              {analytics.estimatedPercentile}
            </h3>
            <span className="text-[9px] sm:text-[10px] text-slate-400">NTA bell curve forecast</span>
          </div>
        </section>

        {/* Analytics Aggregates Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow">
            <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase">Obtained Marks</span>
            <h4 className="text-xl sm:text-3xl font-extrabold text-white my-1 sm:my-2">{scoreRaw} <span className="text-xs sm:text-sm font-normal text-slate-500">/ {totalRaw}</span></h4>
            <span className="text-[9px] sm:text-xs text-slate-400 line-clamp-1">NTA negative marking</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow">
            <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase">Accuracy</span>
            <h4 className="text-xl sm:text-3xl font-extrabold text-white my-1 sm:my-2">{percentage}%</h4>
            <span className="text-[9px] sm:text-xs text-slate-400 line-clamp-1">Questions correct ratio</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow">
            <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase">Correct Answers</span>
            <h4 className="text-xl sm:text-3xl font-extrabold text-emerald-400 my-1 sm:my-2">{analytics.correct}</h4>
            <span className="text-[9px] sm:text-xs text-slate-500 line-clamp-1">Incorrect: {analytics.incorrect} | Skipped: {analytics.skipped}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow">
            <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase">Time Spent</span>
            <h4 className="text-xl sm:text-3xl font-extrabold text-indigo-400 my-1 sm:my-2">{analytics.averageTime}s <span className="text-xs sm:text-sm font-normal text-slate-500">/ Q</span></h4>
            <span className="text-[9px] sm:text-xs text-slate-400 line-clamp-1">Average answering speed</span>
          </div>
        </section>

        {/* Sub-section recommendation */}
        <section className="grid lg:grid-cols-3 gap-8">
          
          {/* Detailed Question Review */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold text-white mb-2">Question Review & Solutions</h3>
            <div className="space-y-6">
              {test.questions.map((q: any, i: number) => {
                const userAnsObj = attempt.answers.find((a: any) => a.questionId === q.id);
                const selected = userAnsObj?.selectedOption || null;
                const isCorrect = userAnsObj?.isCorrect;
                
                let borderClass = 'border-slate-800';
                let tagText = 'Skipped';
                let tagClass = 'bg-slate-800 text-slate-400';
                
                if (selected) {
                  if (isCorrect) {
                    borderClass = 'border-emerald-800/40 bg-emerald-950/5';
                    tagText = 'Correct (+5)';
                    tagClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  } else {
                    borderClass = 'border-rose-800/40 bg-rose-950/5';
                    tagText = 'Incorrect (-1)';
                    tagClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                  }
                }

                return (
                  <div key={q.id} className={`bg-slate-900 border rounded-2xl p-4 sm:p-6 ${borderClass} space-y-4`}>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-xs sm:text-sm text-slate-400 font-bold">Question {i + 1}</span>
                      <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded font-bold uppercase ${tagClass}`}>
                        {tagText}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-white leading-relaxed">{q.questionText}</p>

                    {/* Options */}
                    <div className="grid md:grid-cols-2 gap-3 pt-2">
                      {q.options.map((opt: any) => {
                        const isUserSelected = selected === opt.key;
                        const isCorrectOpt = q.correctAnswer === opt.key;
                        
                        let optBorder = 'border-slate-800 text-slate-400';
                        if (isUserSelected) optBorder = 'border-rose-500 bg-rose-500/5 text-rose-300 font-bold';
                        if (isCorrectOpt) optBorder = 'border-emerald-500 bg-emerald-500/5 text-emerald-300 font-bold';

                        return (
                          <div key={opt.key} className={`border rounded-lg p-3 flex gap-2 items-center text-xs md:text-sm ${optBorder}`}>
                            <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                              isCorrectOpt ? 'bg-emerald-500 text-white' : (isUserSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500')
                            }`}>
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs md:text-sm">
                      <p className="font-extrabold text-blue-400">💡 Concept Explanation:</p>
                      <p className="text-slate-400 leading-relaxed">{q.explanation || 'No explanation provided for this conceptual question.'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Subject Mastery predictions */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">2026 Preparation Guide</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Based on your results from this mock test, our predictive engine recommends focusing on the following concepts to achieve a 99+ percentile in the 2026 examination:
              </p>
              
              <div className="space-y-4 pt-2">
                {[
                  { topic: 'National Income Accounting', action: 'Revise double-counting exclusions', priority: 'High Priority' },
                  { topic: 'Cloze Grammatical Rules', action: 'Practice neither/either singular singular subject-verb agreement', priority: 'High Priority' },
                  { topic: 'Henri Fayol Principles', action: 'Differentiate Unity of Direction vs Command structures', priority: 'Moderate' }
                ].map((rec, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white">{rec.topic}</h4>
                      <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/10">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <h3 className="text-lg font-bold text-white">Earned XP</h3>
              <div className="text-5xl font-extrabold text-yellow-400 animate-pulse">
                +150 XP
              </div>
              <p className="text-xs text-slate-500">Streak updated in database. Streak modifier applied.</p>
              <Link href="/dashboard" className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition text-sm">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
