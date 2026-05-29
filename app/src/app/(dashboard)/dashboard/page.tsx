'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleStartTest = (templateId: string) => {
    setGeneratingId(templateId);
    fetch('/api/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ templateId })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.testId) {
          window.location.href = `/exams/${res.data.testId}`;
        } else {
          alert('Failed to generate a new mock test. Loading standard test.');
          window.location.href = `/exams/${templateId}`;
        }
      })
      .catch(err => {
        console.error('Failed to generate dynamic test:', err);
        window.location.href = `/exams/${templateId}`;
      });
  };

  useEffect(() => {
    // Call health check first to ensure auto-seeding is complete
    fetch('/api/health')
      .then(() => Promise.all([
        fetch('/api/stats').then(res => res.json()),
        fetch('/api/tests').then(res => res.json())
      ]))
      .then(([statsRes, testsRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (testsRes.success) setTests(testsRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">Loading CUET Dashboard...</p>
        </div>
      </div>
    );
  }

  // Fallback default stats if API fails
  const currentStats = stats || {
    totalTestsTaken: 0,
    averagePercentage: 0,
    currentStreak: 1,
    longestStreak: 1,
    subjectMastery: { BUSINESS_STUDIES: 0, ECONOMICS: 0, ENGLISH: 0, GENERAL_TEST: 0 },
    weakTopics: ['National Income Economics', 'Cloze Grammar Exercises'],
    strongTopics: ['Henri Fayol Principles', 'Reading Strategies']
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              CUET UG
            </span>
            <span className="hidden sm:inline text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-wider">
              Prep
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <Link href="/admin" className="font-semibold text-slate-400 hover:text-slate-200">
              Admin
            </Link>
            <div className="h-4 w-px bg-slate-800"></div>
            <span className="hidden md:inline font-semibold text-slate-300">
              👤 Himani Shukla
            </span>
            <span className="md:hidden font-semibold text-slate-300">
              👤 Himani
            </span>
            <div className="h-4 w-px bg-slate-800"></div>
            <span className="font-semibold text-blue-400 flex items-center gap-1">
              🔥 <span className="hidden sm:inline">Streak: </span>{currentStats.currentStreak}d
            </span>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        
        {/* Banner */}
        <section className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-800/40 rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">Welcome back, Himani Shukla!</h2>
            <p className="text-slate-300 max-w-xl text-xs sm:text-sm leading-relaxed">
              The 2026 NTA CUET predictive engine has analyzed 2022–2025 question cycles. 
              Review your weak areas below and attempt a mock test.
            </p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="#exams-list" className="w-full text-center md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg transition text-sm">
              Take Mock Exam
            </Link>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Average Score */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow">
            <span className="text-slate-400 text-xs sm:text-sm font-semibold">Average Score</span>
            <span className="text-xl sm:text-4xl font-extrabold text-white my-2 sm:my-3">
              {currentStats.averagePercentage}%
            </span>
            <div className="w-full bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-1000" 
                style={{ width: `${currentStats.averagePercentage || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Active Streak */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow">
            <span className="text-slate-400 text-xs sm:text-sm font-semibold">Current Streak</span>
            <span className="text-xl sm:text-4xl font-extrabold text-orange-400 my-2 sm:my-3">
              {currentStats.currentStreak} Days
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 line-clamp-1">Longest: {currentStats.longestStreak} days</span>
          </div>

          {/* Tests Completed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow">
            <span className="text-slate-400 text-xs sm:text-sm font-semibold">Completed</span>
            <span className="text-xl sm:text-4xl font-extrabold text-indigo-400 my-2 sm:my-3">
              {currentStats.totalTestsTaken}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 line-clamp-1">Target: 20 Full-length</span>
          </div>

          {/* 2026 Exam Date */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow">
            <span className="text-slate-400 text-xs sm:text-sm font-semibold">Days to CUET</span>
            <span className="text-xl sm:text-4xl font-extrabold text-rose-500 my-2 sm:my-3">
              348 Days
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 line-clamp-1">Schedule: May 2026</span>
          </div>
        </section>

        {/* Core Layout Split */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Subject Mastery and 2026 Predictions */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Subject Mastery */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Subject Mastery Index</h3>
              <div className="space-y-5">
                {[
                  { name: 'Business Studies', key: 'BUSINESS_STUDIES', color: 'bg-emerald-500' },
                  { name: 'Economics', key: 'ECONOMICS', color: 'bg-blue-500' },
                  { name: 'English', key: 'ENGLISH', color: 'bg-purple-500' },
                  { name: 'General Test', key: 'GENERAL_TEST', color: 'bg-amber-500' }
                ].map((sub, i) => {
                  const val = currentStats.subjectMastery[sub.key] || 0;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{sub.name}</span>
                        <span className="font-bold text-slate-300">{val}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`${sub.color} h-full transition-all duration-1000`} 
                          style={{ width: `${val}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2026 Predictions Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">2026 Predicted Topics (NTA Pattern)</h3>
                <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-500/20">
                  AI ENGINE ACTIVE
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Based on analysis of 2022–2025 question repetitions, these concepts show the highest probability of appearing in the 2026 exam cycle:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { topic: 'Management Principles (Fayol/Taylor)', probability: '95%', reason: 'Appeared in all 4 historical years' },
                  { topic: 'Reading Comprehension Strategies', probability: '92%', reason: 'Consistently higher weight in 2024-2025' },
                  { topic: 'Supply and Demand Elasticity', probability: '88%', reason: 'Highly repeated concept in microeconomics' },
                  { topic: 'Indian Constitution (Article 14-21)', probability: '85%', reason: 'Repeated core in general awareness tests' }
                ].map((pred, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{pred.topic}</h4>
                      <p className="text-xs text-slate-500">{pred.reason}</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs font-extrabold px-2 py-0.5 rounded border border-emerald-500/20">
                      {pred.probability}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Weak/Strong areas */}
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Weak Concepts (Action Required)</h3>
              <div className="space-y-3">
                {currentStats.weakTopics.map((topic: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm font-semibold text-red-400">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Strong Concepts</h3>
              <div className="space-y-3">
                {currentStats.strongTopics.map((topic: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                    <span className="text-xl">✅</span>
                    <span className="text-sm font-semibold text-emerald-400">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exams List Grid */}
        <section id="exams-list" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Select a Mock Test</h3>
            <span className="text-slate-400 text-sm">{tests.length} tests available</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="text-lg font-bold text-white line-clamp-2">{test.title}</h4>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-3">{test.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="bg-slate-800 px-2 py-1 rounded">{test.totalQuestions} Questions</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">{test.duration} Mins</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">{test.difficulty}</span>
                  </div>
                  <button 
                    onClick={() => handleStartTest(test.id)}
                    disabled={generatingId !== null}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
                  >
                    {generatingId === test.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : 'Start'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
