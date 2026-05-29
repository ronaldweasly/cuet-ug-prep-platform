// CUET Types & Interfaces

export enum Subject {
  BUSINESS_STUDIES = 'BUSINESS_STUDIES',
  ECONOMICS = 'ECONOMICS',
  ENGLISH = 'ENGLISH',
  GENERAL_TEST = 'GENERAL_TEST',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  READING_COMPREHENSION = 'READING_COMPREHENSION',
  NUMERICAL = 'NUMERICAL',
  ASSERTION_REASON = 'ASSERTION_REASON',
  FILL_BLANKS = 'FILL_BLANKS',
  MATCHING = 'MATCHING',
}

export enum TestType {
  FULL_LENGTH = 'FULL_LENGTH',
  SECTION = 'SECTION',
  CHAPTER_WISE = 'CHAPTER_WISE',
  MOCK = 'MOCK',
  PRACTICE = 'PRACTICE',
}

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
}

export enum TestResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export interface QuestionOption {
  key: string // A, B, C, D
  text: string
}

export interface Question {
  id: string
  subject: Subject
  chapter?: string
  topic?: string
  questionText: string
  options: QuestionOption[]
  correctAnswer: string
  explanation?: string
  year: number
  source: string
  difficulty: Difficulty
  questionType: QuestionType
  isPYQ: boolean
  pageNumber?: number
  tags?: string[]
  createdAt?: Date
}

export interface Test {
  id: string
  title: string
  description?: string
  subjects: Subject[]
  totalQuestions: number
  duration: number // minutes
  passingScore: number // percentage
  testType: TestType
  difficulty: Difficulty
  isPublished: boolean
  questions: Question[]
  createdAt?: Date
}

export interface TestAttempt {
  id: string
  userId: string
  testId: string
  answers: UserAnswer[]
  startedAt: Date
  submittedAt?: Date
  totalMarks?: number
  obtainedMarks?: number
  percentage?: number
  duration?: number // seconds
  isComplete: boolean
}

export interface UserAnswer {
  questionId: string
  selectedOption?: string // A, B, C, D
  isCorrect?: boolean
  timeSpent: number // seconds
  marked: boolean
  reviewed: boolean
}

export interface TestAnalytics {
  attemptId: string
  totalQuestions: number
  attempted: number
  correct: number
  incorrect: number
  skipped: number
  averageTime: number
  subjectScores: Record<Subject, number>
  difficultyScores: Record<Difficulty, number>
  estimatedPercentile?: number
  estimatedScore?: number
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  createdAt: Date
  lastLoginAt?: Date
}

export interface UserStats {
  userId: string
  totalTestsTaken: number
  averageScore: number
  averagePercentage: number
  bestScore?: number
  subjectMastery: Record<Subject, number>
  weakTopics: string[]
  strongTopics: string[]
  currentStreak: number
  longestStreak: number
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
