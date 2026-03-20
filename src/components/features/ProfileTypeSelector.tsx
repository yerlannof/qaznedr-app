'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

type ProfileType = 'subsoil_user' | 'service_provider' | 'investor';

interface ProfileCard {
  type: ProfileType;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  fallbackTitle: string;
  fallbackDescription: string;
}

const profileCards: ProfileCard[] = [
  {
    type: 'subsoil_user',
    icon: '⛏️',
    titleKey: 'profile.type.subsoilUser',
    descriptionKey: 'profile.type.subsoilUserDesc',
    fallbackTitle: 'Недропользователь',
    fallbackDescription:
      'Владелец лицензий на добычу или разведку полезных ископаемых',
  },
  {
    type: 'service_provider',
    icon: '🔧',
    titleKey: 'profile.type.serviceProvider',
    descriptionKey: 'profile.type.serviceProviderDesc',
    fallbackTitle: 'Поставщик услуг',
    fallbackDescription:
      'Компания, оказывающая услуги для горнодобывающей отрасли',
  },
  {
    type: 'investor',
    icon: '💼',
    titleKey: 'profile.type.investor',
    descriptionKey: 'profile.type.investorDesc',
    fallbackTitle: 'Инвестор / Покупатель',
    fallbackDescription:
      'Инвестор или покупатель минеральных ресурсов и лицензий',
  },
];

export default function ProfileTypeSelector() {
  const [selected, setSelected] = useState<ProfileType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t, locale } = useTranslation();

  const getLabel = (key: string, fallback: string): string => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const handleSubmit = async () => {
    if (!selected) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_type: selected }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save profile type');
      }

      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {getLabel('profile.setup.title', 'Выберите тип профиля')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {getLabel(
            'profile.setup.subtitle',
            'Это поможет нам настроить платформу под ваши потребности'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {profileCards.map((card) => {
          const isSelected = selected === card.type;
          return (
            <button
              key={card.type}
              onClick={() => setSelected(card.type)}
              className={`relative flex flex-col items-center text-center p-6 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#0A84FF] bg-gray-50 dark:bg-gray-800 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="text-4xl mb-4">{card.icon}</span>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isSelected
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {getLabel(card.titleKey, card.fallbackTitle)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getLabel(card.descriptionKey, card.fallbackDescription)}
              </p>
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={!selected || isSubmitting}
          className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
            selected && !isSubmitting
              ? 'bg-gray-900 hover:bg-gray-800 cursor-pointer'
              : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
          }`}
        >
          {isSubmitting
            ? getLabel('common.loading', 'Загрузка...')
            : getLabel('profile.setup.continue', 'Продолжить')}
        </button>
      </div>
    </div>
  );
}
