# PHASE 4: EXAM ENGINE

## Overview

Build a fully-featured CUET-compliant exam taking system with 20 realistic full-length tests.

## System Architecture

```
├── Test Configuration
│   ├── Subject selection (1-4 subjects)
│   ├── Time allocation per subject
│   ├── Question randomization
│   └── Review mode settings
├── Exam Interface
│   ├── Question display (fullscreen capable)
│   ├── Option selection (keyboard + mouse)
│   ├── Timer (per section + total)
│   ├── Question palette
│   ├── Mark for review
│   └── Previous/Next navigation
├── State Management
│   ├── Question answers
│   ├── Time tracking
│   ├── Session persistence
│   └── Auto-save (every 5 seconds)
├── Submission & Validation
│   ├── Submit confirmation
│   ├── Anti-accidental exit handling
│   ├── Answer validation
│   └── Score calculation
└── Results Display
    ├── Score breakdown by subject
    ├── Time analysis
    ├── Accuracy metrics
    └── Performance comparison
```

## 20 Full-Length Test Suite

### Test Distribution

```
Business Studies Tests:
- 5√ Level tests (0-20%)
- M Medium tests (50-65%)
- 5 Hard tests (70-95%)
Total: 5 tests

Economics Tests:
- 5 Level tests (0-20%)
- 5 Medium tests (50-65%)
- 5 Hard tests (70-95%)
Total: 5 tests

English Tests:
- 5 Level tests (0-20%)
- 5 Medium tests (50-65%)
- 5 Hard tests (70-95%)
Total: 5 tests

General Test:
- 5 Level tests (0-20%)
- 5 Medium tests (50-65%)
- 5 Hard tests (70-95%)
Total: 5 tests

GRAND TOTAL: 20 full-length exams
```

### Test Specifications

**Each test MUST match CUET pattern:**

| Aspect | Details |
|--------|---------|
| Duration | 180 minutes (3 hours) |
| Questions | 120 MCQ (30 per section) |
| Sections | 4 (one per subject) |
| Marks | 120 total (1 per question) |
| Negative Marking | None (CUET 2024 pattern) |
| Language | English |
| Difficulty Mix | Easy: 30%, Medium: 40%, Hard: 30% |

### Question Generation Logic

```typescript
function generateTestQuestions(
  subject: Subject,
  difficulty: Difficulty,
  testNumber: number
): Question[] {
  const questionBank = getAllQuestionsBySubject(subject);
  
  // Filter by difficulty
  const filtered = questionBank.filter(
    q => q.difficulty === difficulty
  );
  
  // Select 30 random, unique questions
  const selected = selectRandom(filtered, 30);
  
  // Validate no duplicates in test
  validateNoDuplicates(selected);
  
  return selected;
}
```

## Frontend Components

### 1. Exam Start Screen
- Select test subject
- Choose difficulty
- Review instructions
- Start exam button
- Previous attempts (if available)

### 2. Fullscreen Exam Interface
```
┌─────────────────────────────────────────┐
│  [Q] Timer: 2:45:30  | Attempted: 85/120  │
├─────────────────┬───────────────────────┤
│ Question Palet  │ Question: 45/120      │
├────────────┬────┼──────────────────────┤
│ ? ? ? ? ?  │    │ What is the...       │
│ ✓ ✓ ✓ ✓    │    │                      │
│ ✗ ✗ ✗ ✗    │    │ A) Option A          │
│ § § § §    │    │ B) Option B          │
│            │    │ C) Option C          │
│ [Review]   │    │ D) Option D          │
│            │    │                      │
│ [Mark]     │    │ [Previous]  [Next]   │
└────────────┴────┴──────────────────────┘
```

Legend:
- `?` = Not attempted
- `✓` = Answered correctly
- `✗` = Answered incorrectly  
- `§` = Marked for review

### 3. Question Palette
- Grid showing all 120 questions
- Color coding (attempted, marked, skipped)
- Jump to any question
- Quick overview of progress

### 4. Timer Component
- Total time remaining
- Per-section time (if applicable)
- Warning at 10 minutes
- Critical warning at 1 minute
- Auto-submit at 0:00

### 5. Submit Confirmation
- Summary of answers
- WARNING if trying to exit
- "Are you sure?" dialog
- Option to resume

## Implementation Details

### State Management (with Zustand)

```typescript
interface ExamStore {
  // Test data
  currentTest: Test
  selectedAnswers: Map<string, string>
  markedQuestions: Set<string>
  
  // Timing
  startTime: Date
  timeRemaining: number
  
  // Status
  isStarted: boolean
  isSubmitted: boolean
  
  // Actions
  selectAnswer(questionId: string, option: string): void
  markForReview(questionId: string): void
  navigateToQuestion(questionId: string): void
  submitTest(): void
}
```

### Auto-Save Mechanism

```typescript
// Save every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    saveExamState({
      selectedAnswers: store.selectedAnswers,
      markedQuestions: store.markedQuestions,
      timeSpent: calculateTimeSpent(),
    })
  }, 5000)
  
  return () => clearInterval(interval)
}, [])
```

### Score Calculation

```typescript
function calculateScore(answers: Map<string, string>, test: Test): {
  totalMarks: number
  obtainedMarks: number
  percentage: number
  breakdown: Record<Subject, number>
} {
  let correct = 0
  const subjectScores: Record<Subject, number> = {}
  
  for (const [questionId, selectedOption] of answers) {
    const question = test.questions.find(q => q.id === questionId)
    if (!question) continue
    
    if (selectedOption === question.correctAnswer) {
      correct++
    }
  }
  
  // Calculate subject-wise breakdown
  for (const subject of test.subjects) {
    const subjectQuestions = test.questions.filter(q => q.subject === subject)
    const subjectCorrect = subjectQuestions.filter(q => 
      answers.get(q.id) === q.correctAnswer
    ).length
    subjectScores[subject] = (subjectCorrect / subjectQuestions.length) * 100
  }
  
  return {
    totalMarks: test.totalQuestions,
    obtainedMarks: correct,
    percentage: (correct / test.totalQuestions) * 100,
    breakdown: subjectScores,
  }
}
```

## Mobile Responsiveness

- Full-screen exam on mobile
- Swipe navigation between questions
- Bottom question palette (drawer)
- Large tap targets
- Fixed timer at top
- Responsive option buttons

## Security & Proctoring

### Basic Security
- Fullscreen mode enforcement
- Window focus detection
- Copy-paste prevention
- Developer tools blocking (in production)

### Session Management
- Unique exam session ID
- Timeout after inactivity (30 mins)
- Can't restart once submitted
- Unique question sets per student

### Data Integrity
- Server-side validation
- Time tracking validation
- Answer hash verification
- Submission logs

## Database Schema (API)

```sql
-- Store exam attempts
INSERT INTO test_attempts (
  userId, testId, startedAt, submittedAt, 
  totalMarks, obtainedMarks, percentage
) VALUES (...)

-- Store individual answers
INSERT INTO user_answers (
  attemptId, questionId, selectedOption, 
  isCorrect, timeSpent, marked, reviewed
) VALUES (...)
```

## APIs Required

```
POST /api/exams/start
  - Start new exam session
  - Generate unique session ID

GET /api/exams/:testId
  - Get test questions and metadata

POST /api/exams/:sessionId/answer
  - Submit an answer
  - Auto-save checkpoint

PUT /api/exams/:sessionId/mark
  - Mark question for review

POST /api/exams/:sessionId/submit
  - Submit exam
  - Calculate score

GET /api/exams/:attemptId/results
  - Retrieve results and analytics
```

## Testing Strategy

1. **Unit Tests**
   - Score calculation
   - Time tracking
   - Answer validation

2. **Integration Tests**
   - Full exam flow
   - API endpoints
   - Database persistence

3. **E2E Tests**
   - Complete exam taking
   - Timer accuracy
   - Result generation

4. **Performance Tests**
   - 120 questions load time < 2s
   - Answer submission < 500ms
   - Analytics generation < 1s

## Success Metrics

- ✓ All 20 tests generated
- ✓ Accurate score calculation
- ✓ No exam data loss
- ✓ < 100ms answer submission
- ✓ Timer accuracy ±1 second
- ✓ Mobile responsive
- ✓ All CUET patterns matched

---

**Timeline**: 5-7 days for complete implementation
**Team**: 2-3 developers
**Tests Needed**: 20 full exams × 120 questions = 2,400 test questions
