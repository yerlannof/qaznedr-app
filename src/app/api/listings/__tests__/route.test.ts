import { GET, POST, PUT, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { validateCSRFToken } from '@/lib/middleware/csrf';
import { RedisCache } from '@/lib/cache/redis';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/middleware/rate-limit');
jest.mock('@/lib/middleware/csrf');
jest.mock('@/lib/cache/redis');

describe('Listings API', () => {
  let mockSupabase: any;
  let mockCache: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn(),
      auth: {
        getUser: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Setup Redis cache mock
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      cached: jest.fn(),
    };

    RedisCache.getInstance = jest.fn().mockReturnValue(mockCache);

    // Setup rate limit mock
    (rateLimit as jest.Mock).mockResolvedValue({
      success: true,
      remaining: 10,
    });

    // Setup CSRF mock
    (validateCSRFToken as jest.Mock).mockReturnValue(true);
  });

  describe('GET /api/listings', () => {
    it('should return cached listings when available', async () => {
      const cachedData = [
        {
          id: '1',
          title: 'Cached Gold Mine',
          type: 'MINING_LICENSE',
          mineral: 'Gold',
        },
      ];

      mockCache.get.mockResolvedValue(cachedData);

      const request = new NextRequest('http://localhost:3000/api/listings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(cachedData);
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch from database when cache miss', async () => {
      const dbData = [
        {
          id: '2',
          title: 'Database Gold Mine',
          type: 'MINING_LICENSE',
          mineral: 'Gold',
        },
      ];

      mockCache.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({ data: dbData, error: null });

      const request = new NextRequest('http://localhost:3000/api/listings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('kazakhstan_deposits');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      mockCache.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest(
        'http://localhost:3000/api/listings?type=EXPLORATION_LICENSE&mineral=Copper&minPrice=1000000'
      );
      const response = await GET(request);

      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'type',
        'EXPLORATION_LICENSE'
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('mineral', 'Copper');
      expect(mockSupabase.gte).toHaveBeenCalledWith('price', 1000000);
    });

    it('should handle search queries', async () => {
      mockCache.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest(
        'http://localhost:3000/api/listings?query=gold'
      );
      const response = await GET(request);

      expect(mockSupabase.or).toHaveBeenCalled();
    });

    it('should implement pagination', async () => {
      mockCache.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest(
        'http://localhost:3000/api/listings?page=2&limit=10'
      );
      const response = await GET(request);

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19);
    });

    it('should handle rate limiting', async () => {
      (rateLimit as jest.Mock).mockResolvedValue({
        success: false,
        remaining: 0,
        reset: Date.now() + 10000,
      });

      const request = new NextRequest('http://localhost:3000/api/listings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should handle database errors', async () => {
      mockCache.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/listings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('database');
    });

    it('should validate query parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/listings?limit=200' // Exceeds max limit
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('validation');
    });
  });

  describe('POST /api/listings', () => {
    it('should create a new listing with valid data', async () => {
      const newListing = {
        title: 'New Gold Mine',
        description: 'Premium gold mining operation with proven reserves',
        type: 'MINING_LICENSE',
        mineral: 'Gold',
        region: 'Aktobe',
        price: 15000000,
        area: 500,
        status: 'ACTIVE',
        licenseNumber: 'KZ-ML-2024-002',
        licenseExpiry: '2030-12-31',
        licenseSubtype: 'PRODUCTION',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { ...newListing, id: 'new-id', user_id: 'user-123' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-token',
          Cookie: 'csrf-token=valid-token',
        },
        body: JSON.stringify(newListing),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('new-id');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Gold Mine',
          type: 'MINING_LICENSE',
        })
      );
      expect(mockCache.delete).toHaveBeenCalledWith('listings:*');
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-token',
          Cookie: 'csrf-token=valid-token',
        },
        body: JSON.stringify({ title: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate CSRF token', async () => {
      (validateCSRFToken as jest.Mock).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'invalid-token',
          Cookie: 'csrf-token=valid-token',
        },
        body: JSON.stringify({ title: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Invalid CSRF token');
    });

    it('should validate input data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const invalidListing = {
        title: '', // Empty title
        description: 'Short', // Too short
      };

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-token',
          Cookie: 'csrf-token=valid-token',
        },
        body: JSON.stringify(invalidListing),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('validation');
    });

    it('should check rate limits', async () => {
      (rateLimit as jest.Mock).mockResolvedValue({
        success: false,
        remaining: 0,
        reset: Date.now() + 10000,
      });

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-token',
          Cookie: 'csrf-token=valid-token',
        },
        body: JSON.stringify({ title: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
    });
  });

  describe('PUT /api/listings/[id]', () => {
    it('should update an existing listing', async () => {
      const listingId = '123e4567-e89b-12d3-a456-426614174000';
      const updates = {
        price: 20000000,
        status: 'SOLD',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Check ownership
      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: 'user-123' },
        error: null,
      });

      // Perform update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: listingId, ...updates },
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/listings/${listingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'valid-token',
            Cookie: 'csrf-token=valid-token',
          },
          body: JSON.stringify(updates),
        }
      );

      const response = await PUT(request, { params: { id: listingId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should prevent updating listings owned by others', async () => {
      const listingId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Different owner
      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'user-456' },
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/listings/${listingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'valid-token',
            Cookie: 'csrf-token=valid-token',
          },
          body: JSON.stringify({ price: 20000000 }),
        }
      );

      const response = await PUT(request, { params: { id: listingId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Not authorized to update this listing');
    });
  });

  describe('DELETE /api/listings/[id]', () => {
    it('should delete a listing owned by user', async () => {
      const listingId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Check ownership
      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: 'user-123' },
        error: null,
      });

      // Perform delete
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/listings/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': 'valid-token',
            Cookie: 'csrf-token=valid-token',
          },
        }
      );

      const response = await DELETE(request, { params: { id: listingId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should prevent deleting listings owned by others', async () => {
      const listingId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Different owner
      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'user-456' },
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/listings/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': 'valid-token',
            Cookie: 'csrf-token=valid-token',
          },
        }
      );

      const response = await DELETE(request, { params: { id: listingId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Not authorized to delete this listing');
    });
  });
});
