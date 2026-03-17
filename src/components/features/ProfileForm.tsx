'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

type ProfileType = 'subsoil_user' | 'service_provider' | 'investor';

type ServiceType =
  | 'drilling'
  | 'consulting'
  | 'audit'
  | 'legal'
  | 'lab'
  | 'reserve_estimation';

interface ProfileData {
  full_name: string;
  company_name: string;
  phone: string;
  city: string;
  country: string;
  website: string;
  description: string;
  profile_type: ProfileType | '';
  service_types: ServiceType[];
}

const SERVICE_TYPE_OPTIONS: {
  value: ServiceType;
  labelRu: string;
  labelEn: string;
  labelKz: string;
}[] = [
  {
    value: 'drilling',
    labelRu: 'Бурение',
    labelEn: 'Drilling',
    labelKz: 'Бұрғылау',
  },
  {
    value: 'consulting',
    labelRu: 'Консалтинг',
    labelEn: 'Consulting',
    labelKz: 'Консалтинг',
  },
  { value: 'audit', labelRu: 'Аудит', labelEn: 'Audit', labelKz: 'Аудит' },
  {
    value: 'legal',
    labelRu: 'Юридические услуги',
    labelEn: 'Legal Services',
    labelKz: 'Заң қызметтері',
  },
  {
    value: 'lab',
    labelRu: 'Лабораторные исследования',
    labelEn: 'Laboratory Research',
    labelKz: 'Зертханалық зерттеулер',
  },
  {
    value: 'reserve_estimation',
    labelRu: 'Оценка запасов',
    labelEn: 'Reserve Estimation',
    labelKz: 'Қорларды бағалау',
  },
];

const PROFILE_TYPES: {
  value: ProfileType;
  labelRu: string;
  labelEn: string;
  labelKz: string;
}[] = [
  {
    value: 'subsoil_user',
    labelRu: 'Недропользователь',
    labelEn: 'Subsoil User',
    labelKz: 'Жер қойнауын пайдаланушы',
  },
  {
    value: 'service_provider',
    labelRu: 'Поставщик услуг',
    labelEn: 'Service Provider',
    labelKz: 'Қызмет көрсетуші',
  },
  {
    value: 'investor',
    labelRu: 'Инвестор / Покупатель',
    labelEn: 'Investor / Buyer',
    labelKz: 'Инвестор / Сатып алушы',
  },
];

export default function ProfileForm() {
  const { t, locale } = useTranslation();

  const [form, setForm] = useState<ProfileData>({
    full_name: '',
    company_name: '',
    phone: '',
    city: '',
    country: 'Kazakhstan',
    website: '',
    description: '',
    profile_type: '',
    service_types: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const label = (ru: string, en: string, kz: string): string => {
    if (locale === 'en') return en;
    if (locale === 'kz') return kz;
    return ru;
  };

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          setForm({
            full_name: p.full_name || '',
            company_name: p.company_name || '',
            phone: p.phone || '',
            city: p.city || '',
            country: p.country || 'Kazakhstan',
            website: p.website || '',
            description: p.description || '',
            profile_type: p.profile_type || '',
            service_types: Array.isArray(p.service_types)
              ? p.service_types
              : [],
          });
        }
      } catch {
        // Profile not found or not authenticated - use defaults
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileTypeChange = (value: ProfileType) => {
    setForm((prev) => ({
      ...prev,
      profile_type: value,
      // Clear service_types if switching away from service_provider
      service_types: value === 'service_provider' ? prev.service_types : [],
    }));
  };

  const handleServiceTypeToggle = (serviceType: ServiceType) => {
    setForm((prev) => {
      const current = prev.service_types;
      const next = current.includes(serviceType)
        ? current.filter((s) => s !== serviceType)
        : [...current, serviceType];
      return { ...prev, service_types: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setToast({
          type: 'success',
          message: label(
            'Профиль успешно сохранен',
            'Profile saved successfully',
            'Профиль сәтті сақталды'
          ),
        });
      } else {
        const data = await res.json();
        setToast({
          type: 'error',
          message:
            data.error ||
            label(
              'Не удалось сохранить профиль',
              'Failed to save profile',
              'Профильді сақтау мүмкін болмады'
            ),
        });
      }
    } catch {
      setToast({
        type: 'error',
        message: label(
          'Ошибка сети. Попробуйте позже.',
          'Network error. Please try again later.',
          'Желі қатесі. Кейінірек қайталап көріңіз.'
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {label('Редактировать профиль', 'Edit Profile', 'Профильді өңдеу')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {label(
            'Обновите информацию о себе и вашей компании',
            'Update your personal and company information',
            'Өзіңіз және компанияңыз туралы ақпаратты жаңартыңыз'
          )}
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label('ФИО', 'Full Name', 'Толық аты-жөні')} *
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          value={form.full_name}
          onChange={handleChange}
          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          placeholder={label(
            'Иванов Иван Иванович',
            'John Doe',
            'Иванов Иван Иванович'
          )}
        />
      </div>

      {/* Company Name */}
      <div>
        <label
          htmlFor="company_name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label('Название компании', 'Company Name', 'Компания атауы')}
        </label>
        <input
          id="company_name"
          name="company_name"
          type="text"
          value={form.company_name}
          onChange={handleChange}
          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          placeholder={label('ТОО "Пример"', 'Example LLC', 'ЖШС "Мысал"')}
        />
      </div>

      {/* Phone and City on one row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label('Телефон', 'Phone', 'Телефон')}
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder="+7 (7xx) xxx-xx-xx"
          />
        </div>
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label('Город', 'City', 'Қала')}
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={form.city}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder={label('Алматы', 'Almaty', 'Алматы')}
          />
        </div>
      </div>

      {/* Country */}
      <div>
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label('Страна', 'Country', 'Ел')}
        </label>
        <input
          id="country"
          name="country"
          type="text"
          value={form.country}
          onChange={handleChange}
          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          placeholder="Kazakhstan"
        />
      </div>

      {/* Website */}
      <div>
        <label
          htmlFor="website"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label('Веб-сайт', 'Website', 'Веб-сайт')}
        </label>
        <input
          id="website"
          name="website"
          type="text"
          value={form.website}
          onChange={handleChange}
          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          placeholder="https://example.kz"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label('Описание', 'Description', 'Сипаттама')}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={form.description}
          onChange={handleChange}
          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
          placeholder={label(
            'Расскажите о себе или вашей компании...',
            'Tell us about yourself or your company...',
            'Өзіңіз немесе компанияңыз туралы айтыңыз...'
          )}
        />
      </div>

      {/* Profile Type */}
      <div>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label('Тип профиля', 'Profile Type', 'Профиль түрі')}
        </span>
        <div className="space-y-2">
          {PROFILE_TYPES.map((pt) => (
            <label
              key={pt.value}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                form.profile_type === pt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="profile_type"
                value={pt.value}
                checked={form.profile_type === pt.value}
                onChange={() => handleProfileTypeChange(pt.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span
                className={`ml-3 text-sm font-medium ${
                  form.profile_type === pt.value
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {label(pt.labelRu, pt.labelEn, pt.labelKz)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Service Types (conditional) */}
      {form.profile_type === 'service_provider' && (
        <div>
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {label('Виды услуг', 'Service Types', 'Қызмет түрлері')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SERVICE_TYPE_OPTIONS.map((st) => (
              <label
                key={st.value}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  form.service_types.includes(st.value)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.service_types.includes(st.value)}
                  onChange={() => handleServiceTypeToggle(st.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span
                  className={`ml-3 text-sm font-medium ${
                    form.service_types.includes(st.value)
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {label(st.labelRu, st.labelEn, st.labelKz)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
            isSaving
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md cursor-pointer'
          }`}
        >
          {isSaving
            ? label('Сохранение...', 'Saving...', 'Сақталуда...')
            : label('Сохранить', 'Save', 'Сақтау')}
        </button>
      </div>
    </form>
  );
}
