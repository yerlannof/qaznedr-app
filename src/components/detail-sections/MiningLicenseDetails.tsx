'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        📋 Информация о лицензии на добычу
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Номер лицензии</h3>
            <p className="text-gray-700 font-mono text-sm bg-gray-50 px-3 py-2 rounded">
              {deposit.licenseNumber || 'Не указан'}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Подтип лицензии</h3>
            <p className="text-gray-700">
              {getLicenseSubtypeText(deposit.licenseSubtype)}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Срок действия лицензии
            </h3>
            <p className="text-gray-700">
              {deposit.licenseExpiry
                ? new Date(deposit.licenseExpiry).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Не указан'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {deposit.annualProductionLimit && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Годовой лимит добычи
              </h3>
              <p className="text-gray-700">
                <span className="text-2xl font-bold text-blue-600">
                  {deposit.annualProductionLimit.toLocaleString()}
                </span>{' '}
                тонн в год
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

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Площадь участка</h3>
            <p className="text-gray-700">
              <span className="text-xl font-bold text-blue-600">
                {deposit.area.toLocaleString()}
              </span>{' '}
              км²
            </p>
          </div>
        </div>
      </div>

      {/* Licensing Requirements */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">
          🏭 Особенности лицензии на добычу
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ Право на промышленную добычу полезных ископаемых</li>
            <li>✅ Соблюдение экологических норм и стандартов</li>
            <li>✅ Регулярная отчетность о добыче</li>
            <li>✅ Уплата налогов и роялти</li>
            <li>✅ Восстановление земель после добычи</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
