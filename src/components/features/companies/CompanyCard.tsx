'use client';

import Link from 'next/link';
import {
  Building2,
  Star,
  Shield,
  MapPin,
  Globe,
  Phone,
  Mail,
  Briefcase,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Card, CardBadge } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button-new';
import { cn } from '@/lib/utils';

interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    description: string | null;
    logo: string | null;
    website: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    region: string | null;
    category: string[];
    services: any;
    certifications: any;
    portfolio: any;
    rating: number | null;
    reviews_count: number;
    verified: boolean;
    verification_date: string | null;
    services_count?: number;
    projects_count?: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  drilling: 'Бурение',
  exploration: 'Геологоразведка',
  consulting: 'Консалтинг',
  logistics: 'Логистика',
  equipment: 'Оборудование',
  legal: 'Юридические услуги',
  environmental: 'Экология',
  construction: 'Строительство',
};

export function CompanyCard({ company }: CompanyCardProps) {
  const renderRating = (rating: number | null) => {
    if (!rating) return null;

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 fill-yellow-400/50 text-yellow-400"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)} ({company.reviews_count})
        </span>
      </div>
    );
  };

  const certificationCount = company.certifications
    ? JSON.parse(company.certifications).length
    : 0;

  return (
    <Card
      variant="elevated"
      className="group hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Building2 className="w-8 h-8 text-gray-400" />
            )}
          </div>

          {/* Company Info */}
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {company.name}
              </h3>
              {company.verified && (
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </div>

            {/* Rating */}
            {renderRating(company.rating)}

            {/* Location */}
            {company.region && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {company.region}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {company.description}
        </p>
      )}

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {company.category.slice(0, 3).map((cat) => (
          <CardBadge key={cat} variant="info" className="text-xs">
            {CATEGORY_LABELS[cat] || cat}
          </CardBadge>
        ))}
        {company.category.length > 3 && (
          <CardBadge variant="default" className="text-xs">
            +{company.category.length - 3}
          </CardBadge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-t border-b border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {company.services_count || 0}
          </div>
          <div className="text-xs text-gray-500">Услуг</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {certificationCount}
          </div>
          <div className="text-xs text-gray-500">Сертификатов</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {company.projects_count || 0}
          </div>
          <div className="text-xs text-gray-500">Проектов</div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="truncate">
              {company.website.replace(/^https?:\/\//, '')}
            </span>
          </a>
        )}

        {company.phone && (
          <a
            href={`tel:${company.phone}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>{company.phone}</span>
          </a>
        )}

        <a
          href={`mailto:${company.email}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span className="truncate">{company.email}</span>
        </a>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/companies/${company.id}`} className="flex-1">
          <Button
            variant="default"
            className="w-full group/btn"
            rightIcon={
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            }
          >
            Подробнее
          </Button>
        </Link>

        <Button variant="outline" size="icon">
          <Mail className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
