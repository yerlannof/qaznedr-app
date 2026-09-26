/**
 * Shared transform from a kazakhstan_deposits database row (snake_case) into the
 * KazakhstanDeposit shape (camelCase) consumed by frontend components.
 *
 * Single source of truth — used by both the catalog route (/api/listings) and the
 * detail route (/api/listings/[id]) so the two never drift apart (the drift was the
 * root cause of the "Объявление не найдено" detail-page bug).
 */
export function transformDepositFromDB(row: any): any {
  // Parse coordinates - handle various formats from the database
  let coordinates: [number, number] = [0, 0];
  if (row.coordinates_lat != null && row.coordinates_lng != null) {
    coordinates = [
      Number(row.coordinates_lat) || 0,
      Number(row.coordinates_lng) || 0,
    ];
  } else if (row.coordinates) {
    if (Array.isArray(row.coordinates) && row.coordinates.length >= 2) {
      coordinates = [
        Number(row.coordinates[0]) || 0,
        Number(row.coordinates[1]) || 0,
      ];
    } else if (
      typeof row.coordinates === 'object' &&
      row.coordinates !== null
    ) {
      coordinates = [
        Number(row.coordinates.lat ?? row.coordinates.latitude ?? 0) || 0,
        Number(
          row.coordinates.lng ??
            row.coordinates.longitude ??
            row.coordinates.lon ??
            0
        ) || 0,
      ];
    } else if (typeof row.coordinates === 'string') {
      try {
        const parsed = JSON.parse(row.coordinates);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          coordinates = [Number(parsed[0]) || 0, Number(parsed[1]) || 0];
        } else if (typeof parsed === 'object' && parsed !== null) {
          coordinates = [
            Number(parsed.lat ?? parsed.latitude ?? 0) || 0,
            Number(parsed.lng ?? parsed.longitude ?? parsed.lon ?? 0) || 0,
          ];
        }
      } catch {
        // leave as [0, 0]
      }
    }
  }

  // Build exploration period if start/end are present
  let explorationPeriod: { start: Date; end: Date } | undefined;
  if (row.exploration_start && row.exploration_end) {
    explorationPeriod = {
      start: new Date(row.exploration_start),
      end: new Date(row.exploration_end),
    };
  }

  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    type: row.type,
    mineral: row.mineral,
    region: row.region,
    city: row.city || '',
    area: Number(row.area) || 0,
    price: row.price != null ? Number(row.price) : null,
    coordinates,
    verified: Boolean(row.verified),
    featured: Boolean(row.featured),
    views: Number(row.views) || 0,
    status: row.status || 'ACTIVE',
    images: Array.isArray(row.images) ? row.images : [],
    documents: Array.isArray(row.documents) ? row.documents : [],
    userId: row.user_id || row.owner_id || '',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),

    // Mining license fields
    licenseSubtype: row.license_subtype || undefined,
    licenseNumber: row.license_number || undefined,
    licenseExpiry: row.license_expiry
      ? new Date(row.license_expiry)
      : undefined,
    annualProductionLimit:
      row.annual_production_limit != null
        ? Number(row.annual_production_limit)
        : undefined,

    // Exploration license fields
    explorationStage: row.exploration_stage || undefined,
    explorationPeriod,
    explorationBudget:
      row.exploration_budget != null
        ? Number(row.exploration_budget)
        : undefined,

    // Mineral occurrence fields
    discoveryDate: row.discovery_date
      ? new Date(row.discovery_date)
      : undefined,
    geologicalConfidence: row.geological_confidence || undefined,
    estimatedReserves:
      row.estimated_reserves != null
        ? Number(row.estimated_reserves)
        : undefined,
    accessibilityRating: row.accessibility_rating || undefined,
  };
}
