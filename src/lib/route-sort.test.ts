import { describe, it, expect } from 'vitest';
import { haversineKm, sortByDistance, formatDistance } from './route-sort';

describe('route-sort helpers', () => {
  describe('haversineKm', () => {
    it('calculates distance between two known cities', () => {
      // Delhi to Mumbai (approximate)
      const delhiLat = 28.6139;
      const delhiLng = 77.209;
      const mumbaiLat = 19.076;
      const mumbaiLng = 72.8479;

      const distance = haversineKm(delhiLat, delhiLng, mumbaiLat, mumbaiLng);

      // Delhi to Mumbai is approximately 1150 km (actual great-circle distance)
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1200);
    });

    it('returns 0 for same coordinates', () => {
      const distance = haversineKm(28.6139, 77.209, 28.6139, 77.209);
      expect(distance).toBeCloseTo(0, 5);
    });

    it('calculates short distances correctly', () => {
      // Two points about 1 km apart
      const lat1 = 28.6139;
      const lng1 = 77.209;
      const lat2 = 28.6185; // ~0.5 km north
      const lng2 = 77.209;

      const distance = haversineKm(lat1, lng1, lat2, lng2);

      // Should be roughly 0.5 km
      expect(distance).toBeGreaterThan(0.4);
      expect(distance).toBeLessThan(0.6);
    });

    it('handles negative coordinates (southern/western hemispheres)', () => {
      // Sydney to Melbourne (approximate)
      const sydneyLat = -33.8688;
      const sydneyLng = 151.2093;
      const melbourneLat = -37.8136;
      const melbourneLng = 144.9631;

      const distance = haversineKm(sydneyLat, sydneyLng, melbourneLat, melbourneLng);

      // Sydney to Melbourne is approximately 710 km
      expect(distance).toBeGreaterThan(660);
      expect(distance).toBeLessThan(760);
    });
  });

  describe('sortByDistance', () => {
    const agentLat = 28.6139;
    const agentLng = 77.209;

    it('sorts orders with coordinates by distance (nearest first)', () => {
      const orders = [
        {
          id: '3',
          lat: '28.62',
          lng: '77.21',
          placed_at: new Date('2024-01-03'),
        }, // Farthest from agent
        {
          id: '1',
          lat: '28.61405',
          lng: '77.2095',
          placed_at: new Date('2024-01-01'),
        }, // Closest to agent
        {
          id: '2',
          lat: '28.615',
          lng: '77.209',
          placed_at: new Date('2024-01-02'),
        }, // Medium distance
      ];

      const sorted = sortByDistance(orders, agentLat, agentLng);

      // Should be sorted by distance (nearest first)
      expect(sorted[0].id).toBe('1'); // Closest
      expect(sorted[1].id).toBe('2'); // Medium
      expect(sorted[2].id).toBe('3'); // Farthest
    });

    it('places orders without coordinates at the end', () => {
      const orders = [
        { id: '1', lat: '28.6145', lng: '77.2095', placed_at: new Date() }, // Has coords
        { id: '2', lat: null, lng: null, placed_at: new Date() }, // No coords
        { id: '3', lat: '28.62', lng: '77.21', placed_at: new Date() }, // Has coords
      ];

      const sorted = sortByDistance(orders, agentLat, agentLng);

      // Orders without coords should be at the end
      expect(sorted[2].id).toBe('2');
    });

    it('sorts orders without coordinates by placed_at (oldest first)', () => {
      const orders = [
        { id: '1', lat: null, lng: null, placed_at: new Date('2024-01-03') },
        { id: '2', lat: null, lng: null, placed_at: new Date('2024-01-01') },
        { id: '3', lat: null, lng: null, placed_at: new Date('2024-01-02') },
      ];

      const sorted = sortByDistance(orders, agentLat, agentLng);

      // Should be sorted by placed_at (oldest first)
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('handles string coordinates correctly', () => {
      const orders = [
        { id: '1', lat: '28.6145', lng: '77.2095', placed_at: new Date() },
        { id: '2', lat: '28.62', lng: '77.21', placed_at: new Date() },
      ];

      const sorted = sortByDistance(orders, agentLat, agentLng);

      expect(sorted[0].id).toBe('1'); // Closest
      expect(sorted[1].id).toBe('2'); // Farthest
    });

    it('handles numeric coordinates correctly', () => {
      const orders = [
        { id: '1', lat: 28.6145, lng: 77.2095, placed_at: new Date() },
        { id: '2', lat: 28.62, lng: 77.21, placed_at: new Date() },
      ];

      const sorted = sortByDistance(orders, agentLat, agentLng);

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
    });

    it('handles mixed coordinates and no coordinates', () => {
      const orders = [
        { id: '1', lat: null, lng: null, placed_at: new Date('2024-01-02') }, // No coords
        { id: '2', lat: '28.62', lng: '77.21', placed_at: new Date('2024-01-03') }, // Has coords
        { id: '3', lat: null, lng: null, placed_at: new Date('2024-01-01') }, // No coords
        { id: '4', lat: '28.6145', lng: '77.2095', placed_at: new Date('2024-01-04') }, // Has coords
      ];

      const sorted = sortByDistance(orders, agentLat, agentLng);

      // With coords first (sorted by distance), then without coords (sorted by placed_at)
      expect(sorted[0].id).toBe('4'); // Closest with coords
      expect(sorted[1].id).toBe('2'); // Farthest with coords
      expect(sorted[2].id).toBe('3'); // Oldest without coords
      expect(sorted[3].id).toBe('1'); // Newer without coords
    });

    it('returns empty array for empty input', () => {
      const sorted = sortByDistance([], agentLat, agentLng);
      expect(sorted).toEqual([]);
    });
  });

  describe('formatDistance', () => {
    it('formats small distances', () => {
      expect(formatDistance(0.05)).toBe('< 0.1 km away');
    });

    it('formats regular distances', () => {
      expect(formatDistance(1.23)).toBe('1.2 km away');
      expect(formatDistance(5.67)).toBe('5.7 km away');
    });

    it('formats large distances', () => {
      expect(formatDistance(100.5)).toBe('100.5 km away');
    });

    it('rounds to 1 decimal place', () => {
      expect(formatDistance(1.2)).toBe('1.2 km away');
      expect(formatDistance(1.3)).toBe('1.3 km away');
      expect(formatDistance(5.54)).toBe('5.5 km away');
      expect(formatDistance(5.56)).toBe('5.6 km away');
      expect(formatDistance(10.1)).toBe('10.1 km away');
    });
  });
});
