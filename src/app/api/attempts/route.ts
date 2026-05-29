import { NextRequest, NextResponse } from 'next/server';
import { LocalDb } from '@/lib/db';
import { TestAttempt, UserAnswer, TestResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const attempt = LocalDb.getAttemptById(id);
      if (!attempt) {
        return NextResponse.json(
          { success: false, error: 'Attempt not found' },
          { status: 404 }
        );
      }
      
      const test = LocalDb.getTestById(attempt.testId);
      let correct = 0;
      let incorrect = 0;
      let skipped = 0;
      
      attempt.answers.forEach(a => {
        if (a.selectedOption === null || a.selectedOption === undefined) {
          skipped++;
        } else if (a.isCorrect) {
          correct++;
        } else {
          incorrect++;
        }
      });
      
      const percentage = attempt.percentage || 0;
      let estimatedPercentile = 50;
      if (percentage >= 95) estimatedPercentile = 99.8;
      else if (percentage >= 85) estimatedPercentile = 97.5;
      else if (percentage >= 70) estimatedPercentile = 91.0;
      else if (percentage >= 50) estimatedPercentile = 78.4;
      else estimatedPercentile = Math.max(10, Math.round(percentage * 1.2));
      
      const result = percentage >= (test?.passingScore || 50) ? 'PASS' : 'FAIL';
      
      return NextResponse.json({
        success: true,
        data: {
          attempt,
          analytics: {
            totalQuestions: test?.questions.length || attempt.answers.length,
            attempted: correct + incorrect,
            correct,
            incorrect,
            skipped,
            averageTime: Math.round((attempt.duration || 120) / attempt.answers.length),
            estimatedPercentile,
            result
          }
        }
      });
    }

    const attempts = LocalDb.getAttempts();
    return NextResponse.json({ success: true, data: attempts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attempts: ' + String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, answers, duration } = body as { testId: string; answers: Array<{ questionId: string; selectedOption?: string; timeSpent: number }>; duration: number };

    if (!testId || !answers) {
      return NextResponse.json(
        { success: false, error: 'testId and answers are required' },
        { status: 400 }
      );
    }

    const test = LocalDb.getTestById(testId);
    const dbQuestions = LocalDb.getQuestions();

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // CUET standard scoring: +5 marks for correct, -1 mark for incorrect, 0 for skipped/unattempted
    let obtainedMarks = 0;
    let totalMarks = test.questions.length * 5;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const gradedAnswers: UserAnswer[] = test.questions.map(testQ => {
      const submitted = answers.find(ans => ans.questionId === testQ.id);
      const fullQ = dbQuestions.find(q => q.id === testQ.id);
      const correctAnswer = fullQ ? fullQ.correctAnswer : 'A';
      
      const selectedOption = submitted?.selectedOption || undefined;
      const timeSpent = submitted?.timeSpent || 0;

      let isCorrect: boolean | undefined = undefined;

      if (!selectedOption) {
        skippedCount++;
      } else {
        isCorrect = selectedOption === correctAnswer;
        if (isCorrect) {
          correctCount++;
          obtainedMarks += 5;
        } else {
          incorrectCount++;
          obtainedMarks -= 1; // Negative marking
        }
      }

      return {
        questionId: testQ.id,
        selectedOption,
        isCorrect,
        timeSpent,
        marked: false,
        reviewed: false
      };
    });

    const percentage = Math.max(0, Math.round((obtainedMarks / totalMarks) * 100));
    const result: TestResult = percentage >= test.passingScore ? TestResult.PASS : TestResult.FAIL;

    const attempt: TestAttempt = {
      id: `attempt_${Date.now()}`,
      userId: 'default_student',
      testId,
      answers: gradedAnswers,
      startedAt: new Date(Date.now() - duration * 1000),
      submittedAt: new Date(),
      totalMarks,
      obtainedMarks,
      percentage,
      isComplete: true
    };

    // Calculate dynamic percentile estimate (simulated bell curve)
    // 80% score -> ~95 percentile, 95%+ -> 99.9 percentile
    let estimatedPercentile = 50;
    if (percentage >= 95) {
      estimatedPercentile = 99.8;
    } else if (percentage >= 85) {
      estimatedPercentile = 97.5;
    } else if (percentage >= 70) {
      estimatedPercentile = 91.0;
    } else if (percentage >= 50) {
      estimatedPercentile = 78.4;
    } else {
      estimatedPercentile = Math.max(10, Math.round(percentage * 1.2));
    }

    // Save and update stats
    const updatedStats = LocalDb.saveAttempt(attempt);

    // Hydrate the attempt response with analytics meta
    return NextResponse.json({
      success: true,
      data: {
        attempt,
        analytics: {
          totalQuestions: test.questions.length,
          attempted: correctCount + incorrectCount,
          correct: correctCount,
          incorrect: incorrectCount,
          skipped: skippedCount,
          averageTime: Math.round(duration / test.questions.length),
          estimatedPercentile,
          result
        },
        stats: updatedStats
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process attempt: ' + String(error) },
      { status: 500 }
    );
  }
}
