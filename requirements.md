# Admin & Agent App - Requirements

## Project Overview

This is Project 2 of 2: the admin and delivery-agent web application for a grocery ordering system. It shares a single Neon Postgres database with Project 1 (customer app). There is **no API between the two apps** — the database is the only integration point.

**Key constraint**: The schema already exists in the database. This app will never create migrations or regenerate the schema.

## Functional Requirements

### 1. Authentication & Access Control

**FR-1.1 Admin Seeding**
- Admin account created via seed script (`scripts/seed-admin.ts`)
- Script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment
- Inserts one user with role=admin and bcrypt-hashed password
- Executed manually by user; Kiro never runs it

**FR-1.2 Agent Account Creation**
- Admin can create agent accounts from the app
- Form collects: name, email, temporary password (admin sets)
- Temporary password shown once to admin (not stored plaintext)
- Agent can change password after first login

**FR-1.3 Login**
- Email + password authentication only
- No OTP, no SMS verification in this app
- Same session pattern as Project 1: httpOnly, Secure, SameSite=Lax JWT cookie
- 30-minute sliding timeout on every request

**FR-1.4 Route Guards**
- `/admin/*` requires role=admin
- `/agent/*` requires role=agent or admin
- `/login` accessible to all unauthenticated users

### 2. Agent Workflow

**FR-2.1 Agent Dashboard**
- Displays "I am ready" button when agent has no active PICKING batch
- Displays current batch progress when agent has an active PICKING batch
- Shows batch ID, count of items packed, total orders

**FR-2.2 Batch Claiming**
- "I am ready" button atomically claims N oldest PLACED orders (default N=8, configurable)
- Atomic transaction:
  - Creates new batch with agent_id, status=PICKING
  - Updates N oldest PLACED orders: sets agent_id, batch_id, status=IN_TRIP, claimed_at=NOW()
  - Uses `FOR UPDATE SKIP LOCKED` for consistency
- Enforces at most one PICKING batch per agent (check before allowing "I am ready" again)

**FR-2.3 Pick List**
- Shows items aggregated across the batch's orders
- Summed quantities by product
- Read-only reference for picking phase

**FR-2.4 Pack List**
- Per-order breakdown
- Checkboxes for each item
- Agent can mark items `unavailable` if out of stock
- Notes field for each unavailable item
- No automatic total recalculation

**FR-2.5 Order Packing**
- Per-order "Packed" action sets packed_at
- Only available when all items in order are accounted for (packed or marked unavailable)
- Inserts entry in order_status_history (status, changed_by=agent's user_id, changed_at)

**FR-2.6 Batch Dispatch**
- "Out for Delivery" button (available only when all orders in batch are packed)
- Sets batch.status=OUT_FOR_DELIVERY
- Sets all batch's orders.status=OUT_FOR_DELIVERY
- Sets dispatched_at on both batch and orders
- Inserts order_status_history entries

**FR-2.7 Order Delivery**
- Per-order "Delivered" action sets delivered_at, orders.status=DELIVERED
- Inserts order_status_history entry
- When all orders in batch are DELIVERED, set batch.status=COMPLETED

**FR-2.8 Order Failure**
- Agent can mark order CANCELLED (customer refused) or FAILED (unreachable after 2 attempts)
- Required notes field for reason
- Inserts order_status_history entry
- Can be done anytime during batch lifecycle

### 3. Admin Workflow

**FR-3.1 Admin Dashboard**
- Live counts: PLACED (unclaimed), IN_TRIP, OUT_FOR_DELIVERY orders
- List of active agents with their current batch (if any)
  - Agent name, batch ID, claimed_at timestamp, item count, progress
- List of unclaimed PLACED orders (oldest first)
- List of PICKING batches with claimed_at timestamps (to spot stuck batches visually)

**FR-3.2 Batch Release (Manual Escalation)**
- "Release batch" button on a stuck batch
- Atomically:
  - Sets batch.status=CANCELLED
  - Resets all orders in batch: status=PLACED, agent_id=NULL, batch_id=NULL, claimed_at=NULL
  - Single transaction

**FR-3.3 Order List & Management**
- Full order list viewable with filters by status (PLACED, IN_TRIP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, FAILED) and date range
- Manually change any order's status
- Required notes field for status changes
- Inserts order_status_history entry

**FR-3.4 Phone Verification**
- Admin can manually mark a user's phone_verified=true
- Fallback for when Project 1's SMS gateway fails

**FR-3.5 Agent Management**
- List all agents (active + inactive)
- Create new agent (same form as FR-1.2)
- Deactivate an agent (use existing columns only; no schema changes)
  - If no deactivation column exists, clarify approach (e.g., role reassignment)

### 4. API Routes

**Authentication**
- POST `/api/auth/login` — email, password → JWT cookie, user info
- POST `/api/auth/logout` — clear session
- GET `/api/auth/me` — return current user or 401

**Agent Endpoints**
- POST `/api/agent/batch/claim` — "I am ready" → create batch + claim orders
- POST `/api/agent/batch/[id]/seal` — mark all orders packed, batch ready to dispatch
- POST `/api/agent/batch/[id]/dispatch` — OUT_FOR_DELIVERY
- POST `/api/agent/order/[id]/packed` — set packed_at, mark order ready
- POST `/api/agent/order/[id]/delivered` — set delivered_at, mark DELIVERED
- POST `/api/agent/order/[id]/status` — { status: 'CANCELLED'|'FAILED', notes: string }

**Admin Endpoints**
- GET `/api/admin/dashboard` — stats + active agents + unclaimed orders + stuck batches
- GET `/api/admin/orders` — list all orders with filters (status, date range)
- GET `/api/admin/agents` — list all agents
- POST `/api/admin/agents` — create new agent
- POST `/api/admin/batch/[id]/release` — release stuck batch
- POST `/api/admin/order/[id]/status` — { status, notes }
- POST `/api/admin/user/[id]/verify-phone` — set phone_verified=true

### 5. Pages

**Public**
- `/login` — email + password form

**Agent**
- `/agent` — dashboard ("I am ready" button + current batch status)
- `/agent/batch/[id]` — pick list + pack list + dispatch controls

**Admin**
- `/admin` — dashboard (stats, agents, orders, stuck batches)
- `/admin/orders` — full order list with filters and bulk actions
- `/admin/agents` — agent list + create form

### 6. Non-Functional Requirements

**FR-6.1 Database**
- Never run `drizzle-kit generate`, `migrate`, or `push`
- Never modify `src/db/schema.ts`
- All queries use Drizzle ORM with `drizzle-orm/neon-serverless` Pool
- Transactions required for multi-step operations (batch claiming, batch release, order status changes)

**FR-6.2 No Background Jobs**
- No setInterval polling on server
- No delayed jobs or scheduled functions
- No cron tasks
- All time-sensitive actions triggered by manual admin clicks

**FR-6.3 UI**
- Desktop-first layout (used at counter or tablet)
- Mobile-usable (responsive)
- Simple table/list layouts
- Clarity over polish
- Reuse green/off-white tokens from Project 1 if convenient (not required)

**FR-6.4 Testing**
- Vitest for pure functions only (batch logic, status transitions)
- tsc --noEmit for type checking
- Linting enforced

**FR-6.5 Secrets & Configuration**
- Never hardcode secrets
- `.env.example` with variable NAMES only
- DATABASE_URL must match Project 1's exact value
- Config constants (e.g., batch size) in one file

## Success Criteria

✅ All 8 phases pass `tsc --noEmit`, linting, and Vitest  
✅ README explains shared database and no migration regeneration  
✅ Full flow works end-to-end:
  - Admin seeds themselves
  - Admin creates an agent
  - Agent claims a batch
  - Agent packs orders
  - Agent dispatches batch
  - Agent delivers orders
  - Admin sees status updates in dashboard  
✅ No schema modifications  
✅ No background jobs or timers  
✅ All status changes logged in order_status_history
