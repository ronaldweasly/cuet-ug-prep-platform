"""
CUET PDF Processing Pipeline
Converts PDFs to structured questions with metadata
"""

import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
from datetime import datetime

# Third-party imports (will be installed)
try:
    import PyPDF2
    from pdfplumber import PDF
    import pdfplumber
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Difficulty(Enum):
    """Question difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    UNKNOWN = "unknown"


class QuestionType(Enum):
    """Question types in CUET"""
    MULTIPLE_CHOICE = "multiple_choice"
    READ_COMPREHENSION = "reading_comprehension"
    NUMERICAL = "numerical"
    ASSERTION_REASON = "assertion_reason"
    FILL_BLANKS = "fill_blanks"
    UNKNOWN = "unknown"


@dataclass
class QuestionOption:
    """A single option (A, B, C, D)"""
    key: str  # A, B, C, D
    text: str


@dataclass
class Question:
    """Structured CUET question"""
    id: str  # Unique identifier
    subject: str
    chapter: Optional[str] = None
    topic: Optional[str] = None
    question_text: str = ""
    options: List[QuestionOption] = field(default_factory=list)
    correct_answer: Optional[str] = None  # A, B, C, or D
    explanation: Optional[str] = None
    year: int = 0
    source: str = ""  # Which PDF
    difficulty: Difficulty = Difficulty.UNKNOWN
    question_type: QuestionType = QuestionType.MULTIPLE_CHOICE
    is_pyq: bool = False
    has_answer_key: bool = False
    tags: List[str] = field(default_factory=list)
    page_number: Optional[int] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        d = asdict(self)
        d['difficulty'] = self.difficulty.value
        d['question_type'] = self.question_type.value
        d['options'] = [asdict(opt) for opt in self.options]
        return d


class PDFTextExtractor:
    """Extract text from PDFs using multiple methods"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)
        self.text = ""
        self.pages_text = []
        
    def extract_with_pdfplumber(self) -> Tuple[str, List[str]]:
        """Extract using pdfplumber (best for structured text)"""
        try:
            full_text = ""
            pages = []
            
            with pdfplumber.open(self.pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    pages.append(page_text)
                    full_text += page_text + "\n\n"
            
            logger.info(f"Extracted {len(pages)} pages from {self.pdf_path.name}")
            return full_text, pages
        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {e}")
            return "", []
    
    def extract_with_pypdf(self) -> Tuple[str, List[str]]:
        """Fallback extraction using PyPDF2"""
        try:
            full_text = ""
            pages = []
            
            with open(self.pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text() or ""
                    pages.append(page_text)
                    full_text += page_text + "\n\n"
            
            logger.info(f"Extracted {len(pages)} pages with PyPDF2")
            return full_text, pages
        except Exception as e:
            logger.error(f"PyPDF extraction failed: {e}")
            return "", []
    
    def extract(self) -> Tuple[str, List[str]]:
        """Extract text with fallback"""
        text, pages = self.extract_with_pdfplumber()
        if not text:
            text, pages = self.extract_with_pypdf()
        
        self.text = text
        self.pages_text = pages
        return text, pages


class QuestionParser:
    """Parse extracted text to find questions and options"""
    
    # Patterns for question detection
    QUESTION_PATTERNS = [
        r'^\s*\d+[\.\)]\s+(.+?)$',  # "1. Question text"
        r'^\s*Q\d+[\.\)]\s+(.+?)$',  # "Q1. Question text"
        r'^\s*Q\d+\s*[:]\s+(.+?)$',   # "Q1: Question text"
    ]
    
    # Patterns for option detection
    OPTION_PATTERNS = [
        r'^\s*[A-D]\s*[\.\)]\s+(.+?)$',  # "A) Option text"
        r'^\s*\([A-D]\)\s+(.+?)$',       # "(A) Option text"
        r'^\s*[A-D]\s*:?\s+(.+?)$',      # "A: Option text"
    ]
    
    # Patterns for answer detection
    ANSWER_PATTERNS = [
        r'Answer\s*[:\-]\s*([A-D])',
        r'Correct\s*[A-Z\s]*[:\-]\s*([A-D])',
        r'Key\s*[:\-]\s*([A-D])',
    ]
    
    def __init__(self):
        self.questions: List[Question] = []
    
    def parse_questions(self, text: str, pdf_metadata: Dict) -> List[Question]:
        """Parse text to extract questions"""
        questions = []
        
        # Split by common question delimiters
        lines = text.split('\n')
        current_question = None
        current_options = []
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if not line:
                i += 1
                continue
            
            # Check if this is a question
            question_match = self._match_pattern(line, self.QUESTION_PATTERNS)
            if question_match:
                # Save previous question
                if current_question:
                    current_question.options = current_options
                    questions.append(self._finalize_question(
                        current_question, pdf_metadata
                    ))
                
                # Start new question
                current_question = Question(
                    id=f"{pdf_metadata['source']}_{len(questions) + 1}",
                    subject=pdf_metadata['subject'],
                    question_text=question_match,
                    year=pdf_metadata['year'],
                    source=pdf_metadata['source'],
                    is_pyq=pdf_metadata.get('is_pyq', False),
                    has_answer_key=pdf_metadata.get('has_answer_key', False),
                    page_number=pdf_metadata.get('page_number', 0),
                )
                current_options = []
            
            # Check if this is an option
            elif current_question:
                option_match = self._match_pattern(line, self.OPTION_PATTERNS)
                if option_match:
                    # Extract option key (A, B, C, D)
                    key_match = re.match(r'^[A-D]', line.strip())
                    if key_match:
                        key = key_match.group(0)
                        current_options.append(QuestionOption(key, option_match))
            
            i += 1
        
        # Add last question
        if current_question:
            current_question.options = current_options
            questions.append(self._finalize_question(current_question, pdf_metadata))
        
        logger.info(f"Parsed {len(questions)} questions from {pdf_metadata['source']}")
        return questions
    
    def _match_pattern(self, text: str, patterns: List[str]) -> Optional[str]:
        """Try to match text against pattern list"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1) if match.lastindex else match.group(0)
        return None
    
    def _finalize_question(self, question: Question, metadata: Dict) -> Question:
        """Add metadata and estimate difficulty"""
        
        # Estimate difficulty based on text length
        text_length = len(question.question_text)
        if text_length < 100:
            question.difficulty = Difficulty.EASY
        elif text_length < 250:
            question.difficulty = Difficulty.MEDIUM
        else:
            question.difficulty = Difficulty.HARD
        
        # Set question type based on content
        if 'Read the passage' in question.question_text or 'Following passage' in question.question_text:
            question.question_type = QuestionType.READ_COMPREHENSION
        elif any(word in question.question_text.lower() for word in ['assert', 'reason']):
            question.question_type = QuestionType.ASSERTION_REASON
        elif any(word in question.question_text.lower() for word in ['blank', 'fill']):
            question.question_type = QuestionType.FILL_BLANKS
        
        return question


class PDFProcessor:
    """Main pipeline: PDF -> Questions"""
    
    def __init__(self, output_dir: str = "processed"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.all_questions = []
    
    def process_pdf(self, pdf_path: str, metadata: Dict) -> List[Question]:
        """Process a single PDF file"""
        
        logger.info(f"Processing {Path(pdf_path).name}...")
        
        # Extract text
        extractor = PDFTextExtractor(pdf_path)
        text, pages = extractor.extract()
        
        if not text:
            logger.warning(f"No text extracted from {pdf_path}")
            return []
        
        # Parse questions
        parser = QuestionParser()
        questions = parser.parse_questions(text, metadata)
        
        # Save results
        self._save_questions(questions, Path(pdf_path).stem)
        
        self.all_questions.extend(questions)
        return questions
    
    def process_directory(self, data_dir: str) -> Dict:
        """Process all PDFs in data directory"""
        
        results = {
            'processed_files': 0,
            'total_questions': 0,
            'by_subject': {},
            'by_year': {},
            'errors': []
        }
        
        data_path = Path(data_dir)
        
        # Process each subject folder
        for subject_dir in sorted(data_path.iterdir()):
            if not subject_dir.is_dir():
                continue
            
            subject = subject_dir.name
            results['by_subject'][subject] = {'files': 0, 'questions': 0}
            
            # Process each PDF in subject folder
            for pdf_file in sorted(subject_dir.glob('*.pdf')):
                try:
                    # Parse metadata from filename
                    parts = pdf_file.stem.split('_')
                    
                    if len(parts) < 3:
                        logger.warning(f"Skipping {pdf_file.name}: Invalid naming")
                        continue
                    
                    year = int(parts[1]) if parts[1].isdigit() else 2024
                    source = '_'.join(parts[2:-1])
                    
                    metadata = {
                        'subject': subject,
                        'year': year,
                        'source': source,
                        'is_pyq': 'NTA' in source or 'Official' in source,
                        'has_answer_key': True,
                    }
                    
                    # Process PDF
                    questions = self.process_pdf(str(pdf_file), metadata)
                    
                    results['processed_files'] += 1
                    results['total_questions'] += len(questions)
                    results['by_subject'][subject]['files'] += 1
                    results['by_subject'][subject]['questions'] += len(questions)
                    
                    # Track by year
                    if year not in results['by_year']:
                        results['by_year'][year] = 0
                    results['by_year'][year] += len(questions)
                    
                except Exception as e:
                    error_msg = f"Error processing {pdf_file.name}: {str(e)}"
                    logger.error(error_msg)
                    results['errors'].append(error_msg)
        
        return results
    
    def _save_questions(self, questions: List[Question], pdf_name: str):
        """Save extracted questions to JSON"""
        
        if not questions:
            return
        
        output_file = self.output_dir / f"{pdf_name}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(
                [q.to_dict() for q in questions],
                f,
                indent=2,
                ensure_ascii=False
            )
        
        logger.info(f"Saved {len(questions)} questions to {output_file}")
    
    def save_all_questions(self, output_file: str = "all_questions.json"):
        """Save all processed questions"""
        
        output_path = self.output_dir / output_file
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(
                [q.to_dict() for q in self.all_questions],
                f,
                indent=2,
                ensure_ascii=False
            )
        
        logger.info(f"Saved {len(self.all_questions)} total questions")
    
    def save_database_dump(self, output_file: str = "questions_db_dump.sql"):
        """Generate SQL INSERT statements for database"""
        
        output_path = self.output_dir / output_file
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("-- CUET Questions Database Dump\n")
            f.write(f"-- Generated: {datetime.now()}\n")
            f.write(f"-- Total Questions: {len(self.all_questions)}\n\n")
            
            f.write("INSERT INTO questions (id, subject, chapter, question_text, options, ")
            f.write("correct_answer, explanation, year, source, difficulty, ")
            f.write("question_type, is_pyq, page_number) VALUES\n")
            
            for i, q in enumerate(self.all_questions):
                options_json = json.dumps([o.text for o in q.options])
                
                values = (
                    f"('{q.id}', '{q.subject}', {f\"'{q.chapter}'\" if q.chapter else 'NULL'}, "
                    f"'{q.question_text.replace(chr(39), chr(39)*2)}', "  # Escape quotes
                    f"'{options_json}', "
                    f"{f\"'{q.correct_answer}'\" if q.correct_answer else 'NULL'}, "
                    f"{f\"'{q.explanation}'\" if q.explanation else 'NULL'}, "
                    f"{q.year}, '{q.source}', '{q.difficulty.value}', "
                    f"'{q.question_type.value}', {str(q.is_pyq).lower()}, "
                    f"{q.page_number if q.page_number else 'NULL'})"
                )
                
                f.write(values)
                if i < len(self.all_questions) - 1:
                    f.write(",\n")
                else:
                    f.write(";\n")
        
        logger.info(f"Generated SQL dump: {output_path}")


def main():
    """Example usage"""
    
    # Process all PDFs in data directory
    processor = PDFProcessor(output_dir='processed')
    
    # This will scan data/ directory for all PDFs
    results = processor.process_directory('data')
    
    # Save all questions
    processor.save_all_questions()
    processor.save_database_dump()
    
    # Print report
    print("\n" + "="*60)
    print("PDF PROCESSING PIPELINE REPORT")
    print("="*60)
    print(f"Files Processed: {results['processed_files']}")
    print(f"Total Questions Extracted: {results['total_questions']}")
    
    print("\nBy Subject:")
    for subject, data in results['by_subject'].items():
        print(f"  {subject}: {data['files']} files, {data['questions']} questions")
    
    print("\nBy Year:")
    for year in sorted(results['by_year'].keys()):
        print(f"  {year}: {results['by_year'][year]} questions")
    
    if results['errors']:
        print(f"\nErrors ({len(results['errors'])}):")
        for error in results['errors'][:5]:
            print(f"  - {error}")
        if len(results['errors']) > 5:
            print(f"  ... and {len(results['errors']) - 5} more")
    
    print("="*60)


if __name__ == '__main__':
    main()
