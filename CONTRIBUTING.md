# Contributing to Nena na Daktari

Thank you for contributing to Nena na Daktari! This guide will help you get started.

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (recommended)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd nnd

# Start development environment
docker-compose -f docker-compose.dev.yml up

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

## Project Structure

```
├── backend/              # Django REST API
│   ├── apps/             # Modular Django applications
│   │   ├── accounts/     # Authentication & user management
│   │   ├── patients/     # Patient records
│   │   ├── encounters/   # Consultation encounters
│   │   └── core/         # Shared utilities & base models
│   ├── config/           # Django settings & configuration
│   └── requirements/     # Python dependencies
├── frontend/             # React TypeScript application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── services/     # API communication layer
│   │   └── types/        # TypeScript type definitions
│   └── public/
└── docker-compose.yml    # Local development environment
```

## Development Workflow

1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with tests

3. Run linting and tests locally
   ```bash
   # Backend
   cd backend
   black .
   isort .
   flake8 .
   python -m pytest

   # Frontend
   cd frontend
   npm run lint
   npm test
   ```

4. Commit your changes
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. Push to remote and open a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

6. CI will run automatically on your PR

7. After review and approval, merge to `main`

## Commit Message Convention

We follow Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Example:
```
feat: add patient search functionality

- Implemented search by name and national ID
- Added search input to patient list page
- Updated API endpoint with search parameter
```

## Code Style

### Python (Backend)

- Use Black for formatting
- Use isort for import sorting
- Follow PEP 8 guidelines
- Write docstrings for all public functions

### TypeScript (Frontend)

- Use ESLint and Prettier
- Follow Airbnb style guide
- Use TypeScript types for all props and state
- Write functional components with hooks

## Testing

### Backend Tests

```bash
cd backend
python -m pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## API Conventions

- Use RESTful endpoints
- Return proper HTTP status codes
- Use pagination for list endpoints
- Validate input with serializers
- Document API endpoints in README

## Getting Help

- Check the README.md for setup instructions
- Review the architecture documents in /Docs
- Open an issue for bugs or feature requests
- Ask questions in the team chat

## Code of Be respectful and inclusive in all interactions.
