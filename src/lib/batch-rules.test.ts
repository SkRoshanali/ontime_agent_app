import { describe, it, expect } from 'vitest';
import { isBatchActive } from './batch-rules';

describe('isBatchActive', () => {
  it('returns true for PICKING batch with unfinished orders', () => {
    expect(isBatchActive('PICKING', 1)).toBe(true);
  });

  it('returns true for OUT_FOR_DELIVERY batch with unfinished orders', () => {
    expect(isBatchActive('OUT_FOR_DELIVERY', 5)).toBe(true);
  });

  it('returns false for PICKING batch with zero unfinished orders', () => {
    expect(isBatchActive('PICKING', 0)).toBe(false);
  });

  it('returns false for OUT_FOR_DELIVERY batch with zero unfinished orders', () => {
    expect(isBatchActive('OUT_FOR_DELIVERY', 0)).toBe(false);
  });

  it('returns false for COMPLETED batch', () => {
    expect(isBatchActive('COMPLETED', 1)).toBe(false);
  });

  it('returns false for CANCELLED batch', () => {
    expect(isBatchActive('CANCELLED', 1)).toBe(false);
  });

  it('returns false for null status', () => {
    expect(isBatchActive(null, 1)).toBe(false);
  });

  it('returns false for undefined status', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isBatchActive(undefined as any, 1)).toBe(false);
  });
});
