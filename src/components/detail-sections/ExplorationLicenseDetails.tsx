'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';

interface ExplorationLicenseDetailsProps {
  deposit: KazakhstanDeposit;
}

export default function ExplorationLicenseDetails({
  deposit,
}: ExplorationLicenseDetailsProps) {
  const getExplorationStageText = (stage?: string) => {
    const stages: Record<string, string> = {
      PRELIMINARY: 'Предварительная разведка',
      DETAILED: 'Детальная разведка',
      FEASIBILITY: 'Технико-экономическое обоснование',
      ENVIRONMENTAL: 'Экологическая оценка',
    };
    return stages[stage || ''] || 'Не указан';
  };

  const getStageDescription = (stage?: string) => {
    const descriptions: Record<string, string> = {
      PRELIMINARY: 'Изучение общих геологических условий и перспектив',
      DETAILED: 'Детальное изучение запасов и подготовка к промышленной добыче',
      FEASIBILITY: 'Экономическая оценка рентабельности проекта',
      ENVIRONMENTAL: 'Оценка воздействия на окружающую среду',
    };
    return descriptions[stage || ''] || '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        🔍 Информация о лицензии на разведку
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Стадия разведки
            </h3>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-green-800 dark:text-green-300 font-medium">
                {getExplorationStageText(deposit.explorationStage)}
              </p>
              <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                {getStageDescription(deposit.explorationStage)}
              </p>
            </div>
          </div>

          {deposit.explorationPeriod && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Период проведения работ
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Начало:</span>{' '}
                  {new Date(deposit.explorationPeriod.start).toLocaleDateString(
                    'ru-RU',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Окончание:</span>{' '}
                  {new Date(deposit.explorationPeriod.end).toLocaleDateString(
                    'ru-RU',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Полезное ископаемое
            </h3>
            <p className="text-gray-700 text-lg font-medium">
              {deposit.mineral}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {deposit.explorationBudget && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Бюджет разведки
              </h3>
              <p className="text-gray-700">
                <span className="text-2xl font-bold text-green-600">
                  {(deposit.explorationBudget / 1000000).toFixed(1)}
                </span>{' '}
                млн ₸
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Площадь участка
            </h3>
            <p className="text-gray-700">
              <span className="text-xl font-bold text-green-600">
                {deposit.area.toLocaleString()}
              </span>{' '}
              км²
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Статус участка
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              🔍 Разведка
            </span>
          </div>
        </div>
      </div>

      {/* Exploration Requirements */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 mb-3">
          📊 Особенности разведочных работ
        </h3>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
            <li>✅ Геологическое изучение месторождения</li>
            <li>✅ Оценка запасов полезных ископаемых</li>
            <li>✅ Экологический мониторинг</li>
            <li>✅ Подготовка технической документации</li>
            <li>✅ Соблюдение требований недропользования</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
