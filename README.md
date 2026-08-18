# 🌿 CarbonRoute

> **A Reproducible Benchmark and Deadline-Risk Calibrator for Carbon-Aware Batch Scheduling under Forecast Error**  
> *17-Week Software Engineering Project (UCS503)*  
> **Course Supervisor:** Sukhpal Singh  
> **Research Team:** Yuvika Nagpal, Kumkum Gupta, Aaneya Sabharwal  
> **Current Phase:** `PLANNING PHASE`

---

## 📌 Project Overview

CarbonRoute is a software system for evaluating carbon-aware batch scheduling when carbon forecasts, cloud capacity and workload conditions are uncertain.

The web platform serves as the team's permanent project website and submission repository throughout the 17-week semester, featuring:
1. **Public Research Website:**
   - **Home (`/`):** Hero with status badge, animated pipeline visual, "Why CarbonRoute?" problem formulation, planned capabilities, project flow, and team preview.
   - **Project Specification (`/project`):** 10 structured sections covering Problem, Motivation, Core Research Question, 10 Objectives, Scope (Included vs Not Included), Proposed System, 7 Scheduling Policies (with Oracle reference disclaimer), Uncertainty & Risk Formulation (Scenario A vs B), Evaluation metrics (marked *"To be evaluated"*), and 17-Week Roadmap.
   - **System Architecture (`/architecture`):** Interactive clickable pipeline from Workload Generator to API/Dashboard + full-stack software topology (React, FastAPI, Simulation/Scheduling services, Storage).
   - **Development Roadmap (`/roadmap`):** Phased 17-week development milestones from initial requirements to university semester defense.
   - **Presentations Archive (`/presentations`):** Permanent archive of all course deliverables (Software Grid, Planning V1, Planning V2, Mid-Sem, Final).
   - **Planning Presentation Viewer (`/presentations/planning/v1`):** Embedded real PDF presentation viewer with pagination, zoom, download, and Project Summary.
   - **Future Dashboard Preview (`/dashboard`):** Modular UI architecture preview labeled *"Coming During Development"*.
   - **Team Profile (`/team`):** Roles for Yuvika Nagpal, Kumkum Gupta, and Aaneya Sabharwal, plus shared responsibilities notice.
2. **Admin / Content Management Area (`/admin`):**
   - Secure login with session/JWT authentication and bcrypt password hashing.
   - Dashboard statistics: Total Presentations, Published Versions, Drafts, Recent Uploads.
   - Upload & versioning workflow: Drag-and-drop PPT/PDF upload, metadata input (Title, Type, Version, Date, Authors, Change Summary), **Interactive Preview Modal**, and **Publish** action.
   - Immutable version retention: When V2 or V3 is published, V1 remains permanently accessible with full audit traceability.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend:** Node.js / Express (TypeScript), REST API (FastAPI-compatible architecture)
- **Document Rendering:** In-browser PDF streaming (`inline` & `attachment`), PDF.js canvas frame, and interactive slide stage
- **Database:** JSON Document Database / PostgreSQL compatibility via SQLAlchemy / structured schema
- **Security:** JWT Authentication, Bcrypt Password Hashing, Helmet security headers, CORS origin verification

```
                         CARBONROUTE WEBSITE
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
             PUBLIC SITE                         ADMIN
                 │                                 │
        ┌────────┼────────┐                 Upload PPT/PDF
        │        │        │                        │
       Home   Project  Presentations          Add metadata
        │        │        │                        │
     Future   Roadmap Planning V1               Preview
    Dashboard             │                        │
                      View PPT                  Publish
                                                   │
                                          Public presentation
                                                   │
                                          Version remains saved
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (v18+ recommended, v20+ or v24+ supported)
- npm

### 1. Installation

```bash
# Clone the repository and navigate to project root
cd carbonroute

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Generate Initial Presentation PDF

To generate the official multi-slide `CarbonRoute_Planning_Presentation_V1.pdf` document:

```bash
cd carbonroute
node scripts/generate_presentation_pdf.js
```

### 3. Environment Variables

Create `.env` files in `backend/` and `frontend/` (sample files provided):

**`backend/.env`**:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=carbonroute_super_secure_academic_jwt_secret_2026
STORAGE_TYPE=local
LOCAL_STORAGE_DIR=./uploads
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@carbonroute.org
ADMIN_PASSWORD=CarbonRoute2026!Secure
```

**`frontend/.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Running Locally

**Option A: Running Backend & Frontend in Development Mode**

```bash
# In Terminal 1 (Backend):
cd backend
npm run dev

# In Terminal 2 (Frontend):
cd frontend
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api`

**Option B: Production Build (Single Port Unified Server)**

```bash
# Build Frontend
cd frontend
npm run build

# Build Backend
cd ../backend
npm run build

# Start Unified Server
node dist/index.js
```
The server serves both the REST API and the React frontend on `http://localhost:5000`.

---

## 🔐 Admin Authentication & Credentials

| Credential | Value |
|---|---|
| **Login URL** | `/admin` or `/admin/login` |
| **Username** | `admin` |
| **Email** | `admin@carbonroute.org` |
| **Password** | `CarbonRoute2026!Secure` |

---

## 🔄 Live Demonstration Flow

To demonstrate the full end-to-end workflow to the course evaluator:

1. **Step 1:** Open the public website at `http://localhost:5000/` (or `http://localhost:5173/`).
2. **Step 2:** Click **Presentations** in the top navigation.
3. **Step 3:** Open **Planning Presentation V1**.
4. **Step 4:** View the real embedded presentation document inside the web browser with page navigation, zoom, and fullscreen controls. Inspect the **Project Summary** below.
5. **Step 5:** Navigate to **Admin / Login** (`/admin`).
6. **Step 6:** Log in with credentials (`admin` / `CarbonRoute2026!Secure`).
7. **Step 7:** Click **Upload Presentation**.
8. **Step 8:** Select a PDF/PPT file, enter metadata:
   - **Title:** `Planning Presentation V2`
   - **Deliverable Type:** `Planning Presentation`
   - **Version:** `v2`
   - **Date:** `2026-08-24`
   - **Authors:** `Yuvika Nagpal, Kumkum Gupta, Aaneya Sabharwal`
   - **Change Summary:** `Updated uncertainty variance calibration curves and trace schemas`
9. **Step 9:** Click **Preview** to verify the metadata dialog.
10. **Step 10:** Click **Publish**.
11. **Step 11:** Navigate to the public **Presentations** page (`/presentations`).
12. **Step 12:** Open the newly published **Planning Presentation V2** (`/presentation/v2`).
13. **Step 13:** Verify that **Planning Presentation V1** (`/presentations/planning/v1`) remains completely intact and accessible.

---

## 🗄️ Database & Storage Architecture

### Presentations Model (`PresentationItem`)
```typescript
interface PresentationItem {
  id: string;
  title: string;
  deliverableType: 'software_grid' | 'planning' | 'midterm' | 'final' | 'other';
  versionTag: string; // 'v1', 'v2', etc.
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  authors: string[];
  uploaderName: string;
  status: 'published' | 'draft' | 'archived';
  presentationDate: string;
  sha256Checksum: string;
  changeSummary: string;
  previousVersionId?: string;
  createdAt: string;
  publishedAt?: string;
}
```

### Storage Retention
- Files are stored in `backend/uploads/presentations/` and assigned SHA-256 integrity checksums.
- Served with HTTP `Content-Disposition: inline` for in-browser PDF rendering and `?download=true` for local saving.

---

## 👥 Research Team & Responsibilities

| Team Member | Core Focus |
|---|---|
| **Yuvika Nagpal** | Simulation / Data / Workload Modelling |
| **Kumkum Gupta** | Scheduling Algorithms / Uncertainty / Risk Calibration |
| **Aaneya Sabharwal** | Backend / Dashboard / Deployment / Integration |

> *Testing, documentation, evaluation and presentation are shared team responsibilities.*
