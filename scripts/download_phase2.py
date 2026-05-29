#!/usr/bin/env python3
"""
Phase 2 CUET Paper Downloader
Downloads CUET PYQ papers and English/General Test materials
from additional sources discovered through research.
"""

import os
import sys
import time
import hashlib
import requests
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from pdf_collector import CUETCollector

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/pdf,text/html,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
}


def get_file_hash(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    return sha256.hexdigest()


def download_pdf(url, dest_path, timeout=60):
    """Download a PDF from a URL"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout, stream=True, allow_redirects=True)
        response.raise_for_status()
        
        temp_path = dest_path.with_suffix('.tmp')
        total_size = 0
        
        with open(temp_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    total_size += len(chunk)
        
        # Check if it's actually a PDF
        with open(temp_path, 'rb') as f:
            magic = f.read(5)
            if magic != b'%PDF-':
                logger.warning(f"  Not a PDF (magic: {magic!r})")
                # Check if it's HTML
                with open(temp_path, 'rb') as f2:
                    content = f2.read(2000)
                    if b'<html' in content.lower() or b'<!doctype' in content.lower():
                        logger.error(f"  Got HTML page instead of PDF - skipping")
                        temp_path.unlink()
                        return False
                temp_path.unlink()
                return False
        
        if total_size < 50 * 1024:  # Less than 50KB
            logger.warning(f"  File too small ({total_size} bytes)")
            temp_path.unlink()
            return False
        
        temp_path.rename(dest_path)
        logger.info(f"  ✓ Downloaded {dest_path.name} ({total_size / 1024:.1f} KB)")
        return True
        
    except Exception as e:
        logger.error(f"  Error: {e}")
        temp_path = dest_path.with_suffix('.tmp')
        if temp_path.exists():
            temp_path.unlink()
        return False


def download_ncert_english():
    """Download NCERT English textbooks (Flamingo and Vistas)"""
    base_dir = Path(__file__).parent.parent
    english_dir = base_dir / 'data' / 'English'
    english_dir.mkdir(parents=True, exist_ok=True)
    
    # NCERT Class 12 English - Flamingo (Prose)
    flamingo_chapters = {
        'lefl101': 'The_Last_Lesson',
        'lefl102': 'Lost_Spring',
        'lefl103': 'Deep_Water',
        'lefl104': 'The_Rattrap',
        'lefl105': 'Indigo',
        'lefl106': 'Poets_and_Pancakes',
        'lefl107': 'The_Interview',
        'lefl108': 'Going_Places',
    }
    
    # NCERT Class 12 English - Flamingo (Poetry)
    flamingo_poetry = {
        'lefl109': 'My_Mother_At_Sixty_Six',
        'lefl110': 'An_Elementary_School',
        'lefl111': 'Keeping_Quiet',
        'lefl112': 'A_Thing_Of_Beauty',
        'lefl113': 'A_Roadside_Stand',
        'lefl114': 'Aunt_Jennifers_Tigers',
    }
    
    # NCERT Class 12 English - Vistas (Supplementary)
    vistas_chapters = {
        'levt101': 'Third_Level',
        'levt102': 'Tiger_King',
        'levt103': 'Journey_To_End_Of_Earth',
        'levt104': 'Enemy',
        'levt105': 'Should_Wizard_Hit_Mommy',
        'levt106': 'On_The_Face_Of_It',
        'levt107': 'Evans_Tries_O_Level',
        'levt108': 'Memories_Of_Childhood',
    }
    
    downloaded = 0
    
    # Download Flamingo prose chapters
    for i, (code, name) in enumerate(flamingo_chapters.items(), 1):
        url = f"https://ncert.nic.in/textbook/pdf/{code}.pdf"
        dest = english_dir / f"English_2024_NCERT_Flamingo_{i:02d}.pdf"
        if not dest.exists():
            logger.info(f"Downloading Flamingo prose: {name}")
            if download_pdf(url, dest):
                downloaded += 1
            time.sleep(1.5)
    
    # Download Flamingo poetry
    for i, (code, name) in enumerate(flamingo_poetry.items(), 1):
        url = f"https://ncert.nic.in/textbook/pdf/{code}.pdf"
        dest = english_dir / f"English_2024_NCERT_Poetry_{i:02d}.pdf"
        if not dest.exists():
            logger.info(f"Downloading Flamingo poetry: {name}")
            if download_pdf(url, dest):
                downloaded += 1
            time.sleep(1.5)
    
    # Download Vistas chapters
    for i, (code, name) in enumerate(vistas_chapters.items(), 1):
        url = f"https://ncert.nic.in/textbook/pdf/{code}.pdf"
        dest = english_dir / f"English_2024_NCERT_Vistas_{i:02d}.pdf"
        if not dest.exists():
            logger.info(f"Downloading Vistas: {name}")
            if download_pdf(url, dest):
                downloaded += 1
            time.sleep(1.5)
    
    logger.info(f"English NCERT: {downloaded} files downloaded")
    return downloaded


def download_selfstudys_papers():
    """
    Try to download CUET PYQ papers from SelfStudys.com
    Note: These URLs are constructed based on common patterns.
    The actual URLs may vary.
    """
    base_dir = Path(__file__).parent.parent
    
    # SelfStudys typically uses these URL patterns for CUET papers
    # These are constructed URLs - may or may not work
    selfstudys_urls = [
        # Business Studies
        {
            'subject': 'Business_Studies',
            'urls': [
                ('https://www.selfstudys.com/exam/cuet-ug/previous-year-question-papers/business-studies/2024', 'Business_Studies_2024_SelfStudys_01.pdf'),
                ('https://www.selfstudys.com/exam/cuet-ug/previous-year-question-papers/business-studies/2023', 'Business_Studies_2023_SelfStudys_01.pdf'),
            ]
        },
        # Economics
        {
            'subject': 'Economics',
            'urls': [
                ('https://www.selfstudys.com/exam/cuet-ug/previous-year-question-papers/economics/2024', 'Economics_2024_SelfStudys_01.pdf'),
                ('https://www.selfstudys.com/exam/cuet-ug/previous-year-question-papers/economics/2023', 'Economics_2023_SelfStudys_01.pdf'),
            ]
        },
    ]
    
    downloaded = 0
    for group in selfstudys_urls:
        subject_dir = base_dir / 'data' / group['subject']
        subject_dir.mkdir(parents=True, exist_ok=True)
        
        for url, filename in group['urls']:
            dest = subject_dir / filename
            if not dest.exists():
                logger.info(f"Trying SelfStudys: {filename}")
                if download_pdf(url, dest):
                    downloaded += 1
                time.sleep(2)
    
    return downloaded


def download_general_test_materials():
    """Download GK and reasoning materials for General Test"""
    base_dir = Path(__file__).parent.parent
    gt_dir = base_dir / 'data' / 'General_Test'
    gt_dir.mkdir(parents=True, exist_ok=True)
    
    # NCERT Class 11/12 resources that are relevant for General Test
    # Political Science / Indian Constitution (relevant for GK)
    ncert_gt_urls = [
        # Class 11 Political Science - Indian Constitution at Work
        ('https://ncert.nic.in/textbook/pdf/keps101.pdf', 'General_Test_2024_NCERT_Constitution_01.pdf'),
        ('https://ncert.nic.in/textbook/pdf/keps102.pdf', 'General_Test_2024_NCERT_Constitution_02.pdf'),
        ('https://ncert.nic.in/textbook/pdf/keps103.pdf', 'General_Test_2024_NCERT_Constitution_03.pdf'),
        # Class 12 Political Science - Contemporary World Politics
        ('https://ncert.nic.in/textbook/pdf/leps101.pdf', 'General_Test_2024_NCERT_WorldPolitics_01.pdf'),
        ('https://ncert.nic.in/textbook/pdf/leps102.pdf', 'General_Test_2024_NCERT_WorldPolitics_02.pdf'),
        ('https://ncert.nic.in/textbook/pdf/leps103.pdf', 'General_Test_2024_NCERT_WorldPolitics_03.pdf'),
        # Class 12 Geography
        ('https://ncert.nic.in/textbook/pdf/legy101.pdf', 'General_Test_2024_NCERT_Geography_01.pdf'),
        ('https://ncert.nic.in/textbook/pdf/legy102.pdf', 'General_Test_2024_NCERT_Geography_02.pdf'),
        # Class 12 History
        ('https://ncert.nic.in/textbook/pdf/lehs101.pdf', 'General_Test_2024_NCERT_History_01.pdf'),
        ('https://ncert.nic.in/textbook/pdf/lehs102.pdf', 'General_Test_2024_NCERT_History_02.pdf'),
    ]
    
    downloaded = 0
    for url, filename in ncert_gt_urls:
        dest = gt_dir / filename
        if not dest.exists():
            logger.info(f"Downloading: {filename}")
            if download_pdf(url, dest):
                downloaded += 1
            time.sleep(1.5)
    
    logger.info(f"General Test: {downloaded} files downloaded")
    return downloaded


def register_all_and_generate():
    """Register all downloaded PDFs and generate reports"""
    base_dir = Path(__file__).parent.parent
    collector = CUETCollector(str(base_dir))
    data_dir = base_dir / 'data'
    
    # Source URL mapping
    source_urls = {
        'NCERT': 'https://ncert.nic.in/textbook.php',
        'SelfStudys': 'https://www.selfstudys.com/',
    }
    
    registered = 0
    
    for subject_dir in sorted(data_dir.iterdir()):
        if not subject_dir.is_dir() or subject_dir.name.startswith('.') or subject_dir.name.startswith('_'):
            continue
        
        subject = subject_dir.name
        for pdf_file in sorted(subject_dir.glob('*.pdf')):
            stem = pdf_file.stem
            parts = stem.split('_')
            
            # Parse year
            year = None
            for p in parts:
                if p.isdigit() and len(p) == 4:
                    year = int(p)
                    break
            
            if not year:
                year = 2024
            
            # Determine source
            source = 'Unknown'
            is_pyq = False
            for key in ['NCERT', 'NTA', 'SelfStudys', 'Vedantu', 'Allen', 'Mock']:
                if key in stem:
                    source = key
                    is_pyq = key in ['NTA']
                    break
            
            url = source_urls.get(source, '[manual-entry]')
            
            success = collector.add_manual_pdf(
                subject=subject,
                file_path=str(pdf_file),
                year=year,
                source=source,
                is_pyq=is_pyq,
                has_answer_key=False,
                url=url
            )
            
            if success:
                registered += 1
    
    logger.info(f"Registered {registered} PDFs")
    
    if registered > 0:
        collector.generate_index_md()
        collector.generate_json_manifest()
        collector.generate_report()
        logger.info("Generated INDEX.md, manifest.json, and COLLECTION_REPORT.md")
    
    return registered


def main():
    """Main download orchestrator for Phase 2"""
    logger.info("=" * 60)
    logger.info("CUET Paper Downloader - Phase 2")
    logger.info("=" * 60)
    
    # Phase 1: NCERT English textbooks
    logger.info("\n--- Phase 1: NCERT English Textbooks ---")
    english_count = download_ncert_english()
    
    # Phase 2: General Test materials
    logger.info("\n--- Phase 2: General Test NCERT Materials ---")
    gt_count = download_general_test_materials()
    
    # Phase 3: Register all and generate reports
    logger.info("\n--- Phase 3: Registering & Generating Reports ---")
    total = register_all_and_generate()
    
    logger.info("\n" + "=" * 60)
    logger.info(f"Phase 2 Complete!")
    logger.info(f"  English downloads: {english_count}")
    logger.info(f"  General Test downloads: {gt_count}")
    logger.info(f"  Total registered: {total}")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()
