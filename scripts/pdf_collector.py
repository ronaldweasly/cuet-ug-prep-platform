#!/usr/bin/env python3
"""
CUET PDF Collector & Organizer
Fetches CUET UG past papers from public sources and organizes them.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class PDFMetadata:
    """Metadata for a collected PDF"""
    subject: str
    file_name: str
    year: int
    source: str
    type_: str  # PYQ or Mock
    answer_key: bool
    url: str
    file_size: Optional[int] = None
    collected_date: str = None
    
    def __post_init__(self):
        if self.collected_date is None:
            self.collected_date = datetime.now().isoformat()


class CUETCollector:
    """Main PDF collection and organization system"""
    
    # Define known sources for each subject
    SOURCES = {
        'Business_Studies': [
            {
                'name': 'NTA Official',
                'url': 'https://www.nta.ac.in/',
                'pattern': 'CUET*Business*Studies*.pdf'
            },
            {
                'name': 'Vedantu',
                'url': 'https://www.vedantu.com/cuet',
                'pattern': 'vedantu-cuet-business*.pdf'
            },
            {
                'name': 'Allen',
                'url': 'https://www.allen.ac.in/',
                'pattern': 'allen-cuet-business*.pdf'
            },
        ],
        'Economics': [
            {
                'name': 'NTA Official',
                'url': 'https://www.nta.ac.in/',
                'pattern': 'CUET*Economics*.pdf'
            },
            {
                'name': 'NCERT',
                'url': 'https://ncert.nic.in/',
                'pattern': 'Economics*.pdf'
            },
        ],
        'English': [
            {
                'name': 'NTA Official',
                'url': 'https://www.nta.ac.in/',
                'pattern': 'CUET*English*.pdf'
            },
            {
                'name': 'BBC Learning',
                'url': 'https://www.bbc.co.uk/learning/english/',
                'pattern': 'english-*.pdf'
            },
        ],
        'General_Test': [
            {
                'name': 'NTA Official',
                'url': 'https://www.nta.ac.in/',
                'pattern': 'CUET*General*.pdf'
            },
            {
                'name': 'Britannica',
                'url': 'https://www.britannica.com/',
                'pattern': 'general-knowledge*.pdf'
            },
        ],
    }
    
    def __init__(self, base_dir: str):
        """Initialize collector with base directory"""
        self.base_dir = Path(base_dir)
        self.collected_files: List[PDFMetadata] = []
        self.index_file = self.base_dir / 'data' / 'INDEX.md'
        
    def create_directory_structure(self):
        """Create required directory structure"""
        subjects = ['Business_Studies', 'Economics', 'English', 'General_Test']
        for subject in subjects:
            path = self.base_dir / 'data' / subject
            path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created/verified directory: {path}")
    
    def fetch_metadata_from_sources(self) -> Dict[str, List[Dict]]:
        """
        Fetch metadata from known sources.
        In production, this would use requests + web scraping.
        For now, returns template structure.
        """
        metadata = {}
        
        for subject, sources in self.SOURCES.items():
            metadata[subject] = []
            for source in sources:
                # Template for what would be fetched
                logger.info(f"Scanning {subject} from {source['name']}...")
                
        return metadata
    
    def add_manual_pdf(self, subject: str, file_path: str, year: int, 
                       source: str, is_pyq: bool, has_answer_key: bool, url: str):
        """
        Manually register a PDF (for files already downloaded).
        """
        if not Path(file_path).exists():
            logger.error(f"File not found: {file_path}")
            return False
        
        file_name = Path(file_path).name
        metadata = PDFMetadata(
            subject=subject,
            file_name=file_name,
            year=year,
            source=source,
            type_='PYQ' if is_pyq else 'Mock',
            answer_key=has_answer_key,
            url=url,
            file_size=Path(file_path).stat().st_size
        )
        
        self.collected_files.append(metadata)
        logger.info(f"Registered: {file_name}")
        return True
    
    def generate_index_md(self):
        """Generate INDEX.md with all collected metadata"""
        if not self.collected_files:
            logger.warning("No files collected yet. Run add_manual_pdf() first.")
            return
        
        # Group by subject
        by_subject = {}
        for file in self.collected_files:
            if file.subject not in by_subject:
                by_subject[file.subject] = []
            by_subject[file.subject].append(file)
        
        # Generate markdown
        md_content = "# CUET UG Papers Index\n\n"
        md_content += f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        md_content += "## Summary\n\n"
        
        total_files = len(self.collected_files)
        md_content += f"- **Total Files**: {total_files}\n"
        
        for subject in sorted(by_subject.keys()):
            count = len(by_subject[subject])
            md_content += f"- **{subject}**: {count} files\n"
        
        md_content += "\n---\n\n"
        
        # Detailed table by subject
        for subject in sorted(by_subject.keys()):
            md_content += f"## {subject.replace('_', ' ')}\n\n"
            md_content += "| File Name | Year | Source | Type | Answer Key | Download URL |\n"
            md_content += "|-----------|------|--------|------|------------|---------------|\n"
            
            for file in sorted(by_subject[subject], key=lambda x: x.year, reverse=True):
                ans_key = "✓" if file.answer_key else "✗"
                md_content += (
                    f"| {file.file_name} | {file.year} | {file.source} | "
                    f"{file.type_} | {ans_key} | [Link]({file.url}) |\n"
                )
            
            md_content += "\n"
        
        # Write to file
        with open(self.index_file, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        logger.info(f"Generated INDEX.md with {total_files} files")
    
    def generate_json_manifest(self):
        """Generate JSON manifest for programmatic access"""
        manifest = {
            'generated': datetime.now().isoformat(),
            'total_files': len(self.collected_files),
            'files': [asdict(f) for f in self.collected_files]
        }
        
        manifest_file = self.base_dir / 'data' / 'manifest.json'
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Generated manifest.json")
        return manifest
    
    def generate_report(self):
        """Generate data quality report"""
        if not self.collected_files:
            logger.warning("No files to report on")
            return
        
        # Analysis
        by_subject = {}
        by_year = {}
        by_source = {}
        
        for file in self.collected_files:
            # By subject
            if file.subject not in by_subject:
                by_subject[file.subject] = []
            by_subject[file.subject].append(file)
            
            # By year
            if file.year not in by_year:
                by_year[file.year] = []
            by_year[file.year].append(file)
            
            # By source
            if file.source not in by_source:
                by_source[file.source] = []
            by_source[file.source].append(file)
        
        report = "# CUET Data Collection Report\n\n"
        report += f"**Report Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # Summary stats
        report += "## Summary Statistics\n\n"
        report += f"- **Total Files Collected**: {len(self.collected_files)}\n"
        report += f"- **Total Subjects**: {len(by_subject)}\n"
        report += f"- **Year Range**: {min(by_year.keys())} - {max(by_year.keys())}\n"
        report += f"- **Unique Sources**: {len(by_source)}\n\n"
        
        # Files per subject
        report += "## Files Per Subject\n\n"
        for subject in sorted(by_subject.keys()):
            count = len(by_subject[subject])
            pyq_count = len([f for f in by_subject[subject] if f.type_ == 'PYQ'])
            mock_count = len([f for f in by_subject[subject] if f.type_ == 'Mock'])
            ans_key_count = len([f for f in by_subject[subject] if f.answer_key])
            
            report += f"### {subject.replace('_', ' ')}\n"
            report += f"- Total: {count}\n"
            report += f"- PYQ: {pyq_count}\n"
            report += f"- Mock: {mock_count}\n"
            report += f"- With Answer Key: {ans_key_count}\n\n"
        
        # Files per year
        report += "## Files Per Year\n\n"
        for year in sorted(by_year.keys(), reverse=True):
            count = len(by_year[year])
            report += f"- **{year}**: {count} files\n"
        report += "\n"
        
        # Files per source
        report += "## Files Per Source\n\n"
        for source in sorted(by_source.keys()):
            count = len(by_source[source])
            report += f"- **{source}**: {count} files\n"
        report += "\n"
        
        # Missing years analysis
        all_years = set(range(2022, 2026))
        missing_years = all_years - set(by_year.keys())
        
        report += "## Missing Years\n\n"
        if missing_years:
            report += "No papers found for:\n"
            for year in sorted(missing_years):
                report += f"- {year}\n"
        else:
            report += "✓ All years (2022-2025) covered!\n"
        report += "\n"
        
        # Data quality score
        max_score = 4 * 4 * 4  # 4 subjects × 4 years × presence/absence
        current_score = len(self.collected_files)
        quality_percentage = (current_score / max_score) * 100 if max_score > 0 else 0
        
        report += "## Data Quality Score\n\n"
        report += f"- **Target**: 16-20 files per subject (5-6 years of papers)\n"
        report += f"- **Collected**: {current_score} files\n"
        report += f"- **Quality**: {quality_percentage:.1f}%\n\n"
        
        report += "## Next Steps\n\n"
        report += "1. Fill missing years from verified CUET sources\n"
        report += "2. Prioritize papers with official answer keys\n"
        report += "3. Verify file integrity and readability\n"
        report += "4. Remove duplicates if detected\n"
        report += "5. Prepare for OCR processing pipeline\n"
        
        # Write report
        report_file = self.base_dir / 'data' / 'COLLECTION_REPORT.md'
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"Generated COLLECTION_REPORT.md")
        print(report)


def main():
    """Example usage"""
    base_dir = Path(__file__).parent
    
    collector = CUETCollector(base_dir)
    
    # Create directories
    collector.create_directory_structure()
    
    # Example: Add manually downloaded PDFs
    # collector.add_manual_pdf(
    #     subject='Business_Studies',
    #     file_path='data/Business_Studies/Business_Studies_2024_NTA_01.pdf',
    #     year=2024,
    #     source='NTA Official',
    #     is_pyq=True,
    #     has_answer_key=True,
    #     url='https://www.nta.ac.in/'
    # )
    
    # Generate outputs
    collector.generate_index_md()
    collector.generate_json_manifest()
    collector.generate_report()


if __name__ == '__main__':
    main()
