# JIUnity

**Your campus and dormitory companion. One login, one app.**

JIUnity brings the everyday services of campus and dormitory life into a single place:
cafeteria meals, exit permissions, borrowing, and a student marketplace. It is a full stack
web application built for Jakarta International University during the JIU x POEM Career Camp.

> Vision: make campus and dormitory life easier, safer, and better for every student.

## Features

### Cafeteria
- Daily menu students can check before heading to eat
- Fast meal check in during admin set hours, with a redeemed meal coupon and a server recorded time
- Food allergen list where students mark each dish Safe or Avoid, saved to their account
- Feedback and food complaints sent straight to the cafeteria admin

### Permission (dorm students)
- Digital leave pass: destination, expected return, and a required GPS location
- A student stays marked "out" until security (satpam) or dorm staff record the return; a student can never close their own pass
- Live "who is out" board for security and dorm staff
- Catalog of borrowable rooms and equipment, maintained by the dorm admin

### Marketplace
- Students apply to become sellers; a market admin approves or revokes access
- Approved sellers list products with photos
- Buyers browse, add to a cart, and pay the seller directly by QRIS

### Roles and access
- Student, Staff and Lecturer, and Security (a single purpose gate kiosk)
- Module admins for Cafeteria, Dormitory, Marketplace, and Academics
- A Root super admin who grants and revokes admin roles
- Every screen and action is checked against one central authorization policy

## Tech stack
- Next.js 15 (App Router) and React 19
- TypeScript
- Prisma 6 with PostgreSQL (Neon)
- Auth.js v5 with Google sign in
- Deployed on Vercel

## Security and architecture highlights
- **Central policy engine.** A single `can(actor, action, resource)` authority combines role
  capability with ownership and scope, and fails closed by default. (`src/lib/authz/policy.ts`)
- **Campus SSO with a domain gate.** Sign in is Google only and limited to campus domains
  (students and staff); a member is provisioned automatically on first login.
- **First login onboarding.** Each member confirms and locks their real ID (student or staff
  number) before using the app.
- **Stateful, revocable sessions.** Roles and status are re-read from the database on every
  request, so suspending a member or changing a role takes effect immediately.
- **Guarded state transitions.** Single use meal coupons and single close exit passes use
  conditional writes, so an action cannot be double applied.
- **Append only audit log.** Sensitive actions (role grants, approvals, redemptions, returns)
  are recorded.

## Getting started

### 1. Requirements
- Node.js 18 or newer
- A PostgreSQL database (a free Neon project works well)
- Google OAuth credentials (Client ID and Secret)

### 2. Environment
Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://..."   # your Postgres connection string
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
AUTH_SECRET="..."                 # any long random string
```

### 3. Install and run
```bash
npm install            # installs dependencies and generates the Prisma client
npm run db:push        # creates the database schema
npm run dev            # start at http://localhost:3000
```

Sign in with a campus Google account. The first person to sign in is provisioned as a normal
member; the Root super admin is set by email in `src/auth.ts`.

Useful scripts:
```bash
npm run build && npm start   # production build and start
npm run db:seed              # seed demo data (optional)
```

## Roadmap and honest notes
- **Identity is self reported.** Onboarding trusts the ID a member enters; a real deployment
  should verify it against the campus directory or student information system.
- **Borrowing is a catalog.** Students browse items today; a request, approval, and return
  loop is planned.
- **Marketplace is a facilitator.** Payment happens off app via the seller's QRIS; there is no
  in app order or payment processing yet.
- **Images are stored inline.** Product and item photos are kept as small data URLs; object
  storage is the next step for scale.
- **Single tenant.** The app runs for one campus; serving many campuses is a future direction.

## Credits
Built by students during the JIU x POEM Career Camp: Empowering Your Future Path, at Jakarta
International University.
