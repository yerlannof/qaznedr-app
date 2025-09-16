'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/layouts/Navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Clock,
  User,
  Eye,
  Download,
  FileText,
  Video,
  Image as ImageIcon,
  Bookmark,
  Share2,
  Tag,
  TrendingUp,
  Award,
  Lightbulb,
} from 'lucide-react';
import { Card } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button';
import Footer from '@/components/layouts/Footer';

const knowledgeArticles = [
  {
    id: '1',
    title: 'Руководство по получению лицензий на недропользование в Казахстане',
    description:
      'Пошаговое руководство по всем этапам получения лицензий на геологическое изучение и добычу полезных ископаемых.',
    category: 'Лицензирование',
    type: 'article', // 'article' | 'video' | 'document' | 'guide'
    difficulty: 'beginner', // 'beginner' | 'intermediate' | 'advanced'
    readTime: 12,
    views: 15678,
    downloads: 2341,
    author: 'Министерство энергетики РК',
    publishedAt: '2024-01-15',
    updatedAt: '2024-03-10',
    tags: [
      'лицензирование',
      'недропользование',
      'законодательство',
      'процедуры',
    ],
    featured: true,
    rating: 4.8,
    reviews: 234,
    content: 'Подробное описание всех этапов лицензирования...',
    thumbnail: '/images/knowledge/licensing-guide.jpg',
    fileUrl: '/documents/licensing-guide.pdf',
    fileSize: '2.4 MB',
  },
  {
    id: '2',
    title: 'Современные методы геологоразведки: от сейсморазведки до геохимии',
    description:
      'Обзор современных технологий и методов геологической разведки, применяемых в Казахстане.',
    category: 'Геологоразведка',
    type: 'video',
    difficulty: 'intermediate',
    readTime: 45,
    views: 8934,
    downloads: 567,
    author: 'КазГео Институт',
    publishedAt: '2024-02-20',
    updatedAt: '2024-02-20',
    tags: ['геологоразведка', 'сейсморазведка', 'геохимия', 'технологии'],
    featured: true,
    rating: 4.9,
    reviews: 156,
    content: 'Видеолекция о современных методах...',
    thumbnail: '/images/knowledge/geology-methods.jpg',
    fileUrl: '/videos/geology-methods.mp4',
    fileSize: '245 MB',
  },
  {
    id: '3',
    title: 'Экологические требования к горнодобывающим предприятиям',
    description:
      'Полный перечень экологических требований, нормативов и процедур для горнодобывающих компаний.',
    category: 'Экология',
    type: 'document',
    difficulty: 'advanced',
    readTime: 25,
    views: 12456,
    downloads: 3421,
    author: 'Министерство экологии РК',
    publishedAt: '2023-11-30',
    updatedAt: '2024-01-15',
    tags: ['экология', 'нормативы', 'требования', 'охрана природы'],
    featured: false,
    rating: 4.6,
    reviews: 87,
    content: 'Документ содержит все экологические требования...',
    thumbnail: '/images/knowledge/ecology-requirements.jpg',
    fileUrl: '/documents/ecology-requirements.pdf',
    fileSize: '5.2 MB',
  },
  {
    id: '4',
    title: 'Технико-экономическое обоснование горнодобывающих проектов',
    description:
      'Методология составления ТЭО для проектов разработки месторождений полезных ископаемых.',
    category: 'Экономика',
    type: 'guide',
    difficulty: 'advanced',
    readTime: 35,
    views: 6789,
    downloads: 1234,
    author: 'Казахстанский институт минеральных ресурсов',
    publishedAt: '2024-01-08',
    updatedAt: '2024-01-08',
    tags: ['ТЭО', 'экономика', 'планирование', 'финансы'],
    featured: false,
    rating: 4.7,
    reviews: 112,
    content: 'Практическое руководство по составлению ТЭО...',
    thumbnail: '/images/knowledge/teo-guide.jpg',
    fileUrl: '/documents/teo-methodology.pdf',
    fileSize: '8.1 MB',
  },
  {
    id: '5',
    title: 'Безопасность труда на открытых горных работах',
    description:
      'Требования и рекомендации по обеспечению безопасности при ведении открытых горных работ.',
    category: 'Безопасность',
    type: 'article',
    difficulty: 'intermediate',
    readTime: 18,
    views: 9876,
    downloads: 1987,
    author: 'Комитет по труду МТиСЗ РК',
    publishedAt: '2024-02-01',
    updatedAt: '2024-02-15',
    tags: ['безопасность', 'охрана труда', 'открытые работы', 'требования'],
    featured: false,
    rating: 4.5,
    reviews: 76,
    content: 'Статья о мерах безопасности...',
    thumbnail: '/images/knowledge/safety-openpit.jpg',
    fileUrl: '/documents/safety-openpit.pdf',
    fileSize: '3.7 MB',
  },
  {
    id: '6',
    title: 'Цифровые технологии в горной промышленности',
    description:
      'Применение IoT, Big Data и ИИ в современной горнодобывающей промышленности Казахстана.',
    category: 'Технологии',
    type: 'video',
    difficulty: 'intermediate',
    readTime: 28,
    views: 5432,
    downloads: 432,
    author: 'Цифровой Казахстан',
    publishedAt: '2024-03-01',
    updatedAt: '2024-03-01',
    tags: ['цифровизация', 'IoT', 'Big Data', 'ИИ', 'инновации'],
    featured: true,
    rating: 4.8,
    reviews: 89,
    content: 'Видео о цифровых технологиях...',
    thumbnail: '/images/knowledge/digital-mining.jpg',
    fileUrl: '/videos/digital-mining.mp4',
    fileSize: '189 MB',
  },
  {
    id: '7',
    title: 'Подсчет запасов полезных ископаемых: методы и стандарты',
    description:
      'Российские и международные стандарты подсчета и классификации запасов минерального сырья.',
    category: 'Геология',
    type: 'document',
    difficulty: 'advanced',
    readTime: 42,
    views: 7654,
    downloads: 1876,
    author: 'Национальная геологическая служба',
    publishedAt: '2023-12-15',
    updatedAt: '2024-01-20',
    tags: ['запасы', 'классификация', 'стандарты', 'подсчет'],
    featured: false,
    rating: 4.9,
    reviews: 145,
    content: 'Методические указания по подсчету запасов...',
    thumbnail: '/images/knowledge/reserves-calculation.jpg',
    fileUrl: '/documents/reserves-standards.pdf',
    fileSize: '6.8 MB',
  },
  {
    id: '8',
    title: 'Инвестиционная привлекательность горнодобывающих проектов',
    description:
      'Анализ факторов, влияющих на инвестиционную привлекательность проектов в горной отрасли.',
    category: 'Инвестиции',
    type: 'article',
    difficulty: 'intermediate',
    readTime: 22,
    views: 4321,
    downloads: 678,
    author: 'Казахстанская ассоциация горнодобывающих компаний',
    publishedAt: '2024-02-10',
    updatedAt: '2024-02-25',
    tags: ['инвестиции', 'привлекательность', 'анализ', 'факторы'],
    featured: false,
    rating: 4.4,
    reviews: 63,
    content: 'Исследование инвестиционной привлекательности...',
    thumbnail: '/images/knowledge/investment-attractiveness.jpg',
    fileUrl: '/documents/investment-analysis.pdf',
    fileSize: '4.3 MB',
  },
];

const categories = [
  'Все категории',
  'Лицензирование',
  'Геологоразведка',
  'Экология',
  'Экономика',
  'Безопасность',
  'Технологии',
  'Геология',
  'Инвестиции',
];

const contentTypes = ['Все типы', 'article', 'video', 'document', 'guide'];

const contentTypeNames = {
  article: 'Статья',
  video: 'Видео',
  document: 'Документ',
  guide: 'Руководство',
};

const difficultyLevels = ['Все уровни', 'beginner', 'intermediate', 'advanced'];

const difficultyNames = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedType, setSelectedType] = useState('Все типы');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Все уровни');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<
    'publishedAt' | 'views' | 'rating' | 'downloads'
  >('publishedAt');

  const filteredArticles = useMemo(() => {
    const filtered = knowledgeArticles.filter((article) => {
      const matchesSearch =
        !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'Все категории' ||
        article.category === selectedCategory;
      const matchesType =
        selectedType === 'Все типы' || article.type === selectedType;
      const matchesDifficulty =
        selectedDifficulty === 'Все уровни' ||
        article.difficulty === selectedDifficulty;
      const matchesFeatured = !featuredOnly || article.featured;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesDifficulty &&
        matchesFeatured
      );
    });

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'publishedAt':
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        case 'views':
          return b.views - a.views;
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    searchQuery,
    selectedCategory,
    selectedType,
    selectedDifficulty,
    featuredOnly,
    sortBy,
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'guide':
        return BookOpen;
      default:
        return FileText;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-blue-600 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-6 text-blue-200" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">База знаний</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Техническая документация, руководства, стандарты и лучшие практики
              для профессионалов горнодобывающей отрасли Казахстана.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Найдите статью, руководство или документ..."
                className="w-full px-6 py-4 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
              />
              <Button
                size="icon"
                className="absolute right-2 top-2 rounded-full"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип контента
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'Все типы'
                        ? type
                        : contentTypeNames[
                            type as keyof typeof contentTypeNames
                          ]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Уровень сложности
              </label>
              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {difficultyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level === 'Все уровни'
                        ? level
                        : difficultyNames[
                            level as keyof typeof difficultyNames
                          ]}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="publishedAt">По дате</option>
                  <option value="views">По просмотрам</option>
                  <option value="rating">По рейтингу</option>
                  <option value="downloads">По скачиваниям</option>
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
                <Award className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  Только рекомендуемые
                </span>
              </label>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Найдено:{' '}
                <span className="font-semibold">{filteredArticles.length}</span>{' '}
                материалов
              </span>

              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Articles Grid/List */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-6'
          }
        >
          {filteredArticles.map((article) => {
            const TypeIcon = getTypeIcon(article.type);

            return (
              <Card
                key={article.id}
                className={`group hover:shadow-xl transition-all duration-300 ${viewMode === 'list' ? 'p-6' : ''}`}
              >
                <div className={`${viewMode === 'list' ? 'flex gap-6' : ''}`}>
                  {/* Thumbnail */}
                  <div
                    className={`${viewMode === 'list' ? 'flex-shrink-0 w-48' : 'mb-4'} relative`}
                  >
                    <div
                      className={`relative ${viewMode === 'list' ? 'h-32' : 'h-48'} bg-gray-200 rounded-lg overflow-hidden`}
                    >
                      <Image
                        src="/images/placeholder-document.jpg"
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                      {article.featured && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Рекомендуемое
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <TypeIcon className="w-3 h-3" />
                          {
                            contentTypeNames[
                              article.type as keyof typeof contentTypeNames
                            ]
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                    {/* Header */}
                    <div
                      className={`${viewMode === 'list' ? 'flex justify-between items-start mb-3' : 'mb-3'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-blue-600 font-medium">
                            {article.category}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}
                          >
                            {
                              difficultyNames[
                                article.difficulty as keyof typeof difficultyNames
                              ]
                            }
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div
                      className={`${viewMode === 'list' ? 'flex gap-6' : 'grid grid-cols-2 gap-2'} mb-4 text-sm text-gray-500`}
                    >
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{article.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span>{article.downloads.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{article.readTime} мин</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{article.rating}/5</span>
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

                    {/* Author and Date */}
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
                        className="group-hover:bg-blue-600 group-hover:text-white transition-colors"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Читать
                      </Button>
                      <Button size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        {article.fileSize}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <section className="bg-blue-600 rounded-2xl p-8 text-center text-white mt-16">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl font-bold mb-4">
            Расширяем базу знаний вместе
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            У вас есть экспертные знания или полезные материалы? Поделитесь ими
            с сообществом профессионалов горнодобывающей отрасли.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Предложить статью
            </Button>
            <Button
              variant="outline"
              className="border-blue-400 text-white hover:bg-blue-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Загрузить документ
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
