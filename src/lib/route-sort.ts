/**
 * Route sorting helpers using the Haversine formula.
 * - Calculates straight-line distance between coordinates
 * - Sorts orders by distance (nearest first)
 * - Handles missing coordinates gracefully
 */

/**
 * Calculate distance between two points using Haversine formula.
 * Returns distance in kilometers.
 * 
 * @param lat1 - Latitude of point A (number)
 * @param lng1 - Longitude of point A (number)
 * @param lat2 - Latitude of point B (number)
 * @param lng2 - Longitude of point B (number)
 * @returns Distance in kilometers
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Sort orders by distance from agent location.
 * Orders with coordinates are sorted nearest first.
 * Orders without coordinates are placed at the end, sorted by placed_at ascending.
 * 
 * @param orders - Array of orders with lat, lng, and placed_at fields
 * @param agentLat - Agent's latitude (number)
 * @param agentLng - Agent's longitude (number)
 * @returns Sorted array of orders
 */
export function sortByDistance(
  orders: Array<{
    id?: string;
    lat?: string | number | null;
    lng?: string | number | null;
    placed_at?: Date | string;
  }>,
  agentLat: number,
  agentLng: number
): typeof orders {
  const withCoordinates = orders.filter(
    (order) => order.lat != null && order.lng != null
  );
  const withoutCoordinates = orders.filter(
    (order) => order.lat == null || order.lng == null
  );

  // Sort orders with coordinates by distance (nearest first)
  withCoordinates.sort((a, b) => {
    const latA = typeof a.lat === 'string' ? parseFloat(a.lat) : a.lat || 0;
    const lngA = typeof a.lng === 'string' ? parseFloat(a.lng) : a.lng || 0;
    const latB = typeof b.lat === 'string' ? parseFloat(b.lat) : b.lat || 0;
    const lngB = typeof b.lng === 'string' ? parseFloat(b.lng) : b.lng || 0;

    const distA = haversineKm(agentLat, agentLng, latA, lngA);
    const distB = haversineKm(agentLat, agentLng, latB, lngB);

    return distA - distB;
  });

  // Sort orders without coordinates by placed_at (oldest first)
  withoutCoordinates.sort((a, b) => {
    const timeA = new Date(a.placed_at || 0).getTime();
    const timeB = new Date(b.placed_at || 0).getTime();
    return timeA - timeB;
  });

  return [...withCoordinates, ...withoutCoordinates];
}

/**
 * Format distance for display: "1.2 km away"
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return '< 0.1 km away';
  }
  return `${distanceKm.toFixed(1)} km away`;
}
