<<<<<<< HEAD
# EventsHub
events center managemet system
=======
# EventsHub SaaS — Events Center Management System

## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL 16
- Auth: JWT + Email Verification
- Storage: Cloudinary
- Payments: Stripe
- Email: Nodemailer

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 16
- Git

### Step 1: Clone and install
git clone [repo]
cd events-center
cd backend && npm install
cd ../frontend && npm install

### Step 2: Database setup
1. Create PostgreSQL database named 'eventshub'
2. cd backend
3. psql -U postgres -d eventshub -f scripts/001_init.sql
4. Update .env with your DATABASE_URL

### Step 3: Configure environment
- Copy .env.example to .env in backend/
- Fill in all required values (see ENVIRONMENT VARIABLES section)

### Step 4: Seed initial data
cd backend
node scripts/seedSuperAdmin.js
node scripts/checkSetup.js

### Step 5: Run the app
Terminal 1 (backend): cd backend && npm run dev
Terminal 2 (frontend): cd frontend && npm run dev

App runs at: http://localhost:5173
API runs at: http://localhost:5000

Default super admin: admin@eventshub.com / SuperAdmin@123

## Build Order Checklist

PHASE 1
 — Backend project init
 -Frontend project init
 — Database schema
 — DB connection config
 Run checkSetup.js to verify

PHASE 2 — Backend Middleware:
 — All middleware files Test middleware in isolation

PHASE 3 — Backend APIs :
 — Auth controller + routes
 → verify email → login
 — Halls controller
 — Clients controller
 — Bookings controller
 — Events controller
 — Attendees + QR
 — Settings controller
 — Stripe billing
 — Reports controller
 — Super admin
  Test all APIs with Insomnia/Postman

PHASE 4 — Frontend Foundation :
 — Auth store + API layer
 — UI components
 — Layout + shared components
 — App.jsx + routing

PHASE 5 — Frontend Pages:
 — Auth pages (login, signup, verify...)
 — Onboarding wizard
 — Dashboard
 — Bookings pages
 — Events pages
 — Gate pass + scanner
 — Calendar
 — Reports
 — Settings (all tabs)
 — Billing tab
 — Super admin panel

PHASE 6 — Scripts & Deploy (Day 15):
[ ] PROMPT 7.1 — Scripts
[ ] Test full flow end-to-end

## Stripe Setup
1. Create account at stripe.com
2. Dashboard → Products → Create "EventsHub Pro"
   Price: ₦15,000 / month recurring in NGN
3. Create "EventsHub Enterprise" — ₦45,000 / month
4. Copy Price IDs to .env
5. Webhooks → Add endpoint: https://your-api.com/api/billing/webhook
   Events to listen: checkout.session.completed,
   invoice.payment_succeeded, invoice.payment_failed,
   customer.subscription.deleted, customer.subscription.updated
6. Copy webhook secret to .env

## Deployment

### Backend → Railway
1. Push to GitHub
2. railway.app → New Project → GitHub repo
3. Add PostgreSQL plugin
4. Set all .env variables in Railway dashboard
5. Run migration: connect to Railway DB and run 001_init.sql
6. Run seed: node scripts/seedSuperAdmin.js

### Frontend → Vercel
1. vercel.com → Import repo → select /frontend folder
2. Set VITE_API_URL = https://your-railway-api.railway.app/api
3. Deploy

## Security Checklist
[ ] JWT_SECRET is at least 64 random characters
[ ] JWT_REFRESH_SECRET is different from JWT_SECRET
[ ] BCRYPT_ROUNDS = 12 in production
[ ] HTTPS only in production
[ ] CORS only allows frontend domain
[ ] Rate limiting on auth and scan routes
[ ] All queries use parameterized statements
[ ] Tenant ID verified on every protected request
[ ] Stripe webhook signature verified

Show complete README.md content.
>>>>>>> 6a1e687b (adding new files)
