# EventsHub SaaS — Events Center Management System

EventsHub is a multi-tenant SaaS platform for events centers to manage bookings, clients, halls, attendees, QR gate passes, reports, team access, billing, and super-admin operations.

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

```bash
git clone [repo]
cd EventsHub
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Database setup

Create a PostgreSQL database named `eventshub`.

```bash
cd backend
psql -U postgres -d eventshub -f scripts/001_init.sql
```

Update `backend/.env` with your `DATABASE_URL`.

### Step 3: Configure environment

Create `backend/.env` and fill in all required values from the environment variables section below.

```bash
cd backend
cp .env.example .env
```

If `.env.example` is not present yet, create `backend/.env` manually.

### Step 4: Seed initial data

```bash
cd backend
node scripts/seedSuperAdmin.js
node scripts/checkSetup.js
```

Optional demo data:

```bash
node scripts/seedSampleData.js
```

### Step 5: Run the app

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

App runs at: `http://localhost:5173`

API runs at: `http://localhost:5000`

Default super admin: `admin@eventshub.com` / `SuperAdmin@123`

Change the default password immediately after first login.

## Environment Variables

### Backend `.env`

Required:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/eventshub

JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password
EMAIL_FROM="EventsHub <no-reply@eventshub.com>"

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx

FRONTEND_URL=http://localhost:5173
```

Recommended:

```env
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### Frontend `.env`

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Utility Scripts

Run scripts from the `backend` directory.

```bash
node scripts/seedSuperAdmin.js
```

Creates the platform super admin if one does not already exist.

```bash
node scripts/checkSetup.js
```

Checks database connectivity, required tables, plan limits, super admin existence, and required environment variables.

```bash
node scripts/seedSampleData.js
```

Creates demo tenant data for local testing:

- Tenant: `Lagos Grand Events`
- Owner login: `demo@test.com` / `Demo@123`
- Sample halls, clients, bookings, and events

## Project Structure

```text
EventsHub/
  backend/
    config/
    controllers/
    middleware/
    routes/
    scripts/
    utils/
  frontend/
    src/
      api/
      components/
      hooks/
      pages/
      store/
```

## Core Features

- Multi-tenant events center management
- JWT authentication with email verification
- Tenant onboarding wizard
- Booking creation, approval, rejection, payment tracking, and status management
- Hall and client management
- Event scheduling from approved bookings
- Attendee gate pass generation with QR scanning
- Dashboard, calendar, reports, and export workflows
- Tenant branding with dynamic primary color and logo
- Team management and role-based access
- Stripe billing and subscription management
- Super admin dashboard, tenant controls, impersonation, and audit log

## Stripe Setup

1. Create a Stripe account.
2. Create the `EventsHub Pro` product.
3. Add recurring NGN monthly price: `₦15,000`.
4. Create the `EventsHub Enterprise` product.
5. Add recurring NGN monthly price: `₦45,000`.
6. Copy the price IDs into `STRIPE_PRO_PRICE_ID` and `STRIPE_ENTERPRISE_PRICE_ID`.
7. Add a webhook endpoint:

```text
https://your-api-domain.com/api/billing/webhook
```

Listen for:

- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Deployment

### Backend on Railway

1. Push the repository to GitHub.
2. Create a Railway project from the GitHub repository.
3. Add a PostgreSQL service.
4. Set all backend environment variables in Railway.
5. Run the database schema:

```bash
psql "$DATABASE_URL" -f backend/scripts/001_init.sql
```

6. Seed the super admin:

```bash
cd backend
node scripts/seedSuperAdmin.js
```

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set the project root to `frontend`.
3. Set:

```env
VITE_API_URL=https://your-api-domain.com/api
```

4. Deploy.

## Production Checklist

- Set `NODE_ENV=production`.
- Use long, random, different values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Change the default super admin password.
- Restrict CORS to the production frontend domain.
- Use HTTPS for frontend, backend, Stripe webhooks, and email links.
- Verify Stripe webhook signatures.
- Ensure all protected routes validate tenant ownership.
- Confirm rate limiting is enabled for auth, invite, and scan endpoints.
- Confirm Cloudinary credentials are production credentials.
- Confirm email provider credentials and sender domain are verified.
- Run `node scripts/checkSetup.js` after deployment.

## Common Commands

Backend:

```bash
cd backend
npm install
npm run dev
node scripts/checkSetup.js
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Troubleshooting

### Database connection fails

- Confirm PostgreSQL is running.
- Confirm the `eventshub` database exists.
- Confirm `DATABASE_URL` points to the correct host, port, database, username, and password.

### Login fails for seeded users

- Confirm `node scripts/seedSuperAdmin.js` completed successfully.
- Confirm the `users` table has a `super_admin` record.
- Confirm backend environment variables are loaded.

### Frontend cannot reach API

- Confirm backend is running on `http://localhost:5000`.
- Confirm `frontend/.env` has `VITE_API_URL=http://localhost:5000/api`.
- Restart the Vite dev server after changing `.env`.

### Stripe checkout fails

- Confirm Stripe secret key and price IDs are valid.
- Confirm the backend can reach Stripe.
- Confirm plan names sent from the frontend match backend billing logic.

## License

Proprietary. All rights reserved.
