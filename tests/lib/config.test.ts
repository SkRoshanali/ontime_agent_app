import { describe, it, expect } from 'vitest';
import { MAX_ORDERS_PER_BATCH, SESSION_TIMEOUT_MINUTES, SESSION_COOKIE_NAME } from '@/lib/config';

describe('config', () => {
  it('should export MAX_ORDERS_PER_BATCH constant', () => {
    expect(MAX_ORDERS_PER_BATCH).toBeDefined();
    expect(MAX_ORDERS_PER_BATCH).toBeNull();
  });

  it('should export SESSION_TIMEOUT_MINUTES constant', () => {
    expect(SESSION_TIMEOUT_MINUTES).toBeDefined();
    expect(typeof SESSION_TIMEOUT_MINUTES).toBe('number');
    expect(SESSION_TIMEOUT_MINUTES).toBe(30);
  });

  it('should export SESSION_COOKIE_NAME constant', () => {
    expect(SESSION_COOKIE_NAME).toBeDefined();
    expect(typeof SESSION_COOKIE_NAME).toBe('string');
    expect(SESSION_COOKIE_NAME).toBe('session');
  });
});

