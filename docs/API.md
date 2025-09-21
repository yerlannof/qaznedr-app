# QAZNEDR API Documentation

## Overview

The QAZNEDR API provides RESTful endpoints for managing mining listings, user interactions, and analytics data. All API routes are prefixed with `/api`.

## Authentication

Most endpoints require authentication via NextAuth session cookies or Supabase JWT tokens.

```typescript
// Request headers
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

## Base URL

```
Development: http://localhost:3000/api
Production: https://qaznedr.kz/api
```

## Endpoints

### Listings

#### GET /api/listings

Fetch mining listings with optional filters.

**Query Parameters:**

- `type` - Filter by listing type (MINING_LICENSE, EXPLORATION_LICENSE, MINERAL_OCCURRENCE)
- `mineral` - Filter by mineral type (Золото, Медь, Уран, etc.)
- `region` - Filter by region (Карагандинская, Атырауская, etc.)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `minArea` - Minimum area in km²
- `maxArea` - Maximum area in km²
- `verified` - Show only verified listings (boolean)
- `featured` - Show only featured listings (boolean)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)
- `sortBy` - Sort field (price, area, createdAt, views)
- `sortOrder` - Sort order (asc, desc)

**Response:**

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "uuid",
        "title": "Gold Mining License - Karaganda",
        "type": "MINING_LICENSE",
        "mineral": "Золото",
        "region": "Карагандинская",
        "city": "Караганда",
        "area": 150,
        "price": 50000000,
        "coordinates": [49.8047, 73.1094],
        "verified": true,
        "featured": false,
        "views": 234,
        "status": "ACTIVE",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### GET /api/listings/[id]

Get detailed information about a specific listing.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Gold Mining License - Karaganda",
    "description": "Active gold mining operation...",
    "type": "MINING_LICENSE",
    "mineral": "Золото",
    "region": "Карагандинская",
    "city": "Караганда",
    "area": 150,
    "price": 50000000,
    "coordinates": [49.8047, 73.1094],
    "licenseNumber": "LIC-2024-001",
    "licenseExpiry": "2030-12-31",
    "annualProductionLimit": 1000,
    "images": ["url1", "url2"],
    "documents": ["doc1", "doc2"],
    "geologicalData": {
      "reserves": 50000,
      "grade": 2.5,
      "depth": 200
    }
  }
}
```

#### POST /api/listings

Create a new listing.

**Request Body:**

```json
{
  "title": "New Mining License",
  "description": "Description of the mining opportunity",
  "type": "MINING_LICENSE",
  "mineral": "Золото",
  "region": "Карагандинская",
  "city": "Караганда",
  "area": 100,
  "price": 25000000,
  "coordinates": [49.8047, 73.1094],
  "licenseNumber": "LIC-2024-002",
  "licenseExpiry": "2035-12-31"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "message": "Listing created successfully"
  }
}
```

#### PUT /api/listings/[id]

Update an existing listing.

**Request Body:**

```json
{
  "title": "Updated Title",
  "price": 30000000,
  "status": "PENDING"
}
```

#### DELETE /api/listings/[id]

Delete a listing.

**Response:**

```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

### Analytics

#### POST /api/analytics

Track custom analytics events.

**Request Body:**

```json
{
  "name": "listing_viewed",
  "properties": {
    "listingId": "uuid",
    "source": "search"
  },
  "timestamp": 1705315200000
}
```

#### GET /api/analytics

Retrieve analytics data.

**Query Parameters:**

- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `eventName` - Filter by event name
- `userId` - Filter by user ID
- `limit` - Maximum events (default: 100)

**Response:**

```json
{
  "success": true,
  "data": {
    "events": [...],
    "totalEvents": 1523,
    "eventCounts": [
      {
        "name": "listing_viewed",
        "count": 850
      }
    ]
  }
}
```

### User

#### GET /api/user/favorites

Get user's favorite listings.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "listingId": "listing-uuid",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/user/favorites

Add a listing to favorites.

**Request Body:**

```json
{
  "listingId": "listing-uuid"
}
```

#### DELETE /api/user/favorites/[id]

Remove from favorites.

### Contact

#### POST /api/contact

Send a contact request for a listing.

**Request Body:**

```json
{
  "listingId": "uuid",
  "message": "I'm interested in this mining license",
  "phone": "+7 777 123 4567",
  "email": "buyer@example.com"
}
```

### Search

#### GET /api/search

Full-text search across all listings.

**Query Parameters:**

- `q` - Search query
- `type` - Filter by type
- `limit` - Results limit

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [...],
    "total": 25,
    "query": "gold karaganda"
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes

| Code               | Description                       |
| ------------------ | --------------------------------- |
| `UNAUTHORIZED`     | Missing or invalid authentication |
| `FORBIDDEN`        | Access denied to resource         |
| `NOT_FOUND`        | Resource not found                |
| `VALIDATION_ERROR` | Invalid request data              |
| `RATE_LIMITED`     | Too many requests                 |
| `SERVER_ERROR`     | Internal server error             |

## Rate Limiting

- **Anonymous**: 100 requests per hour
- **Authenticated**: 1000 requests per hour
- **Premium**: Unlimited

## Pagination

Standard pagination format:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhooks

Configure webhooks for real-time events:

```json
{
  "event": "listing.created",
  "data": {...},
  "timestamp": "2024-01-15T10:00:00Z",
  "signature": "hmac-sha256-signature"
}
```

### Supported Events

- `listing.created`
- `listing.updated`
- `listing.deleted`
- `listing.sold`
- `contact.received`
- `user.registered`

## SDK Examples

### JavaScript/TypeScript

```typescript
import { QaznedrAPI } from '@qaznedr/sdk';

const api = new QaznedrAPI({
  apiKey: 'YOUR_API_KEY',
  baseURL: 'https://qaznedr.kz/api',
});

// Fetch listings
const listings = await api.listings.list({
  mineral: 'Золото',
  region: 'Карагандинская',
  limit: 10,
});

// Get single listing
const listing = await api.listings.get('uuid');

// Create listing
const newListing = await api.listings.create({
  title: 'New Mining License',
  // ... other fields
});
```

### cURL

```bash
# Get listings
curl -X GET "https://qaznedr.kz/api/listings?mineral=Золото&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create listing
curl -X POST "https://qaznedr.kz/api/listings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New License","type":"MINING_LICENSE"}'
```

## Testing

Test environment available at:

```
https://test-api.qaznedr.kz
```

Use test API keys:

- Public: `test_pub_key_123`
- Secret: `test_secret_key_456`
