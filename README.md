# PetStack

A full-stack platform for pet services, connecting pet owners with vets and sellers.

## Backend Setup

1. **Environment Variables**: Copy `.env.example` to `.env` (if provided) or create a new `.env` file in the `backend/` directory with the required variables (MongoDB URL, JWT secret, Cloudinary credentials, etc.).

2. **Install Dependencies**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Run the Server**:
```bash
uvicorn app.main:app --reload
```

## Admin Setup

To seed the initial admin user into the database, run the provided CLI script. This will prompt you for an email and password.

```bash
cd backend
python seed_admin.py
```
This script checks if an admin already exists before creating a new one, so it is safe to run multiple times.
