'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const TYPES = [
  { value: 'MINING_LICENSE', label: 'Лицензия на добычу' },
  { value: 'EXPLORATION_LICENSE', label: 'Лицензия на разведку' },
  { value: 'MINERAL_OCCURRENCE', label: 'Рудопроявление' },
];

const MINERALS = ['Нефть', 'Газ', 'Золото', 'Медь', 'Уголь', 'Уран', 'Железо'];

const REGIONS = [
  'Мангистауская',
  'Атырауская',
  'Западно-Казахстанская',
  'Актюбинская',
  'Костанайская',
  'Северо-Казахстанская',
  'Акмолинская',
  'Карагандинская',
  'Павлодарская',
  'Восточно-Казахстанская',
  'Алматинская',
  'Жамбылская',
  'Туркестанская',
  'Кызылординская',
  'Улытауская',
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Опубликовано' },
  { value: 'PENDING_MODERATION', label: 'На модерации' },
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'SOLD', label: 'Продано' },
  { value: 'REJECTED', label: 'Отклонено' },
];

export interface AdminListingValues {
  title: string;
  description: string;
  type: string;
  mineral: string;
  region: string;
  city: string;
  area: number | '';
  price: number | '' | null;
  status: string;
  verified: boolean;
  featured: boolean;
  images: string[];
}

const EMPTY: AdminListingValues = {
  title: '',
  description: '',
  type: 'MINING_LICENSE',
  mineral: 'Золото',
  region: 'Карагандинская',
  city: '',
  area: '',
  price: '',
  status: 'ACTIVE',
  verified: false,
  featured: false,
  images: [],
};

export default function AdminListingForm({
  mode,
  listingId,
  initialValues,
}: {
  mode: 'create' | 'edit';
  listingId?: string;
  initialValues?: Partial<AdminListingValues>;
}) {
  const router = useRouter();
  const { locale } = useTranslation();
  const [values, setValues] = useState<AdminListingValues>({
    ...EMPTY,
    ...initialValues,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof AdminListingValues>(
    key: K,
    value: AdminListingValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!values.title.trim()) {
      setError('Название обязательно');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        title: values.title.trim(),
        description: values.description.trim(),
        type: values.type,
        mineral: values.mineral,
        region: values.region,
        city: values.city.trim(),
        area: values.area === '' ? 0 : Number(values.area),
        price:
          values.price === '' || values.price === null
            ? null
            : Number(values.price),
        status: values.status,
        verified: values.verified,
        featured: values.featured,
        images: values.images,
      };

      const url =
        mode === 'create'
          ? '/api/admin/listings'
          : `/api/admin/listings/${listingId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Save failed');
      }

      router.push(`/${locale}/admin/listings`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Название *">
        <input
          type="text"
          required
          value={values.title}
          onChange={(e) => update('title', e.target.value)}
          className={inputCls}
          placeholder="Месторождение Кашаган"
        />
      </Field>

      <Field label="Описание">
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          className={inputCls}
          placeholder="Подробное описание объекта"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Тип">
          <select
            value={values.type}
            onChange={(e) => update('type', e.target.value)}
            className={inputCls}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Минерал">
          <select
            value={values.mineral}
            onChange={(e) => update('mineral', e.target.value)}
            className={inputCls}
          >
            {MINERALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Регион">
          <select
            value={values.region}
            onChange={(e) => update('region', e.target.value)}
            className={inputCls}
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Город">
          <input
            type="text"
            value={values.city}
            onChange={(e) => update('city', e.target.value)}
            className={inputCls}
            placeholder="Атырау"
          />
        </Field>

        <Field label="Площадь, км²">
          <input
            type="number"
            step="0.01"
            value={values.area}
            onChange={(e) =>
              update(
                'area',
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            className={inputCls}
          />
        </Field>

        <Field label="Цена, ₸">
          <input
            type="number"
            step="1"
            value={values.price ?? ''}
            onChange={(e) =>
              update(
                'price',
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            className={inputCls}
            placeholder="По запросу"
          />
        </Field>
      </div>

      <Field label="Статус">
        <select
          value={values.status}
          onChange={(e) => update('status', e.target.value)}
          className={inputCls}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={values.verified}
            onChange={(e) => update('verified', e.target.checked)}
            className="rounded border-gray-300"
          />
          Verified
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={values.featured}
            onChange={(e) => update('featured', e.target.checked)}
            className="rounded border-gray-300"
          />
          Featured
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'create' ? 'Создать объявление' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/listings`)}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}
