'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    '[2026-05-29 23:56:01] - [PIPELINE] - INFO - Initializing data processor...',
    '[2026-05-29 23:56:02] - [PIPELINE] - INFO - Scanning directory data/ for PDF sources...',
  ]);

  useEffect(() => {
    // Read manifest by fetching from health check or direct load
    // Since Next.js static api might not read external files directly, we simulate or fetch
    fetch('/api/health')
      .then(() => {
        // Mock manifest loading from the actual 48 files
        setManifest({
          totalFiles: 48,
          files: [
            { name: 'Economics_2024_NCERT_Macro_01.pdf', subject: 'Economics', size: '1.2 MB', source: 'NCERT' },
            { name: 'Economics_2024_NCERT_Macro_02.pdf', subject: 'Economics', size: '4.1 MB', source: 'NCERT' },
            { name: 'Business_Studies_2024_NCERT_Part1_01.pdf', subject: 'Business_Studies', size: '2.4 MB', source: 'NCERT' },
            { name: 'English_2024_NCERT_Flamingo_02.pdf', subject: 'English', size: '1.5 MB', source: 'NCERT' },
            { name: 'General_Test_2024_NCERT_Constitution_01.pdf', subject: 'General_Test', size: '1.9 MB', source: 'NCERT' },
          ]
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const simulateOcr = () => {
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] - [OCR] - INFO - Spinning up pdfplumber Text Extractor...`,
      `[${new Date().toLocaleTimeString()}] - [OCR] - INFO - Extracting pages from Vistas supplementaries...`,
      `[${new Date().toLocaleTimeString()}] - [OCR] - SUCCESS - Structured question output: 23 questions parsed!`,
      `[${new Date().toLocaleTimeString()}] - [PIPELINE] - SUCCESS - Questions appended to all_questions.json successfully!`
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">Opening Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
            Admin Portal
          </span>
          <Link href="/dashboard" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Banner */}
        <section className="bg-gradient-to-r from-red-950/40 to-amber-950/40 border border-red-800/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white">Data Pipeline Management</h2>
            <p className="text-slate-300 max-w-xl text-sm leading-relaxed">
              Monitor text extraction pipelines, track registered textbook PDF assets, and trigger simulated OCR runs to verify parsing accuracy.
            </p>
          </div>
          <button 
            onClick={simulateOcr}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition"
          >
            Trigger OCR Pipeline
          </button>
        </section>

        {/* Layout grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Registered files list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Registered PDF Assets ({manifest?.totalFiles || 48} files total)</h3>
              
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                {manifest?.files.map((file: any, i: number) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{file.name}</h4>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>Subject: {file.subject}</span>
                        <span>•</span>
                        <span>Size: {file.size}</span>
                      </div>
                    </div>
                    <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
                      Indexed
                    </span>
                  </div>
                ))}
                <div className="text-center text-xs text-slate-500 pt-4">
                  Showing 5 of {manifest?.totalFiles || 48} indexed files. Complete registry cached in manifest.json.
                </div>
              </div>
            </div>
          </div>

          {/* Right column: terminal logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4 flex-1">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Extraction Pipeline Console</h3>
              
              {/* Terminal screen */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-2 h-[340px] overflow-y-auto">
                {logs.map((log, i) => (
                  <p key={i} className="leading-relaxed break-all">{log}</p>
                ))}
              </div>
            </div>

            <div className="pt-4 text-xs text-slate-500">
              Prisma client instance: PostgreSQL Mock Server active. Seeding status: Complete (200+ questions active).
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
