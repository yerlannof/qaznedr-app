'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/layouts/Navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Newspaper,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Clock,
  User,
  Eye,
  Share2,
  BookmarkPlus,
  TrendingUp,
  Award,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/layouts/Footer';

const newsArticles = [
  {
    id: '1',
    title:
      'Казахстан увеличил добычу золота на 15% в первом квартале 2024 года',
    summary:
      'По данным Агентства по статистике, в первом квартале 2024 года добыча золота в стране составила 18,5 тонн против 16,1 тонн в аналогичном периоде прошлого года.',
    content: 'Полная статья о росте золотодобычи...',
    category: 'Добыча',
    priority: 'high', // 'high' | 'medium' | 'low'
    publishedAt: '2024-03-15T09:00:00Z',
    author: 'Министерство индустрии и инфраструктурного развития РК',
    source: 'Официальный источник',
    views: 25678,
    shares: 234,
    featured: true,
    trending: true,
    tags: ['золото', 'добыча', 'статистика', 'рост'],
    imageUrl: '/images/news/gold-mining-growth.jpg',
    readTime: 5,
    slug: 'kazakhstan-gold-production-growth-q1-2024',
  },
  {
    id: '2',
    title: 'Новое месторождение меди открыто в Карагандинской области',
    summary:
      'Геологи обнаружили крупные запасы медной руды в районе Жезказгана. Предварительные оценки указывают на запасы более 2 миллионов тонн меди.',
    content: 'Детали открытия нового месторождения...',
    category: 'Разведка',
    priority: 'high',
    publishedAt: '2024-03-14T14:30:00Z',
    author: 'КазГео',
    source: 'Отраслевые новости',
    views: 18943,
    shares: 187,
    featured: true,
    trending: true,
    tags: ['медь', 'месторождение', 'геология', 'открытие'],
    imageUrl: '/images/news/copper-discovery.jpg',
    readTime: 7,
    slug: 'new-copper-deposit-karaganda-region',
  },
  {
    id: '3',
    title: 'Экологические инновации в горнодобывающей отрасли Казахстана',
    summary:
      'Крупнейшие горнодобывающие компании внедряют новые технологии для снижения воздействия на окружающую среду и повышения энергоэффективности.',
    content: 'Обзор экологических инноваций...',
    category: 'Экология',
    priority: 'medium',
    publishedAt: '2024-03-13T11:15:00Z',
    author: 'EcoMining Kazakhstan',
    source: 'Специализированные издания',
    views: 12456,
    shares: 98,
    featured: false,
    trending: false,
    tags: ['экология', 'инновации', 'технологии', 'устойчивость'],
    imageUrl: '/images/news/eco-innovations.jpg',
    readTime: 8,
    slug: 'environmental-innovations-mining-industry',
  },
  {
    id: '4',
    title: 'Инвестиции в модернизацию Жезказганского медеплавильного завода',
    summary:
      'Kazakhmys планирует инвестировать $500 миллионов в модернизацию производственных мощностей завода для увеличения объемов переработки.',
    content: 'Детали инвестиционного проекта...',
    category: 'Инвестиции',
    priority: 'high',
    publishedAt: '2024-03-12T16:45:00Z',
    author: 'Kazakhmys Corporation',
    source: 'Корпоративные новости',
    views: 15789,
    shares: 156,
    featured: true,
    trending: false,
    tags: ['инвестиции', 'модернизация', 'медеплавильный', 'Жезказган'],
    imageUrl: '/images/news/plant-modernization.jpg',
    readTime: 6,
    slug: 'zhezkazgan-smelter-modernization-investment',
  },
  {
    id: '5',
    title: 'Цифровая трансформация горных предприятий набирает обороты',
    summary:
      'Все больше казахстанских горнодобывающих компаний внедряют системы автоматизации, IoT-решения и технологии машинного обучения.',
    content: 'Статья о цифровизации горной отрасли...',
    category: 'Технологии',
    priority: 'medium',
    publishedAt: '2024-03-11T13:20:00Z',
    author: 'Digital Mining Hub',
    source: 'Технологические новости',
    views: 9876,
    shares: 87,
    featured: false,
    trending: true,
    tags: ['цифровизация', 'автоматизация', 'IoT', 'машинное обучение'],
    imageUrl: '/images/news/digital-transformation.jpg',
    readTime: 9,
    slug: 'digital-transformation-mining-enterprises',
  },
  {
    id: '6',
    title: 'Новые требования к промышленной безопасности вступают в силу',
    summary:
      'С 1 апреля 2024 года вводятся обновленные стандарты промышленной безопасности для предприятий горнодобывающей отрасли.',
    content: 'Подробности новых требований...',
    category: 'Регулирование',
    priority: 'high',
    publishedAt: '2024-03-10T10:00:00Z',
    author: 'Комитет индустрии МИР РК',
    source: 'Официальный источник',
    views: 22134,
    shares: 298,
    featured: false,
    trending: false,
    tags: ['безопасность', 'регулирование', 'стандарты', 'требования'],
    imageUrl: '/images/news/safety-requirements.jpg',
    readTime: 4,
    slug: 'new-industrial-safety-requirements-2024',
  },
  {
    id: '7',
    title:
      'Рост цен на редкоземельные металлы стимулирует разведку в Казахстане',
    summary:
      'Высокие цены на литий, кобальт и другие редкоземельные металлы привлекают инвесторов к геологоразведочным проектам в стране.',
    content: 'Анализ рынка редкоземельных металлов...',
    category: 'Рынки',
    priority: 'medium',
    publishedAt: '2024-03-09T15:30:00Z',
    author: 'Metals Market Analytics',
    source: 'Аналитика рынков',
    views: 8765,
    shares: 76,
    featured: false,
    trending: true,
    tags: ['редкоземельные металлы', 'цены', 'разведка', 'инвестиции'],
    imageUrl: '/images/news/rare-earth-metals.jpg',
    readTime: 7,
    slug: 'rare-earth-metals-price-growth-exploration',
  },
  {
    id: '8',
    title:
      'Казахстан подписал соглашение о сотрудничестве в области критических минералов',
    summary:
      'Подписано международное соглашение о развитии цепочек поставок критически важных минералов для энергетического перехода.',
    content: 'Детали международного соглашения...',
    category: 'Политика',
    priority: 'medium',
    publishedAt: '2024-03-08T12:00:00Z',
    author: 'Министерство энергетики РК',
    source: 'Официальный источник',
    views: 11234,
    shares: 134,
    featured: false,
    trending: false,
    tags: [
      'соглашение',
      'критические минералы',
      'международное',
      'сотрудничество',
    ],
    imageUrl: '/images/news/international-agreement.jpg',
    readTime: 5,
    slug: 'critical-minerals-cooperation-agreement',
  },
];

const categories = [
  'Все категории',
  'Добыча',
  'Разведка',
  'Экология',
  'Инвестиции',
  'Технологии',
  'Регулирование',
  'Рынки',
  'Политика',
];

const sources = [
  'Все источники',
  'Официальный источник',
  'Отраслевые новости',
  'Специализированные издания',
  'Корпоративные новости',
  'Технологические новости',
  'Аналитика рынков',
];

const priorities = ['Все приоритеты', 'high', 'medium', 'low'];

const priorityNames = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedSource, setSelectedSource] = useState('Все источники');
  const [selectedPriority, setSelectedPriority] = useState('Все приоритеты');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'publishedAt' | 'views' | 'shares'>(
    'publishedAt'
  );

  const filteredArticles = useMemo(() => {
    const filtered = newsArticles.filter((article) => {
      const matchesSearch =
        !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'Все категории' ||
        article.category === selectedCategory;
      const matchesSource =
        selectedSource === 'Все источники' || article.source === selectedSource;
      const matchesPriority =
        selectedPriority === 'Все приоритеты' ||
        article.priority === selectedPriority;
      const matchesFeatured = !featuredOnly || article.featured;
      const matchesTrending = !trendingOnly || article.trending;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSource &&
        matchesPriority &&
        matchesFeatured &&
        matchesTrending
      );
    });

    // Сортировка - создаем отсортированную копию
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'publishedAt':
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        case 'views':
          return b.views - a.views;
        case 'shares':
          return b.shares - a.shares;
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    searchQuery,
    selectedCategory,
    selectedSource,
    selectedPriority,
    featuredOnly,
    trendingOnly,
    sortBy,
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Менее часа назад';
    if (diffInHours < 24) return `${diffInHours} часов назад`;
    if (diffInHours < 48) return 'Вчера';

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Новости
        </p>
        <h1 className="mt-3 text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Новости отрасли
        </h1>
        <p className="mt-4 text-base lg:text-lg text-gray-500 max-w-xl">
          Актуальные новости и события горнодобывающей промышленности
          Казахстана. Будьте в курсе последних трендов и разработок.
        </p>

        {/* Search */}
        <div className="max-w-2xl mt-6 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск новостей по ключевым словам..."
            className="w-full px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-[#141414] text-lg focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
          />
          <Button size="icon" className="absolute right-2 top-2 rounded-lg">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Категория
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] appearance-none bg-white"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Источник
              </label>
              <div className="relative">
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] appearance-none bg-white"
                >
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Приоритет
              </label>
              <div className="relative">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] appearance-none bg-white"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority === 'Все приоритеты'
                        ? priority
                        : priorityNames[priority as keyof typeof priorityNames]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сортировка
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] appearance-none bg-white"
                >
                  <option value="publishedAt">По дате</option>
                  <option value="views">По просмотрам</option>
                  <option value="shares">По популярности</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200">
            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700">
                  Только рекомендуемые
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trendingOnly}
                  onChange={(e) => setTrendingOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">Только популярные</span>
              </label>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Найдено:{' '}
                <span className="font-semibold">{filteredArticles.length}</span>{' '}
                новостей
              </span>

              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* News Grid/List */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-6'
          }
        >
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className={`group hover:shadow-xl transition-all duration-300 ${viewMode === 'list' ? 'p-6' : ''}`}
            >
              <div className={`${viewMode === 'list' ? 'flex gap-6' : ''}`}>
                {/* Image */}
                <div
                  className={`${viewMode === 'list' ? 'flex-shrink-0 w-48' : 'mb-4'} relative`}
                >
                  <div
                    className={`relative ${viewMode === 'list' ? 'h-32' : 'h-48'} bg-gray-200 rounded-lg overflow-hidden`}
                  >
                    <Image
                      src="/images/placeholder-news.jpg"
                      alt={article.title}
                      fill
                      className="object-cover"
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {article.featured && (
                        <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Рекомендуемое
                        </div>
                      )}
                      {article.trending && (
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Популярное
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2 right-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(article.priority)}`}
                      >
                        {
                          priorityNames[
                            article.priority as keyof typeof priorityNames
                          ]
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Header */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-blue-600 font-medium">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {article.source}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  {/* Stats */}
                  <div
                    className={`${viewMode === 'list' ? 'flex gap-6' : 'grid grid-cols-3 gap-2'} mb-4 text-sm text-gray-500`}
                  >
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{article.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      <span>{article.shares}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{article.readTime} мин</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{article.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="truncate">{article.author}</span>
                    </div>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div
                    className={`${viewMode === 'list' ? 'flex' : 'grid grid-cols-2'} gap-2`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:bg-gray-900 group-hover:text-white transition-colors"
                    >
                      <Newspaper className="w-4 h-4 mr-2" />
                      Читать
                    </Button>
                    <Button size="sm" variant="outline">
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Сохранить
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Newsletter Subscription */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-gray-50 dark:bg-[#141414] mt-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Подписка на новости отрасли
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg">
            Получайте самые важные новости горнодобывающей отрасли Казахстана на
            свою электронную почту. Еженедельная рассылка.
          </p>
          <div className="flex gap-3 mt-6 max-w-md">
            <input
              type="email"
              placeholder="Ваш email"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-[#0A0A0A] flex-1 focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
            />
            <Button className="whitespace-nowrap">Подписаться</Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
