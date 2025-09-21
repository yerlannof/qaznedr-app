# QAZNEDR.KZ API Documentation

## Base URL
- Production: `https://qaznedr.kz/api`
- Development: `http://localhost:3000/api`

## Authentication

All protected endpoints require authentication via Supabase Auth. Include the authentication token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Rate Limiting

- **Standard endpoints**: 30 requests per minute per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Write operations**: 10 requests per minute per user

## API Endpoints

### Listings

#### GET /api/listings
Get all listings with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12, max: 100)
- `sortBy` (string): Sort field (created_at, price, area, views)
- `sortOrder` (string): asc or desc (default: desc)
- `query` (string): Search query
- `type` (string): MINING_LICENSE | EXPLORATION_LICENSE | MINERAL_OCCURRENCE
- `mineral` (string): Oil | Gas | Gold | Copper | Coal | Uranium | Iron
- `region` (string): Kazakhstan region name
- `verified` (boolean): Filter by verified status
- `featured` (boolean): Filter by featured status
- `priceMin` (number): Minimum price in KZT
- `priceMax` (number): Maximum price in KZT
- `areaMin` (number): Minimum area in km²
- `areaMax` (number): Maximum area in km²

**Response:**
```json
{
  "success": true,
  "data": {
    "deposits": [
      {
        "id": "uuid",
        "title": "Kashagan Oil Field",
        "description": "Major offshore oil field",
        "type": "MINING_LICENSE",
        "mineral": "Oil",
        "price": 850000000000,
        "area": 5500,
        "region": "Атырауская область",
        "city": "Атырау",
        "coordinates": { "lat": 46.15, "lng": 50.0 },
        "status": "ACTIVE",
        "verified": true,
        "featured": false,
        "views": 1250,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-20T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 150,
      "totalPages": 13,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### POST /api/listings
Create a new listing (requires authentication).

**Request Body:**
```json
{
  "title": "New Mining License",
  "description": "Description of the mining opportunity",
  "type": "MINING_LICENSE",
  "mineral": "Gold",
  "price": 5000000000,
  "area": 250,
  "region": "Карагандинская область",
  "city": "Караганда",
  "coordinates": { "lat": 49.8, "lng": 73.1 },
  "images": ["https://..."],
  "documents": ["https://..."],
  
  // For MINING_LICENSE type:
  "licenseSubtype": "extraction",
  "licenseNumber": "KZ-2024-001",
  "licenseExpiry": "2034-12-31",
  "annualProductionLimit": 50000,
  
  // For EXPLORATION_LICENSE type:
  "explorationStage": "DETAILED",
  "explorationStart": "2024-01-01",
  "explorationEnd": "2026-12-31",
  "explorationBudget": 10000000,
  
  // For MINERAL_OCCURRENCE type:
  "discoveryDate": "2023-06-15",
  "geologicalConfidence": "INDICATED",
  "estimatedReserves": 1000000,
  "accessibilityRating": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "New Mining License",
    "status": "DRAFT",
    "created_at": "2024-01-25T12:00:00Z"
  }
}
```

#### GET /api/listings/[id]
Get a specific listing by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Kashagan Oil Field",
    "description": "Detailed description...",
    "type": "MINING_LICENSE",
    "mineral": "Oil",
    "price": 850000000000,
    "area": 5500,
    "region": "Атырауская область",
    "city": "Атырау",
    "coordinates": { "lat": 46.15, "lng": 50.0 },
    "images": ["url1", "url2"],
    "documents": ["doc1", "doc2"],
    "status": "ACTIVE",
    "verified": true,
    "featured": false,
    "views": 1251,
    "user_id": "user_uuid",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-20T15:30:00Z"
  }
}
```

#### PUT /api/listings/[id]
Update a listing (requires authentication and ownership).

**Request Body:** Same as POST /api/listings

#### DELETE /api/listings/[id]
Delete a listing (requires authentication and ownership).

### Favorites

#### GET /api/favorites
Get user's favorite listings (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "listing_id": "listing_uuid",
      "created_at": "2024-01-20T10:00:00Z",
      "listing": {
        "title": "Tengiz Oil Field",
        "type": "MINING_LICENSE",
        "mineral": "Oil",
        "price": 750000000000
      }
    }
  ]
}
```

#### POST /api/favorites
Add a listing to favorites (requires authentication).

**Request Body:**
```json
{
  "listingId": "listing_uuid"
}
```

#### DELETE /api/favorites/[id]
Remove a listing from favorites (requires authentication).

### Authentication

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "company": "Mining Corp",
  "phone": "+7 701 234 5678"
}
```

#### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### POST /api/auth/logout
Logout current user (requires authentication).

#### POST /api/auth/reset-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### GDPR Compliance

#### GET /api/gdpr/export
Export all user data (requires authentication).

**Response:** JSON file with all user data.

#### DELETE /api/gdpr/delete
Request account deletion (requires authentication).

**Request Body:**
```json
{
  "password": "current_password",
  "confirmDeletion": true
}
```

#### GET /api/gdpr/consent
Get current consent preferences (requires authentication).

#### POST /api/gdpr/consent
Update consent preferences (requires authentication).

**Request Body:**
```json
{
  "preferences": {
    "analytics": true,
    "marketing": false,
    "personalizedContent": true,
    "thirdPartySharing": false,
    "newsletterSubscription": true
  }
}
```

### Analytics

#### GET /api/analytics/dashboard
Get dashboard analytics (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalListings": 150,
    "activeListings": 120,
    "totalViews": 45000,
    "totalValue": 5750000000000,
    "recentActivity": [],
    "topListings": [],
    "mineralDistribution": [],
    "regionDistribution": []
  }
}
```

#### POST /api/analytics/web-vitals
Track web vitals performance metrics.

**Request Body:**
```json
{
  "metrics": {
    "CLS": 0.05,
    "FID": 50,
    "LCP": 1200,
    "FCP": 800,
    "TTFB": 200
  },
  "url": "/listings",
  "userAgent": "Mozilla/5.0..."
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": ["Validation error message"]
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Security Headers

All API responses include these security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'
```

## Input Validation

All inputs are validated and sanitized to prevent:
- SQL Injection
- XSS (Cross-Site Scripting)
- Path Traversal
- Command Injection
- NoSQL Injection

## Best Practices

1. **Always use HTTPS** in production
2. **Include authentication tokens** for protected endpoints
3. **Handle rate limiting** gracefully with exponential backoff
4. **Validate inputs** on client side before sending
5. **Cache responses** when appropriate
6. **Use pagination** for list endpoints
7. **Handle errors** gracefully in your application

## SDK Examples

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('https://qaznedr.kz/api/listings', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Using Supabase client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

const { data, error } = await supabase
  .from('kazakhstan_deposits')
  .select('*')
  .eq('type', 'MINING_LICENSE')
  .order('created_at', { ascending: false });
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://qaznedr.kz/api/listings',
    headers=headers,
    params={'type': 'MINING_LICENSE', 'limit': 10}
)
data = response.json()
```

## Webhooks

Webhooks can be configured for these events:

- `listing.created`: New listing created
- `listing.updated`: Listing updated
- `listing.deleted`: Listing deleted
- `listing.verified`: Listing verified by admin
- `user.registered`: New user registered
- `payment.completed`: Payment processed

## Support

For API support:
- Email: api@qaznedr.kz
- Documentation: https://docs.qaznedr.kz
- Status Page: https://status.qaznedr.kz