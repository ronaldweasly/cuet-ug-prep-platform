import fs from 'fs';
import path from 'path';
import { Question, Test, TestAttempt, UserStats, Subject, Difficulty, QuestionType, TestType } from '../types';

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'cuet_db.json');

interface Schema {
  questions: Question[];
  tests: Test[];
  attempts: TestAttempt[];
  stats: UserStats;
}

const DEFAULT_STATS: UserStats = {
  userId: 'default_student',
  totalTestsTaken: 0,
  averageScore: 0,
  averagePercentage: 0,
  subjectMastery: {
    [Subject.BUSINESS_STUDIES]: 0,
    [Subject.ECONOMICS]: 0,
    [Subject.ENGLISH]: 0,
    [Subject.GENERAL_TEST]: 0,
  },
  weakTopics: [],
  strongTopics: [],
  currentStreak: 1,
  longestStreak: 1,
};

export class LocalDb {
  private static cache: Schema | null = null;

  private static ensureDbExists() {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initialSchema: Schema = {
        questions: [],
        tests: [],
        attempts: [],
        stats: DEFAULT_STATS,
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialSchema, null, 2), 'utf-8');
      this.cache = initialSchema;
    }
  }

  static read(): Schema {
    if (this.cache) {
      return this.cache;
    }
    this.ensureDbExists();
    try {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      this.cache = JSON.parse(content) as Schema;
      return this.cache;
    } catch (e) {
      console.error('Failed to read Local DB:', e);
      return { questions: [], tests: [], attempts: [], stats: DEFAULT_STATS };
    }
  }

  static write(data: Schema): boolean {
    this.cache = data;
    this.ensureDbExists();
    try {
      // Background async write to eliminate event-loop block latency
      fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8', (err) => {
        if (err) {
          console.error('Failed to write to Local DB in background:', err);
        }
      });
      return true;
    } catch (e) {
      console.error('Failed to start writing to Local DB:', e);
      return false;
    }
  }

  // QUESTIONS
  static getQuestions(): Question[] {
    return this.read().questions;
  }

  static getQuestionsBySubject(subject: Subject): Question[] {
    return this.getQuestions().filter(q => q.subject === subject);
  }

  // TESTS
  static getTests(): Test[] {
    return this.read().tests;
  }

  static getTestById(id: string): Test | undefined {
    const data = this.read();
    const test = data.tests.find(t => t.id === id);
    if (!test) return undefined;
    // Hydrate questions
    const hydratedQuestions = test.questions.map(q => {
      const fullQ = data.questions.find(full => full.id === q.id);
      return fullQ || q;
    });
    return { ...test, questions: hydratedQuestions };
  }

  // ATTEMPTS & STATS ENGINE
  static getAttempts(): TestAttempt[] {
    return this.read().attempts;
  }

  static getAttemptById(id: string): TestAttempt | undefined {
    return this.getAttempts().find(a => a.id === id);
  }

  static saveAttempt(attempt: TestAttempt): UserStats {
    const db = this.read();
    
    // Add attempt
    db.attempts.push(attempt);
    
    // Update aggregate stats
    const stats = db.stats;
    stats.totalTestsTaken = db.attempts.length;
    
    const percentage = attempt.percentage || 0;
    const totalPercentage = db.attempts.reduce((sum, a) => sum + (a.percentage || 0), 0);
    stats.averagePercentage = Math.round(totalPercentage / db.attempts.length);
    stats.averageScore = Math.round(db.attempts.reduce((sum, a) => sum + (a.obtainedMarks || 0), 0) / db.attempts.length);
    
    if (!stats.bestScore || percentage > (stats.bestScore || 0)) {
      stats.bestScore = percentage;
    }

    // Streaks calculation (simulated progressive check)
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }

    // Recalculate Subject Mastery based on attempts
    const attemptsBySubject: Record<Subject, number[]> = {
      [Subject.BUSINESS_STUDIES]: [],
      [Subject.ECONOMICS]: [],
      [Subject.ENGLISH]: [],
      [Subject.GENERAL_TEST]: [],
    };

    // Create fast lookup maps to bypass O(N) nested loop complexity
    const testsMap = new Map(db.tests.map(t => [t.id, t]));
    const questionsMap = new Map(db.questions.map(q => [q.id, q]));

    db.attempts.forEach(a => {
      const test = testsMap.get(a.testId);
      if (test && test.subjects && test.subjects.length > 0) {
        test.subjects.forEach(sub => {
          attemptsBySubject[sub].push(a.percentage || 0);
        });
      }
    });

    Object.keys(attemptsBySubject).forEach(key => {
      const sub = key as Subject;
      const scores = attemptsBySubject[sub];
      if (scores.length > 0) {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        stats.subjectMastery[sub] = Math.round(avg);
      } else {
        // Seeding baseline if no attempt but some default questions
        stats.subjectMastery[sub] = percentage > 0 ? Math.round(percentage * 0.8) : 40;
      }
    });

    // Dynamic Strong/Weak topics calculations
    const topicsMap: Record<string, { correct: number, total: number }> = {};
    db.attempts.forEach(a => {
      a.answers.forEach(ans => {
        const q = questionsMap.get(ans.questionId);
        if (q && q.topic) {
          if (!topicsMap[q.topic]) {
            topicsMap[q.topic] = { correct: 0, total: 0 };
          }
          topicsMap[q.topic].total += 1;
          if (ans.isCorrect) {
            topicsMap[q.topic].correct += 1;
          }
        }
      });
    });

    const weak: string[] = [];
    const strong: string[] = [];
    
    Object.keys(topicsMap).forEach(topic => {
      const data = topicsMap[topic];
      const accuracy = (data.correct / data.total) * 100;
      if (accuracy >= 75) {
        strong.push(topic);
      } else if (accuracy < 50) {
        weak.push(topic);
      }
    });

    stats.weakTopics = weak.slice(0, 5);
    stats.strongTopics = strong.slice(0, 5);

    // Default mappings if empty
    if (stats.weakTopics.length === 0) {
      stats.weakTopics = ['National Income Accounting', 'Cloze Test Exercises'];
    }
    if (stats.strongTopics.length === 0) {
      stats.strongTopics = ['Management Principles', 'Reading Comprehension Strategies'];
    }

    db.stats = stats;
    this.write(db);
    return stats;
  }

  static getStats(): UserStats {
    return this.read().stats;
  }
}
