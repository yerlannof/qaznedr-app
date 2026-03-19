'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import {
  Search,
  Calendar,
  Mountain,
  Layers,
  DollarSign,
  Activity,
  CheckCircle,
} from 'lucide-react';

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
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-[#141414]">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        Информация о лицензии на разведку
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-gray-400" />
            Стадия разведки
          </dt>
          <dd className="mt-1">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {getExplorationStageText(deposit.explorationStage)}
            </div>
            {getStageDescription(deposit.explorationStage) && (
              <div className="text-xs text-gray-500 mt-0.5">
                {getStageDescription(deposit.explorationStage)}
              </div>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Mountain className="w-3 h-3 text-gray-400" />
            Полезное ископаемое
          </dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
            {deposit.mineral}
          </dd>
        </div>

        {deposit.explorationPeriod && (
          <>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                Начало работ
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
                {new Date(deposit.explorationPeriod.start).toLocaleDateString(
                  'ru-RU',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                Окончание работ
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
                {new Date(deposit.explorationPeriod.end).toLocaleDateString(
                  'ru-RU',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </dd>
            </div>
          </>
        )}

        {deposit.explorationBudget && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-gray-400" />
              Бюджет разведки
            </dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
              {(deposit.explorationBudget / 1000000).toFixed(1)} млн ₸
            </dd>
          </div>
        )}

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
          <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
          Особенности разведочных работ
        </h3>
        <ul className="space-y-2">
          {[
            'Геологическое изучение месторождения',
            'Оценка запасов полезных ископаемых',
            'Экологический мониторинг',
            'Подготовка технической документации',
            'Соблюдение требований недропользования',
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
