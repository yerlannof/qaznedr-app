import Image from 'next/image';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Star } from 'lucide-react';
import { useFavorites } from '@/contexts';

interface UnifiedListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    rating: number;
    image: string;
    verified: boolean;
    type: 'product' | 'service' | 'experience';
  };
}

export function UnifiedListingCard({ listing }: UnifiedListingCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isImageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoadingComplete={() => setIsImageLoading(false)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        {isImageLoading && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        {listing.verified && (
          <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm">
            Verified
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(listing.id);
          }}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${isFavorite(listing.id) ? 'fill-red-500 text-red-500' : 'hover:text-red-500'}`}
          />
        </Button>
      </div>

      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {listing.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {listing.description}
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{listing.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{listing.rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="text-2xl font-bold">
          ${listing.price.toLocaleString()}
        </div>
        <Button>View Details</Button>
      </CardFooter>
    </Card>
  );
}
