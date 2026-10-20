/**
 * Database schema for the grocery ordering system.
 * 
 * LOCKED: This schema matches the actual Neon database from Project 1.
 * This app shares the same database and reads this schema as-is.
 */

import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  boolean,
  uuid,
  numeric,
  index,
  unique,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const orderStatusEnum = pgEnum('order_status', [
  'PLACED',
  'IN_TRIP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'FAILED',
]);

export const userRoleEnum = pgEnum('user_role', ['customer', 'agent', 'admin']);

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    role: userRoleEnum('role').default('customer').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    phone: text('phone').notNull().unique(),
    phone_verified: boolean('phone_verified').default(false).notNull(),
    phone_verified_at: timestamp('phone_verified_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
  }
);

// OTP codes table
export const otp_codes = pgTable(
  'otp_codes',
  {
    id: serial('id').primaryKey(),
    phone: text('phone').notNull(),
    code_hash: text('code_hash').notNull(),
    ip: text('ip').notNull(),
    expires_at: timestamp('expires_at').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    phone_idx: index('idx_otp_codes_phone').on(t.phone),
    ip_idx: index('idx_otp_codes_ip').on(t.ip),
  })
);

// Batches table
export const batches = pgTable('batches', {
  id: serial('id').primaryKey(),
  agent_id: uuid('agent_id').references(() => users.id),
  status: text('status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  sealed_at: timestamp('sealed_at'),
  dispatched_at: timestamp('dispatched_at'),
  completed_at: timestamp('completed_at'),
});

// Orders table
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_no: serial('order_no').notNull().unique(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id),
    agent_id: uuid('agent_id').references(() => users.id),
    batch_id: integer('batch_id').references(() => batches.id),
    status: orderStatusEnum('status').default('PLACED').notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    address_line1: text('address_line1').notNull(),
    address_line2: text('address_line2'),
    city: text('city').notNull(),
    pincode: text('pincode').notNull(),
    lat: numeric('lat', { precision: 10, scale: 7 }),
    lng: numeric('lng', { precision: 10, scale: 7 }),
    delivery_phone: text('delivery_phone').notNull(),
    notes: text('notes'),
    idempotency_key: text('idempotency_key').notNull(),
    placed_at: timestamp('placed_at').defaultNow().notNull(),
    claimed_at: timestamp('claimed_at'),
    packed_at: timestamp('packed_at'),
    dispatched_at: timestamp('dispatched_at'),
    delivered_at: timestamp('delivered_at'),
  },
  (t) => ({
    user_idx: index('idx_orders_user_id').on(t.user_id),
    status_idx: index('idx_orders_status').on(t.status),
    unique_user_idempotency: unique('unique_user_idempotency_key').on(
      t.user_id,
      t.idempotency_key
    ),
  })
);

// Order items table
export const order_items = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    item_id: text('item_id').notNull(),
    name_snapshot: text('name_snapshot').notNull(),
    brand_snapshot: text('brand_snapshot'),
    unit_snapshot: text('unit_snapshot').notNull(),
    price_snapshot: numeric('price_snapshot', { precision: 10, scale: 2 }).notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
    unavailable: boolean('unavailable').default(false).notNull(),
  },
  (t) => ({
    order_idx: index('idx_order_items_order_id').on(t.order_id),
  })
);

// Order status history table
export const order_status_history = pgTable(
  'order_status_history',
  {
    id: serial('id').primaryKey(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    changed_by: uuid('changed_by').references(() => users.id),
    changed_at: timestamp('changed_at').defaultNow().notNull(),
    notes: text('notes'),
  },
  (t) => ({
    order_idx: index('idx_order_status_history_order_id').on(t.order_id),
  })
);
