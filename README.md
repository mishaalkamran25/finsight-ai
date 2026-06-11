# FinSight AI - FP&A Intelligence Platform

An AI-powered FP&A tool with two modules: a conversational copilot that answers finance questions grounded in your data, and an automated management pack generator that produces executive-ready PowerPoint reports.

Built with: Next.js · FastAPI · Claude API · pandas · python-pptx · Recharts · Tailwind CSS

---

## Architecture

```
finsight-ai/
├── backend/                  # FastAPI (Python)
│   ├── main.py               # App entry point, CORS
│   ├── routers/
│   │   ├── upload.py         # File upload + demo data endpoints
│   │   ├── copilot.py        # AI chat endpoint
│   │   └── report.py         # Commentary + PowerPoint endpoints
│   ├── services/
│   │   ├── parser.py         # File parsing, column normalization, metric calculation
│   │   └── pptx_generator.py # PowerPoint generation
│   ├── sample_data.csv       # Demo dataset (Meridian Consumer Goods)
│   └── requirements.txt
├── frontend/                 # Next.js (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.jsx     # App shell, tab navigation
│   │   │   └── _app.jsx
│   │   ├── components/
│   │   │   ├── UploadTab.jsx        # File upload + demo loader
│   │   │   ├── CopilotTab.jsx       # Chat interface
│   │   │   └── ManagementPackTab.jsx # KPIs, charts, table, download
│   │   └── styles/globals.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
└── render.yaml               # Render deployment config
```

---

## Local Setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

uvicorn main:app --reload
# Runs at http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 for local dev

npm run dev
# Runs at http://localhost:3000
```

---

## Input File Format

The parser is flexible and auto-detects common column names. Ideal columns:

| Column | Aliases accepted |
|--------|-----------------|
| `account` | Line Item, Description, Name, GL Account |
| `category` | Type, Group, Section, Class |
| `month` | Period, Date, Fiscal Period |
| `actual` | Actuals, Amount, YTD Actual |
| `budget` | Plan, Target, Budgeted |
| `prior_period` | Prior, PY, Last Year, Previous Period |
| `forecast` | Fcst, Latest Estimate, LE |

Numbers can include `$`, `,`, and spaces — they are cleaned automatically.

---

## Anti-Hallucination Design

1. **Deterministic calculations first**: pandas computes all variances, totals, and percentages before the AI sees anything.
2. **Context injection**: the AI system prompt receives only calculated metrics from the uploaded file, not raw data.
3. **Strict system prompt**: the AI is instructed to only reference numbers present in the context and to flag insufficient data.
4. **No database, no cross-session bleed**: each session is isolated in memory.

---

## Deployment

### Backend → Render (Free Tier)

1. Push to GitHub
2. Create a new Web Service on [render.com](https://render.com)
3. Connect your repo, set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `ANTHROPIC_API_KEY`

> Note: Render free tier spins down after inactivity (~30s cold start). Upgrade to Starter ($7/mo) for always-on.

### Frontend → Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
5. Deploy

---

## 60-Second Demo Flow

1. Open the live app
2. Click **"Load Demo Dataset"** (Meridian Consumer Goods)
3. Switch to **FP&A Copilot** tab
4. Ask: *"What drove the unfavorable OPEX variance?"*
5. Receive a specific, numbers-grounded FP&A-style answer
6. Switch to **Management Pack** tab
7. Click **"Generate AI Commentary"**
8. Click **"Download PowerPoint"**
9. Open the downloaded `.pptx` — professional management report ready

---

## Portfolio Use

- Live URL: deploy to Vercel and share the link
- Screenshots: capture the copilot chat, KPI cards, and the downloaded PowerPoint
- GitHub: make the repo public — recruiters and hiring managers will review the code
- Framer landing page: build a separate portfolio page describing the problem, solution, and tech stack

---

## Built By

Mishaal Kamran Hussain, Business Analytics & Information Management, Purdue University  
Financial & Business Analyst, x-Coca-Cola
