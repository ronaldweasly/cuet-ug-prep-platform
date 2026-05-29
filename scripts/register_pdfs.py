#!/usr/bin/env python3
"""
Batch PDF Registration Script
Auto-scans the data directory and registers all PDFs with the collector.
"""

import os
import re
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))
from pdf_collector import CUETCollector


def parse_filename(filename: str) -> dict:
    """
    Parse filename following convention: Subject_Year_Source_##.pdf
    Examples:
        Business_Studies_2024_NTA_01.pdf
        Economics_2023_NCERT_Micro_02.pdf
        English_2022_Vedantu_03.pdf
        General_Test_2025_Allen_01.pdf
    """
    stem = Path(filename).stem
    
    # Known subject prefixes
    subjects = {
        'Business_Studies': 'Business_Studies',
        'Economics': 'Economics',
        'English': 'English',
        'General_Test': 'General_Test',
    }
    
    subject = None
    remainder = stem
    
    for prefix, subj_name in subjects.items():
        if stem.startswith(prefix):
            subject = subj_name
            remainder = stem[len(prefix) + 1:]  # +1 for underscore
            break
    
    if not subject:
        return None
    
    # Try to extract year (4-digit number)
    year_match = re.search(r'(\d{4})', remainder)
    if not year_match:
        return None
    
    year = int(year_match.group(1))
    
    # Extract source (everything between year and sequence number)
    after_year = remainder[year_match.end():]
    if after_year.startswith('_'):
        after_year = after_year[1:]
    
    # Split off trailing sequence number
    parts = after_year.rsplit('_', 1)
    if len(parts) == 2 and parts[1].isdigit():
        source = parts[0]
        sequence = int(parts[1])
    else:
        source = after_year
        sequence = 1
    
    # Determine if PYQ
    is_pyq = any(keyword in source.upper() for keyword in ['NTA', 'OFFICIAL', 'PYQ'])
    
    return {
        'subject': subject,
        'year': year,
        'source': source,
        'sequence': sequence,
        'is_pyq': is_pyq,
    }


def main():
    """Scan data directory and register all PDFs"""
    base_dir = Path(__file__).parent.parent  # CUET/
    data_dir = base_dir / 'data'
    
    collector = CUETCollector(str(base_dir))
    
    registered = 0
    skipped = 0
    errors = 0
    
    print("=" * 60)
    print("CUET PDF Batch Registration")
    print("=" * 60)
    
    for subject_dir in sorted(data_dir.iterdir()):
        if not subject_dir.is_dir() or subject_dir.name.startswith('.'):
            continue
        
        subject = subject_dir.name
        pdf_files = sorted(subject_dir.glob('*.pdf'))
        
        if not pdf_files:
            print(f"\n[DIR] {subject}: (empty)")
            continue
        
        print(f"\n[DIR] {subject}: {len(pdf_files)} PDFs")
        
        for pdf_file in pdf_files:
            parsed = parse_filename(pdf_file.name)
            
            if parsed:
                success = collector.add_manual_pdf(
                    subject=parsed['subject'],
                    file_path=str(pdf_file),
                    year=parsed['year'],
                    source=parsed['source'],
                    is_pyq=parsed['is_pyq'],
                    has_answer_key=True,  # Default - update manually if needed
                    url='[auto-registered]'
                )
                
                if success:
                    print(f"  [OK] {pdf_file.name}")
                    registered += 1
                else:
                    print(f"  [FAIL] {pdf_file.name} (registration failed)")
                    errors += 1
            else:
                print(f"  [SKIP] {pdf_file.name} (could not parse filename)")
                skipped += 1
    
    print(f"\n{'=' * 60}")
    print(f"Results:")
    print(f"  Registered: {registered}")
    print(f"  Skipped:    {skipped}")
    print(f"  Errors:     {errors}")
    print(f"{'=' * 60}")
    
    if registered > 0:
        print("\nGenerating outputs...")
        collector.generate_index_md()
        collector.generate_json_manifest()
        collector.generate_report()
        print("[OK] INDEX.md, manifest.json, and COLLECTION_REPORT.md generated")
    else:
        print("\nNo PDFs to register. Download papers first using download_papers.py")


if __name__ == '__main__':
    main()
