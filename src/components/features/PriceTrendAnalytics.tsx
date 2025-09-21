'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Filter,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';

interface PriceTrendData {
  month: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  volume: number;
}

interface MineralDistribution {
  name: string;
  value: number;
  percentage: number;
}

const mockPriceTrendData: PriceTrendData[] = [
  {
    month: 'Янв',
    avgPrice: 450000000,
    minPrice: 350000000,
    maxPrice: 550000000,
    volume: 12,
  },
  {
    month: 'Фев',
    avgPrice: 465000000,
    minPrice: 360000000,
    maxPrice: 570000000,
    volume: 15,
  },
  {
    month: 'Мар',
    avgPrice: 480000000,
    minPrice: 380000000,
    maxPrice: 580000000,
    volume: 18,
  },
  {
    month: 'Апр',
    avgPrice: 475000000,
    minPrice: 375000000,
    maxPrice: 575000000,
    volume: 14,
  },
  {
    month: 'Май',
    avgPrice: 490000000,
    minPrice: 390000000,
    maxPrice: 590000000,
    volume: 20,
  },
  {
    month: 'Июн',
    avgPrice: 510000000,
    minPrice: 410000000,
    maxPrice: 610000000,
    volume: 22,
  },
];

const mineralDistribution: MineralDistribution[] = [
  { name: 'Нефть', value: 35, percentage: 35 },
  { name: 'Газ', value: 25, percentage: 25 },
  { name: 'Золото', value: 15, percentage: 15 },
  { name: 'Медь', value: 10, percentage: 10 },
  { name: 'Уголь', value: 8, percentage: 8 },
  { name: 'Уран', value: 5, percentage: 5 },
  { name: 'Железо', value: 2, percentage: 2 },
];

const COLORS = [
  '#3B82F6',
  '#60A5FA',
  '#93C5FD',
  '#BFDBFE',
  '#DBEAFE',
  '#EFF6FF',
  '#F3F4F6',
];

export default function PriceTrendAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '1y' | 'all'>(
    '6m'
  );
  const [selectedMineral, setSelectedMineral] = useState<string>('all');

  const priceChange = useMemo(() => {
    const lastMonth = mockPriceTrendData[mockPriceTrendData.length - 1];
    const firstMonth = mockPriceTrendData[0];
    const change =
      ((lastMonth.avgPrice - firstMonth.avgPrice) / firstMonth.avgPrice) * 100;
    return change;
  }, []);

  const totalVolume = useMemo(() => {
    return mockPriceTrendData.reduce((sum, item) => sum + item.volume, 0);
  }, []);

  const avgPrice = useMemo(() => {
    const sum = mockPriceTrendData.reduce(
      (acc, item) => acc + item.avgPrice,
      0
    );
    return sum / mockPriceTrendData.length;
  }, []);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              {entry.name}: {formatPrice(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Средняя цена
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(avgPrice)}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Изменение цены
              </p>
              <p className="text-2xl font-bold">
                <span
                  className={
                    priceChange > 0
                      ? 'text-blue-600'
                      : priceChange < 0
                        ? 'text-gray-600'
                        : 'text-gray-500'
                  }
                >
                  {priceChange > 0 ? '+' : ''}
                  {priceChange.toFixed(1)}%
                </span>
              </p>
            </div>
            <div
              className={`p-2 rounded-lg ${priceChange > 0 ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              {priceChange > 0 ? (
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : priceChange < 0 ? (
                <TrendingDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Minus className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Объем сделок
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalVolume}
              </p>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Период:
            </span>
            <div className="flex gap-2">
              {(['6m', '1y', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {period === '6m'
                    ? '6 мес.'
                    : period === '1y'
                      ? '1 год'
                      : 'Все'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Минерал:
            </span>
            <select
              value={selectedMineral}
              onChange={(e) => setSelectedMineral(e.target.value)}
              className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все</option>
              <option value="oil">Нефть</option>
              <option value="gas">Газ</option>
              <option value="gold">Золото</option>
              <option value="copper">Медь</option>
            </select>
          </div>
        </div>
      </div>

      {/* Price Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Динамика цен
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={mockPriceTrendData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis
              stroke="#6B7280"
              tickFormatter={(value) => formatPrice(value)}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="avgPrice"
              name="Средняя цена"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
            <Line
              type="monotone"
              dataKey="maxPrice"
              name="Макс. цена"
              stroke="#93C5FD"
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="minPrice"
              name="Мин. цена"
              stroke="#BFDBFE"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Объем сделок
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mockPriceTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip />
            <Bar
              dataKey="volume"
              name="Количество сделок"
              fill="#3B82F6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mineral Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Распределение по минералам
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={mineralDistribution as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mineralDistribution.map((entry, index) => (
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

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Топ минералов
          </h3>
          <div className="space-y-3">
            {mineralDistribution.slice(0, 5).map((mineral, index) => (
              <div
                key={mineral.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {mineral.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${mineral.percentage}%`,
                        backgroundColor: COLORS[index],
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">
                    {mineral.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
