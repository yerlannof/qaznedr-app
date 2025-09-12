'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/layouts/Navigation';
import { ImageUpload } from '@/components/ui/image-upload';
import { depositApi } from '@/lib/api/deposits';
import { ListingType, MineralType, RegionType } from '@/lib/types/listing';
import Link from 'next/link';

type FormData = {
  title: string;
  description: string;
  type: ListingType | '';
  mineral: MineralType | '';
  region: RegionType | '';
  city: string;
  price: number | null;
  area: number;
  coordinates: [number, number];
  images: string[];

  // Mining License fields
  licenseSubtype?: string;
  licenseNumber?: string;
  licenseExpiry?: string;

  // Exploration License fields
  explorationStage?: string;
  explorationStart?: string;
  explorationBudget?: number;

  // Mineral Occurrence fields
  discoveryDate?: string;
  geologicalConfidence?: string;
  estimatedReserves?: string;
};

const REGIONS: RegionType[] = [
  'Мангистауская',
  'Атырауская',
  'Западно-Казахстанская',
  'Актюбинская',
  'Костанайская',
  'Акмолинская',
  'Павлодарская',
  'Карагандинская',
  'Восточно-Казахстанская',
  'Алматинская',
  'Жамбылская',
  'Туркестанская',
  'Кызылординская',
  'Улытауская',
];

const MINERALS: MineralType[] = [
  'Нефть',
  'Газ',
  'Золото',
  'Медь',
  'Уголь',
  'Уран',
  'Железо',
];

export default function CreateListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: '',
    mineral: '',
    region: '',
    city: '',
    price: null,
    area: 0,
    coordinates: [0, 0],
    images: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Проверка авторизации
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Необходима авторизация
            </h1>
            <p className="text-gray-600 mb-6">
              Войдите в систему, чтобы создавать объявления.
            </p>
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Войти в систему
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : value,
    }));

    // Очистка ошибки для поля
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCoordinateChange = (index: 0 | 1, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      coordinates:
        index === 0
          ? [numValue, prev.coordinates[1]]
          : [prev.coordinates[0], numValue],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }

    if (!formData.type) {
      newErrors.type = 'Выберите тип объявления';
    }

    if (!formData.mineral) {
      newErrors.mineral = 'Выберите полезное ископаемое';
    }

    if (!formData.region) {
      newErrors.region = 'Выберите регион';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Город обязателен';
    }

    if (!formData.area || formData.area <= 0) {
      newErrors.area = 'Площадь должна быть больше 0';
    }

    // Валидация специфичных полей
    if (formData.type === 'MINING_LICENSE') {
      if (!formData.licenseNumber?.trim()) {
        newErrors.licenseNumber = 'Номер лицензии обязателен';
      }
      if (!formData.licenseExpiry) {
        newErrors.licenseExpiry = 'Срок действия лицензии обязателен';
      }
    }

    if (formData.type === 'EXPLORATION_LICENSE') {
      if (!formData.explorationStage?.trim()) {
        newErrors.explorationStage = 'Стадия разведки обязательна';
      }
      if (!formData.explorationStart?.trim()) {
        newErrors.explorationStart = 'Период разведки обязателен';
      }
    }

    if (formData.type === 'MINERAL_OCCURRENCE') {
      if (!formData.discoveryDate) {
        newErrors.discoveryDate = 'Дата обнаружения обязательна';
      }
      if (!formData.geologicalConfidence?.trim()) {
        newErrors.geologicalConfidence =
          'Геологическая достоверность обязательна';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const listingData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type as ListingType,
        mineral: formData.mineral as MineralType,
        region: formData.region as RegionType,
        city: formData.city,
        price: formData.price,
        area: formData.area,
        coordinates: formData.coordinates,
        status: 'PENDING',
        verified: false,
        featured: false,
        views: 0,
        images: formData.images,
        documents: [],

        // Type-specific fields
        ...(formData.type === 'MINING_LICENSE' && {
          licenseSubtype: formData.licenseSubtype || 'Добычная',
          licenseNumber: formData.licenseNumber,
          licenseExpiry: new Date(formData.licenseExpiry!),
        }),

        ...(formData.type === 'EXPLORATION_LICENSE' && {
          explorationStage: formData.explorationStage,
          explorationStart: formData.explorationStart,
          explorationBudget: formData.explorationBudget,
        }),

        ...(formData.type === 'MINERAL_OCCURRENCE' && {
          discoveryDate: new Date(formData.discoveryDate!),
          geologicalConfidence: formData.geologicalConfidence,
          estimatedReserves: formData.estimatedReserves,
        }),
      };

      const newListing = await depositApi.create(listingData);

      // Перенаправление на страницу созданного объявления
      router.push(`/listings/${newListing.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Произошла ошибка при создании объявления. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'MINING_LICENSE':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Данные лицензии на добычу
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Подтип лицензии
                </label>
                <select
                  name="licenseSubtype"
                  value={formData.licenseSubtype || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите подтип</option>
                  <option value="Добычная">Добычная</option>
                  <option value="Совмещенная">Совмещенная</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер лицензии *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Например: KZ1234567890"
                />
                {errors.licenseNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.licenseNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Срок действия лицензии *
                </label>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licenseExpiry ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.licenseExpiry && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.licenseExpiry}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'EXPLORATION_LICENSE':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Данные лицензии на разведку
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Стадия разведки *
                </label>
                <select
                  name="explorationStage"
                  value={formData.explorationStage || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.explorationStage
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите стадию</option>
                  <option value="Предварительная разведка">
                    Предварительная разведка
                  </option>
                  <option value="Детальная разведка">Детальная разведка</option>
                  <option value="Доразведка">Доразведка</option>
                </select>
                {errors.explorationStage && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.explorationStage}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Период разведки *
                </label>
                <input
                  type="text"
                  name="explorationStart"
                  value={formData.explorationStart || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.explorationStart
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Например: 3 года"
                />
                {errors.explorationStart && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.explorationStart}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Бюджет разведки (₸)
                </label>
                <input
                  type="number"
                  name="explorationBudget"
                  value={formData.explorationBudget || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Сумма в тенге"
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 'MINERAL_OCCURRENCE':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Данные рудопроявления
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата обнаружения *
                </label>
                <input
                  type="date"
                  name="discoveryDate"
                  value={formData.discoveryDate || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.discoveryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.discoveryDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.discoveryDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Геологическая достоверность *
                </label>
                <select
                  name="geologicalConfidence"
                  value={formData.geologicalConfidence || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.geologicalConfidence
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите уровень</option>
                  <option value="Высокая">Высокая</option>
                  <option value="Средняя">Средняя</option>
                  <option value="Низкая">Низкая</option>
                </select>
                {errors.geologicalConfidence && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.geologicalConfidence}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Оценочные запасы
                </label>
                <textarea
                  name="estimatedReserves"
                  value={formData.estimatedReserves || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Описание оценочных запасов полезного ископаемого"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/listings"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Назад к каталогу
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Разместить объявление
          </h1>
          <p className="text-gray-600 mt-2">
            Заполните форму для размещения объявления о продаже месторождения
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Основная информация
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название объявления *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Например: Месторождение нефти в Мангистауской области"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Подробное описание месторождения, его характеристик и особенностей"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип объявления *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Выберите тип</option>
                    <option value="MINING_LICENSE">Лицензия на добычу</option>
                    <option value="EXPLORATION_LICENSE">
                      Лицензия на разведку
                    </option>
                    <option value="MINERAL_OCCURRENCE">Рудопроявление</option>
                  </select>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Полезное ископаемое *
                  </label>
                  <select
                    name="mineral"
                    value={formData.mineral}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.mineral ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Выберите ископаемое</option>
                    {MINERALS.map((mineral) => (
                      <option key={mineral} value={mineral}>
                        {mineral}
                      </option>
                    ))}
                  </select>
                  {errors.mineral && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.mineral}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена (₸)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Укажите цену"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Оставьте пустым для &quot;По запросу&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Местоположение
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Регион *
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.region ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Выберите регион</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                  {errors.region && (
                    <p className="text-red-500 text-sm mt-1">{errors.region}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Город *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Город или населенный пункт"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Площадь (км²) *
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.area ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Площадь в квадратных километрах"
                  min="0"
                  step="0.01"
                />
                {errors.area && (
                  <p className="text-red-500 text-sm mt-1">{errors.area}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Широта
                  </label>
                  <input
                    type="number"
                    value={formData.coordinates[0] || ''}
                    onChange={(e) => handleCoordinateChange(0, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: 43.238949"
                    step="any"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Долгота
                  </label>
                  <input
                    type="number"
                    value={formData.coordinates[1] || ''}
                    onChange={(e) => handleCoordinateChange(1, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: 76.889709"
                    step="any"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Type-specific fields */}
          {formData.type && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {renderTypeSpecificFields()}
            </div>
          )}

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Изображения месторождения
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Добавьте фотографии месторождения, карты, схемы или другие
              визуальные материалы
            </p>
            <ImageUpload
              value={formData.images}
              onChange={(images) =>
                setFormData((prev) => ({ ...prev, images }))
              }
              maxFiles={10}
              maxSize={5}
              bucket="images"
              folder="listings"
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/listings"
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Создание...' : 'Создать объявление'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
