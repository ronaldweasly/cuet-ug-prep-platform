# CUET UG Exam Platform - Complete Setup Guide

Production-Grade Preparation Platform for CUET UG Entrance Examination

## 🎯 Project Overview

A comprehensive full-stack platform providing:

- **1,200-1,500** authentic CUET questions from official papers (2022-2025)
- **20 full-length** realistic mock exams
- **AI-powered** analysis and personalized learning
- **Adaptive gameplay** mechanics and leaderboards
- **Admin dashboard** for content management
- **Professional analytics** with percentile predictions

## 📁 Project Structure

```
CUET/
├── data/                          [Phase 1: Collected PDFs]
│   ├── Business_Studies/
│   ├── Economics/
│   ├── English/
│   ├── General_Test/
│   ├── INDEX.md
│   └── manifest.json
│
├── scripts/                       [Phase 2: OCR & Processing]
│   ├── pdf_collector.py           [PDF collection tool]
│   ├── pdf_processor.py           [OCR & question extraction]
│   └── register_pdfs.py           [Batch registration]
│
├── app/                           [Phase 3-10: Main Platform]
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         [Root layout]
│   │   │   ├── page.tsx           [Home page]
│   │   │   ├── globals.css        [Global styles]
│   │   │   ├── api/               [API routes]
│   │   │   │   ├── health/
│   │   │   │   ├── questions/
│   │   │   │   ├── tests/
│   │   │   │   ├── exams/
│   │   │   │   ├── analytics/
│   │   │   │   └── admin/
│   │   │   ├── (auth)/            [Auth pages]
│   │   │   ├── (dashboard)/       [Dashboard]
│   │   │   ├── exams/             [Exam taking]
│   │   │   ├── results/           [Results & analytics]
│   │   │   └── admin/             [Admin panel]
│   │   ├── components/            [Reusable components]
│   │   ├── types/                 [TypeScript types]
│   │   ├── lib/                   [Utilities & helpers]
│   │   └── hooks/                 [Custom React hooks]
│   ├── prisma/
│   │   ├── schema.prisma          [Database schema]
│   │   └── migrations/            [DB migrations]
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── Dockerfile
│
├── processed/                     [Phase 2: Extracted questions]
│   ├── questions.json
│   ├── all_questions.json
│   └── questions_db_dump.sql
│
├── CUET_SOURCES.md               [Phase 1: Public sources list]
├── PHASE_1_COLLECTION_GUIDE.md   [Phase 1: Instructions]
├── PHASE_2_PROCESSING.md         [Phase 2: OCR pipeline]
├── PHASE_4_EXAM_ENGINE.md        [Phase 4: Exam engine]
├── PHASE_5_ANALYTICS.md          [Phase 5: Analytics]
├── PHASE_6_10_ADVANCED.md        [Phases 6-10: Advanced features]
│
├── schema.prisma                 [Database schema (copy to app/prisma/)]
├── requirements.txt              [Python dependencies]
└── README.md                     [This file]
```

## 🚀 Quick Start (5 Steps)

### Step 1: Setup Python Environment (Phase 1-2)

```bash
# Create virtual environment
python -m venv venv

# Activate
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Collect PDFs (Phase 1)

```bash
# Follow PHASE_1_COLLECTION_GUIDE.md
# Download 5-10 PDFs per subject from sources in CUET_SOURCES.md
# Place in data/Business_Studies, data/Economics, etc.

# Status check
ls -la data/*/
```

### Step 3: Process PDFs (Phase 2)

```bash
# Process all PDFs and extract questions
python scripts/pdf_processor.py

# Output generated:
# - processed/all_questions.json (1,200-1,500 questions)
# - processed/questions_db_dump.sql
# - data/INDEX.md (updated)
# - data/COLLECTION_REPORT.md
```

### Step 4: Setup Next.js App (Phase 3)

```bash
cd app

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# DATABASE_URL=postgresql://...
# REDIS_URL=redis://...
# etc.

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Seed initial data
npx prisma db seed

# Run dev server
npm run dev
```

Visit http://localhost:3000

### Step 5: Deploy (Phase 10)

```bash
# Using Docker
docker-compose up -d

# Or deploy to Vercel
npm install -g vercel
vercel deploy --prod
```

## 📊 Phase-by-Phase Status

| Phase | Title | Status | Est. Time |
|-------|-------|--------|-----------|
| 1 | PDF Collection | ✅ Ready | 1 week |
| 2 | OCR & Processing | ✅ Ready | 2-3 days |
| 3 | Next.js Platform | ✅ Scaffolded | 2-3 days |
| 4 | Exam Engine | 🔄 Guide Ready | 5-7 days |
| 5 | Analytics | 🔄 Guide Ready | 4-5 days |
| 6-7 | AI & Gamification | 🔄 Guide Ready | 6-7 days |
| 8 | Admin Panel | 🔄 Guide Ready | 4 days |
| 9 | Design & UI | 🔄 Guide Ready | 5-7 days |
| 10 | Deployment | 🔄 Guide Ready | 5-7 days |

## 📖 Documentation

- **[PHASE_1_COLLECTION_GUIDE.md](PHASE_1_COLLECTION_GUIDE.md)** - How to collect CUET papers
- **[PHASE_2_PROCESSING.md](PHASE_2_PROCESSING.md)** - OCR & question extraction pipeline
- **[PHASE_4_EXAM_ENGINE.md](PHASE_4_EXAM_ENGINE.md)** - Building full-length exams
- **[PHASE_5_ANALYTICS.md](PHASE_5_ANALYTICS.md)** - Analytics and predictions
- **[PHASE_6_10_ADVANCED.md](PHASE_6_10_ADVANCED.md)** - AI, gamification, admin, deployment

## 🗄️ Database Setup

### PostgreSQL

```bash
# Install PostgreSQL
# Mac: brew install postgresql
# Ubuntu: sudo apt install postgresql
# Windows: Download installer

# Create database
createdb cuet

# Setup connection in .env.local
DATABASE_URL=postgresql://username:password@localhost:5432/cuet
```

### Redis (Optional but Recommended)

```bash
# Install Redis
# Mac: brew install redis
# Ubuntu: sudo apt install redis-server
# Windows: WSL or Docker

# Run Redis
redis-server

# Setup in .env.local
REDIS_URL=redis://localhost:6379
```

## 🔧 Development

### Run Development Server

```bash
cd app
npm run dev
```

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_new_table

# Apply migrations
npx prisma db push

# Open database UI
npx prisma studio
```

### View Database

```bash
npx prisma studio
# Opens at http://localhost:5555
```

## 📦 Technology Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Recharts** - Analytics charts
- **Framer Motion** - Animations

### Backend
- **Next.js API Routes** - REST API
- **Prisma ORM** - Database
- **PostgreSQL** - Main database
- **Redis** - Caching & queuing
- **NextAuth** - Authentication

### Python Tools
- **pdfplumber** - PDF text extraction
- **PyPDF2** - PDF processing
- **Pandas** - Data handling
- **SQLAlchemy** - Database ORM

## 🔒 Security Best Practices

- ✅ Environment variables (.env.local never committed)
- ✅ Password hashing (bcrypt)
- ✅ HTTPS enforcement
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Rate limiting
- ✅ Input validation

## 📊 Performance Targets

- ✅ API response time: < 500ms
- ✅ Page load time: < 2s
- ✅ Database queries: < 100ms
- ✅ Uptime: > 99%
- ✅ Core Web Vitals: Green

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Vercel (Recommended for Frontend)

```bash
npm install -g vercel
vercel link
vercel deploy
```

### Docker (Self-Hosted)

```bash
docker-compose up -d
```

### AWS/GCP/Azure

See [PHASE_6_10_ADVANCED.md](PHASE_6_10_ADVANCED.md#phase-10-deployment--documentation)

## 📋 Progress Checklist

### Phase 1: Data Collection
- [ ] Identify public CUET sources
- [ ] Download 5-10 PDFs per subject
- [ ] Verify file integrity
- [ ] Register with pdf_collector.py
- [ ] Generate INDEX.md
- [ ] Create ZIP archives (optional)

### Phase 2: PDF Processing
- [ ] Install Python dependencies
- [ ] Configure PDF processor
- [ ] Run extraction: `python scripts/pdf_processor.py`
- [ ] Verify question extraction (>85% success)
- [ ] Remove duplicates
- [ ] Validate data quality
- [ ] Generate SQL dump

### Phase 3: Next.js Setup
- [ ] Initialize project (✅ Done)
- [ ] Setup database (PostgreSQL + Prisma)
- [ ] Create authentication
- [ ] Setup API routes
- [ ] Test health endpoint
- [ ] Deploy to staging

### Phase 4: Exam Engine
- [ ] Create Test model
- [ ] Build exam interface components
- [ ] Implement timer system
- [ ] Add answer tracking
- [ ] Create scoring logic
- [ ] Generate 20 full-length tests
- [ ] Test on mobile

### Phase 5: Analytics
- [ ] Create analytics calculations
- [ ] Build dashboard UI
- [ ] Implement prediction engine
- [ ] Add comparison features
- [ ] Create recommendation system
- [ ] Optimize query performance

### Phase 6: AI Features
- [ ] Setup OpenAI/Gemini API
- [ ] Implement explanation generator
- [ ] Build AI tutor interface
- [ ] Create study plan generator
- [ ] Add personalized feedback

### Phase 7: Gamification
- [ ] Build XP system
- [ ] Implement levels & leveling
- [ ] Create streak tracking
- [ ] Build leaderboards
- [ ] Design badges/achievements
- [ ] Add daily goals

### Phase 8: Admin Panel
- [ ] Build admin layout
- [ ] Create question management UI
- [ ] Add test creation interface
- [ ] Implement user management
- [ ] Build analytics dashboard
- [ ] Add moderation tools

### Phase 9: Design & UI
- [ ] Finalize color scheme
- [ ] Create design system
- [ ] Build all components
- [ ] Responsive design tests
- [ ] Dark mode implementation
- [ ] Accessibility audit

### Phase 10: Deployment
- [ ] Setup CI/CD pipeline
- [ ] Configure monitoring
- [ ] Setup backups
- [ ] Create documentation
- [ ] Performance testing
- [ ] Security audit
- [ ] Launch! 🚀

## 📞 Support & Resources

### Official Resources
- [CUET NTA Portal](https://cuet.nta.ac.in/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community
- GitHub Issues
- Stack Overflow
- Discord communities

## 📄 License

MIT License - Free to use and modify

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 👨‍💻 Development Team

Built with ❤️ for CUET aspirants

---

**Status**: Ready for Phase 1 (PDF Collection)  
**Last Updated**: May 29, 2026  
**Next**: Start collecting PDFs following [PHASE_1_COLLECTION_GUIDE.md](PHASE_1_COLLECTION_GUIDE.md)
