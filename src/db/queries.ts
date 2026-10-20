import { db } from './client';
import { users, batches, orders, order_items, order_status_history } from './schema';
import { eq, and } from 'drizzle-orm';

/**
 * Find a user by email.
 */
export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

/**
 * Find a user by ID.
 */
export async function findUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

/**
 * Create a new user (used in seed scripts).
 */
export async function createUser(data: {
  email: string;
  password_hash: string;
  role: 'admin' | 'agent' | 'customer';
  name: string;
  phone: string;
}) {
  return db.insert(users).values(data).returning();
}

/**
 * Update user phone_verified status.
 */
export async function updateUserPhoneVerified(userId: string, verified: boolean) {
  return db
    .update(users)
    .set({ phone_verified: verified })
    .where(eq(users.id, userId))
    .returning();
}

/**
 * Create a new batch.
 */
export async function createBatch(agent_id: string, status: 'PICKING' = 'PICKING') {
  const result = await db
    .insert(batches)
    .values({
      agent_id,
      status,
      created_at: new Date(),
    })
    .returning();
  return result[0];
}

/**
 * Get agent's active PICKING batch.
 */
export async function getAgentActiveBatch(agent_id: string) {
  const result = await db
    .select()
    .from(batches)
    .where(and(eq(batches.agent_id, agent_id), eq(batches.status, 'PICKING')))
    .limit(1);
  return result[0] || null;
}

/**
 * Get unclaimed PLACED orders (oldest first).
 */
export async function getUnclaimedOrders(_limit: number = 8) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.status, 'PLACED'))
    .orderBy(orders.placed_at);
}

/**
 * Get all orders for a batch.
 */
export async function getOrdersForBatch(batch_id: string | number) {
  const numBatchId = typeof batch_id === 'string' ? Number(batch_id) : batch_id;
  return db.select().from(orders).where(eq(orders.batch_id, numBatchId));
}

/**
 * Get items for an order.
 */
export async function getOrderItemsForOrder(order_id: string) {
  return db.select().from(order_items).where(eq(order_items.order_id, order_id));
}

/**
 * Update an order's status.
 */
export async function updateOrderStatus(
  order_id: string,
  status: string,
  batch_id?: string | null
) {
  const updateData: Record<string, unknown> = { status };
  if (batch_id !== undefined) updateData.batch_id = batch_id;
  if (status === 'IN_TRIP') updateData.claimed_at = new Date();

  return db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, order_id))
    .returning();
}

/**
 * Log an order status change to history.
 */
export async function logOrderStatusChange(
  order_id: string,
  status: string,
  changed_by: string,
  notes?: string
) {
  return db.insert(order_status_history).values({
    order_id,
    status,
    changed_by,
    notes,
    changed_at: new Date(),
  });
}

/**
 * Get a batch with all its orders.
 */
export async function getBatchWithOrders(batch_id: string | number) {
  const numBatchId = typeof batch_id === 'string' ? Number(batch_id) : batch_id;
  const batch = await db.select().from(batches).where(eq(batches.id, numBatchId));
  if (!batch[0]) return null;

  const batchOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.batch_id, numBatchId));

  return { batch: batch[0], orders: batchOrders };
}
