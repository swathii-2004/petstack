# PetStack — Phase Progress Tracker

> Mark tasks as completed by changing `- [ ]` to `- [x]`  
> Each phase ends with a working, demo-able state.  
> **Total estimated time: ~14 weeks**

---

## Progress Overview

| Phase | Title | Status | Duration |
|---|---|---|---|
| Phase 1 | Foundation & Auth | ✅ Completed | 2 weeks |
| Phase 2 | Admin Panel & Approval System | ✅ Completed | 1.5 weeks |
| Phase 3 | Product Seller Module | ✅ Completed | 2 weeks |
| Phase 4 | Orders & Payment Integration | ✅ Completed | 2 weeks |
| Phase 5 | Vet Module & Appointments | ✅ Completed | 2 weeks |
| Phase 6 | Realtime Chat | ✅ Completed | 1.5 weeks |
| Phase 7 | Dashboards, Analytics & Improvements | ✅ Completed | 2 weeks |
| Phase 8 | Testing, Security & Deployment | 🔲 Not started | 1.5 weeks |

> Update the status column as you go: `🔲 Not started` → `🔄 In progress` → `✅ Completed`

---

## Phase 1 — Foundation & Auth

> **Goal:** Project skeleton, database, JWT auth for all roles, document upload on signup, admin seed script.  
> **Milestone:** All 4 roles can register and login correctly end-to-end.

### Backend

#### Project setup
- [x] Initialize FastAPI project inside `backend/`
- [x] Configure `pyproject.toml` or `requirements.txt` with all dependencies
- [x] Set up `app/config.py` with pydantic-settings reading from `.env`
- [x] Set up `app/database.py` — Motor async MongoDB connection
- [x] Set up `app/main.py` — FastAPI app init, CORS, router registration
- [x] Create `.env.example` with all required variable names

#### Auth — User signup/login
- [x] Create `users` collection schema and Pydantic models
- [x] `POST /auth/signup` — user role, bcrypt hash, status: active, return JWT
- [x] `POST /auth/login` — verify password, check status, return access + refresh tokens
- [x] `POST /auth/refresh` — validate refresh token from httpOnly cookie, issue new access token
- [x] `POST /auth/logout` — clear httpOnly cookie
- [x] JWT utility: `encode_token()` and `decode_token()` in `utils/jwt.py`
- [x] `get_current_user()` dependency in `dependencies.py`
- [x] `require_role(["vet"])` role guard in `dependencies.py`

#### Auth — Vet/Seller signup with document upload
- [x] `POST /auth/signup` handles `multipart/form-data` for vet/seller roles
- [x] File validator: accept only PDF, JPG, PNG; reject if > 5MB
- [x] Upload validated files to Cloudinary, save URLs to DB
- [x] Vet/seller status set to `"pending"` on signup
- [x] Login returns `403` with clear message if status is `"pending"` or `"rejected"`

#### Admin seed script
- [x] `seed_admin.py` CLI script that creates an admin user in MongoDB
- [x] Script checks if admin already exists before creating (idempotent)
- [x] Document how to run it in README

### Frontend — All 4 apps

#### Project setup (repeat for each frontend)
- [x] `frontend-user` — Vite + React TS + Tailwind + shadcn/ui initialized
- [x] `frontend-vet` — same setup
- [x] `frontend-seller` — same setup
- [x] `frontend-admin` — same setup
- [x] Axios instance with base URL from `VITE_API_URL` and request interceptor that attaches JWT
- [x] Axios response interceptor: on 401 → call `/auth/refresh` → retry original request → on refresh fail → logout
- [x] `authStore.ts` (Zustand) — stores `user`, `token`, `isAuthenticated`
- [x] Protected route wrapper component that redirects to login if not authenticated

#### User app — Auth UI
- [x] Login page with email/password form + Zod validation
- [x] Signup page with name, email, password, confirm password
- [x] Show toast on login error / success
- [x] Redirect to dashboard on successful login

#### Vet app — Auth UI
- [x] Login page
- [x] Signup page with: name, email, password, license number, specialisation, clinic name, experience years
- [x] Document upload field: accepts PDF/JPG/PNG, shows file name after selection, max 5MB client-side check
- [x] Show "Awaiting admin approval" message after successful signup
- [x] Show specific message if login is attempted while still pending

#### Seller app — Auth UI
- [x] Login page
- [x] Signup page with: business name, GST number, email, password, phone
- [x] Document upload: trade license + ID proof
- [x] Show "Awaiting admin approval" message after successful signup

#### Admin app — Auth UI
- [x] Login page only — no signup route exists
- [x] Show error message if credentials are wrong

### Infrastructure
- [x] `docker-compose.yml` — MongoDB + backend containers for local dev
- [x] Backend `Dockerfile`
- [x] Root `.gitignore` covering Python, Node, env files, OS artifacts
- [x] Root `README.md` with setup instructions for local development
- [ ] `develop` branch created from `main`

---

## Phase 2 — Admin Panel & Approval System

> **Goal:** Admin can review uploaded documents, approve or reject vet/seller registrations, manage users.  
> **Milestone:** Full approval loop — vet signs up → admin approves → vet can log in.

### Backend

#### Approval endpoints
- [x] `GET /admin/pending?role=vet` — list all pending vet applications with document URLs
- [x] `GET /admin/pending?role=seller` — list all pending seller applications
- [x] `PUT /admin/approve/:user_id` — set status to `"active"`, log in admin_audit_log
- [x] `PUT /admin/reject/:user_id` `{ reason }` — set status to `"rejected"`, log in admin_audit_log
- [x] Send approval email via SendGrid on approve
- [x] Send rejection email with reason via SendGrid on reject
- [x] `admin_audit_log` collection — append-only, written on every admin action
- [x] All admin endpoints protected by `require_role(["admin"])`

#### User management endpoints
- [x] `GET /admin/users?role=&search=&page=` — paginated user list with filters
- [x] `PUT /admin/users/:id/deactivate` — set status to `"deactivated"`
- [x] `PUT /admin/users/:id/reactivate` — set status back to `"active"`

#### Platform stats
- [x] `GET /admin/analytics/overview` — return counts: total users, pending vets, pending sellers, active vets, active sellers, total products, total orders

### Frontend — Admin app

#### Layout
- [x] Sidebar navigation: Dashboard, Pending Approvals, Users, Analytics, Broadcasts
- [x] Top bar with admin name and logout button
- [x] Active route highlighting in sidebar

#### Pending approvals page
- [x] Tabbed view: "Pending Vets" tab and "Pending Sellers" tab
- [x] Each application card shows: name, email, submission date, time waiting (hours)
- [x] Amber highlight on applications waiting > 48 hours
- [x] Red highlight on applications waiting > 72 hours
- [x] "View Documents" button opens a modal

#### Document viewer modal
- [x] Inline PDF viewer for PDF documents (use `<iframe>` or `react-pdf`)
- [x] Image viewer for JPG/PNG documents
- [x] Document checklist inside modal (checkboxes admin ticks before approving)
- [x] "Approve" button → confirm dialog → calls approve endpoint → refreshes list
- [x] "Reject" button → modal with required reason text field → calls reject endpoint

#### User management page
- [x] Searchable, filterable table: name, email, role, status, joined date
- [x] Deactivate / Reactivate action per row with confirm dialog

#### Analytics overview
- [x] Stat cards: total users, active vets, active sellers, pending approvals
- [x] No charts yet — just numbers (charts come in Phase 7)

### Email templates (SendGrid)
- [x] Approval email: "Congratulations, your account has been approved. You can now log in."
- [x] Rejection email: "Your application was not approved. Reason: [reason]. You may resubmit."

---

## Phase 3 — Product Seller Module

> **Goal:** Sellers can manage product listings. Users can browse, search, and view products.  
> **Milestone:** User can browse products. Seller can add, edit, and delete products.

### Backend

#### Seller profile
- [x] `GET /sellers/me/profile` — get own profile
- [x] `PUT /sellers/me/profile` — update business name, bank details, etc.
- [x] `seller_profiles` collection with all fields from schema

#### Product CRUD
- [x] `POST /products` — create product with image upload to Cloudinary (seller only)
- [x] `GET /products/mine` — list own products with pagination (seller only)
- [x] `PUT /products/:id` — update product, seller can only update own products
- [x] `DELETE /products/:id` — soft delete (`is_active = false`)
- [x] `GET /products` — public listing with query params: `category`, `search`, `min_price`, `max_price`, `sort`, `page`
- [x] `GET /products/:id` — public product detail
- [x] Text index on `name` + `description` + `tags` for full-text search
- [x] Low stock detection: flag in response if `stock < low_stock_threshold`

#### Reviews (read only for now — write comes with orders in Phase 4)
- [x] `GET /reviews/product/:id` — list reviews for a product

### Frontend — Seller app

#### Layout
- [x] Sidebar: Dashboard, Products, Orders (empty for now), Inventory, Payouts (empty)
- [x] Dashboard shows placeholder stat cards

#### Products page
- [x] Product list table: image thumbnail, name, category, price, stock, status, actions
- [x] Low-stock rows highlighted in amber
- [x] "Add Product" button opens side drawer or modal form

#### Add/Edit product form
- [x] Fields: name, description, category (select), price, stock, low_stock_threshold
- [x] Multi-image upload: up to 5 images, preview thumbnails, remove individual images
- [x] Zod form validation
- [x] Success toast on save

### Frontend — User app

#### Shop page
- [x] Category filter tabs: All / Food / Grooming / Clothing / Accessories
- [x] Search bar with debounced API call
- [x] Product grid: image, name, price, rating stars, add to cart button
- [x] Pagination or infinite scroll

#### Product detail page
- [x] Image gallery (multiple images)
- [x] Name, description, price, stock availability
- [x] Quantity selector + Add to Cart button
- [x] Reviews section (read only)

#### Cart
- [x] Cart slide-over panel showing items, quantities, subtotal
- [x] Increase / decrease / remove items
- [x] "Proceed to Checkout" button (leads to Phase 4)

---

## Phase 4 — Orders & Payment Integration

> **Goal:** Users can checkout and pay via Stripe/COD. Sellers receive and manage orders.  
> **Milestone:** User pays → Seller sees order → Ships → User sees status update.

### Backend

#### Order creation and payment
- [x] `POST /orders/create` — validate cart, check stock, create order (status: placed), create Stripe session, return checkout URL
- [x] `POST /orders/verify` — verify Stripe session status, update order status to "confirmed", decrement stock
- [x] Removed Razorpay integration completely per user request
- [x] `transactions` collection — create record on each payment event
- [x] Stock check: if any item is out of stock at time of order, return `400` with which item

#### Order management
- [x] `GET /orders/user` — user's own orders with pagination and status filter
- [x] `GET /orders/seller` — seller's incoming orders with pagination and status filter
- [x] `PUT /orders/:id/status` — seller updates status: processing → shipped (with tracking_no) → delivered
- [x] `PUT /orders/:id/cancel` — user cancels (only if status is placed or confirmed)
- [x] Notify user via notification when seller updates order status

#### Refunds
- [x] Stripe refund integration (via Stripe dashboard or API)
- [x] Update order status to "refunded", update transaction record

### Frontend — User app

#### Checkout flow
- [x] Checkout page: review items, enter/select delivery address
- [x] "Pay Now" button → calls `/orders/create` → redirects to Stripe Checkout
- [x] On payment success → redirected to success page → show success page with order ID
- [x] On payment failure → show error with retry option

#### Orders page
- [x] List of all orders with status badge
- [x] Per-order status bar: Placed → Confirmed → Processing → Shipped → Delivered
- [x] Order detail expandable: items, amounts, tracking number when available

### Frontend — Seller app

#### Orders page
- [x] Order table with filters: All / Placed / Processing / Shipped / Delivered
- [x] New order notification — in-app badge
- [x] Per-order actions: "Confirm", "Mark as Shipped" (with tracking number field), "Mark as Delivered"
- [x] Refund tracking

#### Payout tracking
- [x] Payout panel showing real transaction history and earnings calculation
- [x] Total settled (delivered) vs pending (confirmed/shipped) stat cards

### Reviews (after delivery)
- [x] After order status = "delivered", user can submit product review
- [x] `POST /reviews` with `target_type: "product"`, `order_id`
- [x] One review per order item enforced
- [x] Review nudge banner shown in user's orders page after delivery

---

## Phase 5 — Vet Module & Appointments

> **Goal:** Vets manage availability and profile. Users discover vets and book appointments.  
> **Milestone:** User books → Vet accepts/rejects → User notified in real-time.

### Backend

#### Vet profile
- [x] `GET /vets` — public search with filters: `specialisation`, `species`, `available_today`, `min_rating`, `max_fee`
- [x] `GET /vets/:id` — public vet profile detail
- [x] `PUT /vets/me/profile` — vet updates own profile
- [x] `PUT /vets/me/availability` — vet sets weekly schedule + blocked dates
- [x] `GET /vets/:id/availability?date=` — returns available slots for a given date
- [x] `vet_profiles` collection — all fields from schema

#### Pets
- [x] `POST /pets` — user adds a pet
- [x] `GET /pets` — list user's pets
- [x] `PUT /pets/:id` — update pet info (vaccinations, weight, etc.)
- [x] `DELETE /pets/:id` — remove pet

#### Appointments
- [x] `POST /appointments/book` — user books: vet_id, pet_id, date, time_slot, reason
- [x] Validate: slot must be in vet's availability and not already booked
- [x] Notify vet via WebSocket + notification on new booking
- [x] `GET /appointments/user` — user's appointments with status filter
- [x] `GET /appointments/vet` — vet's appointments with status filter
- [x] `PUT /appointments/:id/accept` `{ note? }` — vet accepts, notify user, unlock chat room
- [x] `PUT /appointments/:id/reject` `{ note }` — vet rejects with note, notify user
- [x] `PUT /appointments/:id/complete` — vet marks complete, triggers review nudge for user
- [x] `PUT /appointments/:id/cancel` — user cancels (only if pending or accepted)

#### Prescriptions
- [x] `POST /prescriptions` — vet writes prescription after marking appointment complete
- [x] Generate prescription PDF (using Cloudinary or generated link)
- [x] `GET /prescriptions/:id` — retrieve prescription (user and vet of that appointment)
- [x] `GET /prescriptions/pet/:pet_id` — all prescriptions for a pet (user only)

### Frontend — User app

#### Vet discovery page
- [x] Search bar + filter panel: species, specialisation, available today toggle, max fee slider, min rating
- [x] Vet cards: photo, name, specialisation tags, rating, fee, "Book" button
- [x] Vet profile page: full bio, tags, availability calendar, reviews

#### Booking flow
- [x] Select pet (from user's pets list)
- [x] Pick date → fetch available slots for that date → select time slot
- [x] Enter reason for visit
- [x] Confirm booking → success message

#### Appointments page
- [x] Tabs: Upcoming / Past / Cancelled (Implemented via Filters)
- [x] Each card: vet name, pet, date/time, status badge, vet note if rejected
- [x] "Chat with vet" button visible only if status = "accepted"
- [x] Prescription download button if appointment is completed

#### Pets page
- [x] Pet profile cards with photo, name, species, age
- [x] Add pet form: name, species, breed, date of birth, weight, photo upload
- [x] Per-pet health timeline: vaccinations list, past appointments

---

## Phase 6 — Realtime Chat

> **Goal:** Live bidirectional chat between user and vet, available only after appointment acceptance.  
> **Milestone:** Messages delivered in real-time, chat history persisted.

### Backend

#### WebSocket server
- [x] `ConnectionManager` class in `utils/connection_manager.py` — manages rooms
- [x] `WebSocket /ws/chat/{appointment_id}` endpoint
- [x] Authenticate WS connection via token in query param `?token=<access_token>`
- [x] Validate that requesting user is either the user or vet of the appointment
- [x] On connect: join room, send last 50 messages as history
- [x] On message receive: save to `messages` collection, broadcast to all sockets in room
- [x] On disconnect: remove from room
- [x] `GET /chat/:id/history` — paginated message history for initial load

#### Chat access guard
- [x] Room is only accessible if there is an appointment with status = "accepted" or "completed"
- [x] Return error / close socket if no such appointment exists

### Frontend — User app

#### Chat page
- [x] List of active chats
- [x] Messages bubble layout: own messages right-aligned, vet messages left-aligned
- [x] Timestamps per message
- [x] Unread message indicators
- [x] Auto-scroll to latest message on new message
- [x] "Send" on Enter key
- [x] Reconnect logic (Exponential backoff handling)

### Frontend — Vet app

#### Chat page
- [x] Same structure as user chat page
- [x] Chat list shows patient name and pet name

### Notifications (real-time for all apps)
- [x] Backend: Notification service — creates notification doc
- [x] In-app badge showing unread count
- [x] Notification dropdown: title, message, time ago

---

## Phase 7 — Dashboards, Analytics & All Improvements

> **Goal:** Complete all 4 dashboards with charts, analytics, and all improvement features.  
> **Milestone:** All dashboards live with real data and meaningful visualisations.

### Backend — New analytics endpoints

- [x] `GET /users/me/dashboard` — recent orders + upcoming appointments
- [x] `GET /appointments/vet/dashboard` — today's session, pending, completed counts
- [x] `GET /orders/seller/payouts` — real earnings (available vs pending)
- [x] `GET /admin/analytics/overview` — global stats: total revenue, total orders, users

### User dashboard improvements
- [x] User Dashboard home page instead of redirecting to shop
- [x] Upcoming appointments widget
- [x] Recent orders summary widget
- [x] Quick navigation links to Shop, Find Vet, etc.

### Vet dashboard improvements
- [x] Today's session counter
- [x] Pending appointment request counter
- [x] Total completed sessions counter
- [x] Profile/Status overview strip

### Seller dashboard improvements
- [x] Real Total Orders received count
- [x] Recent Orders table with item counts and status
- [x] Functional Payouts page with Available/Pending/Lifetime earnings calculation
- [x] Low-stock alerts highlighted on dashboard

### Admin dashboard improvements
- [x] Real-time Total Revenue via MongoDB aggregation
- [x] Total Orders counter
- [x] Recent global orders table
- [x] Visual stat cards with modern design tokens

---

## Phase 8 — Testing, Security & Deployment

> **Goal:** Secure the platform, write tests, containerise, and deploy to production.  
> **Milestone:** Platform live on production URL, all roles functional, secured.

### Security hardening

- [ ] Rate limiting on auth endpoints: max 10 login attempts per IP per minute (slowapi)
- [ ] CORS config: restrict allowed origins to exact frontend URLs (no wildcard in production)
- [ ] All file uploads: validate MIME type server-side (not just extension), reject if mismatch
- [ ] All file uploads: size limit enforced server-side (not just client-side)
- [ ] Pydantic v2 strict validation on all request models — no extra fields accepted
- [ ] Razorpay webhook: verify `X-Razorpay-Signature` header on every webhook request
- [ ] Admin endpoints: double-check all are protected by `require_role(["admin"])`
- [ ] No sensitive data in JWT payload (no password, no bank details)
- [ ] `admin_audit_log` verified as append-only (no PUT/DELETE routes exist for it)
- [ ] MongoDB: create dedicated DB user with least-privilege access for the app
- [ ] Environment secrets not committed to repo (verify with `git log` check)

### Testing — Backend

- [ ] `tests/test_auth.py` — signup (user, vet, seller), login (active, pending, rejected), token refresh, logout
- [ ] `tests/test_admin.py` — approve, reject, user management endpoints
- [ ] `tests/test_products.py` — CRUD, access control (seller can only edit own products)
- [ ] `tests/test_orders.py` — create order, payment verify, status updates
- [ ] `tests/test_appointments.py` — book, accept, reject, complete, slot conflict prevention
- [ ] `tests/test_reviews.py` — post review, one-per-target enforcement
- [ ] All tests use a separate test MongoDB database (set in test config)
- [ ] 80%+ coverage on routers and services

### Testing — Frontend

- [ ] All Zod schemas tested: valid input passes, invalid input fails with correct message
- [ ] Auth store tested: login sets token, logout clears state
- [ ] Cart store tested: add, remove, update quantity, total calculation
- [ ] Axios interceptor tested: 401 triggers refresh, refresh failure triggers logout

### CI/CD

- [ ] `.github/workflows/deploy-backend.yml` — on push to `main` where `backend/**` changed → run tests → deploy to Railway/Render
- [ ] `.github/workflows/deploy-user.yml` — on push to `main` where `frontend-user/**` changed → Vercel deploy
- [ ] Same for vet, seller, admin frontends
- [ ] Tests must pass in CI before deploy step runs
- [ ] Environment variables set as GitHub Secrets

### Production deployment

- [ ] MongoDB Atlas cluster created (M0 free tier is fine to start)
- [ ] Cloudinary account set up, credentials added to env
- [ ] Razorpay account verified, live keys added to env
- [ ] SendGrid account set up, sender domain verified
- [ ] Backend deployed to Railway or Render with env vars set
- [ ] Backend health check endpoint `GET /health` returns `200 OK`
- [ ] All 4 frontends deployed to Vercel with correct root directories and env vars
- [ ] CORS on backend updated to production frontend URLs
- [ ] Admin seed script run on production DB to create admin account
- [ ] End-to-end smoke test on production: sign up as user → browse shop → sign up as vet → admin approves → user books appointment

### Post-deploy checklist

- [ ] All 4 login pages accessible at their respective domains
- [ ] Admin can log in and see dashboard
- [ ] Vet can sign up, upload documents
- [ ] Admin can approve vet → vet can log in
- [ ] User can browse products and add to cart
- [ ] Payment flow works in test mode end-to-end
- [ ] Chat connects and messages deliver in real-time
- [ ] Email delivery confirmed (approval email, rejection email, order receipt)
- [ ] No console errors in any frontend on first load

---

## Bugs & Issues Log

> Use this section to track bugs as you encounter them during development.

| # | Description | Phase found | Status |
|---|---|---|---|
| — | — | — | — |

---

## Notes

> Free-form notes, decisions, and things to revisit.

-

---

*Keep this file updated as you build. Every completed checkbox is progress.*
