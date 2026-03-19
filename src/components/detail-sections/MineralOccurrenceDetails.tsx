'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import {
  Gem,
  Calendar,
  BarChart2,
  Layers,
  Navigation,
  Mountain,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

interface MineralOccurrenceDetailsProps {
  deposit: KazakhstanDeposit;
}

export default function MineralOccurrenceDetails({
  deposit,
}: MineralOccurrenceDetailsProps) {
  const getConfidenceText = (confidence?: string) => {
    const confidences: Record<string, string> = {
      INFERRED: 'Предполагаемые',
      INDICATED: 'Вероятные',
      MEASURED: 'Достоверные',
    };
    return confidences[confidence || ''] || 'Не определена';
  };

  const getAccessibilityText = (rating?: string) => {
    const ratings: Record<string, string> = {
      EASY: 'Легкий доступ',
      MODERATE: 'Умеренный доступ',
      DIFFICULT: 'Сложный доступ',
      VERY_DIFFICULT: 'Очень сложный доступ',
    };
    return ratings[rating || ''] || 'Не оценен';
  };

  const getAccessibilityDescription = (rating?: string) => {
    const descriptions: Record<string, string> = {
      EASY: 'Хорошая транспортная доступность, развитая инфраструктура',
      MODERATE: 'Умеренная доступность, потребуется развитие инфраструктуры',
      DIFFICULT: 'Ограниченная доступность, сложная логистика',
      VERY_DIFFICULT:
        'Крайне сложная доступность, требует значительных инвестиций',
    };
    return descriptions[rating || ''] || '';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-[#141414]">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
        <Gem className="w-5 h-5 text-gray-400" />
        Информация о рудопроявлении
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {deposit.discoveryDate && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              Дата открытия
            </dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
              {new Date(deposit.discoveryDate).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <BarChart2 className="w-3 h-3 text-gray-400" />
            Достоверность запасов
          </dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
            {getConfidenceText(deposit.geologicalConfidence)}
          </dd>
        </div>

        {deposit.estimatedReserves && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-gray-400" />
              Оценочные запасы
            </dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
              {deposit.estimatedReserves.toLocaleString()} т
            </dd>
          </div>
        )}

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Mountain className="w-3 h-3 text-gray-400" />
            Полезное ископаемое
          </dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
            {deposit.mineral}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-gray-400" />
            Транспортная доступность
          </dt>
          <dd className="mt-1">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {getAccessibilityText(deposit.accessibilityRating)}
            </div>
            {getAccessibilityDescription(deposit.accessibilityRating) && (
              <div className="text-xs text-gray-500 mt-0.5">
                {getAccessibilityDescription(deposit.accessibilityRating)}
              </div>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-gray-400" />
            Площадь участка
          </dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
            {deposit.area.toLocaleString()} км²
          </dd>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
          Инвестиционный потенциал
        </h3>
        <ul className="space-y-2">
          {[
            'Возможность дальнейшей разведки и оценки запасов',
            'Потенциал для научных исследований',
            'База для инвестиционных решений',
            'Планирование инфраструктурных проектов',
            'Соблюдение требований экологической безопасности',
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#0A84FF] mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
