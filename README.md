# 🚑 RescueRoute AI

> **Autonomous Emergency Route Optimization & Dynamic Incident Rerouting Platform**  
> Built with React, Vite, TypeScript, Tailwind CSS, Node.js, Express, Prisma, SQLite / PostgreSQL, and Google Gemini API.

---

## 🌟 Overview

**RescueRoute AI** is an emergency routing and dispatch console engineered for paramedics, emergency dispatchers, and trauma center coordinators. Standard GPS routing focuses on commuter efficiency; RescueRoute AI prioritizes **patient hemodynamic survival, road clearance, emergency signal preemption, and real-time roadblock avoidance**.

When catastrophic traffic incidents, floods, or multi-vehicle pileups block critical transit arteries, the system **autonomously detects the collision, triggers dynamic rerouting, evaluates alternative corridors, and provides AI tactical justifications**.

---

## ⚡ Key Features

- **🔐 End-to-End Authentication**: Real JWT authentication with bcrypt password hashing, role-based dispatcher/paramedic profiles, and protected dashboard views.
- **🗺️ Interactive Tactical Dark Map**: Powered by Leaflet and CartoDB Dark Matter tiles, featuring glowing ambulance origin pins, trauma hospital beacons, danger radius hazard circles, and color-coded multi-vector polylines. Includes direct Google Maps direction integration.
- **🛣️ Multi-Corridor Emergency Route Planner**:
  - Evaluates **Corridor Alpha (Medical Priority)**, **Route Bravo (Metro Expressway)**, and **Route Charlie (Arterial Bypass)**.
  - Multi-factor **Suitability Score (0-100)** factoring in baseline transit speed, road surface quality, green-wave signal preemption, and active hazard delays.
- **🚨 Dynamic Roadblock & Incident Collision Engine**:
  - Point-to-segment geometric distance calculations detect when simulated roadblocks intersect an ambulance corridor.
  - Instantly marks blocked routes, flags severity penalties, and generates an emergency reroute recommendation.
- **🧠 AI Tactical Dispatch Briefings (Gemini API + Robust Fallback)**:
  - Generates tactical operational rationale using **Google Gemini 1.5 Flash**.
  - Seamlessly fails over to an intelligent **Rule-Based Tactical Dispatch Engine** when an API key is omitted or during offline operation.
- **📋 Incident Command & Roadblock Injector**:
  - Add, filter, inspect, and resolve simulated hazards on the fly with presets (e.g., hazmat spills, highway rollovers, flooding).
  - Resolving a roadblock automatically triggers real-time corridor recalculation and clears transit warnings.
- **📊 Operational Telemetry & Dispatch History**:
  - Tracks active roadblocks, response time saved, dispatched routes, and trauma hub availability.
  - One-click dispatch action commits records to the Prisma database history log.

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| **Frontend UI** | React 18, Vite, TypeScript | Fast, type-safe reactive dashboard |
| **Styling** | Tailwind CSS (Custom Dark Navy Theme) | Tactical ops room aesthetics (`#070C1A`, `#00F0FF`, `#10B981`, `#EF4444`) |
| **Mapping** | Leaflet + CartoDB Dark Matter | Interactive, dark-mode vector map without mandatory API keys |
| **Backend API** | Node.js, Express, TypeScript (`tsx`) | Robust REST API endpoints |
| **ORM & Database** | Prisma ORM with SQLite (Local) / PostgreSQL (Prod) | Zero-friction local setup, production-ready schema |
| **Security** | JSON Web Tokens (JWT), `bcryptjs` | Stateless session handling & hashed credentials |
| **AI Engine** | Google Gemini 1.5 Flash REST API | Generative tactical dispatch justifications |

---

## 🚀 Quickstart Guide (Local Development)

### Prerequisites
- Node.js `v18+` or `v20+` (Tested on Node `v24`)
- npm `v9+`

### 1. Clone & Setup Project
```bash
git clone <repository-url>
cd "smart mobanilty"
```

### 2. Configure Environment Files

Create `.env` inside `server/`:
```bash
cd server
cp .env.example .env
```
Default `server/.env`:
```env
DATABASE_URL="file:./dev.db"
PORT=5000
JWT_SECRET="rescueroute_super_secret_jwt_key_2026_hackathon"
GEMINI_API_KEY="" # Optional: paste Google Gemini API key or leave blank for fallback
CLIENT_URL="http://localhost:5173"
```

### 3. Install Dependencies & Initialize Database

```bash
# In server directory:
npm install
npx prisma generate
npx prisma db push
npm run seed
```

### 4. Install Frontend Dependencies

```bash
cd ../client
npm install
```

### 5. Launch Application

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Server listens at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend live at http://localhost:5173
```

---

## 🔑 Demo Dispatcher Credentials

The database is pre-seeded with an active demo dispatcher account for instant login:

| Field | Seeded Value |
|---|---|
| **Email** | `dispatcher@rescueroute.ai` |
| **Password** | `Emergency123!` |
| **Name** | Captain Marcus Vance |
| **Role** | Lead Dispatcher (Metro Level-1 Trauma EOC) |

*You can also click the **"Fill Seeded Dispatcher Credentials (Instant Demo)"** button directly on the login screen.*

---

## 🧪 Step-by-Step Testing Walkthrough

1. **Sign In**: Navigate to `http://localhost:5173`. Click the quick-fill demo button and sign in.
2. **Review Dashboard & Tactical Map**: Observe the 4 monitored trauma centers (Metro General Level 1, St. Jude, etc.), ambulance origin pin, and live route options.
3. **Emergency Corridor Calculation**:
   - Change the origin to *Market St & Civic Plaza* or *Sunset West*.
   - Select *Metro General Hospital*.
   - Click **"Compute Optimal Emergency Routes"**.
   - Notice the suitability scores, baseline ETAs, and AI tactical explanation card.
4. **Simulate a Roadblock & Trigger Dynamic Rerouting**:
   - Click the **"Roadblocks"** button or **"Inject Hazard"** button.
   - Choose the preset **"⚡ Interstate Multi-Vehicle Catastrophe"** or create a custom hazard.
   - Click **"Deploy Roadblock & Recalculate Routes"**.
   - Observe the flashing **"CRITICAL ROADBLOCK COLLISION DETECTED / ACTIVE REROUTE"** banner!
   - Route Alpha is tagged with **"Blocked"**, and Route Bravo or Charlie is promoted as the new recommended route.
5. **Dispatch Corridor**:
   - Click **"Dispatch This Corridor"** on the recommended route.
   - A success notification confirms unit dispatch, and telemetry is recorded in the database.
6. **Inspect Route History**:
   - Click **"History"** in the top navigation bar to audit all past dispatched runs, timestamps, and AI explanations.
7. **Clear & Resolve Roadblock**:
   - Open the Incident Manager, click **"Clear & Resolve"** on the active roadblock.
   - The system automatically restores the primary medical corridor.

---

## ☁️ Deployment Instructions

### Option 1: Backend on Render (with Managed PostgreSQL)

1. **Create PostgreSQL Database on Render**:
   - In Render Dashboard, click **New +** → **PostgreSQL**.
   - Copy the provided **Internal Database URL** or **External Database URL**.

2. **Update Prisma Schema for PostgreSQL**:
   In `server/prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Deploy Web Service on Render**:
   - Click **New +** → **Web Service** → Connect your repository.
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run seed`
   - **Start Command**: `npm run start`
   - **Environment Variables**:
     - `DATABASE_URL`: `postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require`
     - `JWT_SECRET`: `<your_strong_secret>`
     - `GEMINI_API_KEY`: `<optional_gemini_key>`
     - `PORT`: `5000`

---

### Option 2: Frontend on Vercel

1. **Import Repository to Vercel**:
   - Select your project repository.
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

2. **Configure API Proxy / Rewrites**:
   Create or ensure `client/vercel.json` exists:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-render-backend-app.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. **Environment Variables on Vercel**:
   - `VITE_GOOGLE_MAPS_API_KEY`: `<optional>`

4. Click **Deploy**. Your frontend is now connected to your live Render backend!

---

## 🔒 Hackathon Integrity & Simulation Disclaimer

- **Simulated Traffic & Roadblocks**: In compliance with hackathon transparency guidelines, all road closures, traffic bottlenecks, and incident densities in this demonstration are generated via the platform's simulated incident engine. It does not access live municipal emergency feeds without authorized agency credentials.
- **API Key Security**: Sensitive keys (`JWT_SECRET`, `GEMINI_API_KEY`) are managed exclusively via server-side environment variables and never exposed to client-side bundles.

---

## 📄 License
MIT License. Built for hackathon demonstration and emergency logistics research.
