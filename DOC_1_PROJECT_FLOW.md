# PetStack — Project Flow, Architecture & Technical Reference

> **Stack:** React TypeScript (×4 frontends) · FastAPI · MongoDB · JWT Auth  
> **Repo strategy:** Monorepo — one repo, 5 folders, deploy each independently

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Role Overview](#2-role-overview)
3. [System Architecture Flow](#3-system-architecture-flow)
4. [Authentication Flow](#4-authentication-flow)
5. [Feature Flows (per role)](#5-feature-flows-per-role)
6. [Database Models](#6-database-models)
7. [API Structure](#7-api-structure)
8. [Tech Stack](#8-tech-stack)
9. [Folder Structure](#9-folder-structure)
10. [Git Strategy](#10-git-strategy)
11. [Deployment Strategy](#11-deployment-strategy)

---

## 1. Project Overview

PetStack is a multi-role pet services platform with four completely independent frontends sharing one FastAPI backend and one MongoDB database.

| Service | URL (example) | Deploy target |
|---|---|---|
| Backend API | `api.petstack.com` | Railway / Render / VPS |
| User frontend | `app.petstack.com` | Vercel |
| Vet frontend | `vet.petstack.com` | Vercel |
| Seller frontend | `seller.petstack.com` | Vercel |
| Admin frontend | `admin.petstack.com` | Vercel |

---

## 2. Role Overview

| Role | Signup | Login | Approval needed |
|---|---|---|---|
| **User** | Public signup | Immediate | No |
| **Vet** | Signup + document upload | After admin approval | Yes |
| **Product Seller** | Signup + document upload | After admin approval | Yes |
| **Admin** | No public signup — seeded via CLI | Always active | No |

---

## 3. System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  [User App]   [Vet App]   [Seller App]   [Admin App]           │
│  React TS     React TS    React TS       React TS               │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTPS REST + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│                                                                 │
│  JWT Middleware → Role Guards → Route Handlers → Services       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Auth     │  │ Products │  │ Appoint- │  │ WebSocket    │  │
│  │ Router   │  │ Router   │  │ ments    │  │ Chat Manager │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                                                                 │
└──────┬──────────────┬──────────────┬──────────────┬────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
  [MongoDB]    [Cloudinary]    [Razorpay]    [SendGrid]
  Motor async   File/doc         Payment       Email
  driver        storage          gateway       service
```

### Request lifecycle

1. Client sends request with `Authorization: Bearer <access_token>`
2. FastAPI `get_current_user()` dependency decodes JWT → extracts `user_id` + `role`
3. Role guard checks if endpoint is permitted for that role
4. Business logic executes → reads/writes MongoDB via Motor (async)
5. File uploads → validated (type + size) → streamed to Cloudinary → URL saved in DB
6. Payment events → arrive via Razorpay webhook → HMAC signature verified
7. Realtime events → pushed via WebSocket to connected clients
8. Response returned with appropriate HTTP status

---

## 4. Authentication Flow

### 4.1 User signup (immediate access)

```
User fills form
     │
     ▼
POST /auth/signup
     │
     ├── Validate input (Pydantic)
     ├── Check email not already registered
     ├── Hash password (bcrypt)
     ├── Create user doc: { role: "user", status: "active" }
     └── Return access_token + set refresh_token in httpOnly cookie
```

### 4.2 Vet / Seller signup (approval required)

```
Vet/Seller fills form + uploads documents (PDF/JPG/PNG, max 5MB each)
     │
     ▼
POST /auth/signup  (multipart/form-data)
     │
     ├── Validate input fields
     ├── Validate file types and sizes
     ├── Upload documents to Cloudinary → save URLs
     ├── Hash password (bcrypt)
     ├── Create user doc: { role: "vet"|"seller", status: "pending" }
     └── Return 201: "Registration submitted. Awaiting admin approval."

     [Login blocked until status = "active"]
```

### 4.3 Admin approval flow

```
Admin logs in → opens pending approvals queue
     │
     ▼
Admin clicks application → views uploaded documents inline
     │
     ├── [APPROVE] → PUT /admin/approve/:user_id
     │       ├── status = "active"
     │       └── Send approval email via SendGrid
     │
     └── [REJECT]  → PUT /admin/reject/:user_id  { reason: "..." }
             ├── status = "rejected"
             └── Send rejection email with reason
                 (User can resubmit → new application, status = "pending" again)
```

### 4.4 Login flow (all roles)

```
POST /auth/login  { email, password }
     │
     ├── Find user by email
     ├── Check status == "active"  → 403 if pending/rejected
     ├── Verify password (bcrypt)
     ├── Generate access_token  (JWT, 15 min, payload: user_id + role)
     ├── Generate refresh_token (JWT, 7 days)
     ├── Set refresh_token in httpOnly cookie
     └── Return { access_token, user: { id, name, role } }
```

### 4.5 Token refresh

```
POST /auth/refresh
     │
     ├── Read refresh_token from httpOnly cookie
     ├── Verify and decode
     ├── Issue new access_token (15 min)
     └── Return { access_token }
```

### 4.6 JWT middleware (every protected route)

```python
# FastAPI dependency — applied to all protected routes
async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    payload = decode_jwt(token)          # raises 401 if invalid/expired
    user = await db.users.find_one({"_id": payload["user_id"]})
    if not user or user["status"] != "active":
        raise HTTPException(403)
    return user

# Role guard
def require_role(roles: list[str]):
    def guard(current_user = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(403, "Insufficient permissions")
        return current_user
    return guard
```

---

## 5. Feature Flows (per role)

### 5.1 User flows

#### Browse & purchase products

```
User opens Shop tab
     │
     ▼
GET /products?category=food&page=1&limit=20&search=...
     │
     ▼
User adds item to cart (frontend state — Zustand)
     │
     ▼
User clicks Checkout → fills address
     │
     ▼
POST /orders/create
     ├── Create order in DB (status: "placed")
     ├── Create Razorpay order → return razorpay_order_id
     └── Frontend opens Razorpay checkout
          │
          ▼
     User completes payment
          │
          ▼
     POST /orders/verify-payment { razorpay_order_id, payment_id, signature }
          ├── Verify HMAC signature
          ├── Update order status → "confirmed"
          └── Notify seller via WebSocket
```

#### Book a vet appointment

```
User opens Vet Discovery
     │
     ▼
GET /vets?specialisation=dog&available=true&rating_min=4
     │
     ▼
User selects vet → views profile + availability calendar
     │
     ▼
POST /appointments
     { vet_id, pet_id, date, time_slot, reason }
     │
     ├── Check slot not already booked
     ├── Create appointment (status: "pending")
     └── Notify vet via WebSocket

          [Vet sees new appointment request]
          │
          ├── PUT /appointments/:id/accept { note? }
          │       ├── status = "accepted"
          │       ├── Notify user via WebSocket
          │       └── Chat room unlocked between user ↔ vet
          │
          └── PUT /appointments/:id/reject { note }
                  ├── status = "rejected"
                  └── Notify user via WebSocket
```

#### Realtime chat (user ↔ vet)

```
Chat only available when appointment status = "accepted"
     │
     ▼
Frontend connects to WebSocket:
     ws://api.petstack.com/ws/chat/{room_id}
     room_id = alphabetically sorted concat of user_id + vet_id
     │
     ▼
On connect:
     ├── Authenticate via token query param: ?token=<access_token>
     ├── Join room
     └── Load message history: GET /chat/{room_id}/history
          │
          ▼
     User sends message → WS event → FastAPI WS manager
          ├── Save message to DB (chat_messages collection)
          └── Broadcast to all sockets in room_id
```

---

### 5.2 Vet flows

#### Manage availability

```
Vet opens Availability tab
     │
     ▼
GET /vets/me/availability
     │
     ▼
Vet sets weekly schedule:
     { monday: ["09:00","10:00","11:00",...], tuesday: [...], ... }
     │
     ▼
PUT /vets/me/availability
     └── Saved to vet_profiles.availability

[When user books a slot, that slot is marked unavailable automatically]
```

#### Write prescription after appointment

```
Appointment status = "completed"
     │
     ▼
Vet opens patient record → clicks "Write Prescription"
     │
     ▼
POST /prescriptions
     { appointment_id, medicines: [{ name, dosage, frequency, duration }], notes }
     │
     ├── Save prescription to DB
     ├── Generate PDF (reportlab/WeasyPrint)
     ├── Upload PDF to Cloudinary
     └── Notify user → prescription visible in their health timeline
```

---

### 5.3 Product Seller flows

#### Product CRUD

```
POST   /products          → Create listing (seller only)
GET    /products/mine     → List own products
PUT    /products/:id      → Update product
DELETE /products/:id      → Soft delete (is_active = false)

Each product: name, description, category, price, stock, images[], is_active
Images uploaded to Cloudinary on create/edit
```

#### Order management

```
New order arrives (WebSocket notification)
     │
     ▼
GET /orders/seller?status=placed
     │
     ▼
Seller reviews order → confirms stock
     │
     ▼
PUT /orders/:id/status { status: "processing" }
     │
     ▼
Ships item → PUT /orders/:id/status { status: "shipped", tracking_no: "..." }
     │
     ▼
Delivered → PUT /orders/:id/status { status: "delivered" }
     │
     └── User notified at each status change via WebSocket
```

---

### 5.4 Admin flows

#### Pending approval queue

```
GET /admin/pending?role=vet       → all vets with status "pending"
GET /admin/pending?role=seller    → all sellers with status "pending"

Each record includes:
  - name, email, registration date
  - document URLs (viewable inline)
  - Time waiting (for SLA tracking)
```

#### User management

```
GET    /admin/users?role=user&search=...&page=1
PUT    /admin/users/:id/deactivate
PUT    /admin/users/:id/reactivate
DELETE /admin/users/:id
```

---

## 6. Database Models

> MongoDB collections. All `_id` fields are MongoDB ObjectId.

### 6.1 users

```js
{
  _id: ObjectId,
  name: String,                          // required
  email: String,                         // unique, required
  hashed_password: String,               // bcrypt
  role: "user" | "vet" | "seller" | "admin",
  status: "pending" | "active" | "rejected" | "deactivated",
  avatar_url: String,
  phone: String,
  address: {
    line1: String, city: String, state: String, pincode: String
  },
  created_at: DateTime,
  updated_at: DateTime
}
// Indexes: email (unique), role, status
```

### 6.2 vet_profiles

```js
{
  _id: ObjectId,
  user_id: ObjectId,                     // ref: users
  license_number: String,
  specialisations: [String],             // ["dog","cat","bird","reptile"]
  condition_tags: [String],              // ["dental","ortho","derma"]
  bio: String,
  consultation_fee: Number,
  clinic_name: String,
  clinic_address: String,
  languages: [String],
  experience_years: Number,
  availability: {                        // weekly schedule
    monday:    [String],                 // ["09:00","10:00","11:00"]
    tuesday:   [String],
    wednesday: [String],
    thursday:  [String],
    friday:    [String],
    saturday:  [String],
    sunday:    [String]
  },
  blocked_dates: [Date],                 // holidays / leave
  doc_urls: [String],                    // uploaded license/degree docs
  average_rating: Number,                // computed, cached
  total_reviews: Number,
  is_profile_complete: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
// Indexes: user_id (unique)
```

### 6.3 seller_profiles

```js
{
  _id: ObjectId,
  user_id: ObjectId,                     // ref: users
  business_name: String,
  gst_number: String,
  bank_details: {
    account_number: String,
    ifsc: String,
    account_name: String
  },
  razorpay_account_id: String,           // for Route payouts
  doc_urls: [String],                    // trade license, ID proof
  total_products: Number,                // cached count
  total_sales: Number,                   // cached
  created_at: DateTime,
  updated_at: DateTime
}
// Indexes: user_id (unique)
```

### 6.4 products

```js
{
  _id: ObjectId,
  seller_id: ObjectId,                   // ref: users
  name: String,
  description: String,
  category: "food" | "grooming" | "clothing" | "accessories",
  price: Number,
  discounted_price: Number,              // null if no discount
  discount_expires_at: DateTime,
  stock: Number,
  low_stock_threshold: Number,           // alert when stock < this
  images: [String],                      // Cloudinary URLs
  is_active: Boolean,
  average_rating: Number,
  total_reviews: Number,
  total_sold: Number,                    // cached
  tags: [String],                        // for search
  created_at: DateTime,
  updated_at: DateTime
}
// Indexes: seller_id, category, is_active, tags (text index)
```

### 6.5 orders

```js
{
  _id: ObjectId,
  user_id: ObjectId,                     // ref: users
  seller_id: ObjectId,                   // ref: users
  items: [
    {
      product_id: ObjectId,
      name: String,                      // snapshot at time of order
      price: Number,
      quantity: Number,
      image_url: String
    }
  ],
  subtotal: Number,
  shipping_fee: Number,
  total: Number,
  status: "placed" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded",
  payment_id: String,                    // Razorpay payment_id
  razorpay_order_id: String,
  tracking_number: String,
  shipping_address: {
    name: String, line1: String, city: String, state: String, pincode: String, phone: String
  },
  cancellation_reason: String,
  refund_id: String,
  created_at: DateTime,
  updated_at: DateTime
}
// Indexes: user_id, seller_id, status, created_at
```

### 6.6 appointments

```js
{
  _id: ObjectId,
  user_id: ObjectId,                     // ref: users
  vet_id: ObjectId,                      // ref: users
  pet_id: ObjectId,                      // ref: pets
  date: Date,
  time_slot: String,                     // "10:00"
  reason: String,
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled",
  vet_note: String,                      // note on accept/reject
  prescription_id: ObjectId,            // ref: prescriptions (after completion)
  chat_room_id: String,                  // unlocked when accepted
  created_at: DateTime,
  updated_at: DateTime
}
// Indexes: user_id, vet_id, status, date
```

### 6.7 pets

```js
{
  _id: ObjectId,
  owner_id: ObjectId,                    // ref: users
  name: String,
  species: "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other",
  breed: String,
  date_of_birth: Date,
  weight_kg: Number,
  photo_url: String,
  health_notes: String,
  vaccinations: [
    {
      name: String,
      date_given: Date,
      next_due: Date,
      doc_url: String
    }
  ],
  created_at: DateTime,
  updated_at: DateTime
}
// Indexes: owner_id
```

### 6.8 prescriptions

```js
{
  _id: ObjectId,
  appointment_id: ObjectId,             // ref: appointments
  vet_id: ObjectId,                     // ref: users
  user_id: ObjectId,                    // ref: users
  pet_id: ObjectId,                     // ref: pets
  medicines: [
    {
      name: String,
      dosage: String,                   // "500mg"
      frequency: String,               // "twice daily"
      duration: String,                // "7 days"
      notes: String
    }
  ],
  general_notes: String,
  recommended_product_ids: [ObjectId],  // ref: products
  pdf_url: String,                      // Cloudinary URL
  created_at: DateTime
}
// Indexes: appointment_id, user_id, vet_id
```

### 6.9 chat_messages

```js
{
  _id: ObjectId,
  room_id: String,                      // sorted(user_id + vet_id)
  sender_id: ObjectId,                  // ref: users
  receiver_id: ObjectId,               // ref: users
  message: String,
  is_read: Boolean,
  created_at: DateTime
}
// Indexes: room_id + created_at (compound), is_read
```

### 6.10 reviews

```js
{
  _id: ObjectId,
  reviewer_id: ObjectId,               // ref: users
  target_id: ObjectId,                 // ref: users (vet) OR products
  target_type: "vet" | "product",
  rating: Number,                      // 1–5
  comment: String,
  appointment_id: ObjectId,            // ref: appointments (for vet reviews)
  order_id: ObjectId,                  // ref: orders (for product reviews)
  created_at: DateTime
}
// Indexes: target_id + target_type, reviewer_id
// Unique: reviewer_id + target_id + target_type (one review per target)
```

### 6.11 notifications

```js
{
  _id: ObjectId,
  user_id: ObjectId,                   // ref: users
  title: String,
  message: String,
  type: "appointment" | "order" | "chat" | "approval" | "system",
  is_read: Boolean,
  action_url: String,                  // deep link in frontend
  created_at: DateTime
}
// Indexes: user_id + is_read, created_at
```

### 6.12 transactions

```js
{
  _id: ObjectId,
  order_id: ObjectId,                  // ref: orders
  user_id: ObjectId,                   // ref: users
  seller_id: ObjectId,                 // ref: users
  amount: Number,
  platform_fee: Number,                // commission if applicable
  seller_payout: Number,
  gateway: "razorpay" | "stripe",
  gateway_order_id: String,
  gateway_payment_id: String,
  gateway_payout_id: String,
  status: "initiated" | "captured" | "refunded" | "failed",
  created_at: DateTime
}
// Indexes: order_id, user_id, seller_id, status
```

### 6.13 admin_audit_log

```js
{
  _id: ObjectId,
  admin_id: ObjectId,                  // ref: users
  action: "approve" | "reject" | "deactivate" | "delete" | "broadcast",
  target_id: ObjectId,                 // who was acted upon
  target_role: String,
  reason: String,
  metadata: Object,                    // any extra context
  created_at: DateTime
}
// Indexes: admin_id, action, created_at
// This collection is append-only — never delete or update records
```

---

## 7. API Structure

All routes prefixed with `/api/v1`

| Router | Prefix | Key endpoints | Access |
|---|---|---|---|
| Auth | `/auth` | `POST /signup`, `POST /login`, `POST /refresh`, `POST /logout` | Public |
| Users | `/users` | `GET /me`, `PUT /me`, `GET /me/notifications` | User |
| Pets | `/pets` | `POST /`, `GET /`, `PUT /:id`, `DELETE /:id` | User |
| Vets | `/vets` | `GET /` (search), `GET /:id`, `PUT /me/profile`, `PUT /me/availability` | Vet + Public |
| Appointments | `/appointments` | `POST /`, `GET /user`, `GET /vet`, `PUT /:id/accept`, `PUT /:id/reject`, `PUT /:id/complete` | User + Vet |
| Prescriptions | `/prescriptions` | `POST /`, `GET /:id`, `GET /user/:user_id` | Vet (write) + User (read) |
| Chat | `/chat` | `GET /:room_id/history`, `WS /ws/chat/:room_id` | User + Vet |
| Products | `/products` | `GET /` (public), `POST /`, `PUT /:id`, `DELETE /:id`, `GET /mine` | Seller (CUD) + Public (R) |
| Orders | `/orders` | `POST /`, `GET /user`, `GET /seller`, `PUT /:id/status`, `POST /verify-payment` | User + Seller |
| Payments | `/webhook` | `POST /razorpay` | Razorpay server only |
| Reviews | `/reviews` | `POST /`, `GET /vet/:id`, `GET /product/:id` | User (write) + Public (read) |
| Admin | `/admin` | `GET /pending`, `PUT /approve/:id`, `PUT /reject/:id`, `GET /users`, `GET /analytics`, `POST /broadcast` | Admin only |
| Notifications | `/notifications` | `GET /`, `PUT /:id/read`, `PUT /read-all` | Authenticated |

---

## 8. Tech Stack

### Backend

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.12 | Runtime |
| FastAPI | 0.111+ | Web framework |
| Motor | 3.x | Async MongoDB driver |
| Pydantic v2 | 2.x | Request/response validation |
| python-jose | 3.x | JWT encode/decode |
| bcrypt | 4.x | Password hashing |
| cloudinary | 1.x | File/image uploads |
| razorpay | 1.x | Payment integration |
| sendgrid | 6.x | Transactional email |
| slowapi | 0.1.x | Rate limiting |
| pytest + httpx | latest | Testing |
| uvicorn | 0.29+ | ASGI server |

### Frontend (all 4 apps — identical stack)

| Tool | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | Component library |
| React Query (TanStack) | 5.x | Server state, caching |
| Zustand | 4.x | Client state |
| React Router | 6.x | Routing |
| Axios | 1.x | HTTP client |
| Socket.IO client | 4.x | WebSocket (chat) |
| Recharts | 2.x | Charts and analytics |
| React Hook Form + Zod | latest | Form handling + validation |
| date-fns | 3.x | Date utilities |

### Infrastructure

| Tool | Purpose |
|---|---|
| MongoDB Atlas | Managed database (free tier to start) |
| Cloudinary | Media and document storage (free tier) |
| Razorpay | Payments (India) |
| SendGrid | Email (100/day free) |
| Vercel | 4 frontend deploys |
| Railway / Render | Backend deploy |
| Docker | Local development + production containerization |
| GitHub Actions | CI/CD |

---

## 9. Folder Structure

```
petstack/                                   ← monorepo root
│
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml              ← deploys on push to backend/**
│       ├── deploy-user.yml                 ← deploys on push to frontend-user/**
│       ├── deploy-vet.yml
│       ├── deploy-seller.yml
│       └── deploy-admin.yml
│
├── backend/
│   ├── app/
│   │   ├── main.py                         ← FastAPI app init, router registration, CORS
│   │   ├── config.py                       ← Settings via pydantic-settings (.env)
│   │   ├── database.py                     ← Motor client + db connection
│   │   ├── dependencies.py                 ← get_current_user(), require_role()
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── pets.py
│   │   │   ├── vets.py
│   │   │   ├── appointments.py
│   │   │   ├── prescriptions.py
│   │   │   ├── products.py
│   │   │   ├── orders.py
│   │   │   ├── reviews.py
│   │   │   ├── chat.py
│   │   │   ├── admin.py
│   │   │   ├── notifications.py
│   │   │   └── webhooks.py
│   │   │
│   │   ├── models/                         ← Pydantic schemas (request + response)
│   │   │   ├── user.py
│   │   │   ├── vet.py
│   │   │   ├── seller.py
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   ├── appointment.py
│   │   │   ├── prescription.py
│   │   │   ├── chat.py
│   │   │   ├── review.py
│   │   │   └── notification.py
│   │   │
│   │   ├── services/                       ← Business logic (called by routers)
│   │   │   ├── auth_service.py
│   │   │   ├── payment_service.py
│   │   │   ├── upload_service.py
│   │   │   ├── email_service.py
│   │   │   └── notification_service.py
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.py                      ← encode/decode helpers
│   │   │   ├── hashing.py                  ← bcrypt helpers
│   │   │   └── validators.py               ← file type/size validators
│   │   │
│   │   └── websocket/
│   │       └── manager.py                  ← ConnectionManager for chat rooms
│   │
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_products.py
│   │   ├── test_orders.py
│   │   └── test_appointments.py
│   │
│   ├── seed_admin.py                       ← CLI: creates admin user in DB
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend-user/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                         ← Routes definition
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── SignupPage.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── shop/
│   │   │   │   ├── ShopPage.tsx
│   │   │   │   ├── ProductDetailPage.tsx
│   │   │   │   └── CartPage.tsx
│   │   │   ├── vets/
│   │   │   │   ├── VetDiscoveryPage.tsx
│   │   │   │   └── VetProfilePage.tsx
│   │   │   ├── appointments/
│   │   │   │   └── AppointmentsPage.tsx
│   │   │   ├── chat/
│   │   │   │   └── ChatPage.tsx
│   │   │   ├── orders/
│   │   │   │   └── OrdersPage.tsx
│   │   │   └── pets/
│   │   │       └── PetsPage.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── shop/
│   │   │   ├── appointments/
│   │   │   ├── chat/
│   │   │   └── shared/
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── cartStore.ts
│   │   │   └── notificationStore.ts
│   │   ├── api/
│   │   │   ├── axios.ts                    ← Axios instance with interceptors
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── appointments.ts
│   │   │   └── vets.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts                  ← Socket.IO hook
│   │   │   └── useNotifications.ts
│   │   └── types/
│   │       └── index.ts                    ← Shared TypeScript interfaces
│   ├── .env.example
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── frontend-vet/                           ← Same structure as frontend-user
│   └── src/
│       └── pages/
│           ├── auth/
│           ├── dashboard/
│           ├── appointments/
│           ├── patients/
│           ├── prescriptions/
│           ├── availability/
│           ├── chat/
│           └── earnings/
│
├── frontend-seller/                        ← Same structure
│   └── src/
│       └── pages/
│           ├── auth/
│           ├── dashboard/
│           ├── products/
│           ├── orders/
│           ├── inventory/
│           └── payouts/
│
├── frontend-admin/                         ← Same structure
│   └── src/
│       └── pages/
│           ├── auth/
│           ├── dashboard/
│           ├── approvals/
│           ├── users/
│           ├── analytics/
│           └── broadcasts/
│
├── docker-compose.yml                      ← Local dev: backend + MongoDB
├── .gitignore
└── README.md
```

---

## 10. Git Strategy

### Branch model

```
main                ← production-ready code only
  └── develop       ← integration branch (all features merged here first)
        ├── feature/auth-jwt
        ├── feature/product-crud
        ├── feature/appointments
        ├── feature/realtime-chat
        ├── fix/order-payment-verify
        └── chore/docker-setup
```

### Branch naming convention

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<scope>-<description>` | `feature/vet-availability-calendar` |
| Bug fix | `fix/<scope>-<description>` | `fix/user-cart-quantity-bug` |
| Chore | `chore/<description>` | `chore/add-eslint-config` |
| Hotfix | `hotfix/<description>` | `hotfix/payment-webhook-signature` |

### Commit message convention (Conventional Commits)

```
<type>(<scope>): <short description>

Types: feat, fix, chore, docs, refactor, test, style
Scopes: backend, user, vet, seller, admin, shared

Examples:
feat(backend): add appointment accept/reject endpoints
fix(user): resolve cart total calculation on quantity change
chore(admin): configure tailwind for admin frontend
docs: update folder structure in DOC_1
test(backend): add pytest cases for auth login flow
```

### Workflow

```
1. Pull latest develop
   git checkout develop && git pull origin develop

2. Create feature branch
   git checkout -b feature/product-crud

3. Develop + commit with conventional commits

4. Push and open PR → develop
   git push origin feature/product-crud

5. PR checklist before merge:
   - [ ] No TypeScript errors
   - [ ] No failing tests
   - [ ] .env.example updated if new env vars added
   - [ ] Pydantic schemas updated for new fields

6. Merge to develop (squash merge preferred)

7. When develop is stable and tested → merge to main → auto-deploy triggers
```

### .gitignore (root level)

```gitignore
# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/

# Node
node_modules/
dist/
.next/

# Env files
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Uploads (local dev)
uploads/
```

---

## 11. Deployment Strategy

### Local development

```bash
# Start MongoDB + backend together
docker-compose up

# Each frontend runs separately
cd frontend-user && npm run dev    # localhost:5173
cd frontend-vet && npm run dev     # localhost:5174
cd frontend-seller && npm run dev  # localhost:5175
cd frontend-admin && npm run dev   # localhost:5176
```

### docker-compose.yml (local dev)

```yaml
version: "3.9"
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  mongo_data:
```

### Production deploys

| Service | Platform | Trigger |
|---|---|---|
| `backend/` | Railway or Render | Push to `main` — `deploy-backend.yml` |
| `frontend-user/` | Vercel (root dir: `frontend-user`) | Push to `main` — auto |
| `frontend-vet/` | Vercel (root dir: `frontend-vet`) | Push to `main` — auto |
| `frontend-seller/` | Vercel (root dir: `frontend-seller`) | Push to `main` — auto |
| `frontend-admin/` | Vercel (root dir: `frontend-admin`) | Push to `main` — auto |

### Environment variables per service

**backend/.env**
```
MONGODB_URL=mongodb+srv://...
JWT_SECRET=your_super_secret_key
JWT_ALGORITHM=HS256
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
SENDGRID_API_KEY=
FRONTEND_USER_URL=https://app.petstack.com
FRONTEND_VET_URL=https://vet.petstack.com
FRONTEND_SELLER_URL=https://seller.petstack.com
FRONTEND_ADMIN_URL=https://admin.petstack.com
```

**frontend-*/. env**
```
VITE_API_URL=https://api.petstack.com/api/v1
VITE_WS_URL=wss://api.petstack.com
VITE_RAZORPAY_KEY_ID=rzp_live_...
```

---

*Last updated: April 2026*

april fool
