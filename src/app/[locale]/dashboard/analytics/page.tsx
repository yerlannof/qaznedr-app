'use client';

// Force dynamic rendering to avoid build-time Supabase initialization
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navigation from '@/components/layouts/Navigation';
import { Button } from '@/components/ui/button';
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
  '#6B7280',
  '#9CA3AF',
  '#1D4ED8',
  '#374151',
  '#111827',
  '#60A5FA',
  '#93C5FD',
];

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedMineral, setSelectedMineral] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedMineral]);

  const fetchAnalyticsData = async () => {
    setLoading(true);

    try {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: allListings } = await supabase
        .from('deposits')
        .select('id, price, mineral, region, created_at, status, views')
        .gte('created_at', startDate.toISOString());

      const { data: activeListings } = await supabase
        .from('deposits')
        .select('id')
        .eq('status', 'ACTIVE');

      const totalValue =
        allListings?.reduce(
          (sum: number, listing: any) => sum + (listing.price || 0),
          0
        ) || 0;

      const totalViews =
        allListings?.reduce(
          (sum: number, listing: any) => sum + (listing.views || 0),
          0
        ) || 0;

      const priceHistory = generatePriceHistory(days);

      const mineralCounts: Record<string, number> = {};
      allListings?.forEach((listing: any) => {
        if (listing.mineral) {
          mineralCounts[listing.mineral] =
            (mineralCounts[listing.mineral] || 0) + 1;
        }
      });
      const mineralDistribution = Object.entries(mineralCounts).map(
        ([name, value]) => ({ name, value })
      );

      const monthlyActivity = generateMonthlyActivity();

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
    } catch {
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6"
                >
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              Аналитика платформы
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Мониторинг активности и статистика месторождений
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Экспорт
          </Button>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {[
              { value: '7', label: '7 дней' },
              { value: '30', label: '30 дней' },
              { value: '90', label: '3 мес.' },
              { value: '365', label: '1 год' },
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setDateRange(period.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  dateRange === period.value
                    ? 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 border-gray-900 dark:border-gray-50'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#141414]'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {period.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-[#141414] text-gray-600 dark:text-gray-300 focus:outline-none"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Всего объявлений
              </span>
              <Layers className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              {analyticsData?.totalListings || 0}
            </p>
            <p className="text-xs text-[#0A84FF] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% за период
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Активные
              </span>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              {analyticsData?.activeListings || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {analyticsData && analyticsData.totalListings > 0
                ? `${((analyticsData.activeListings / analyticsData.totalListings) * 100).toFixed(0)}% от общего`
                : '0% от общего'}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Общая стоимость
              </span>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {formatPrice(analyticsData?.totalValue || 0)}
            </p>
            <p className="text-xs text-[#0A84FF] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8.5% за период
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Просмотры
              </span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              {analyticsData?.totalViews?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-[#0A84FF] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +24% за период
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Price History Chart */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-4">
              История цен
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analyticsData?.priceHistory || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: number) => formatPrice(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
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
          </div>

          {/* Mineral Distribution */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Распределение по минералам
            </h2>
            <ResponsiveContainer width="100%" height={280}>
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
          </div>

          {/* Monthly Activity */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Активность по месяцам
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData?.monthlyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="listings"
                  fill="#3B82F6"
                  name="Объявления"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="sales"
                  fill="#9CA3AF"
                  name="Продажи"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Regions Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Топ регионов
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Регион
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Объявлений
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Стоимость
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData?.topRegions?.map((region, index) => (
                    <tr
                      key={region.region}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                              {region.region}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                Казахстан
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {region.count}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                          {formatPrice(region.value)}
                        </p>
                        <p className="text-xs text-gray-400">
                          сред.: {formatPrice(region.value / region.count)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
