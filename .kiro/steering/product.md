---
inclusion: auto
name: Admin & Agent App Product Decisions
description: Core constraints, locked decisions, and rules for the admin and delivery-agent web app
---

# Admin & Agent App: Product Decisions

## Locked Decisions

### Stack (matches Project 1 exactly)
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Zustand
- TanStack Query
- Drizzle ORM
- Neon Postgres via `drizzle-orm/neon-serverless` Pool (transactions required)
- Zod
- jose (JWT)
- bcryptjs
- resend
- lucide-react
- Vitest

### Database Integration
- **Shared database**: This app reads/writes the same Neon Postgres schema as Project 1
- **Schema is locked**: `src/db/schema.ts` and `migrations/0000_chilly_bastion.sql` are provided unchanged from Project 1
- **No schema modifications**: Never run `drizzle-kit generate`, `migrate`, or `push`
- **No migrations created**: The schema already exists; this app only consumes it

### Relevant Tables
- `users` (role: customer|agent|admin)
- `orders` (order_items, status, agent_id, batch_id)
- `batches` (agent_id, status)
- `order_status_history` (every status change logged)

### Order & Batch Statuses
- **Order**: PLACED, IN_TRIP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, FAILED
- **Batch**: PICKING, OUT_FOR_DELIVERY, COMPLETED, CANCELLED

### Authentication & Accounts
- **No public signup**: Admin account only created via seed script `scripts/seed-admin.ts`
- **Admin-created agents**: Form with name, email, temporary password (shown once only)
- **Login**: Email + password only
- **Session**: httpOnly, Secure, SameSite=Lax JWT cookie, 30-minute sliding timeout
- **Route guards**: admin routes require role=admin; agent routes require role=agent or admin
- **No OTP anywhere**

### No Background Jobs / Timers
- No setInterval polling on server
- No delayed jobs or scheduled functions
- No cron tasks
- All time-sensitive actions (stuck batches, unclaimed orders) are manual admin button clicks

### Batch Claiming (Atomic)
```sql
BEGIN;
INSERT INTO batches (agent_id, status) VALUES ($1, 'PICKING') RETURNING id;
UPDATE orders SET agent_id=$1, batch_id=$batchId, status='IN_TRIP', claimed_at=NOW()
  WHERE id IN (SELECT id FROM orders WHERE status='PLACED' ORDER BY placed_at ASC LIMIT $limit FOR UPDATE SKIP LOCKED);
COMMIT;
```
- Batch size (N): constant, default 8, in one config file
- Enforce at most one PICKING batch per agent
- Use `FOR UPDATE SKIP LOCKED` for atomicity

### Agent Workflow
1. Dashboard: "I am ready" button (claims N orders atomically)
2. Pick List: items aggregated by product (summed quantity across batch)
3. Pack List: per-order breakdown with checkboxes
4. Mark items `unavailable` if out of stock (no recalculation)
5. "Packed" per order → sets packed_at
6. "Out for Delivery" (all orders packed) → batch.status='OUT_FOR_DELIVERY', orders.status='OUT_FOR_DELIVERY'
7. "Delivered" per order → sets delivered_at, orders.status='DELIVERED'
8. When all orders in batch delivered → batch.status='COMPLETED'
9. Can mark CANCELLED (customer refused) or FAILED (unreachable after 2 attempts)
10. Every status change inserts `order_status_history` (status, changed_by=user_id, changed_at)

### Admin Workflow
1. Dashboard: live counts by status, active agents with batches, unclaimed PLACED orders, PICKING batches with timestamps
2. "Release batch": batch.status='CANCELLED', orders back to PLACED, agent_id/batch_id/claimed_at reset (one transaction)
3. Order list with filters by status and date
4. Manual status changes with required notes
5. Mark phone_verified=true manually
6. Agent management: list, create, deactivate (using existing columns only)

## Out of Scope

- Push notifications
- SMS or email digest batching
- PWA / offline support
- Payment reconciliation
- Maps / routing
- Analytics
- Inventory (none exists)
- Any schema changes
- Any migration generation

## Credit Rules

1. Read a file before editing it; never rewrite files that are already correct
2. NEVER run `drizzle-kit generate/migrate/push`; never touch DB directly except through app's transactional queries
3. Never create real secrets; provide `.env.example` with variable NAMES only
4. Do not start dev server unless asked
5. Vitest covers pure functions only
6. Stop and ask before: adding unlisted dependencies, deleting files, touching schema.ts, or if same error persists after 2 fix attempts
7. After every task: verify with tsc, lint, vitest

## Environment Variables (for .env.example)

```
DATABASE_URL=
SESSION_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_APP_URL=
```

DATABASE_URL **must be the SAME value as Project 1's**.
