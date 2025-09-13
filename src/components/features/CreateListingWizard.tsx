'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wizard, useWizard } from 'react-use-wizard';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  MapPin,
  Image as ImageIcon,
  Settings,
  AlertTriangle,
} from 'lucide-react';

import { depositApi } from '@/lib/api/deposits';
import { ListingType, MineralType, RegionType } from '@/lib/types/listing';
import { ImageUpload } from '@/components/ui/image-upload';

// Validation schemas for each step
const basicInfoSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z
    .string()
    .min(10, 'Описание должно содержать минимум 10 символов'),
  type: z
    .enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE'] as const)
    .refine((val) => val, {
      message: 'Выберите тип объявления',
    }),
  mineral: z
    .enum(['Нефть', 'Газ', 'Золото', 'Медь', 'Уголь', 'Уран', 'Железо'] as const)
    .refine((val) => val, {
      message: 'Выберите полезное ископаемое',
    }),
  price: z.number().optional(),
});

const locationSchema = z.object({
  region: z
    .enum([
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
    ] as const)
    .refine((val) => val, {
      message: 'Выберите регион',
    }),
  city: z.string().min(1, 'Город обязателен'),
  area: z.number().min(0.01, 'Площадь должна быть больше 0'),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
});

const typeSpecificSchema = z.object({
  // Mining License
  licenseSubtype: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),

  // Exploration License
  explorationStage: z.string().optional(),
  explorationStart: z.string().optional(),
  explorationBudget: z.number().optional(),

  // Mineral Occurrence
  discoveryDate: z.string().optional(),
  geologicalConfidence: z.string().optional(),
  estimatedReserves: z.string().optional(),
});

const finalSchema = z.object({
  images: z.array(z.string()).optional(),
});

// Combined schema
const formSchema = basicInfoSchema
  .merge(locationSchema)
  .merge(typeSpecificSchema)
  .merge(finalSchema);

type FormData = z.infer<typeof formSchema>;

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

// Step components
const StepIndicator = () => {
  const { activeStep, stepCount } = useWizard();

  const steps = [
    { title: 'Основное', icon: FileText },
    { title: 'Местоположение', icon: MapPin },
    { title: 'Детали', icon: Settings },
    { title: 'Изображения', icon: ImageIcon },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  animate={{
                    scale: isActive ? [1, 1.1, 1] : 1,
                    rotate: isCompleted ? [0, 360] : 0,
                  }}
                  transition={{
                    scale: { repeat: isActive ? Infinity : 0, duration: 2 },
                    rotate: { duration: 0.5 },
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </motion.div>
                <span
                  className={`text-sm mt-2 font-medium ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  } transition-colors duration-300`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6 bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${((activeStep + 1) / stepCount) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

const StepNavigation = ({
  onSubmit,
  isLoading,
}: {
  onSubmit: () => void;
  isLoading: boolean;
}) => {
  const { previousStep, nextStep, activeStep, isFirstStep, isLastStep } =
    useWizard();

  return (
    <div className="flex justify-between items-center pt-8 border-t border-gray-200">
      <motion.button
        type="button"
        onClick={previousStep}
        disabled={isFirstStep}
        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
          isFirstStep
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
        }`}
        whileHover={!isFirstStep ? { scale: 1.02 } : {}}
        whileTap={!isFirstStep ? { scale: 0.98 } : {}}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад</span>
      </motion.button>

      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>Шаг {activeStep + 1} из 4</span>
      </div>

      <motion.button
        type={isLastStep ? 'submit' : 'button'}
        onClick={isLastStep ? onSubmit : nextStep}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        whileHover={
          !isLoading
            ? { scale: 1.02, boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)' }
            : {}
        }
        whileTap={!isLoading ? { scale: 0.98 } : {}}
      >
        <span>
          {isLastStep
            ? isLoading
              ? 'Создание...'
              : 'Создать объявление'
            : 'Далее'}
        </span>
        {!isLastStep && <ArrowRight className="w-4 h-4" />}
      </motion.button>
    </div>
  );
};

// Step 2: Location Information
const LocationStep = () => {
  const {
    formState: { errors },
    register,
  } = useFormContext<FormData>();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Местоположение
        </h2>
        <p className="text-gray-600">
          Укажите географическое расположение месторождения
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Регион *
            </label>
            <select
              {...register('region')}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.region ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-2 flex items-center space-x-1"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.region.message}</span>
              </motion.p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Город *
            </label>
            <input
              type="text"
              {...register('city')}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Город или населенный пункт"
            />
            {errors.city && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-2 flex items-center space-x-1"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.city.message}</span>
              </motion.p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Площадь (км²) *
          </label>
          <input
            type="number"
            {...register('area', { valueAsNumber: true })}
            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.area ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Площадь в квадратных километрах"
            min="0"
            step="0.01"
          />
          {errors.area && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-2 flex items-center space-x-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.area.message}</span>
            </motion.p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-3">
            Координаты (необязательно)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                Широта
              </label>
              <input
                type="number"
                {...register('coordinates.0', { valueAsNumber: true })}
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: 43.238949"
                step="any"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                Долгота
              </label>
              <input
                type="number"
                {...register('coordinates.1', { valueAsNumber: true })}
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: 76.889709"
                step="any"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Step 3: Type-specific Information
const TypeSpecificStep = () => {
  const {
    formState: { errors },
    register,
    watch,
  } = useFormContext<FormData>();
  const watchedType = watch('type');

  const renderTypeSpecificFields = () => {
    switch (watchedType) {
      case 'MINING_LICENSE':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтип лицензии
                </label>
                <select
                  {...register('licenseSubtype')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите подтип</option>
                  <option value="Добычная">Добычная</option>
                  <option value="Совмещенная">Совмещенная</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер лицензии *
                </label>
                <input
                  type="text"
                  {...register('licenseNumber')}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Например: KZ1234567890"
                />
                {errors.licenseNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.licenseNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Срок действия лицензии *
                </label>
                <input
                  type="date"
                  {...register('licenseExpiry')}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licenseExpiry ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.licenseExpiry && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.licenseExpiry.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'EXPLORATION_LICENSE':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Стадия разведки *
                </label>
                <select
                  {...register('explorationStage')}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    {errors.explorationStage.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Период разведки *
                </label>
                <input
                  type="text"
                  {...register('explorationStart')}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.explorationStart
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Например: 3 года"
                />
                {errors.explorationStart && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.explorationStart.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Бюджет разведки (₸)
                </label>
                <input
                  type="number"
                  {...register('explorationBudget', { valueAsNumber: true })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата обнаружения *
                </label>
                <input
                  type="date"
                  {...register('discoveryDate')}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.discoveryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.discoveryDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.discoveryDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Геологическая достоверность *
                </label>
                <select
                  {...register('geologicalConfidence')}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    {errors.geologicalConfidence.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Оценочные запасы
                </label>
                <textarea
                  {...register('estimatedReserves')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Описание оценочных запасов полезного ископаемого"
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Сначала выберите тип объявления на первом шаге</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Дополнительная информация
        </h2>
        <p className="text-gray-600">
          Укажите специфические данные в зависимости от типа объявления
        </p>
      </div>

      {renderTypeSpecificFields()}
    </motion.div>
  );
};

// Step 4: Images Upload
const ImagesStep = () => {
  const { setValue, watch } = useFormContext<FormData>();
  const images = watch('images') || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Изображения месторождения
        </h2>
        <p className="text-gray-600">
          Добавьте фотографии, карты, схемы и другие визуальные материалы
        </p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
          <ImageIcon className="w-5 h-5" />
          <span>Загрузка изображений</span>
        </h4>
        <p className="text-sm text-blue-700 mb-4">
          Хорошие изображения повышают интерес к объявлению. Рекомендуется
          добавить минимум 3-5 фотографий.
        </p>

        <ImageUpload
          value={images}
          onChange={(newImages) => setValue('images', newImages)}
          maxFiles={10}
          maxSize={5}
          bucket="images"
          folder="listings"
        />
      </div>

      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 p-4 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Загружено {images.length} изображений
            </span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Ваше объявление готово к публикации!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

// Step 1: Basic Information
const BasicInfoStep = () => {
  const {
    formState: { errors },
    register,
    watch,
  } = useFormContext<FormData>();
  const watchedType = watch('type');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Основная информация
        </h2>
        <p className="text-gray-600">
          Укажите основные данные о вашем месторождении
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название объявления *
          </label>
          <input
            type="text"
            {...register('title')}
            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Например: Месторождение нефти в Мангистауской области"
          />
          {errors.title && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-2 flex items-center space-x-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.title.message}</span>
            </motion.p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание *
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${
              errors.description
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Подробное описание месторождения, его характеристик и особенностей"
          />
          {errors.description && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-2 flex items-center space-x-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.description.message}</span>
            </motion.p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип объявления *
            </label>
            <select
              {...register('type')}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.type ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Выберите тип</option>
              <option value="MINING_LICENSE">Лицензия на добычу</option>
              <option value="EXPLORATION_LICENSE">Лицензия на разведку</option>
              <option value="MINERAL_OCCURRENCE">Рудопроявление</option>
            </select>
            {errors.type && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-2 flex items-center space-x-1"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.type.message}</span>
              </motion.p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Полезное ископаемое *
            </label>
            <select
              {...register('mineral')}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.mineral ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-2 flex items-center space-x-1"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.mineral.message}</span>
              </motion.p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Цена (₸)
          </label>
          <input
            type="number"
            {...register('price', { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Укажите цену"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-2">
            Оставьте пустым для &ldquo;По запросу&rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
};

interface CreateListingWizardProps {
  onCancel: () => void;
}

export default function CreateListingWizard({
  onCancel,
}: CreateListingWizardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: undefined,
      mineral: undefined,
      price: undefined,
      region: undefined,
      city: '',
      area: 0,
      coordinates: [0, 0],
      images: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const listingData: any = {
        title: data.title,
        description: data.description,
        type: data.type as ListingType,
        mineral: data.mineral as MineralType,
        region: data.region as RegionType,
        city: data.city,
        price: data.price || null,
        area: data.area,
        coordinates: data.coordinates,
        status: 'PENDING',
        verified: false,
        featured: false,
        views: 0,
        images: data.images || [],
        documents: [],

        // Type-specific fields
        ...(data.type === 'MINING_LICENSE' && {
          licenseSubtype: data.licenseSubtype || 'Добычная',
          licenseNumber: data.licenseNumber,
          licenseExpiry: data.licenseExpiry
            ? new Date(data.licenseExpiry)
            : null,
        }),

        ...(data.type === 'EXPLORATION_LICENSE' && {
          explorationStage: data.explorationStage,
          explorationStart: data.explorationStart,
          explorationBudget: data.explorationBudget,
        }),

        ...(data.type === 'MINERAL_OCCURRENCE' && {
          discoveryDate: data.discoveryDate
            ? new Date(data.discoveryDate)
            : null,
          geologicalConfidence: data.geologicalConfidence,
          estimatedReserves: data.estimatedReserves,
        }),
      };

      const newListing = await depositApi.create(listingData);
      router.push(`/listings/${newListing.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Произошла ошибка при создании объявления. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-8 py-6 border-b border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900">
              Создать объявление
            </h1>
            <p className="text-gray-600 mt-2">
              Пошаговое создание объявления о продаже месторождения
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <StepIndicator />

            <Wizard>
              <BasicInfoStep />
              <LocationStep />
              <TypeSpecificStep />
              <ImagesStep />
            </Wizard>

            <StepNavigation
              onSubmit={methods.handleSubmit(onSubmit)}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Cancel button */}
        <div className="text-center mt-6">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Отменить создание объявления
          </button>
        </div>
      </div>
    </FormProvider>
  );
}
