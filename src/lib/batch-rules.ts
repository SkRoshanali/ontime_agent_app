/**
 * Batch business rules and helpers.
 * Pure functions with no database dependencies.
 */

/**
 * Check if a batch is currently active.
 * A batch is active only if:
 * 1. Status is PICKING or OUT_FOR_DELIVERY, AND
 * 2. There is at least one unfinished order (IN_TRIP or OUT_FOR_DELIVERY)
 *
 * This ensures empty batches never count as active.
 */
export function isBatchActive(
  status: string | null,
  unfinishedOrderCount: number
): boolean {
  if (!status) return false;
  const isActiveStatus = status === 'PICKING' || status === 'OUT_FOR_DELIVERY';
  return isActiveStatus && unfinishedOrderCount > 0;
}
