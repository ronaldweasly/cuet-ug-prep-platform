# PHASE 5: ANALYTICS SYSTEM

## Overview

Provide detailed performance insights after each exam with predictive CUET scoring.

## Analytics Architecture

```
┌─────────────────────────────────────────┐
│      Test Submission                    │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Data Collection │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌──────────┐
│ Answers│  │ Timing │  │ Accuracy │
└────────┘  └────────┘  └──────────┘
    │            │            │
    └────────────┼────────────┘
                 │
        ┌────────▼────────┐
        │ Aggregation &   │
        │ Calculation     │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Subject  │ │Difficulty│ │ Timing   │
│ Analysis │ │ Analysis │ │ Analysis │
└──────────┘ └──────────┘ └──────────┘
    │            │            │
    └────────────┼────────────┘
                 │
        ┌────────▼──────────┐
        │ Percentile &      │
        │ Prediction Engine │
        └────────┬──────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Analytics      │
        │ Dashboard      │
        └────────────────┘
```

## Analytics Dashboard

### 1. Score & Performance Section

```
┌─────────────────────────────────────────┐
│  Score Breakdown                        │
├─────────────────────────────────────────┤
│  Total Score: 92/120                    │
│  Percentage: 76.7%                      │
│  Estimated Percentile: 94.5%            │
│  Estimated CUET Score: 562/600          │
│                                         │
│  Business Studies:   28/30   (93%)      │
│  Economics:          22/30   (73%)      │
│  English:            25/30   (83%)      │
│  General Test:       17/30   (57%)      │
└─────────────────────────────────────────┘
```

### 2. Time Analysis

```
┌─────────────────────────────────────────┐
│  Time Management                        │
├─────────────────────────────────────────┤
│  Total Time Used: 178 minutes           │
│  Remaining: 2 minutes                   │
│                                         │
│  Average Time/Question: 88 seconds      │
│                                         │
│  Business Studies:   89s/q  (Good ✓)    │
│  Economics:          92s/q  (OK)        │
│  English:           85s/q  (Excellent ✓)│
│  General Test:      86s/q  (Excellent ✓)│
│                                         │
│  Ideal Time/Question: 90 seconds        │
└─────────────────────────────────────────┘
```

### 3. Accuracy Analysis

```
┌─────────────────────────────────────────┐
│  Accuracy Trends                        │
├─────────────────────────────────────────┤
│                                         │
│  Correct:   92 (76.7%)  ████████░       │
│  Incorrect: 28 (23.3%)  ██░             │
│  Skipped:    0 (0%)                     │
│                                         │
│  Attempted: 120/120 (100%)              │
└─────────────────────────────────────────┘
```

### 4. Difficulty Analysis

```
┌──────────────────────────────────────────┐
│  Performance by Difficulty               │
├──────────────────────────────────────────┤
│                                          │
│  Easy    (40 questions):   39/40 (97%)   │
│  Medium  (50 questions):   39/50 (78%)   │
│  Hard    (30 questions):   14/30 (47%)   │
│                                          │
│  Strength: Easy level ✓                  │
│  Weakness: Hard difficulty ✗              │
└──────────────────────────────────────────┘
```

### 5. Subject Mastery

```
┌──────────────────────────────────────────┐
│  Subject-wise Performance                │
├──────────────────────────────────────────┤
│                                          │
│  Business Studies        93%             │
│  ████████████████████░   (Excellent)     │
│                                          │
│  Economics              73%              │
│  ███████████░          (Good)            │
│                                          │
│  English                83%              │
│  ████████████████░     (Very Good)       │
│                                          │
│  General Test           57%              │
│  ███████░              (Needs Work)      │
└──────────────────────────────────────────┘
```

### 6. Weak & Strong Topics

```
┌──────────────────────────────────────────┐
│  Topic Analysis                          │
├──────────────────────────────────────────┤
│                                          │
│  Top Strengths:                          │
│  • Financial Management    (18/18 = 100%)│
│  • Balance Sheet Analysis  (15/15 = 100%)│
│  • Business Ethics         (14/15 = 93%) │
│                                          │
│  Areas for Improvement:                  │
│  • Quantitative Reasoning  (3/10 = 30%) │
│  • Logical Reasoning       (5/12 = 42%) │
│  • Reading Comprehension   (8/15 = 53%) │
└──────────────────────────────────────────┘
```

## Prediction Engine

### CUET Score Prediction

Based on multiple factors:

```typescript
function predictCUETScore(analytics: TestAnalytics): {
  estimatedScore: number
  scoreRange: [number, number]
  percentile: number
  confidence: number
} {
  const factors = {
    correctAnswers: analytics.correct / analytics.total,
    timeEfficiency: calculateTimeEfficiency(analytics),
    difficultyWeighting: calculateDifficultyWeighting(analytics),
    subjectBalance: calculateSubjectBalance(analytics),
    improvementTrend: calculateTrendFromHistory(analytics),
  }
  
  // Weighted calculation
  const baseScore = factors.correctAnswers * 600
  const adjustedScore = applyAdjustments(baseScore, factors)
  
  // Calculate percentile based on historical data
  const percentile = calculatePercentile(adjustedScore)
  
  // Confidence based on sample size
  const confidence = calculateConfidence(testAttemptCount)
  
  return {
    estimatedScore: Math.round(adjustedScore),
    scoreRange: [adjustedScore - 20, adjustedScore + 20],
    percentile,
    confidence,
  }
}
```

### Percentile Calculation

```
Percentile = (Number of students with lower score / Total students) × 100

Estimated using:
- Previous test patterns
- Subject-wise performance
- Difficulty level performance
- Time management efficiency
```

## Comparison Features

### vs Previous Tests

```
┌──────────────────────────────────────────┐
│  Progress Comparison                     │
├──────────────────────────────────────────┤
│                                          │
│           Test 1    Test 2    Test 3     │
│  Score:    68/120   75/120   92/120     │
│  Trend:    ↑ +7     ↑ +17                │
│                                          │
│  Your improvement: +41.2% over 3 tests  │
│  Expected score in 10 tests: 105/120    │
│  Projected CUET Percentile: 96.2%       │
└──────────────────────────────────────────┘
```

### vs Category Average

```
TypeScript
function compareWithCategoryAverage(
  yourScore: number,
  difficulty: Difficulty
): ComparisonData {
  const categoryAverage = getAverageScore(difficulty)
  const percentileBetter = calculatePercentageAboveAverage(yourScore, categoryAverage)
  
  return {
    yourScore,
    categoryAverage,
    difference: yourScore - categoryAverage,
    percentileBetter,
    status: yourScore > categoryAverage ? 'Better' : 'Needs Work'
  }
}
```

## Recommendations Engine

### Personalized Study Suggestions

```
Based on your performance:

1. IMMEDIATE FOCUS (Next 1-2 days)
   - Quantitative Reasoning: 30% accuracy
   - Start with basic concepts
   - Recommended: 20 practice questions
   - Time allocation: 2 hours daily

2. MEDIUM TERM (Next 1-2 weeks)
   - Logical Reasoning: 42% accuracy
   - Move to intermediate problems
   - Recommended: 30 practice questions
   - Complete: 2 full mock tests

3. LONG TERM (Next month)
   - Reading Comprehension: 53% accuracy
   - Practice diverse passages  
   - Recommended: 50 passages
   - Time limit: Strictly maintain timing
```

### AI-Generated Insights

```
Machine Learning analysis suggests:
- Your General Test performance is below average
- This is your weakest subject (57%)
- Typical students improve General Test by 15%
  in 2 weeks with focused practice
  
Recommended action:
- Increase General Test practice: 2X current volume
- Focus on: Logical Reasoning + Quantitative
- Expected improvement: +10%
```

## Analytics APIs

```
GET /api/analytics/:attemptId
  - Full analytics report

GET /api/analytics/trending
  - Progress over time

GET /api/analytics/subject/:subject
  - Subject-specific analysis

GET /api/analytics/weak-topics
  - Topics needing improvement

GET /api/analytics/predictions
  - Score and percentile predictions

GET /api/analytics/comparison
  - Compare with peers (anonymized)
```

## Database Schema Updates

```prisma
model TestAnalytics {
  // Core calculations
  totalQuestions Int
  attempted Int
  correct Int
  incorrect Int
  skipped Int
  
  // Time metrics
  averageTime Float // seconds per question
  timeDistribution Json // detailed breakdown
  correctAnswerTime Float // avg time for correct
  incorrectAnswerTime Float // avg time for wrong
  
  // Subject performance
  subjectScores Json // {subject: percentage}
  subjectAccuracy Json
  subjectTiming Json
  
  // Difficulty analysis
  difficultyScores Json // {difficulty: percentage}
  
  // Predictions
  estimatedPercentile Float?
  estimatedScore Float?
  confidence Float? // 0-1
  
  // Comparisons
  categoryAverage Float?
  percentileBetter Float?
  
  // Historical
  improvementTrend Float? // % change from previous
  careerBest Float?
}
```

## Visualization Components

1. **Line Charts**: Score trends over multiple tests
2. **Bar Charts**: Subject-wise performance
3. **Pie Charts**: Time distribution
4. **Gauge Charts**: Accuracy and percentile
5. **Heatmaps**: Weak topics identification
6. **Comparison Charts**: Your vs average

## Performance Optimization

- Cache analytics for 24 hours
- Background calculation for predictions
- Real-time updates for basic stats
- Batch process historical comparisons

## Success Metrics

- ✓ Instant score calculation (< 2 seconds)
- ✓ Accurate percentile within ±5%
- ✓ Predictions within ±30 marks
- ✓ Mobile responsive dashboard
- ✓ All metrics calculated and displayed
- ✓ Trend analysis available after 3 tests

---

**Timeline**: 4-5 days
**Complexity**: Medium-High
**Dependencies**: Phase 4 (Exam Engine)
