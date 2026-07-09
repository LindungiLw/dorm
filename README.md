# JIUnity — Campus Dormitory Management System

A production-oriented, multi-role campus dormitory platform. This repository is the
**foundation slice** built from the architecture plan: it implements Phase 0 (platform
foundation) + Phase 1 (identity/authorization) + the Phase 2 reference workflow and the
Phase 3 crown-jewel coupon flow — enough to run as a real web app and demonstrate the
core security & correctness patterns.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Prisma · SQLite (dev).

## Quick start

```bash
npm install          # installs deps + generates the Prisma client
npm run setup        # creates the SQLite DB schema + seeds demo data
npm run dev          # start the app at http://localhost:3000
```

Then open **http://localhost:3000** and sign in. All demo accounts use the password
`password123`:

| Email | Role |
|-------|------|
| `andi@student.jiu.ac` | Student (Dorm A, has allergies) |
| `bunga@student.jiu.ac` | Student (Dorm A) |
| `citra@student.jiu.ac` | Student (Dorm B) |
| `eko@student.jiu.ac` | Student — **SUSPENDED** (login is blocked) |
| `dewa@jiu.ac` | Faculty |
| `rina.cafe@jiu.ac` | Cafeteria Admin (Outlet Main) |
| `budi.dorm@jiu.ac` | Dormitory Admin (Dorm A) |
| `dyah23@jiu.ac` | Academic Admin |

Handy scripts: `npm run db:reset` (wipe + reseed), `npm run build && npm start` (prod).

## What to try

- **Meal coupons** (student/faculty → *Meals*): activate a coupon, then redeem it by
  entering the **counter code**. Open the counter display at
  [`/counter`](http://localhost:3000/counter) (simulates the physical counter screen) —
  the code rotates every 30s and is verified server-side, so a screenshot can't be reused.
- **Exit permissions** (student → *Permissions*): submit an exit request. Sign in as
  `budi.dorm@jiu.ac` → *Dorm Requests* to approve/reject it (scoped to Dorm A only).
- **Authorization**: sign in as a student and try to open `/dashboard/dorm` — you get a
  "not authorized" notice. A cafeteria admin can't see dorm data, etc.
- **Instant revocation**: `eko@student.jiu.ac` is suspended and cannot sign in;
  suspending an active member invalidates their session on the next request.
- **Audit trail**: sign in as `sari.acad@jiu.ac` → *Academic* to see roster stats and the
  append-only audit log (populated as approvals/redemptions happen).

## How the architecture shows up in the code

| Concept (from the plan) | Where |
|-------------------------|-------|
| **RBAC + ownership/scope** policy engine — the single authority | `src/lib/authz/policy.ts` (`can(actor, action, resource)`) |
| **Stateful, revocable sessions** (status re-checked every request) | `src/lib/auth/session.ts` |
| **Coarse middleware gate** (auth presence only; not authorization) | `src/middleware.ts` |
| **Server Actions** re-derive actor + authorize + validate before mutating | `src/lib/domain/*-actions.ts` |
| **Atomic guarded transitions** (single-use coupon, single approval) | `coupons-actions.ts`, `permissions-actions.ts` (`updateMany where status=…`) |
| **Datastore-enforced invariants** (unique ledger, one coupon/window) | `prisma/schema.prisma` (`@@unique`, unique `couponId` on `Redemption`) |
| **Presence-anchored self-service redemption** (rotating counter code) | `src/lib/counter-code.ts`, `src/app/counter` |
| **Append-only audit** | `src/lib/audit.ts`, surfaced on the Academic dashboard |

## Production notes (not built in this slice)

- **Database:** swap the Prisma `datasource` provider to `postgresql` and put an external
  transaction-mode connection pooler in front (Phase 0). Room-booking uses a Postgres
  range-overlap **exclusion constraint** not expressible in SQLite.
- **Auth:** manual login stands in for **campus Google SSO** + directory/SIS sync — wire
  real OAuth (verify the `hd`/campus domain) and a directory as the source of truth.
- **Not yet built:** borrowing (inventory + room scheduling), marketplace (facilitator-only),
  reporting read-models/replicas, notifications outbox, worker/scheduler tier. See the
  architecture plan for the full phased roadmap.
