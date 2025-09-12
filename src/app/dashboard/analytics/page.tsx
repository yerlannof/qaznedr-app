'use client';

// Force dynamic rendering to avoid build-time Supabase initialization
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navigation from '@/components/layouts/Navigation';
import { Card } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button-new';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  Calendar,
  MapPin,
  Layers,
  Award,
  Filter,
  Download,
} from 'lucide-react';

interface AnalyticsData {
  totalListings: number;
  activeListings: number;
  totalValue: number;
  totalViews: number;
  priceHistory: Array<{ date: string; value: number }>;
  mineralDistribution: Array<{ name: string; value: number }>;
  monthlyActivity: Array<{ month: string; listings: number; sales: number }>;
  topRegions: Array<{ region: string; count: number; value: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    action: string;
    timestamp: string;
  }>;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMineral, setSelectedMineral] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedMineral]);

  const fetchAnalyticsData = async () => {
    setLoading(true);

    try {
      // Get date range
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch total listings
      const { data: allListings } = await supabase
        .from('kazakhstan_deposits')
        .select('id, price, mineral, region, created_at, status, views')
        .gte('created_at', startDate.toISOString());

      // Fetch active listings
      const { data: activeListings } = await supabase
        .from('kazakhstan_deposits')
        .select('id')
        .eq('status', 'ACTIVE');

      // Calculate total value
      const totalValue =
        allListings?.reduce(
          (sum: number, listing: any) => sum + (listing.price || 0),
          0
        ) || 0;

      // Calculate total views
      const totalViews =
        allListings?.reduce(
          (sum: number, listing: any) => sum + (listing.views || 0),
          0
        ) || 0;

      // Generate price history (mock data for demo)
      const priceHistory = generatePriceHistory(days);

      // Calculate mineral distribution
      const mineralCounts: Record<string, number> = {};
      allListings?.forEach((listing: any) => {
        if (listing.mineral) {
          mineralCounts[listing.mineral] =
            (mineralCounts[listing.mineral] || 0) + 1;
        }
      });
      const mineralDistribution = Object.entries(mineralCounts).map(
        ([name, value]) => ({
          name,
          value,
        })
      );

      // Generate monthly activity (mock data for demo)
      const monthlyActivity = generateMonthlyActivity();

      // Calculate top regions
      const regionData: Record<string, { count: number; value: number }> = {};
      allListings?.forEach((listing: any) => {
        if (listing.region) {
          if (!regionData[listing.region]) {
            regionData[listing.region] = { count: 0, value: 0 };
          }
          regionData[listing.region].count++;
          regionData[listing.region].value += listing.price || 0;
        }
      });
      const topRegions = Object.entries(regionData)
        .map(([region, data]) => ({ region, ...data }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Fetch recent activity
      const { data: recentActivity } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setAnalyticsData({
        totalListings: allListings?.length || 0,
        activeListings: activeListings?.length || 0,
        totalValue,
        totalViews,
        priceHistory,
        mineralDistribution,
        monthlyActivity,
        topRegions,
        recentActivity: recentActivity || [],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePriceHistory = (days: number) => {
    const history = [];
    const baseValue = 50000000;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toLocaleDateString('ru-RU', {
          month: 'short',
          day: 'numeric',
        }),
        value: baseValue + Math.random() * 20000000 - 10000000,
      });
    }
    return history;
  };

  const generateMonthlyActivity = () => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
    return months.map((month) => ({
      month,
      listings: Math.floor(Math.random() * 50) + 10,
      sales: Math.floor(Math.random() * 20) + 5,
    }));
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)} млрд ₸`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} млн ₸`;
    }
    return `${value.toLocaleString()} ₸`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8 mt-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Аналитика платформы
              </h1>
              <p className="text-gray-600">
                Мониторинг активности и статистика месторождений
              </p>
            </div>
            <Button
              variant="outline"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Экспорт отчета
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { value: '7', label: '7 дней' },
              { value: '30', label: '30 дней' },
              { value: '90', label: '3 месяца' },
              { value: '365', label: '1 год' },
            ].map((period) => (
              <Button
                key={period.value}
                variant={dateRange === period.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(period.value)}
              >
                <Calendar className="w-4 h-4 mr-1" />
                {period.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              value={selectedMineral || ''}
              onChange={(e) => setSelectedMineral(e.target.value || null)}
            >
              <option value="">Все минералы</option>
              <option value="Нефть">Нефть</option>
              <option value="Газ">Газ</option>
              <option value="Золото">Золото</option>
              <option value="Медь">Медь</option>
              <option value="Уголь">Уголь</option>
              <option value="Уран">Уран</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Всего объявлений
              </h3>
              <Layers className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analyticsData?.totalListings || 0}
            </p>
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% за период
            </p>
          </Card>

          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Активные</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {analyticsData?.activeListings || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {analyticsData && analyticsData.totalListings > 0
                ? `${((analyticsData.activeListings / analyticsData.totalListings) * 100).toFixed(0)}% от общего`
                : '0% от общего'}
            </p>
          </Card>

          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Общая стоимость
              </h3>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(analyticsData?.totalValue || 0)}
            </p>
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +8.5% за период
            </p>
          </Card>

          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Просмотры</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analyticsData?.totalViews?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +24% за период
            </p>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Price History Chart */}
          <Card variant="elevated" className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              История цен
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.priceHistory || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: number) => formatPrice(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Mineral Distribution */}
          <Card variant="elevated" className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Распределение по минералам
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.mineralDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData?.mineralDistribution?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Activity */}
          <Card variant="elevated" className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Активность по месяцам
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.monthlyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                  }}
                />
                <Legend />
                <Bar dataKey="listings" fill="#3B82F6" name="Объявления" />
                <Bar dataKey="sales" fill="#10B981" name="Продажи" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Regions Table */}
          <Card variant="elevated" className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Топ регионов
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">
                      Регион
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">
                      Объявлений
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-700">
                      Стоимость
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData?.topRegions?.map((region, index) => (
                    <tr
                      key={region.region}
                      className="border-b border-gray-100"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {region.region}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Казахстан
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          {region.count}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(region.value)}
                        </p>
                        <p className="text-xs text-gray-500">
                          средняя: {formatPrice(region.value / region.count)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
