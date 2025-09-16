'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import { useTranslation } from '@/hooks/useTranslation';

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

  const getConfidenceColor = (confidence?: string) => {
    const colors: Record<string, string> = {
      INFERRED: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      INDICATED:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      MEASURED:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    };
    return (
      colors[confidence || ''] ||
      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    );
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

  const getAccessibilityColor = (rating?: string) => {
    const colors: Record<string, string> = {
      EASY: 'text-blue-600 dark:text-blue-400',
      MODERATE: 'text-gray-600 dark:text-gray-400',
      DIFFICULT: 'text-gray-700 dark:text-gray-300',
      VERY_DIFFICULT: 'text-gray-800 dark:text-gray-200',
    };
    return colors[rating || ''] || 'text-gray-600 dark:text-gray-400';
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        💎 Информация о рудопроявлении
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {deposit.discoveryDate && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Дата открытия
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {new Date(deposit.discoveryDate).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Достоверность запасов
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(deposit.geologicalConfidence)}`}
            >
              {getConfidenceText(deposit.geologicalConfidence)}
            </span>
          </div>

          {deposit.estimatedReserves && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Оценочные запасы
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-2xl font-bold text-blue-600">
                  {deposit.estimatedReserves.toLocaleString()}
                </span>{' '}
                тонн
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Полезное ископаемое
            </h3>
            <p className="text-gray-700 text-lg font-medium">
              {deposit.mineral}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Транспортная доступность
            </h3>
            <div className="space-y-2">
              <p
                className={`font-medium ${getAccessibilityColor(deposit.accessibilityRating)}`}
              >
                {getAccessibilityText(deposit.accessibilityRating)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {getAccessibilityDescription(deposit.accessibilityRating)}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Площадь участка</h3>
            <p className="text-gray-700">
              <span className="text-xl font-bold text-blue-600">
                {deposit.area.toLocaleString()}
              </span>{' '}
              км²
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Статус участка</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              💎 Рудопроявление
            </span>
          </div>
        </div>
      </div>

      {/* Investment Potential */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 mb-3">
          📈 Инвестиционный потенциал
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>💡 Возможность дальнейшей разведки и оценки запасов</li>
            <li>🔬 Потенциал для научных исследований</li>
            <li>📊 База для инвестиционных решений</li>
            <li>🏗️ Планирование инфраструктурных проектов</li>
            <li>⚖️ Соблюдение требований экологической безопасности</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
