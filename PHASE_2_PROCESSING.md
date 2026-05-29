# PHASE 2: PDF PROCESSING PIPELINE

## Overview

Automatically convert PDF papers into structured questions for the CUET platform.

**Input**: 32-40 raw PDF papers (collected in Phase 1)  
**Output**: 1,000-1,500 structured questions in database

## Architecture

```
PDF Files (data/)
    ↓
[Text Extraction] → pdfplumber & PyPDF2
    ↓
[Question Parsing] → Regex & pattern matching
    ↓
[Metadata Enrichment] → Difficulty, type, chapter detection
    ↓
[Storage] → JSON files + SQL dump
    ↓
Database (PostgreSQL + Prisma)
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- `pdfplumber`: Best text extraction
- `PyPDF2`: Fallback extraction
- `pandas`: Data processing
- `psycopg2-binary`: PostgreSQL

### 2. Environment Setup

Create `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cuet
REDIS_URL=redis://localhost:6379
```

### 3. Database Setup

```bash
# Install PostgreSQL
# Create database
createdb cuet

# Initialize Prisma
npm install @prisma/client
npx prisma generate
npx prisma migrate dev --name init

# Or using the provided schema.prisma
```

## Processing Pipeline

### Step 1: Text Extraction

The `PDFTextExtractor` class extracts text from PDFs:

```bash
python scripts/pdf_processor.py
```

**Methods**:
1. **pdfplumber**: Best for structured PDFs with clear text
2. **PyPDF2**: Fallback method if pdfplumber fails
3. **Tesseract OCR**: For scanned PDFs (requires `pytesseract`)

**Output**:
- Raw text per page
- Full PDF text combined

### Step 2: Question Detection

The `QuestionParser` identifies questions using patterns:

```python
# Detects patterns like:
# 1. Question text
# Q1) Question text
# A) Option A
# B) Option B
# etc.
```

**Extracted Data**:
- Question text
- 4 options (A, B, C, D)
- Correct answer (if available)
- Explanation (if available)

### Step 3: Enrichment

Automatically estimate:
- **Difficulty**: Based on text length & complexity
- **Question Type**: MCQ, Reading Comprehension, Assertion-Reason, etc.
- **Subject**: From folder name
- **Year**: From filename
- **Source**: From filename

### Step 4: Storage

Three output formats:

1. **JSON** (per PDF)
   ```json
   {
     "id": "NTA_2024_001",
     "subject": "Business_Studies",
     "question_text": "...",
     "options": [...],
     "correct_answer": "A",
     "year": 2024,
     "difficulty": "medium"
   }
   ```

2. **SQL Dump** (for database insert)
   ```sql
   INSERT INTO questions (...) VALUES (...);
   ```

3. **Database** (PostgreSQL with Prisma)

## Workflow

### Full Processing

```bash
python scripts/pdf_processor.py
```

This will:
1. Scan `data/` directory
2. Extract text from each PDF
3. Parse questions and options
4. Save as JSON per PDF
5. Generate `all_questions.json` (master file)
6. Generate `questions_db_dump.sql`
7. Print processing report

### Example Report Output

```
============================================================
PDF PROCESSING PIPELINE REPORT
============================================================
Files Processed: 32
Total Questions Extracted: 1,248

By Subject:
  Business_Studies: 8 files, 312 questions
  Economics: 8 files, 301 questions
  English: 8 files, 318 questions
  General_Test: 8 files, 317 questions

By Year:
  2022: 310 questions
  2023: 312 questions
  2024: 313 questions
  2025: 313 questions

============================================================
```

## Quality Assurance

### Before Production

1. **Verify Extraction Rate**
   - Target: >85% of questions extracted
   - Check for missing options

2. **Check for Duplicates**
   - Compare questions across PDFs
   - Remove if >90% similar

3. **Validate Data**
   - All questions have 4 options
   - Correct answer is A/B/C/D
   - No corrupt entries

4. **Manual Review**
   - Sample 50 random questions
   - Verify correctness
   - Check formatting

### Validation Script

```bash
python scripts/validate_questions.py
```

## Database Schema

Created in `schema.prisma`, includes:

### Core Tables

- **questions**: Main question bank
- **options**: A, B, C, D options
- **tests**: Test/exam configurations
- **test_questions**: Link between tests and questions

### User Tables

- **users**: Student accounts
- **test_attempts**: Test submissions
- **user_answers**: Individual answers
- **test_analytics**: Performance metrics

## Integration with Next.js

After processing, questions are available via:

### REST API

```
GET /api/questions/{id}
GET /api/questions?subject=BUSINESS_STUDIES&year=2024
GET /api/tests/{testId}/questions
```

### Database Query

```javascript
const questions = await prisma.question.findMany({
  where: {
    subject: 'BUSINESS_STUDIES',
    year: 2024
  }
});
```

## Performance Optimization

### For Large PDFs (100+ pages)

1. **Batch Processing**: Process in chunks
2. **Parallel Processing**: Use `multiprocessing`
3. **Caching**: Cache extracted text
4. **Indexing**: Add database indexes

### Processing Speed

- Average PDF: ~3-5 seconds
- Total (32 PDFs): ~2-3 minutes
- Database insert: ~30 seconds

## Troubleshooting

### Common Issues

1. **"No text extracted"**
   - PDF might be scanned image
   - Solution: Enable OCR in config

2. **"Questions not detected"**
   - PDF format is unusual
   - Solution: Manual review + add custom patterns

3. **"Options mismatch"**
   - Spacing/formatting issues
   - Solution: Improve regex patterns

4. **"Database connection error"**
   - PostgreSQL not running
   - Solution: Check DATABASE_URL in .env

## Next Steps

### After Phase 2

1. **Verify Question Count**: ~1,200-1,500 questions
2. **Spot Check**: Sample and validate ~50 questions
3. **Missing Data**: Fill in any missing answer keys manually
4. **Move to Phase 3**: Start Next.js platform development

## Configuration

Edit `scripts/pdf_processor.py` to customize:

```python
# File naming pattern
EXPECTED_PATTERN = r'(\w+)_(\d{4})_(\w+)_(\d+)\.pdf'

# Question detection patterns
QUESTION_PATTERNS = [...]

# Option detection patterns
OPTION_PATTERNS = [...]

# Difficulty thresholds
EASY_THRESHOLD = 100
HARD_THRESHOLD = 250
```

## Monitoring

View processing progress:

```bash
# Linux/Mac
tail -f logs/processing.log

# Windows
Get-Content logs/processing.log -Tail 10 -Wait
```

## Data Quality Metrics

After processing, check:

- ✓ Total questions extracted
- ✓ Percentage with correct answers
- ✓ Average extraction rate per PDF
- ✓ Distribution across subjects and years
- ✓ Duplicate detection results

---

**Status**: Ready to process collected PDFs  
**Prerequisite**: Phase 1 (collection) must be complete  
**Next Phase**: Phase 3 (Next.js platform)
