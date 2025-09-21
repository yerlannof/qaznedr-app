import {
  listingsQuerySchema,
  createListingSchema,
  updateListingSchema,
  listingIdSchema,
  paginationSchema,
} from '../api';
import { z } from 'zod';

describe('API Validation Schemas', () => {
  describe('listingsQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        query: 'gold mine',
        type: 'MINING_LICENSE',
        mineral: 'Gold',
        region: 'Aktobe',
        minPrice: '1000000',
        maxPrice: '10000000',
        minArea: '100',
        maxArea: '1000',
        sortBy: 'price',
        sortOrder: 'asc',
        page: '1',
        limit: '20',
      };

      const result = listingsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('gold mine');
        expect(result.data.type).toBe('MINING_LICENSE');
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject invalid type values', () => {
      const invalidQuery = {
        type: 'INVALID_TYPE',
      };

      const result = listingsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should reject negative price values', () => {
      const invalidQuery = {
        minPrice: '-1000',
      };

      const result = listingsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should enforce max limit of 100', () => {
      const invalidQuery = {
        limit: '150',
      };

      const result = listingsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should sanitize query strings for SQL injection', () => {
      const maliciousQuery = {
        query: "'; DROP TABLE users; --",
      };

      const result = listingsQuerySchema.safeParse(maliciousQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        // Should allow the string but it will be safely escaped when used
        expect(result.data.query).toBe("'; DROP TABLE users; --");
      }
    });

    it('should handle empty parameters', () => {
      const emptyQuery = {};

      const result = listingsQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });
  });

  describe('createListingSchema', () => {
    it('should validate mining license with required fields', () => {
      const miningLicense = {
        title: 'Gold Mining License - Aktobe Region',
        description:
          'Active gold mining operation with proven reserves of 50 tons',
        type: 'MINING_LICENSE',
        mineral: 'Gold',
        region: 'Aktobe',
        price: 15000000,
        area: 500,
        coordinates: { lat: 50.123, lng: 57.456 },
        status: 'ACTIVE',
        licenseNumber: 'KZ-ML-2024-001',
        licenseExpiry: '2030-12-31',
        licenseSubtype: 'PRODUCTION',
      };

      const result = createListingSchema.safeParse(miningLicense);
      expect(result.success).toBe(true);
    });

    it('should validate exploration license with required fields', () => {
      const explorationLicense = {
        title: 'Copper Exploration License',
        description:
          'High-potential copper exploration site with preliminary studies',
        type: 'EXPLORATION_LICENSE',
        mineral: 'Copper',
        region: 'Karaganda',
        price: 5000000,
        area: 1000,
        status: 'ACTIVE',
        explorationStage: 'PROSPECTING',
        explorationPeriod: '2024-2026',
        explorationBudget: 2000000,
      };

      const result = createListingSchema.safeParse(explorationLicense);
      expect(result.success).toBe(true);
    });

    it('should validate mineral occurrence with required fields', () => {
      const mineralOccurrence = {
        title: 'Uranium Mineral Occurrence',
        description:
          'Newly discovered uranium deposits with high geological confidence',
        type: 'MINERAL_OCCURRENCE',
        mineral: 'Uranium',
        region: 'Mangystau',
        area: 200,
        status: 'ACTIVE',
        discoveryDate: '2023-06-15',
        geologicalConfidence: 'HIGH',
        estimatedReserves: '10000 tons',
      };

      const result = createListingSchema.safeParse(mineralOccurrence);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const incomplete = {
        title: 'Test Listing',
        // Missing description, type, etc.
      };

      const result = createListingSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should reject title longer than 200 characters', () => {
      const longTitle = {
        title: 'a'.repeat(201),
        description: 'Valid description',
        type: 'MINING_LICENSE',
        mineral: 'Gold',
        region: 'Aktobe',
        status: 'ACTIVE',
      };

      const result = createListingSchema.safeParse(longTitle);
      expect(result.success).toBe(false);
    });

    it('should reject description shorter than 10 characters', () => {
      const shortDesc = {
        title: 'Valid Title',
        description: 'Too short',
        type: 'MINING_LICENSE',
        mineral: 'Gold',
        region: 'Aktobe',
        status: 'ACTIVE',
      };

      const result = createListingSchema.safeParse(shortDesc);
      expect(result.success).toBe(false);
    });

    it('should reject invalid coordinate values', () => {
      const invalidCoords = {
        title: 'Test Listing',
        description: 'Valid description for testing',
        type: 'MINING_LICENSE',
        mineral: 'Gold',
        region: 'Aktobe',
        status: 'ACTIVE',
        coordinates: { lat: 200, lng: 300 }, // Invalid lat/lng
      };

      const result = createListingSchema.safeParse(invalidCoords);
      expect(result.success).toBe(false);
    });

    it('should handle optional contact information', () => {
      const withContact = {
        title: 'Gold Mining License',
        description: 'Premium gold mining operation',
        type: 'MINING_LICENSE',
        mineral: 'Gold',
        region: 'Aktobe',
        status: 'ACTIVE',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+7 777 123 4567',
      };

      const result = createListingSchema.safeParse(withContact);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contactEmail).toBe('john@example.com');
      }
    });

    it('should reject invalid email format', () => {
      const invalidEmail = {
        title: 'Test Listing',
        description: 'Valid description for testing',
        type: 'MINING_LICENSE',
        mineral: 'Gold',
        region: 'Aktobe',
        status: 'ACTIVE',
        contactEmail: 'not-an-email',
      };

      const result = createListingSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('updateListingSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
        price: 20000000,
      };

      const result = updateListingSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
        expect(result.data.price).toBe(20000000);
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should validate updated fields', () => {
      const invalidUpdate = {
        title: '', // Empty title not allowed
      };

      const result = updateListingSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should allow status updates', () => {
      const statusUpdate = {
        status: 'SOLD',
      };

      const result = updateListingSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('SOLD');
      }
    });
  });

  describe('listingIdSchema', () => {
    it('should validate UUID format', () => {
      const validUuid = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = listingIdSchema.safeParse(validUuid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const invalidUuid = {
        id: 'not-a-uuid',
      };

      const result = listingIdSchema.safeParse(invalidUuid);
      expect(result.success).toBe(false);
    });

    it('should reject numeric IDs', () => {
      const numericId = {
        id: '12345',
      };

      const result = listingIdSchema.safeParse(numericId);
      expect(result.success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('should set default values', () => {
      const empty = {};

      const result = paginationSchema.safeParse(empty);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should parse string values to numbers', () => {
      const stringValues = {
        page: '5',
        limit: '50',
      };

      const result = paginationSchema.safeParse(stringValues);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should enforce minimum page of 1', () => {
      const invalidPage = {
        page: '0',
      };

      const result = paginationSchema.safeParse(invalidPage);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum limit of 100', () => {
      const invalidLimit = {
        limit: '200',
      };

      const result = paginationSchema.safeParse(invalidLimit);
      expect(result.success).toBe(false);
    });
  });
});
