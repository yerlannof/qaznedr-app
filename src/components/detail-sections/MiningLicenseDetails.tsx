'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import {
  FileText,
  Layers,
  Calendar,
  Gauge,
  Mountain,
  CheckCircle,
} from 'lucide-react';

interface MiningLicenseDetailsProps {
  deposit: KazakhstanDeposit;
}

export default function MiningLicenseDetails({
  deposit,
}: MiningLicenseDetailsProps) {
  const getLicenseSubtypeText = (subtype?: string) => {
    const subtypes: Record<string, string> = {
      EXTRACTION_RIGHT: 'Право на добычу',
      PROCESSING_RIGHT: 'Право на переработку',
      TRANSPORTATION_RIGHT: 'Право на транспортировку',
      COMBINED_RIGHT: 'Комбинированные права',
    };
    return subtypes[subtype || ''] || 'Не указан';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-[#141414]">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gray-400" />
        Информация о лицензии на добычу
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Номер лицензии
          </dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1 font-mono">
            {deposit.licenseNumber || 'Не указан'}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Подтип лицензии
          </dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
            {getLicenseSubtypeText(deposit.licenseSubtype)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            Срок действия
          </dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
            {deposit.licenseExpiry
              ? new Date(deposit.licenseExpiry).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Не указан'}
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

        {deposit.annualProductionLimit && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-gray-400" />
              Годовой лимит добычи
            </dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
              {deposit.annualProductionLimit.toLocaleString()} т/год
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
          Особенности лицензии на добычу
        </h3>
        <ul className="space-y-2">
          {[
            'Право на промышленную добычу полезных ископаемых',
            'Соблюдение экологических норм и стандартов',
            'Регулярная отчетность о добыче',
            'Уплата налогов и роялти',
            'Восстановление земель после добычи',
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
