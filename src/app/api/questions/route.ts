import { NextRequest, NextResponse } from 'next/server';
import { LocalDb } from '@/lib/db';
import { Subject } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const subject = request.nextUrl.searchParams.get('subject');
    let questions = LocalDb.getQuestions();

    if (subject) {
      questions = questions.filter(
        q => q.subject.toLowerCase() === subject.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions: ' + String(error) },
      { status: 500 }
    );
  }
}
