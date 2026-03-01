<div align="center">

# 🩺 GlucoGuide AI

### Your Intelligent Metabolic Operating System

**GlucoGuide AI** is a full-stack, AI-powered diabetes management platform that transforms raw clinical lab reports into personalized lifestyle intervention plans. Upload your PDF reports, track daily health metrics, manage medications, and receive intelligent recommendations — all in one place.

[Features](#-features) · [Screenshots](#-screenshots) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Clinical Report Analysis** | Upload PDF lab reports — the AI extracts HbA1c, fasting blood sugar, lipid profiles, and blood pressure automatically |
| 🤖 **AI Lifestyle Plans** | LangChain + Groq LLM generates structured 7-week intervention plans covering diet, exercise, and restrictions |
| 📊 **Daily Health Tracking** | Log exercise, steps, sleep, glucose, diet quality, and alcohol intake with automatic adherence scoring |
| 💊 **Medication Management** | Track prescriptions with dosage, frequency, and daily taken/not-taken status |
| 📈 **Interactive Dashboard** | Visualize BMI, glucose trends, and adherence history with Recharts-powered charts |
| 🔐 **Secure Authentication** | Google sign-in via Firebase Auth, validated server-side with Firebase Admin SDK |
| 🇮🇳 **Indian Diet Localization** | Food and nutrition recommendations tailored for Indian dietary patterns |
| 📝 **Weekly AI Feedback** | Automatic trend analysis (Improving / Stable / Declining) with personalized feedback |

---

## 🎥 Demo Video

https://github.com/user-attachments/assets/8dd12e5b-e288-4332-ba8f-b583c3410d21

---

## 🏗 Architecture

<img src="assets/architecture.png" alt="Architecture" width="700" />

</div>

---

**Data Flow:** User interacts with the React frontend → REST API calls to FastAPI backend → Authentication verified via Firebase → Data persisted in PostgreSQL → AI inference via LangChain + Groq for report analysis and recommendation generation.

---

## 🛠 Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | FastAPI, Python, Pydantic, SQLAlchemy, Gunicorn |
| **AI Engine** | LangChain, Groq API (LLM inference) |
| **Authentication** | Firebase Auth (client-side), Firebase Admin SDK (server-side) |
| **Database** | PostgreSQL |
| **PDF Processing** | PyPDF |
| **Observability** | LangSmith (optional tracing) |

---

## 📁 Project Structure

```
glucoguide-ai/
├── glucoguide-ai-backend/
│   ├── app/
│   │   ├── agent/                          # AI engine
│   │   │   ├── llm.py                      # Groq LLM client
│   │   │   ├── extraction_node.py          # Clinical data extraction
│   │   │   ├── plan_node.py                # 7-week lifestyle plan generation
│   │   │   ├── daily_recommendation_node.py # Daily recommendations
│   │   │   ├── feedback_node.py            # Weekly trend feedback
│   │   │   └── pdf_extractor.py            # PDF text extraction
│   │   ├── routes/                         # API endpoints
│   │   │   ├── report_routes.py            # Report upload & analysis
│   │   │   ├── log_routes.py               # Daily log CRUD & feedback
│   │   │   ├── recommendation_routes.py    # AI recommendations
│   │   │   └── medication_routes.py        # Medication management
│   │   ├── utils/scoring.py                # Adherence score calculation
│   │   ├── database.py                     # DB connection setup
│   │   ├── models.py                       # SQLAlchemy ORM models
│   │   ├── firebase_auth.py                # Firebase token validation
│   │   └── main.py                         # FastAPI app entry point
│   ├── .env.example                        # Environment variable template
│   ├── serviceAccountKey.example.json      # Firebase key template
│   └── requirements.txt                    # Python dependencies
│
├── glucoguide-ai-frontend/
│   ├── src/
│   │   ├── pages/                          # Route-level components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SubmitReport.tsx
│   │   │   ├── DailyLog.tsx
│   │   │   ├── MedicineTracker.tsx
│   │   │   └── Login.tsx
│   │   ├── components/                     # Reusable UI components
│   │   ├── services/                       # Firebase & API service layer
│   │   ├── App.tsx                         # Root component with routing
│   │   └── main.tsx                        # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── sample-diabetes-reports/                # Sample PDF reports for testing
├── screenshots/                            # App screenshots
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.10+
- **PostgreSQL** (local or hosted)
- **Firebase project** with Authentication enabled
- **Groq API key** ([console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/yashpawar87/glucoguide-ai.git
cd glucoguide-ai
```

### 2. Backend Setup

```bash
cd glucoguide-ai-backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt
```

**Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database_name>
GROQ_API_KEY=<your_groq_api_key>

# Optional: LangSmith tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=<your_langsmith_api_key>
LANGCHAIN_PROJECT=glucoguide-ai
```

**Add Firebase credentials:**

```bash
cp serviceAccountKey.example.json serviceAccountKey.json
```

Replace the placeholder values in `serviceAccountKey.json` with your Firebase Admin SDK service account key (download from Firebase Console → Project Settings → Service Accounts).

### 3. Frontend Setup

```bash
cd glucoguide-ai-frontend
npm install
```

Update the Firebase config object in `src/services/firebase.tsx` with your Firebase project credentials.

### 4. Run the Application

**Start the backend:**

```bash
cd glucoguide-ai-backend
source venv/bin/activate
uvicorn app.main:app --reload
```

> API server starts at `http://localhost:8000`

**Start the frontend:**

```bash
cd glucoguide-ai-frontend
npm run dev
```

> Development server starts at `http://localhost:5173`

---

## 📡 API Reference

Once the backend is running, interactive API docs are available at:

- **Swagger UI:** [`http://localhost:8000/docs`](http://localhost:8000/docs)

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/me` | Get authenticated user profile |
| `POST` | `/reports/upload` | Upload a PDF clinical report for AI analysis |
| `GET` | `/recommendations/daily` | Retrieve daily AI-powered recommendations |
| `POST` | `/logs/` | Create or update a daily health log |
| `GET` | `/logs/history` | Get recent log history |
| `GET` | `/logs/weekly` | Get weekly adherence summary |
| `GET` | `/logs/feedback` | Get AI-generated weekly feedback |
| `GET` | `/medications/` | List all medications |
| `POST` | `/medications/` | Add a new medication |
| `PUT` | `/medications/{id}/toggle` | Toggle medication taken status |
| `DELETE` | `/medications/{id}` | Delete a medication |

---


