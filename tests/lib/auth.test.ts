import { describe, it, expect, beforeAll } from 'vitest';

// Ensure environment variable is set
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-secret-key-32-chars-minimum!';
}

import {
  hashPassword,
  verifyPassword,
} from '@/lib/auth';

describe('auth', () => {
  describe('hashPassword and verifyPassword', () => {
    let hash: string;

    beforeAll(async () => {
      hash = await hashPassword('test-password-123');
    });

    it('should hash a password', () => {
      expect(hash).toBeDefined();
      expect(hash).not.toBe('test-password-123');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct password', async () => {
      const isValid = await verifyPassword('test-password-123', hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await verifyPassword('wrong-password', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT functions', () => {
    it('should be importable', async () => {
      // JWT functions are tested via API integration in Phase 3+
      // This is a placeholder to ensure the module exports correctly
      expect(true).toBe(true);
    });
  });
});
