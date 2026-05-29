import { NextRequest, NextResponse } from 'next/server';
import { LocalDb } from '@/lib/db';
import { Test, Question } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const test = LocalDb.getTestById(id);
      if (!test) {
        return NextResponse.json(
          { success: false, error: 'Test not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: test });
    }

    // Filter out dynamically generated instances so the dashboard list only displays pristine templates
    const tests = LocalDb.getTests().filter(t => t.isPublished && !t.id.startsWith('gen_'));
    return NextResponse.json({ success: true, data: tests });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tests: ' + String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId } = body as { templateId: string };
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId is required' },
        { status: 400 }
      );
    }
    
    const db = LocalDb.read();
    const template = db.tests.find(t => t.id === templateId);
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template test not found' },
        { status: 404 }
      );
    }
    
    // Generate new randomized questions array matching the template subjects
    const allQuestions = db.questions;
    let selectedQuestions: Question[] = [];
    
    // Draw questions proportionally from each subject
    if (template.subjects.length > 1) {
      const questionsPerSubject = Math.ceil(template.totalQuestions / template.subjects.length);
      template.subjects.forEach(subject => {
        const subjectPool = allQuestions.filter(q => q.subject === subject);
        // Shuffle pool
        const shuffled = [...subjectPool].sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffled.slice(0, questionsPerSubject));
      });
      // Squeeze slice to ensure precise question count matching
      selectedQuestions = selectedQuestions.slice(0, template.totalQuestions);
    } else {
      const subject = template.subjects[0];
      const subjectPool = allQuestions.filter(q => q.subject === subject);
      // Shuffle pool
      const shuffled = [...subjectPool].sort(() => 0.5 - Math.random());
      selectedQuestions = shuffled.slice(0, template.totalQuestions);
    }
    
    // Make sure we have enough questions, otherwise fallback to template questions
    if (selectedQuestions.length < template.totalQuestions) {
      selectedQuestions = template.questions;
    }
    
    // Create new randomized Test instance
    const newTestId = `gen_${templateId}_${Date.now()}`;
    const newTest: Test = {
      ...template,
      id: newTestId,
      title: `${template.title} (Fresh Mock)`,
      description: `A dynamically generated custom set of questions based on NTA 2026 predictions. Generated specifically for Himani Shukla on ${new Date().toLocaleDateString()}.`,
      questions: selectedQuestions,
      isPublished: true,
      createdAt: new Date()
    };
    
    // Add dynamically generated test instance to DB
    db.tests.push(newTest);
    LocalDb.write(db);
    
    return NextResponse.json({
      success: true,
      data: {
        testId: newTestId
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate test: ' + String(error) },
      { status: 500 }
    );
  }
}
