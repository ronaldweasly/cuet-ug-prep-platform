import { NextResponse } from 'next/server'
import { LocalDb } from '@/lib/db'
import { runSeed } from '@/lib/seedData'

export async function GET() {
  const db = LocalDb.read();
  let seeded = false;
  
  if (!db.questions || db.questions.length === 0) {
    runSeed();
    seeded = true;
  }
  
  const currentDb = LocalDb.read();
  
  return NextResponse.json({
    status: 'ok',
    seeded,
    totalQuestions: currentDb.questions ? currentDb.questions.length : 0,
    totalTests: currentDb.tests ? currentDb.tests.length : 0,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  })
}
