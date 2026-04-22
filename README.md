# PetStack

Multi-role pet services platform — React TypeScript × FastAPI × MongoDB.

## Roles
- **User** — browse shop, book vets, chat, track orders
- **Vet** — manage appointments, chat, write prescriptions
- **Product Seller** — manage listings, receive orders, track payouts
- **Admin** — approve vets/sellers, manage platform

## Tech Stack
- Backend: FastAPI + Motor + MongoDB
- Frontend: React 18 + TypeScript + Vite + Tailwind + shadcn/ui (×4)
- Auth: JWT (access token + httpOnly refresh cookie)
- Payments: Razorpay
- Files: Cloudinary

## Local Development

### 1. Clone the repo
git clone https://github.com/swathii-2004/petstack.git
cd petstack

### 2. Backend setup
cd backend
cp .env.example .env
# Fill in your MONGODB_URL, JWT_SECRET, Cloudinary credentials in .env
pip install -r requirements.txt
uvicorn app.main:app --reload

### 3. Seed admin account
cd backend
python seed_admin.py

### 4. Run frontends (each in a separate terminal)
cd frontend-user && npm install && npm run dev      # localhost:5173
cd frontend-vet && npm install && npm run dev       # localhost:5174
cd frontend-seller && npm install && npm run dev    # localhost:5175
cd frontend-admin && npm install && npm run dev     # localhost:5176

### 5. Or run everything with Docker
docker-compose up

## API Docs
http://localhost:8000/docs
