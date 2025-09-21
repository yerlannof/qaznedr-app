'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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
import { formatPrice } from '@/lib/utils/format';

interface DepositMapProps {
  deposits: KazakhstanDeposit[];
  selectedDeposit?: KazakhstanDeposit | null;
  onDepositClick?: (deposit: KazakhstanDeposit) => void;
  className?: string;
  height?: string;
}

// Kazakhstan center coordinates
const KAZAKHSTAN_CENTER: [number, number] = [66.9237, 48.0196];
const KAZAKHSTAN_BOUNDS: [[number, number], [number, number]] = [
  [46.4932, 40.5686],
  [87.3156, 55.4421],
];

export function DepositMap({
  deposits = [],
  selectedDeposit,
  onDepositClick,
  className,
  height = 'h-[500px]',
}: DepositMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: KAZAKHSTAN_CENTER,
      zoom: 5,
      bounds: KAZAKHSTAN_BOUNDS,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers for deposits
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers
    deposits.forEach((deposit) => {
      if (!deposit.coordinates) return;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'w-8 h-8 relative cursor-pointer';

      // Create inner circle
      const inner = document.createElement('div');
      inner.className = cn(
        'absolute inset-0 bg-blue-500 rounded-full border-2 border-white shadow-lg',
        'hover:scale-110 transition-transform',
        selectedDeposit?.id === deposit.id && 'bg-blue-600 scale-110'
      );
      el.appendChild(inner);

      // Create popup
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 max-w-xs">
          <h3 class="font-semibold text-sm mb-1">${deposit.title}</h3>
          <p class="text-xs text-gray-600 mb-2">${deposit.region}, ${deposit.city}</p>
          ${deposit.price ? `<p class="text-sm font-medium">${formatPrice(deposit.price)}</p>` : ''}
          <div class="mt-2 flex gap-1">
            <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              ${deposit.mineral}
            </span>
            <span class="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
              ${deposit.area} км²
            </span>
          </div>
        </div>
      `);

      // Create and add marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([deposit.coordinates.lng, deposit.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler
      el.addEventListener('click', () => {
        onDepositClick?.(deposit);
        // Fly to marker
        map.current?.flyTo({
          center: [deposit.coordinates!.lng, deposit.coordinates!.lat],
          zoom: 10,
          duration: 1500,
        });
      });

      markers.current.push(marker);
    });
  }, [deposits, selectedDeposit, onDepositClick]);

  // Fly to selected deposit
  useEffect(() => {
    if (!map.current || !selectedDeposit?.coordinates) return;

    map.current.flyTo({
      center: [
        selectedDeposit.coordinates.lng,
        selectedDeposit.coordinates.lat,
      ],
      zoom: 10,
      duration: 1500,
    });
  }, [selectedDeposit]);

  const handleReset = () => {
    map.current?.flyTo({
      center: KAZAKHSTAN_CENTER,
      zoom: 5,
      duration: 1000,
    });
  };

  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        isFullscreen && 'fixed inset-4 z-50 m-0',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Карта месторождений
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8"
              title="Приблизить"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8"
              title="Отдалить"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8"
              title="Сбросить вид"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
              title={
                isFullscreen
                  ? 'Выйти из полноэкранного режима'
                  : 'Полноэкранный режим'
              }
            >
              {isFullscreen ? (
                <X className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={mapContainer}
          className={cn(
            'w-full',
            isFullscreen ? 'h-[calc(100vh-120px)]' : height
          )}
        />
        {deposits.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
            <p className="text-gray-500">Нет месторождений для отображения</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
