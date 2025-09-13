'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Eye,
  DollarSign,
  Factory,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

interface DepositMapProps {
  deposits: KazakhstanDeposit[];
  selectedDeposit?: KazakhstanDeposit | null;
  onDepositClick?: (deposit: KazakhstanDeposit) => void;
  className?: string;
  height?: string;
}

// Kazakhstan center coordinates
const KAZAKHSTAN_CENTER: [number, number] = [48.0196, 66.9237];
const KAZAKHSTAN_BOUNDS: [[number, number], [number, number]] = [
  [40.5686, 46.4662], // Southwest corner
  [55.4421, 87.3599], // Northeast corner
];

// Create custom marker icons for different deposit types
const createCustomIcon = (type: string, isSelected?: boolean) => {
  if (typeof window === 'undefined') return null;

  const colors = {
    MINING_LICENSE: '#3B82F6', // Blue
    EXPLORATION_LICENSE: '#10B981', // Green
    MINERAL_OCCURRENCE: '#F59E0B', // Yellow
  };

  const color = colors[type as keyof typeof colors] || '#6B7280';
  const size = isSelected ? 40 : 30;
  const opacity = isSelected ? 1 : 0.8;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        background-color: ${color}; 
        border: 3px solid white;
        border-radius: 50%; 
        opacity: ${opacity};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="color: white; font-size: ${size / 3}px; font-weight: bold;">
          ${type === 'MINING_LICENSE' ? '⛏️' : type === 'EXPLORATION_LICENSE' ? '🔍' : '📍'}
        </div>
      </div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const formatPrice = (price: number | null) => {
  if (!price) return 'По запросу';

  if (price >= 1000000000000) {
    return `${(price / 1000000000000).toFixed(1)} трлн ₸`;
  } else if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(1)} млрд ₸`;
  } else if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)} млн ₸`;
  } else {
    return `${price.toLocaleString()} ₸`;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'MINING_LICENSE':
      return 'Лицензия на добычу';
    case 'EXPLORATION_LICENSE':
      return 'Лицензия на разведку';
    case 'MINERAL_OCCURRENCE':
      return 'Рудопроявление';
    default:
      return type;
  }
};

function MapContent({
  deposits,
  selectedDeposit,
  onDepositClick,
  height = '400px',
}: DepositMapProps) {
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset map view to Kazakhstan
  const resetView = () => {
    if (mapRef.current) {
      const map = (mapRef.current as any).getMap();
      map.fitBounds(KAZAKHSTAN_BOUNDS, { padding: [20, 20] });
    }
  };

  // Zoom controls
  const zoomIn = () => {
    if (mapRef.current) {
      const map = (mapRef.current as any).getMap();
      map.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      const map = (mapRef.current as any).getMap();
      map.zoomOut();
    }
  };

  return (
    <div
      className={cn('relative', isFullscreen && 'fixed inset-0 z-50 bg-white')}
    >
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-10 w-10 bg-white shadow-md hover:bg-gray-50"
        >
          {isFullscreen ? (
            <X className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={resetView}
          className="h-10 w-10 bg-white shadow-md hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={zoomIn}
          className="h-10 w-10 bg-white shadow-md hover:bg-gray-50"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={zoomOut}
          className="h-10 w-10 bg-white shadow-md hover:bg-gray-50"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="p-3 bg-white/95 backdrop-blur-sm">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Типы месторождений</h4>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-[8px]">⛏️</span>
                </div>
                <span>Лицензии на добычу</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-[8px]">🔍</span>
                </div>
                <span>Лицензии на разведку</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-600 flex items-center justify-center">
                  <span className="text-[8px]">📍</span>
                </div>
                <span>Рудопроявления</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div
        className="w-full rounded-lg overflow-hidden"
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        <MapContainer
          ref={mapRef}
          center={KAZAKHSTAN_CENTER}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          maxBounds={KAZAKHSTAN_BOUNDS}
          minZoom={5}
          maxZoom={15}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {deposits.map((deposit) => {
            // Generate random coordinates within Kazakhstan bounds if not provided
            const lat =
              deposit.coordinates?.lat ||
              40.5686 + Math.random() * (55.4421 - 40.5686);
            const lng =
              deposit.coordinates?.lng ||
              46.4662 + Math.random() * (87.3599 - 46.4662);

            return (
              <Marker
                key={deposit.id}
                position={[lat, lng]}
                icon={createCustomIcon(
                  deposit.type,
                  selectedDeposit?.id === deposit.id
                )}
                eventHandlers={{
                  click: () => onDepositClick?.(deposit),
                }}
              >
                <Popup>
                  <div className="p-2 max-w-xs">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-gray-900">
                        {deposit.title}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(deposit.type)}
                        </Badge>
                        {deposit.verified && (
                          <Badge
                            variant="default"
                            className="text-xs bg-green-600"
                          >
                            ✓ Проверено
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {deposit.region}, {deposit.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Factory className="w-4 h-4" />
                        <span>{deposit.mineral}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">
                          {formatPrice(deposit.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Eye className="w-4 h-4" />
                        <span>{deposit.views} просмотров</span>
                      </div>

                      <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                        {deposit.description}
                      </p>

                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() =>
                          window.open(`/listings/${deposit.id}`, '_blank')
                        }
                      >
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default function DepositMap(props: DepositMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'w-full bg-gray-100 rounded-lg flex items-center justify-center',
          props.className
        )}
        style={{ height: props.height || '400px' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  return <MapContent {...props} />;
}
