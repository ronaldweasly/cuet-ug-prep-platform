/**
 * API Endpoint: Calculate prediction scores for questions
 * GET /api/predict/score?questionId=xxx
 * POST /api/predict/batch (for multiple questions)
 * GET /api/predict/exam (generate 2026-focused exam)
 */

import { NextRequest, NextResponse } from 'next/server';
import PredictiveEngine from '@/lib/predictiveEngine';
import { LocalDb } from '@/lib/db';
import { Question } from '@/types';

async function getQuestion(questionId: string): Promise<Question | null> {
  const questions = LocalDb.getQuestions();
  return questions.find(q => q.id === questionId) || null;
}

/**
 * Single question prediction
 */
export async function GET(request: NextRequest) {
  try {
    const questionId = request.nextUrl.searchParams.get('questionId');
    
    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId parameter required' },
        { status: 400 }
      );
    }

    const question = await getQuestion(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const prediction = PredictiveEngine.predictQuestionProbability(question);

    return NextResponse.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Prediction failed: ' + String(error) },
      { status: 500 }
    );
  }
}

/**
 * Batch prediction for multiple questions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionIds, threshold = 70, action } = body;

    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { error: 'questionIds array required' },
        { status: 400 }
      );
    }

    // Fetch all questions (replace with actual DB query)
    const questions = await Promise.all(
      questionIds.map((id: string) => getQuestion(id))
    );

    // Filter valid questions
    const validQuestions = questions.filter((q) => q !== null);

    if (action === 'filter') {
      // Return only high-probability questions
      const filtered = PredictiveEngine.filterHighProbabilityQuestions(
        validQuestions,
        threshold
      );

      const predictions = filtered.map((q) => ({
        question: q,
        prediction: PredictiveEngine.predictQuestionProbability(q),
      }));

      return NextResponse.json({
        success: true,
        data: {
          totalQuestions: validQuestions.length,
          highProbabilityCount: filtered.length,
          percentage: Math.round((filtered.length / validQuestions.length) * 100),
          threshold,
          predictions,
        },
      });
    } else if (action === 'rank') {
      // Return all questions ranked by probability
      const ranked = PredictiveEngine.rankQuestionsByProbability(validQuestions);

      return NextResponse.json({
        success: true,
        data: {
          totalQuestions: ranked.length,
          rankedQuestions: ranked.map((r) => ({
            questionId: r.question.id,
            score: r.prediction.predictionScore,
            confidence: r.prediction.confidence,
            reasoning: r.prediction.reasoning,
          })),
        },
      });
    } else {
      // Return all predictions with details
      const predictions = validQuestions.map((q) => ({
        question: q,
        prediction: PredictiveEngine.predictQuestionProbability(q),
      }));

      return NextResponse.json({
        success: true,
        data: predictions,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Batch prediction failed: ' + String(error) },
      { status: 500 }
    );
  }
}
