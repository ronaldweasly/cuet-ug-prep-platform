#!/usr/bin/env python3
"""
CUET Paper Downloader
Downloads CUET UG papers from verified public sources and registers them with the collector.
"""

import os
import sys
import time
import hashlib
import requests
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from pdf_collector import CUETCollector

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class PaperDownload:
    """Represents a paper to download"""
    subject: str          # e.g., 'Business_Studies'
    year: int             # e.g., 2024
    source: str           # e.g., 'NTA', 'Vedantu', 'NCERT'
    url: str              # Direct download URL
    is_pyq: bool          # True for past year questions
    has_answer_key: bool   # True if answer key included
    source_url: str       # Original source page URL
    sequence: int = 1     # Sequence number for same subject/year/source


class CUETDownloader:
    """Downloads and organizes CUET papers"""

    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.data_dir = self.base_dir / 'data'
        self.collector = CUETCollector(str(self.base_dir))
        self.downloaded_hashes = set()
        self._load_existing_hashes()

    def _load_existing_hashes(self):
        """Load hashes of existing files to detect duplicates"""
        for subject_dir in self.data_dir.iterdir():
            if subject_dir.is_dir() and subject_dir.name != '__pycache__':
                for pdf_file in subject_dir.glob('*.pdf'):
                    file_hash = self._get_file_hash(pdf_file)
                    self.downloaded_hashes.add(file_hash)
                    logger.info(f"Indexed existing: {pdf_file.name} ({file_hash[:8]})")

    def _get_file_hash(self, file_path: Path) -> str:
        """Get SHA256 hash of a file"""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()

    def _generate_filename(self, paper: PaperDownload) -> str:
        """Generate filename following naming convention: Subject_Year_Source_##.pdf"""
        return f"{paper.subject}_{paper.year}_{paper.source}_{paper.sequence:02d}.pdf"

    def download_paper(self, paper: PaperDownload, timeout: int = 60) -> Optional[Path]:
        """Download a single paper"""
        filename = self._generate_filename(paper)
        subject_dir = self.data_dir / paper.subject
        subject_dir.mkdir(parents=True, exist_ok=True)
        dest_path = subject_dir / filename

        # Skip if already exists
        if dest_path.exists():
            logger.info(f"Already exists: {filename}")
            return dest_path

        logger.info(f"Downloading: {paper.url}")
        logger.info(f"  -> {dest_path}")

        try:
            response = requests.get(
                paper.url,
                headers=self.HEADERS,
                timeout=timeout,
                stream=True,
                allow_redirects=True
            )
            response.raise_for_status()

            # Check content type
            content_type = response.headers.get('Content-Type', '')
            if 'pdf' not in content_type.lower() and 'octet-stream' not in content_type.lower():
                logger.warning(f"  Unexpected content type: {content_type}")
                # Still try to save - some servers don't set correct content type

            # Download to temp file first
            temp_path = dest_path.with_suffix('.tmp')
            total_size = 0

            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        total_size += len(chunk)

            # Verify minimum size (100 KB)
            if total_size < 100 * 1024:
                logger.warning(f"  File too small ({total_size} bytes), may not be a valid PDF")
                # Check if it's actually HTML (error page)
                with open(temp_path, 'rb') as f:
                    header = f.read(1024)
                    if b'<html' in header.lower() or b'<!doctype' in header.lower():
                        logger.error(f"  Downloaded HTML instead of PDF - skipping")
                        temp_path.unlink()
                        return None

            # Check for PDF magic bytes
            with open(temp_path, 'rb') as f:
                magic = f.read(5)
                if magic != b'%PDF-':
                    logger.error(f"  Not a valid PDF file (magic bytes: {magic!r}) - skipping")
                    temp_path.unlink()
                    return None

            # Check for duplicates
            file_hash = self._get_file_hash(temp_path)
            if file_hash in self.downloaded_hashes:
                logger.warning(f"  Duplicate content detected - skipping")
                temp_path.unlink()
                return None

            # Move to final location
            temp_path.rename(dest_path)
            self.downloaded_hashes.add(file_hash)

            logger.info(f"  ✓ Downloaded {filename} ({total_size / 1024:.1f} KB)")
            return dest_path

        except requests.exceptions.Timeout:
            logger.error(f"  Timeout downloading {paper.url}")
        except requests.exceptions.HTTPError as e:
            logger.error(f"  HTTP error: {e}")
        except requests.exceptions.ConnectionError as e:
            logger.error(f"  Connection error: {e}")
        except Exception as e:
            logger.error(f"  Error: {e}")

        # Clean up temp file on error
        temp_path = dest_path.with_suffix('.tmp')
        if temp_path.exists():
            temp_path.unlink()

        return None

    def download_all(self, papers: List[PaperDownload], delay: float = 2.0) -> Dict[str, int]:
        """Download all papers with rate limiting"""
        stats = {
            'total': len(papers),
            'downloaded': 0,
            'skipped': 0,
            'failed': 0,
            'duplicate': 0,
        }

        logger.info(f"Starting download of {len(papers)} papers...")

        for i, paper in enumerate(papers, 1):
            logger.info(f"\n[{i}/{len(papers)}] {paper.subject} - {paper.year} - {paper.source}")

            result = self.download_paper(paper)

            if result:
                if result.stat().st_size > 0:
                    # Register with collector
                    self.collector.add_manual_pdf(
                        subject=paper.subject,
                        file_path=str(result),
                        year=paper.year,
                        source=paper.source,
                        is_pyq=paper.is_pyq,
                        has_answer_key=paper.has_answer_key,
                        url=paper.source_url
                    )
                    stats['downloaded'] += 1
                else:
                    stats['skipped'] += 1
            else:
                stats['failed'] += 1

            # Rate limit
            if i < len(papers):
                time.sleep(delay)

        # Generate reports
        if stats['downloaded'] > 0:
            self.collector.generate_index_md()
            self.collector.generate_json_manifest()
            self.collector.generate_report()

        logger.info(f"\n{'='*50}")
        logger.info(f"Download Complete!")
        logger.info(f"  Downloaded: {stats['downloaded']}")
        logger.info(f"  Skipped:    {stats['skipped']}")
        logger.info(f"  Failed:     {stats['failed']}")
        logger.info(f"{'='*50}")

        return stats


# =============================================================================
# PAPER DEFINITIONS - Add discovered URLs here
# =============================================================================

def get_ncert_papers() -> List[PaperDownload]:
    """NCERT textbook PDFs (Economics & Business Studies, Class 12)"""
    papers = []

    # NCERT Economics textbooks (Class 12)
    ncert_econ_urls = [
        # Introductory Microeconomics
        ("https://ncert.nic.in/textbook/pdf/leec1dd.zip", "Micro_Part1"),
        # Introductory Macroeconomics  
        ("https://ncert.nic.in/textbook/pdf/leec2dd.zip", "Macro_Part2"),
    ]

    # NCERT Class 12 Economics Chapter PDFs (individual chapters)
    econ_chapters_micro = [
        "https://ncert.nic.in/textbook/pdf/leec101.pdf",  # Introduction
        "https://ncert.nic.in/textbook/pdf/leec102.pdf",  # Theory of Consumer Behaviour
        "https://ncert.nic.in/textbook/pdf/leec103.pdf",  # Production and Costs
        "https://ncert.nic.in/textbook/pdf/leec104.pdf",  # Theory of the Firm
        "https://ncert.nic.in/textbook/pdf/leec105.pdf",  # Market Equilibrium
        "https://ncert.nic.in/textbook/pdf/leec106.pdf",  # Non-competitive Markets
    ]

    econ_chapters_macro = [
        "https://ncert.nic.in/textbook/pdf/leec201.pdf",  # Introduction to Macro
        "https://ncert.nic.in/textbook/pdf/leec202.pdf",  # National Income Accounting
        "https://ncert.nic.in/textbook/pdf/leec203.pdf",  # Money and Banking
        "https://ncert.nic.in/textbook/pdf/leec204.pdf",  # Income Determination
        "https://ncert.nic.in/textbook/pdf/leec205.pdf",  # Government Budget
        "https://ncert.nic.in/textbook/pdf/leec206.pdf",  # Open Economy
    ]

    # NCERT Class 12 Business Studies Chapter PDFs
    bst_chapters_1 = [
        "https://ncert.nic.in/textbook/pdf/lebs101.pdf",  # Nature and Significance
        "https://ncert.nic.in/textbook/pdf/lebs102.pdf",  # Principles of Management
        "https://ncert.nic.in/textbook/pdf/lebs103.pdf",  # Business Environment
        "https://ncert.nic.in/textbook/pdf/lebs104.pdf",  # Planning
        "https://ncert.nic.in/textbook/pdf/lebs105.pdf",  # Organising
        "https://ncert.nic.in/textbook/pdf/lebs106.pdf",  # Staffing
        "https://ncert.nic.in/textbook/pdf/lebs107.pdf",  # Directing
        "https://ncert.nic.in/textbook/pdf/lebs108.pdf",  # Controlling
    ]

    bst_chapters_2 = [
        "https://ncert.nic.in/textbook/pdf/lebs201.pdf",  # Financial Markets
        "https://ncert.nic.in/textbook/pdf/lebs202.pdf",  # Marketing Management
        "https://ncert.nic.in/textbook/pdf/lebs203.pdf",  # Consumer Protection
        "https://ncert.nic.in/textbook/pdf/lebs204.pdf",  # Entrepreneurship Development
    ]

    # Add Economics micro chapters
    for i, url in enumerate(econ_chapters_micro, 1):
        papers.append(PaperDownload(
            subject='Economics',
            year=2024,  # Latest edition
            source='NCERT_Micro',
            url=url,
            is_pyq=False,
            has_answer_key=False,
            source_url='https://ncert.nic.in/textbook.php',
            sequence=i
        ))

    # Add Economics macro chapters
    for i, url in enumerate(econ_chapters_macro, 1):
        papers.append(PaperDownload(
            subject='Economics',
            year=2024,
            source='NCERT_Macro',
            url=url,
            is_pyq=False,
            has_answer_key=False,
            source_url='https://ncert.nic.in/textbook.php',
            sequence=i
        ))

    # Add Business Studies Part 1 chapters
    for i, url in enumerate(bst_chapters_1, 1):
        papers.append(PaperDownload(
            subject='Business_Studies',
            year=2024,
            source='NCERT_Part1',
            url=url,
            is_pyq=False,
            has_answer_key=False,
            source_url='https://ncert.nic.in/textbook.php',
            sequence=i
        ))

    # Add Business Studies Part 2 chapters
    for i, url in enumerate(bst_chapters_2, 1):
        papers.append(PaperDownload(
            subject='Business_Studies',
            year=2024,
            source='NCERT_Part2',
            url=url,
            is_pyq=False,
            has_answer_key=False,
            source_url='https://ncert.nic.in/textbook.php',
            sequence=i
        ))

    return papers


def get_all_papers() -> List[PaperDownload]:
    """Compile all paper downloads - URLs will be populated from research"""
    papers = []

    # NCERT textbook chapters (these are reliable direct PDF links)
    papers.extend(get_ncert_papers())

    # =========================================================================
    # ADD DISCOVERED URLS BELOW
    # Format:
    #   PaperDownload(
    #       subject='Business_Studies',  # or Economics, English, General_Test
    #       year=2024,
    #       source='NTA',
    #       url='https://direct-pdf-url.pdf',
    #       is_pyq=True,
    #       has_answer_key=True,
    #       source_url='https://source-page-url/',
    #       sequence=1
    #   )
    # =========================================================================

    return papers


def main():
    """Main download orchestrator"""
    base_dir = Path(__file__).parent.parent  # CUET/ directory

    downloader = CUETDownloader(str(base_dir))
    papers = get_all_papers()

    if not papers:
        logger.warning("No papers configured for download.")
        logger.info("Add paper URLs to get_all_papers() function.")
        return

    logger.info(f"Configured {len(papers)} papers for download")

    # Show summary
    by_subject = {}
    for p in papers:
        if p.subject not in by_subject:
            by_subject[p.subject] = 0
        by_subject[p.subject] += 1

    for subject, count in sorted(by_subject.items()):
        logger.info(f"  {subject}: {count} papers")

    # Download
    stats = downloader.download_all(papers, delay=1.5)

    return stats


if __name__ == '__main__':
    main()
