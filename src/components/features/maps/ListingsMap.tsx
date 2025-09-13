'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  GeolocateControl,
  FullscreenControl,
} from 'react-map-gl/maplibre';
import { createClient } from '@/lib/supabase/client';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Maximize,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card-new';
import { getMineralIcon } from '@/components/icons';
import 'maplibre-gl/dist/maplibre-gl.css';

// Kazakhstan bounds
const KAZAKHSTAN_BOUNDS = {
  sw: [46.4932, 40.5686] as [number, number], // Southwest coordinates
  ne: [87.3156, 55.4421] as [number, number], // Northeast coordinates
};

interface ListingMarker {
  id: string;
  title: string;
  type: string;
  mineral: string;
  region: string;
  city: string;
  price: number | null;
  area: number;
  coordinates: [number, number];
  verified: boolean;
}

interface ListingsMapProps {
  listings?: ListingMarker[];
  onMarkerClick?: (listing: ListingMarker) => void;
  className?: string;
}

const MINERAL_COLORS: Record<string, string> = {
  Нефть: '#000000',
  Газ: '#3B82F6',
  Золото: '#F59E0B',
  Медь: '#EA580C',
  Уголь: '#374151',
  Уран: '#10B981',
  Железо: '#6B7280',
  default: '#8B5CF6',
};

export default function ListingsMap({
  listings: initialListings,
  onMarkerClick,
  className,
}: ListingsMapProps) {
  const [viewState, setViewState] = useState({
    longitude: 71.4278,
    latitude: 51.1605,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  });

  const [listings, setListings] = useState<ListingMarker[]>(
    initialListings || []
  );
  const [selectedListing, setSelectedListing] = useState<ListingMarker | null>(
    null
  );
  const [mapStyle, setMapStyle] = useState(
    'https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY'
  );
  const [showClusters, setShowClusters] = useState(true);
  const mapRef = useRef<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!initialListings) {
      loadListings();
    }
  }, [initialListings]);

  const loadListings = async () => {
    const { data, error } = await supabase
      .from('kazakhstan_deposits')
      .select(
        'id, title, type, mineral, region, city, price, area, coordinates, verified'
      )
      .eq('status', 'ACTIVE')
      .not('coordinates', 'is', null);

    if (error) {
      console.error('Error loading listings:', error);
      return;
    }

    const markers: ListingMarker[] =
      data?.map((item: any) => ({
        ...item,
        coordinates: JSON.parse(item.coordinates) as [number, number],
      })) || [];

    setListings(markers);
  };

  const handleMarkerClick = useCallback(
    (listing: ListingMarker) => {
      setSelectedListing(listing);
      if (onMarkerClick) {
        onMarkerClick(listing);
      }

      // Center map on marker
      mapRef.current?.flyTo({
        center: listing.coordinates,
        zoom: 10,
        duration: 1000,
      });
    },
    [onMarkerClick]
  );

  const formatPrice = (price: number | null) => {
    if (!price) return 'По запросу';
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} млрд ₸`;
    } else if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн ₸`;
    }
    return `${price.toLocaleString()} ₸`;
  };

  const mapStyles = [
    {
      name: 'Светлая',
      value:
        'https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY',
    },
    {
      name: 'Темная',
      value:
        'https://api.maptiler.com/maps/toner/style.json?key=YOUR_MAPTILER_KEY',
    },
    {
      name: 'Спутник',
      value:
        'https://api.maptiler.com/maps/hybrid/style.json?key=YOUR_MAPTILER_KEY',
    },
    {
      name: 'Топография',
      value:
        'https://api.maptiler.com/maps/outdoor/style.json?key=YOUR_MAPTILER_KEY',
    },
  ];

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        maxBounds={[KAZAKHSTAN_BOUNDS.sw, KAZAKHSTAN_BOUNDS.ne]}
        minZoom={4}
        maxZoom={18}
      >
        {/* Controls */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />
        <GeolocateControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Markers */}
        {listings.map((listing) => {
          const MineralIcon = getMineralIcon(listing.mineral);
          const color =
            MINERAL_COLORS[listing.mineral] || MINERAL_COLORS.default;

          return (
            <Marker
              key={listing.id}
              longitude={listing.coordinates[0]}
              latitude={listing.coordinates[1]}
              anchor="bottom"
              onClick={() => handleMarkerClick(listing)}
            >
              <div
                className="relative cursor-pointer transform transition-transform hover:scale-110"
                style={{
                  transform:
                    selectedListing?.id === listing.id
                      ? 'scale(1.2)'
                      : 'scale(1)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                  style={{ backgroundColor: color }}
                >
                  <MineralIcon className="w-5 h-5 text-white" />
                </div>
                {listing.verified && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
            </Marker>
          );
        })}

        {/* Popup */}
        {selectedListing && (
          <Popup
            longitude={selectedListing.coordinates[0]}
            latitude={selectedListing.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedListing(null)}
            closeButton={true}
            closeOnClick={false}
            className="map-popup"
          >
            <Card padding="sm" className="min-w-[250px]">
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedListing.title}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  {selectedListing.region}, {selectedListing.city}
                </p>
                <p className="text-gray-600">
                  Минерал:{' '}
                  <span className="font-medium">{selectedListing.mineral}</span>
                </p>
                <p className="text-gray-600">
                  Площадь:{' '}
                  <span className="font-medium">
                    {selectedListing.area} км²
                  </span>
                </p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  {formatPrice(selectedListing.price)}
                </p>
              </div>
              <a
                href={`/listings/${selectedListing.id}`}
                className="mt-3 block w-full text-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Подробнее
              </a>
            </Card>
          </Popup>
        )}
      </Map>

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <Card padding="sm" className="bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Стиль карты
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {mapStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => setMapStyle(style.value)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  mapStyle === style.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-4 z-10">
        <Card padding="sm" className="bg-white/95 backdrop-blur-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Легенда</h4>
          <div className="space-y-1">
            {Object.entries(MINERAL_COLORS)
              .filter(([key]) => key !== 'default')
              .map(([mineral, color]) => (
                <div key={mineral} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600">{mineral}</span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Stats Overlay */}
      <div className="absolute top-4 right-20 z-10">
        <Card padding="sm" className="bg-white/95 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {listings.length}
            </div>
            <div className="text-xs text-gray-600">Объектов на карте</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
