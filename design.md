# Admin & Agent App - Design

## Architecture Overview

### Technology Stack
- **Framework**: Next.js App Router (TypeScript strict)
- **Database**: Neon Postgres via Drizzle ORM (drizzle-orm/neon-serverless Pool)
- **Auth**: JWT (jose) in httpOnly cookie, 30-min sliding timeout
- **State**: Zustand (client) + TanStack Query (server sync)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Security**: bcryptjs for password hashing

### Database Integration
- **Schema Source**: `src/db/schema.ts` (from Project 1, locked)
- **Migrations**: None created by this app
- **Connection**: Pool from `drizzle-orm/neon-serverless`
- **Transactions**: Required for batch claiming, batch release, status changes

### Project Structure

```
c:\ontime/
├── .kiro/
│   └── steering/
│       └── product.md           # Locked decisions & rules
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (agent)/
│   │   │   ├── agent/
│   │   │   │   ├── page.tsx     # Dashboard
│   │   │   │   └── batch/[id]/
│   │   │   │       └── page.tsx # Pick + Pack
│   │   │   └── layout.tsx       # Agent guard
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx     # Dashboard
│   │   │   │   ├── orders/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── agents/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx       # Admin guard
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── agent/
│   │   │   │   ├── batch/
│   │   │   │   │   ├── claim/route.ts
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── seal/route.ts
│   │   │   │   │       └── dispatch/route.ts
│   │   │   │   └── order/[id]/
│   │   │   │       ├── packed/route.ts
│   │   │   │       ├── delivered/route.ts
│   │   │   │       └── status/route.ts
│   │   │   └── admin/
│   │   │       ├── dashboard/route.ts
│   │   │       ├── orders/route.ts
│   │   │       ├── agents/
│   │   │       │   ├── route.ts (list)
│   │   │       │   └── create/route.ts
│   │   │       ├── batch/[id]/release/route.ts
│   │   │       ├── order/[id]/status/route.ts
│   │   │       └── user/[id]/verify-phone/route.ts
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Redirect to /login or dashboard
│   ├── db/
│   │   ├── schema.ts            # From Project 1 (locked)
│   │   ├── client.ts            # Pool & db client
│   │   └── queries.ts           # Drizzle queries
│   ├── lib/
│   │   ├── auth.ts              # JWT helpers
│   │   ├── config.ts            # Config constants (batch size)
│   │   ├── utils.ts             # Common utilities
│   │   └── middleware.ts        # Auth middleware
│   ├── types/
│   │   ├── auth.ts              # Auth types
│   │   ├── api.ts               # API request/response types
│   │   └── index.ts             # Common types
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth state (Zustand)
│   │   └── useQueries.ts        # TanStack Query hooks
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── agent/
│   │   │   ├── DashboardCard.tsx
│   │   │   ├── PickList.tsx
│   │   │   └── PackList.tsx
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── OrderTable.tsx
│   │   │   └── AgentManagement.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       └── ErrorBoundary.tsx
│   └── styles/
│       ├── globals.css
│       ├── print.css            # Print styles for pick/pack lists
│       └── tokens.css           # Color tokens (from Project 1)
├── migrations/
│   └── 0000_chilly_bastion.sql  # From Project 1 (locked)
├── scripts/
│   └── seed-admin.ts            # Admin seeding script
├── tests/
│   ├── lib/
│   │   ├── auth.test.ts
│   │   └── config.test.ts
│   └── utils/
│       └── statusTransition.test.ts
├── .env.example
├── .env.local                   # Not committed; developer creates
├── eslintrc.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── next.config.ts
├── package.json
├── README.md
└── admin-agent-app.spec.md
```

## Key Design Decisions

### Authentication & Sessions
- **JWT in httpOnly cookie** (same as Project 1)
- **30-minute sliding timeout**: Updated on every request
- **No refresh token**: New JWT on each protected request
- **Middleware**: Checks cookie before routing to protected pages

### Batch Claiming (Atomic)
```typescript
// Uses drizzle-orm transactions
BEGIN;
  INSERT INTO batches (agent_id, status) VALUES ($1, 'PICKING') RETURNING id;
  UPDATE orders
  SET agent_id = $1, batch_id = $batchId, status = 'IN_TRIP', claimed_at = NOW()
  WHERE id IN (
    SELECT id FROM orders
    WHERE status = 'PLACED'
    ORDER BY placed_at ASC
    LIMIT $limit
    FOR UPDATE SKIP LOCKED
  );
COMMIT;
```

### Order Status Workflow
```
Agent picking phase:
  PLACED → (claim) → IN_TRIP → (packed) → OUT_FOR_DELIVERY → (delivered) → DELIVERED
  
  OR any order can go: → CANCELLED (customer refused) / FAILED (unreachable)

Every transition inserts order_status_history (status, changed_by, changed_at).
```

### Batch Lifecycle
```
Batch status flows:
  PICKING → OUT_FOR_DELIVERY → COMPLETED
  
  OR on admin release: → CANCELLED (moves orders back to PLACED)
```

### UI Patterns
- **Agent**: Dashboard (one action: "I am ready") → Pick List → Pack List → Dispatch → Delivery screens
- **Admin**: Dashboard (stats + live lists) → Order list (filters, bulk) → Agent management
- **Print**: Pick/pack lists have print-specific CSS for clarity

### Configuration
- **Batch size**: Constant in `src/lib/config.ts`, default 8
- **Session timeout**: 30 minutes (JWT exp claim)
- **Color tokens**: Reuse from Project 1 (green/off-white) if available

## Security Considerations

1. **No schema modifications**: All queries use Drizzle ORM, never raw SQL
2. **Parameterized queries**: Drizzle prevents SQL injection
3. **Password hashing**: bcryptjs for all stored passwords
4. **httpOnly cookies**: JWT cannot be accessed by JavaScript
5. **Transaction atomicity**: Batch claiming uses `FOR UPDATE SKIP LOCKED`
6. **Route guards**: Middleware verifies role before allowing access
7. **No OTP/SMS in this app**: Phone verification is manual admin action

## Testing Strategy

- **Unit tests** (Vitest):
  - JWT creation/validation (auth.ts)
  - Batch size configuration
  - Status transition validation
- **Integration tests**: Out of scope for this phase
- **Manual end-to-end**: Covered in P8 (final verification)

## Styling & Theme

- **Colors**: Green + off-white from Project 1 (if available, else define in Tailwind)
- **Layout**: Desktop-first with mobile responsiveness
- **Components**: Simple lists and tables for clarity
- **Print**: Separate print.css for pick/pack list readability

## Errors & Logging

- **API errors**: Standard HTTP status codes + error messages in JSON
- **Client errors**: Toast notifications (simple alert or similar)
- **Logging**: Console logs for debugging; no persistent logging (out of scope)

## No Background Jobs

- **Strictly enforced**: No setInterval, no cron, no scheduled tasks
- **Manual admin actions only**: Release stuck batch, escalate, mark verified
