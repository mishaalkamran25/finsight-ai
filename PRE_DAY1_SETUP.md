# FinSight AI — Pre-Day 1 Setup Guide
Complete this entire guide before Day 1. It should take 45–90 minutes.
You will end with a running backend, a running frontend, and a confirmed AI response in your browser.

---

## PART 1 — What You Are Setting Up

```
finsight-ai/
├── backend/                        ← Python API (FastAPI)
│   ├── main.py                     ← App entry point
│   ├── requirements.txt            ← Python packages to install
│   ├── .env.example                ← Template for your API key
│   ├── sample_data.csv             ← Demo financial dataset
│   ├── routers/
│   │   ├── upload.py               ← File upload + demo endpoints
│   │   ├── copilot.py              ← AI chat endpoint
│   │   └── report.py               ← Commentary + PowerPoint endpoints
│   └── services/
│       ├── parser.py               ← File parsing + metric calculation
│       └── pptx_generator.py       ← PowerPoint builder
│
├── frontend/                       ← React UI (Next.js)
│   ├── package.json                ← Node packages to install
│   ├── tailwind.config.js          ← Design system tokens
│   ├── postcss.config.js           ← Required by Tailwind
│   ├── .env.example                ← Template for backend URL
│   └── src/
│       ├── pages/
│       │   ├── _app.jsx            ← App wrapper
│       │   └── index.jsx           ← Main page + sidebar shell
│       ├── components/
│       │   ├── UploadTab.jsx       ← File upload UI
│       │   ├── CopilotTab.jsx      ← Chat interface
│       │   └── ManagementPackTab.jsx ← KPIs, charts, report download
│       └── styles/
│           └── globals.css         ← Full design system CSS
│
├── render.yaml                     ← Render deployment config (backend)
├── README.md                       ← Full project documentation
└── PRE_DAY1_SETUP.md               ← This file
```

The backend and frontend run as two separate local servers.
They talk to each other over HTTP. You will open two terminal windows simultaneously.

---

## PART 2 — Tools to Install (Do This First)

### 2.1 Check if you already have these

Open your terminal (Mac: Terminal or iTerm2 / Windows: PowerShell or Windows Terminal) and run each line:

```bash
python3 --version
# Need: Python 3.10 or higher
# If missing: https://www.python.org/downloads/

node --version
# Need: Node 18 or higher
# If missing: https://nodejs.org (download the LTS version)

npm --version
# Comes with Node — need 9 or higher

git --version
# Need: any recent version
# If missing: https://git-scm.com/downloads
```

If all four return version numbers, move to Part 3.

### 2.2 Install VS Code (recommended editor)

Download from: https://code.visualstudio.com
Install these extensions once VS Code is open:
- Python (by Microsoft)
- Pylance
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- GitLens

---

## PART 3 — Get the Project Files

You already have the project folder from the zip file Claude generated.
Unzip it and place the folder somewhere permanent — for example:

```
Mac:     /Users/yourname/projects/finsight-ai
Windows: C:\Users\yourname\projects\finsight-ai
```

Do NOT put it in Downloads. It will live here for the rest of the week.

Open the folder in VS Code:
```bash
# In terminal
cd /Users/yourname/projects/finsight-ai
code .
```

---

## PART 4 — Get Your Anthropic API Key

The AI copilot and commentary generator both require an Anthropic API key.

1. Go to https://console.anthropic.com
2. Sign in or create a free account
3. Click "API Keys" in the left sidebar
4. Click "Create Key" — name it "finsight-ai"
5. Copy the key immediately — it starts with `sk-ant-...`
   It is only shown once. Paste it somewhere safe (Notes, 1Password, etc.)

Free tier gives you enough credits to build and demo this project.
Do not share this key or commit it to GitHub.

---

## PART 5 — Backend Setup

Open Terminal Window 1. Every command in this section runs from the backend folder.

### 5.1 Navigate to the backend

```bash
cd /Users/yourname/projects/finsight-ai/backend
```

### 5.2 Create a Python virtual environment

A virtual environment keeps your project's packages isolated from the rest of your system.

```bash
python3 -m venv venv
```

This creates a folder called `venv/` inside your backend directory. You only do this once.

### 5.3 Activate the virtual environment

**Mac / Linux:**
```bash
source venv/bin/activate
```

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

Your terminal prompt will now show `(venv)` at the start. This means it worked.
You must activate the venv every time you open a new terminal window for the backend.

### 5.4 Install Python dependencies

```bash
pip install -r requirements.txt
```

This installs: FastAPI, Uvicorn, pandas, anthropic, python-pptx, openpyxl, and others.
It will take 1–3 minutes. You should see a series of "Successfully installed" lines.

If you see any errors, run this instead:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5.5 Create your .env file

```bash
cp .env.example .env
```

Now open `.env` in VS Code and add your API key:

```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

Save the file. Never commit this file to GitHub — it is already in .gitignore (you will add that shortly).

### 5.6 Verify the parser works (smoke test)

Before starting the server, confirm the core logic runs cleanly:

```bash
python3 -c "
from services.parser import parse_file, compute_metrics
import pathlib
content = pathlib.Path('sample_data.csv').read_bytes()
df = parse_file(content, 'sample_data.csv')
metrics = compute_metrics(df)
print('Rows parsed:', len(df))
print('Columns found:', list(df.columns))
print('Total actual: \$' + f\"{metrics['summary']['total_actual']:,.0f}\")
print('Variance vs budget: \$' + f\"{metrics['summary']['total_variance_vs_budget']:,.0f}\")
print('Parser OK')
"
```

Expected output (numbers may differ slightly):
```
Rows parsed: 49
Columns found: ['account', 'category', 'month', 'actual', 'budget', 'prior_period']
Total actual: $65,520,000
Variance vs budget: $-2,430,000
Parser OK
```

If you see "Parser OK", the backend core logic is working.

### 5.7 Start the backend server

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

The `--reload` flag means the server automatically restarts when you edit code.
Leave this terminal window open and running.

### 5.8 Confirm the backend is alive

Open your browser and go to: http://localhost:8000

You should see:
```json
{"status": "ok", "app": "FinSight AI"}
```

Also open: http://localhost:8000/docs

This is the auto-generated API documentation. You can test every endpoint here without any frontend.
This is useful for debugging throughout the week.

---

## PART 6 — Frontend Setup

Open Terminal Window 2 (keep Window 1 running with the backend).

### 6.1 Navigate to the frontend

```bash
cd /Users/yourname/projects/finsight-ai/frontend
```

### 6.2 Install Node dependencies

```bash
npm install
```

This installs Next.js, React, Recharts, Tailwind CSS, Axios, and Lucide icons.
Takes 1–3 minutes. Creates a `node_modules/` folder — do not edit anything inside it.

### 6.3 Create your frontend .env file

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This tells the frontend where to find the backend during local development.
You will change this to your Render URL on deployment day.

### 6.4 Start the frontend development server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.3
- Local:        http://localhost:3000
- Ready in 2.1s
```

Open your browser and go to: http://localhost:3000

You should see the FinSight AI interface — a dark navy sidebar on the left,
a white canvas on the right, and the Data Upload tab active.

---

## PART 7 — End-to-End Smoke Test

With both servers running, confirm the full flow works:

### Test 1 — Demo data loads
1. In the browser at http://localhost:3000
2. Click "Load Demo Dataset"
3. You should see a green success card with dataset stats
4. The sidebar should update to show "Dataset Active"

Expected: Rows parsed, columns listed, Total Actual ~$65M shown.

### Test 2 — Copilot responds
1. Click "FP&A Copilot" in the sidebar (or it auto-switches)
2. Click the suggested question: "What drove the unfavorable OPEX variance?"
3. Wait 5–10 seconds for the AI response
4. You should see a structured FP&A-style answer with specific numbers

Expected: A multi-sentence response referencing actual line items and dollar amounts.

If you see an error like "API key not configured":
- Check that your `.env` file in the backend folder has the correct key
- Restart the backend server (CTRL+C then `uvicorn main:app --reload --port 8000`)

### Test 3 — Management pack generates
1. Click "Management Pack" in the sidebar
2. Click "Generate AI Commentary"
3. Wait 5–10 seconds
4. You should see the executive commentary block appear below the chart and table
5. Click "Download PowerPoint"
6. A `.pptx` file should download to your Downloads folder
7. Open it in PowerPoint or Google Slides — you should see 4 professional slides

If all three tests pass, you are fully set up and ready for Day 1.

---

## PART 8 — Git Setup

Do this before writing any code. Version control from day one.

### 8.1 Initialize the repo

```bash
cd /Users/yourname/projects/finsight-ai
git init
```

### 8.2 Create a .gitignore file

Create a file called `.gitignore` in the root of the project with this content:

```
# Python
backend/venv/
backend/__pycache__/
backend/**/__pycache__/
backend/.env
*.pyc
*.pyo

# Node
frontend/node_modules/
frontend/.next/
frontend/.env.local
frontend/out/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/
```

### 8.3 Make your first commit

```bash
git add .
git commit -m "Initial commit — FinSight AI project setup"
```

### 8.4 Push to GitHub

1. Go to https://github.com and sign in
2. Click the "+" icon → "New repository"
3. Name it: `finsight-ai`
4. Set it to Public (required for Vercel free tier)
5. Do NOT initialize with README (you already have one)
6. Click "Create repository"
7. Copy the two commands GitHub shows you under "push an existing repository" and run them:

```bash
git remote add origin https://github.com/YOURUSERNAME/finsight-ai.git
git branch -M main
git push -u origin main
```

Refresh your GitHub page — you should see all your files there.

---

## PART 9 — Account Setup for Deployment (Do Now, Deploy Later)

Create these free accounts now so deployment on Day 4 takes 15 minutes, not 2 hours.

### Render (backend hosting)
1. Go to https://render.com
2. Sign up with your GitHub account (important — links repos automatically)
3. No credit card required for free tier
4. Free tier note: the backend "spins down" after 15 minutes of inactivity
   and takes ~30 seconds to wake up on the next request.
   This is fine for demos — just warn the hiring manager or open the app a minute early.

### Vercel (frontend hosting)
1. Go to https://vercel.com
2. Sign up with your GitHub account
3. No credit card required
4. Free tier is always-on and fast — no cold start issues

---

## PART 10 — Daily Workflow (How to Start Each Day)

Every morning before working on the project:

**Terminal Window 1 — Backend:**
```bash
cd /Users/yourname/projects/finsight-ai/backend
source venv/bin/activate          # Windows: venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

**Terminal Window 2 — Frontend:**
```bash
cd /Users/yourname/projects/finsight-ai/frontend
npm run dev
```

Open browser: http://localhost:3000

**End of each day — commit your work:**
```bash
cd /Users/yourname/projects/finsight-ai
git add .
git commit -m "Day X — brief description of what you built"
git push
```

---

## PART 11 — Troubleshooting Common Issues

### "ModuleNotFoundError" when starting backend
You forgot to activate the virtual environment.
Run `source venv/bin/activate` (Mac) or `venv\Scripts\Activate.ps1` (Windows) first.

### "ANTHROPIC_API_KEY not configured" error in copilot
Your `.env` file is missing or has a typo.
Open `backend/.env`, confirm the key starts with `sk-ant-`, save, and restart uvicorn.

### "Network Error" in the browser when loading demo data
The backend is not running. Check Terminal Window 1.
If it crashed, re-run `uvicorn main:app --reload --port 8000`.

### CORS error in browser console
This happens if the frontend is calling the wrong URL.
Check `frontend/.env.local` — it must say `NEXT_PUBLIC_API_URL=http://localhost:8000`.

### npm install fails
Try: `npm install --legacy-peer-deps`

### PowerPoint download is empty or corrupted
The commentary was not generated before downloading.
Click "Generate AI Commentary" first, wait for it to complete, then download.

### Port already in use
```bash
# Kill whatever is using port 8000
lsof -ti:8000 | xargs kill -9   # Mac/Linux
# Then restart uvicorn
```

---

## Pre-Day 1 Checklist

Complete every item before starting Day 1 work:

- [ ] Python 3.10+ installed and confirmed
- [ ] Node 18+ installed and confirmed
- [ ] Git installed and confirmed
- [ ] VS Code installed with recommended extensions
- [ ] Project folder unzipped to permanent location
- [ ] Anthropic API key created and saved securely
- [ ] `backend/.env` created with API key
- [ ] `backend/venv/` created and activated
- [ ] `pip install -r requirements.txt` completed successfully
- [ ] Parser smoke test passed (shows "Parser OK")
- [ ] `uvicorn main:app --reload` running on port 8000
- [ ] `http://localhost:8000` returns `{"status":"ok"}`
- [ ] `frontend/.env.local` created with backend URL
- [ ] `npm install` completed in frontend folder
- [ ] `npm run dev` running on port 3000
- [ ] `http://localhost:3000` shows FinSight AI interface
- [ ] Test 1 passed: demo data loads
- [ ] Test 2 passed: copilot responds with FP&A answer
- [ ] Test 3 passed: PowerPoint downloads and opens correctly
- [ ] `.gitignore` created
- [ ] First git commit made and pushed to GitHub
- [ ] Render account created (linked to GitHub)
- [ ] Vercel account created (linked to GitHub)

When every box is checked, you are ready for Day 1.
