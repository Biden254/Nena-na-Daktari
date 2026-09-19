# Nena na Daktari (NND)

Healthcare consultation assistant for doctors in Kenya. Captures consultation audio, structures clinical history, and provides evidence-backed medical suggestions.

## Tech Stack

- **Frontend:** React + TypeScript (deployed on Vercel)
- **Backend:** Django REST Framework (deployed on Render)
- **Database:** PostgreSQL (Render managed)
- **Local Development:** SQLite (zero setup) or Docker
- **CI/CD:** GitHub Actions

## Project Structure

```
├── backend/              # Django REST API
│   ├── apps/             # Modular Django applications
│   │   ├── accounts/     # Authentication & user management
│   │   ├── patients/     # Patient records
│   │   ├── encounters/   # Consultation encounters
│   │   └── core/         # Shared utilities & base models
│   ├── config/           # Django settings & configuration
│   ├── requirements/     # Python dependencies
│   └── manage.py
├── frontend/             # React TypeScript application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── services/     # API communication layer
│   │   └── types/        # TypeScript type definitions
│   └── public/
├── docker-compose.yml    # Local development environment
└── .github/workflows/    # CI/CD pipelines
```

## Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd nnd/dev

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/

**Note:** Local development uses SQLite by default — no PostgreSQL setup needed.

## Deployment

### Backend (Render)

1. **Create a PostgreSQL database** on Render (External connections)
2. **Create a Web Service** connected to this repository
3. **Configure environment variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `DJANGO_SETTINGS_MODULE` | `config.settings.prod` | |
| `DJANGO_SECRET_KEY` | *(generate one)* | Render can auto-generate |
| `DJANGO_ALLOWED_HOSTS` | `your-service.onrender.com` | |
| `DATABASE_URL` | *(paste Internal Database URL)* | From your Render PostgreSQL page |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Your Vercel frontend URL |

4. **Build command:**
   ```
   cd backend && pip install -r requirements/prod.txt && python manage.py collectstatic --noinput && python manage.py migrate
   ```

5. **Start command:**
   ```
   cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```

### Frontend (Vercel)

1. **Import repository** on Vercel
2. **Configure environment variables:**

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://your-backend.onrender.com/api` |

3. **Vercel auto-detects CRA.** No extra config needed — `vercel.json` handles build settings.

4. **After deployment**, update your Render backend's `CORS_ALLOWED_ORIGINS` with the Vercel URL.

### CORS Setup

The backend has CORS configured to allow:

- **Main domain:** `https://your-app.vercel.app` (set via `CORS_ALLOWED_ORIGINS`)
- **Preview deployments:** Automatically allowed via regex pattern (`https://nnd-frontend-*.vercel.app`)

If your Vercel project name differs from `nnd-frontend`, update the regex patterns in `backend/config/settings/base.py`.

## API Endpoints

### Authentication
- `POST /api/auth/token/` — Obtain JWT token pair
- `POST /api/auth/token/refresh/` — Refresh access token
- `POST /api/auth/register/` — Register new doctor account
- `GET /api/auth/profile/` — Get current user profile
- `POST /api/auth/logout/` — Logout (blacklist refresh token)

### Patients
- `GET /api/patients/` — List patients (search: `?search=query`)
- `POST /api/patients/` — Create patient
- `GET /api/patients/{id}/` — Retrieve patient
- `PATCH /api/patients/{id}/` — Update patient
- `DELETE /api/patients/{id}/` — Delete patient

### Encounters
- `GET /api/encounters/` — List encounters
- `POST /api/encounters/` — Start encounter
- `GET /api/encounters/{id}/` — Retrieve encounter
- `PATCH /api/encounters/{id}/` — Update encounter
- `POST /api/encounters/{id}/end/` — End encounter

### Health Check
- `GET /api/health/` — Service health status

## Sprint 1 Demo Flow

1. Doctor registers or logs in
2. Dashboard shows recent patients and consultations
3. Doctor creates a patient
4. Doctor opens the patient profile
5. Doctor starts a consultation
6. Encounter workspace opens with patient context

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description | Local Default |
|----------|-------------|---------------|
| `DJANGO_SECRET_KEY` | Django secret key | Insecure dev key |
| `DATABASE_URL` | PostgreSQL connection string | SQLite (empty) |
| `CORS_ALLOWED_ORIGINS` | Frontend origins | `http://localhost:3000` |
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8000/api` |

## License

Private — Nena na Daktari Team
