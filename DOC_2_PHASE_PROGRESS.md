# PetStack — Phase Progress Tracker

> Mark tasks as completed by changing `- [ ]` to `- [x]`  
> Each phase ends with a working, demo-able state.  
> **Total estimated time: ~14 weeks**

---

## Progress Overview

| Phase | Title | Status | Duration |
|---|---|---|---|
| Phase 1 | Foundation & Auth | ✅ Completed | 2 weeks |
| Phase 2 | Admin Panel & Approval System | 🔄 In progress | 1.5 weeks |
| Phase 3 | Product Seller Module | 🔄 In progress | 2 weeks |
| Phase 4 | Orders & Payment Integration | 🔲 Not started | 2 weeks |
| Phase 5 | Vet Module & Appointments | 🔲 Not started | 2 weeks |
| Phase 6 | Realtime Chat | 🔲 Not started | 1.5 weeks |
| Phase 7 | Dashboards, Analytics & Improvements | 🔲 Not started | 2 weeks |
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
- [ ] Sidebar navigation: Dashboard, Pending Approvals, Users, Analytics, Broadcasts
- [ ] Top bar with admin name and logout button
- [ ] Active route highlighting in sidebar

#### Pending approvals page
- [ ] Tabbed view: "Pending Vets" tab and "Pending Sellers" tab
- [ ] Each application card shows: name, email, submission date, time waiting (hours)
- [ ] Amber highlight on applications waiting > 48 hours
- [ ] Red highlight on applications waiting > 72 hours
- [ ] "View Documents" button opens a modal

#### Document viewer modal
- [ ] Inline PDF viewer for PDF documents (use `<iframe>` or `react-pdf`)
- [ ] Image viewer for JPG/PNG documents
- [ ] Document checklist inside modal (checkboxes admin ticks before approving)
- [ ] "Approve" button → confirm dialog → calls approve endpoint → refreshes list
- [ ] "Reject" button → modal with required reason text field → calls reject endpoint

#### User management page
- [ ] Searchable, filterable table: name, email, role, status, joined date
- [ ] Deactivate / Reactivate action per row with confirm dialog

#### Analytics overview
- [ ] Stat cards: total users, active vets, active sellers, pending approvals
- [ ] No charts yet — just numbers (charts come in Phase 7)

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

> **Goal:** Users can checkout and pay via Razorpay. Sellers receive and manage orders.  
> **Milestone:** User pays → Seller sees order → Ships → User sees status update.

### Backend

#### Order creation and payment
- [ ] `POST /orders/create` — validate cart, check stock, create order (status: placed), create Razorpay order, return `razorpay_order_id`
- [ ] `POST /orders/verify-payment` — verify HMAC signature, update order status to "confirmed", decrement stock
- [ ] `POST /webhook/razorpay` — secondary confirmation from Razorpay server, handle payment failures
- [ ] `transactions` collection — create record on each payment event
- [ ] Stock check: if any item is out of stock at time of order, return `400` with which item

#### Order management
- [ ] `GET /orders/user` — user's own orders with pagination and status filter
- [ ] `GET /orders/seller` — seller's incoming orders with pagination and status filter
- [ ] `PUT /orders/:id/status` — seller updates status: processing → shipped (with tracking_no) → delivered
- [ ] `PUT /orders/:id/cancel` — user cancels (only if status is placed or confirmed)
- [ ] Notify user via notification when seller updates order status

#### Refunds
- [ ] `POST /orders/:id/refund` — seller initiates refund via Razorpay API
- [ ] Update order status to "refunded", update transaction record

### Frontend — User app

#### Checkout flow
- [ ] Checkout page: review items, enter/select delivery address
- [ ] "Pay Now" button → calls `/orders/create` → opens Razorpay checkout SDK
- [ ] On payment success → call `/orders/verify-payment` → show success page with order ID
- [ ] On payment failure → show error with retry option

#### Orders page
- [ ] List of all orders with status badge
- [ ] Per-order status bar: Placed → Confirmed → Processing → Shipped → Delivered
- [ ] Order detail expandable: items, amounts, tracking number when available

### Frontend — Seller app

#### Orders page
- [ ] Order table with filters: All / Placed / Processing / Shipped / Delivered
- [ ] New order notification — browser push + in-app badge
- [ ] Per-order actions: "Confirm", "Mark as Shipped" (with tracking number field), "Mark as Delivered"
- [ ] Refund button on delivered orders

#### Payout tracking
- [ ] Placeholder payout panel showing transaction history from DB
- [ ] Total settled vs pending stat cards

### Reviews (after delivery)
- [ ] After order status = "delivered", user can submit product review
- [ ] `POST /reviews` with `target_type: "product"`, `order_id`
- [ ] One review per order item enforced
- [ ] Review nudge banner shown in user's orders page after delivery

---

## Phase 5 — Vet Module & Appointments

> **Goal:** Vets manage availability and profile. Users discover vets and book appointments.  
> **Milestone:** User books → Vet accepts/rejects → User notified in real-time.

### Backend

#### Vet profile
- [ ] `GET /vets` — public search with filters: `specialisation`, `species`, `available_today`, `min_rating`, `max_fee`
- [ ] `GET /vets/:id` — public vet profile detail
- [ ] `PUT /vets/me/profile` — vet updates own profile
- [ ] `PUT /vets/me/availability` — vet sets weekly schedule + blocked dates
- [ ] `GET /vets/:id/availability?date=` — returns available slots for a given date
- [ ] `vet_profiles` collection — all fields from schema

#### Pets
- [ ] `POST /pets` — user adds a pet
- [ ] `GET /pets` — list user's pets
- [ ] `PUT /pets/:id` — update pet info (vaccinations, weight, etc.)
- [ ] `DELETE /pets/:id` — remove pet

#### Appointments
- [ ] `POST /appointments` — user books: vet_id, pet_id, date, time_slot, reason
- [ ] Validate: slot must be in vet's availability and not already booked
- [ ] Notify vet via WebSocket + notification on new booking
- [ ] `GET /appointments/user` — user's appointments with status filter
- [ ] `GET /appointments/vet` — vet's appointments with status filter
- [ ] `PUT /appointments/:id/accept` `{ note? }` — vet accepts, notify user, unlock chat room
- [ ] `PUT /appointments/:id/reject` `{ note }` — vet rejects with note, notify user
- [ ] `PUT /appointments/:id/complete` — vet marks complete, triggers review nudge for user
- [ ] `PUT /appointments/:id/cancel` — user cancels (only if pending or accepted)

#### Prescriptions
- [ ] `POST /prescriptions` — vet writes prescription after marking appointment complete
- [ ] Generate prescription PDF and upload to Cloudinary
- [ ] `GET /prescriptions/:id` — retrieve prescription (user and vet of that appointment)
- [ ] `GET /prescriptions/pet/:pet_id` — all prescriptions for a pet (user only)

### Frontend — User app

#### Vet discovery page
- [ ] Search bar + filter panel: species, specialisation, available today toggle, max fee slider, min rating
- [ ] Vet cards: photo, name, specialisation tags, rating, fee, "Book" button
- [ ] Vet profile page: full bio, tags, availability calendar, reviews

#### Booking flow
- [ ] Select pet (from user's pets list)
- [ ] Pick date → fetch available slots for that date → select time slot
- [ ] Enter reason for visit
- [ ] Confirm booking → success message

#### Appointments page
- [ ] Tabs: Upcoming / Past / Cancelled
- [ ] Each card: vet name, pet, date/time, status badge, vet note if rejected
- [ ] "Chat with vet" button visible only if status = "accepted"
- [ ] Prescription download button if appointment is completed

#### Pets page
- [ ] Pet profile cards with photo, name, species, age
- [ ] Add pet form: name, species, breed, date of birth, weight, photo upload
- [ ] Per-pet health timeline: vaccinations list with next-due dates, past appointments
- [ ] Add vaccination entry with document upload

### Frontend — Vet app

#### Dashboard
- [ ] Today's appointments timeline
- [ ] Pending requests count badge
- [ ] Quick action: "Accept all" (optional)

#### Appointments page
- [ ] Kanban board or tabbed view: Pending / Accepted / Completed / Rejected
- [ ] Pending card: pet name, owner name, reason, date/time — Accept or Reject buttons
- [ ] Reject opens modal with required note field
- [ ] Completed card has "Write Prescription" button

#### Availability page
- [ ] Weekly grid: toggle time slots on/off per day
- [ ] Block specific dates (date picker for holidays)
- [ ] Save changes

#### Patients page
- [ ] List of all users who have had appointments with this vet
- [ ] Click user → view their pet(s), past appointment history, prescriptions

#### Prescription writer
- [ ] Form: add medicine rows (name, dosage, frequency, duration, notes), general notes
- [ ] Product recommendation search (search platform products to attach)
- [ ] Preview prescription before submitting
- [ ] PDF auto-generated and saved

---

## Phase 6 — Realtime Chat

> **Goal:** Live bidirectional chat between user and vet, available only after appointment acceptance.  
> **Milestone:** Messages delivered in real-time, chat history persisted.

### Backend

#### WebSocket server
- [ ] `ConnectionManager` class in `websocket/manager.py` — manages rooms as `dict[room_id, set[WebSocket]]`
- [ ] `WebSocket /ws/chat/{room_id}` endpoint
- [ ] Authenticate WS connection via token in query param `?token=<access_token>`
- [ ] Validate that requesting user is either the user or vet of the appointment linked to this room
- [ ] On connect: join room, send last 50 messages as history
- [ ] On message receive: save to `chat_messages` collection, broadcast to all sockets in room
- [ ] On disconnect: remove from room
- [ ] `GET /chat/:room_id/history?page=` — paginated message history for initial load

#### Chat access guard
- [ ] Room is only accessible if there is an appointment with status = "accepted" linking the two users
- [ ] Return `403` if no such appointment exists

### Frontend — User app

#### Chat page
- [ ] List of active chats (appointments with status = "accepted")
- [ ] Click chat → open message thread
- [ ] Messages bubble layout: own messages right-aligned, vet messages left-aligned
- [ ] Timestamps per message
- [ ] Read receipt tick (single tick sent, double tick read)
- [ ] Unread message badge on chat list item
- [ ] Auto-scroll to latest message on new message
- [ ] "Send" on Enter key, Shift+Enter for new line
- [ ] Reconnect on WebSocket disconnect (exponential backoff)

### Frontend — Vet app

#### Chat page
- [ ] Same structure as user chat page
- [ ] Chat list shows patient name and pet name
- [ ] Unread badge in sidebar nav

### Notifications (real-time for all apps)
- [ ] Backend: `notification_service.py` — creates notification doc + sends via WS
- [ ] All 4 frontends: bell icon in nav showing unread count
- [ ] Notification dropdown: title, message, time ago, click to navigate
- [ ] "Mark all as read" action
- [ ] `GET /notifications` — fetch user's notifications
- [ ] `PUT /notifications/:id/read` and `PUT /notifications/read-all`

---

## Phase 7 — Dashboards, Analytics & All Improvements

> **Goal:** Complete all 4 dashboards with charts, analytics, and all improvement features.  
> **Milestone:** All dashboards live with real data and meaningful visualisations.

### Backend — New analytics endpoints

- [ ] `GET /users/me/spending-summary?months=3` — spending by category per month
- [ ] `GET /vets/me/earnings?period=monthly` — earnings breakdown
- [ ] `GET /vets/me/appointment-stats` — counts by species, by month
- [ ] `GET /sellers/me/revenue?period=monthly` — revenue by category per month
- [ ] `GET /sellers/me/order-funnel` — counts per status stage
- [ ] `GET /sellers/me/top-products?limit=5` — top selling products
- [ ] `GET /admin/analytics/growth` — weekly new signups per role
- [ ] `GET /admin/analytics/revenue` — platform-wide transaction volume

### User dashboard improvements
- [ ] Pet health timeline component: per-pet, chronological, filterable by type (vet visit, vaccination, prescription)
- [ ] Vaccination reminder setup: user sets due dates per vaccine per pet
- [ ] Reminder email sent 7 days and 1 day before due date (cron job or scheduled task)
- [ ] In-app reminder notification at due date
- [ ] Spending breakdown: doughnut chart — vet fees vs product spend, current month vs last month delta
- [ ] Multi-pet switcher pill in nav — filters entire dashboard to selected pet
- [ ] Reorder button on past orders — pre-fills cart with same items
- [ ] Post-appointment prescription card — downloadable PDF link in appointment detail
- [ ] Review nudge banner — appears after delivery or appointment completion, not intrusive

### Vet dashboard improvements
- [ ] Today's queue with countdown timers to each appointment
- [ ] "Start Chat" button activates exactly at appointment time
- [ ] Earnings line chart: weekly/monthly revenue, filterable by period
- [ ] Case volume chart: monthly appointments with species breakdown (stacked bar)
- [ ] Rating trend chart: average rating per month (line chart)
- [ ] Rating breakdown: 1–5 star count distribution (horizontal bar)
- [ ] Follow-up reminder setter: vet sets a reminder for user after consultation
- [ ] Profile completeness progress bar with missing field checklist

### Seller dashboard improvements
- [ ] Revenue by category stacked bar chart (monthly)
- [ ] Top 5 products bar chart
- [ ] Sales calendar heatmap (GitHub-style, daily order count shading)
- [ ] Order funnel chart (stages with counts and drop-off percentages)
- [ ] Low-stock alert strip at top of dashboard if any products below threshold
- [ ] Bulk product operations: select multiple → bulk update price or stock or active status
- [ ] New order browser push notification + subtle in-tab chime
- [ ] Payout history with settled vs pending totals

### Admin dashboard improvements
- [ ] Approval SLA tracker: each pending application shows "waiting X hours", amber at 48h, red at 72h
- [ ] Document authenticity checklist modal: structured checkboxes before approving
- [ ] Platform growth multi-line chart: new users / vets / sellers per week
- [ ] Dispute & report management: users can flag vets/sellers/orders → admin sees disputes table
- [ ] `POST /reports` — user submits a report with type and description
- [ ] `GET /admin/reports` — admin views open reports
- [ ] `PUT /admin/reports/:id` — admin resolves report (warn/suspend/dismiss)
- [ ] Revenue & commission tracker (if platform fee applies)
- [ ] Churned accounts detector: vets with 0 appointments in 30 days, sellers with 0 active products in 14 days
- [ ] Re-submission workflow: rejected vet/seller can submit new documents, admin sees "v2" tag on resubmission
- [ ] Targeted broadcast: send to all / by role / specific user, with schedule option
- [ ] Audit log viewer: paginated, filterable by action type and date range

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
