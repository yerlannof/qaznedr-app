'use client';

// Force dynamic rendering to avoid build-time Supabase initialization
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layouts/Navigation';
import { CompanyCard } from '@/components/features/companies/CompanyCard';
import { createClient } from '@/lib/supabase/client';
import {
  Building2,
  Search,
  Filter,
  Award,
  Briefcase,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button-new';
import Link from 'next/link';

const SERVICE_CATEGORIES = [
  { value: 'drilling', label: 'Бурение', icon: '🔧' },
  { value: 'exploration', label: 'Геологоразведка', icon: '🔍' },
  { value: 'consulting', label: 'Консалтинг', icon: '📊' },
  { value: 'logistics', label: 'Логистика', icon: '🚛' },
  { value: 'equipment', label: 'Оборудование', icon: '⚙️' },
  { value: 'legal', label: 'Юридические услуги', icon: '⚖️' },
  { value: 'environmental', label: 'Экология', icon: '🌿' },
  { value: 'construction', label: 'Строительство', icon: '🏗️' },
];

interface Company {
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
  user_id: string;
  created_at: string;
  services_count?: number;
  projects_count?: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadCompanies();
  }, [selectedCategory, onlyVerified]);

  const loadCompanies = async () => {
    setLoading(true);

    let query = supabase.from('companies').select(`
        *,
        services(count)
      `);

    // Apply filters
    if (selectedCategory) {
      query = query.contains('category', [selectedCategory]);
    }

    if (onlyVerified) {
      query = query.eq('verified', true);
    }

    const { data, error } = await query
      .order('verified', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error loading companies:', error);
    } else {
      const companiesWithCounts =
        data?.map((company: any) => ({
          ...company,
          services_count: company.services?.[0]?.count || 0,
          projects_count: company.portfolio
            ? JSON.parse(company.portfolio).length
            : 0,
        })) || [];

      setCompanies(companiesWithCounts);
    }

    setLoading(false);
  };

  const filteredCompanies = companies.filter((company) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(query) ||
      company.description?.toLowerCase().includes(query) ||
      company.category.some((cat) => cat.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Каталог компаний</h1>
          </div>
          <p className="text-xl text-gray-300 mb-8">
            Найдите надежных партнеров и поставщиков услуг в горнодобывающей
            отрасли
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск компаний и услуг..."
                className="w-full px-4 py-3 pl-12 pr-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mt-8">
            <div>
              <div className="text-3xl font-bold">{companies.length}</div>
              <div className="text-gray-400">Компаний</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {companies.filter((c) => c.verified).length}
              </div>
              <div className="text-gray-400">Проверенных</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {companies.reduce((sum, c) => sum + (c.services_count || 0), 0)}
              </div>
              <div className="text-gray-400">Услуг</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Категории услуг
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Только проверенные
                </span>
              </label>

              <Link href="/companies/register">
                <Button
                  variant="default"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Добавить компанию
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Все категории
            </button>
            {SERVICE_CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
              >
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Companies Grid */}
        {!loading && filteredCompanies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Компании не найдены
            </h3>
            <p className="text-gray-600 mb-6">
              Попробуйте изменить параметры поиска или фильтры
            </p>
            <Link href="/companies/register">
              <Button variant="outline">Зарегистрировать компанию</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
