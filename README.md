# Nena na Daktari (NND)

Healthcare consultation assistant for doctors in Kenya. Captures consultation audio, structures clinical history, and provides evidence-backed medical suggestions.

## Tech Stack

- **Frontend:** React + TypeScript (deployed on Vercel)
- **Backend:** Django REST Framework (deployed on Render)
- **Database:** PostgreSQL (Render managed)
- **Local Development:** Docker Compose
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
- Docker & Docker Compose

### With Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd nnd

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000/api/
# - Admin Panel: http://localhost:8000/admin/
```

### Without Docker

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements/dev.txt
cp ../.env.example ../.env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/token/` - Obtain JWT token pair
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/token/blacklist/` - Logout (blacklist token)

### Patients
- `GET /api/patients/` - List patients
- `POST /api/patients/` - Create patient
- `GET /api/patients/{id}/` - Retrieve patient
- `PUT /api/patients/{id}/` - Update patient
- `DELETE /api/patients/{id}/` - Delete patient

### Encounters
- `GET /api/encounters/` - List encounters
- `POST /api/encounters/` - Start encounter
- `GET /api/encounters/{id}/` - Retrieve encounter
- `PATCH /api/encounters/{id}/` - Update encounter
- `POST /api/encounters/{id}/end/` - End encounter

### Health Check
- `GET /api/health/` - Service health status

## Sprint 1 Demo Flow

1. Doctor authenticates at login page
2. Doctor creates or selects a patient
3. Doctor starts an encounter for that patient
4. Encounter is associated with the doctor and patient

## Development Workflow

1. Create a feature branch from `main`
2. Make changes with tests
3. Open a pull request
4. CI runs automatically
5. Review and merge to `main`

## Environment Variables

See `.env.example` for all required environment variables.

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | Required |
| `DJANGO_DEBUG` | Debug mode | `True` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8000/api` |

## License

Private - Nena na Daktari Team
