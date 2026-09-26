'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Clock, FileText } from 'lucide-react';

// Mirrors the established ShowInterestButton pattern: login redirect if no session,
// plain POST otherwise. Captures interest into lead_unlock_requests.
export default function LeadUnlockForm({
  code,
  locale,
}: {
  code: string;
  locale: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>(
    'idle'
  );

  const fullUrl = `/${locale}/leads/${code}/full`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) {
      router.push(
        `/${locale}/auth/login?callbackUrl=${encodeURIComponent(fullUrl)}`
      );
      return;
    }
    setState('sending');
    try {
      const res = await fetch(`/api/leads/${code}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, contact_phone: phone }),
      });
      if (res.status === 401) {
        router.push(
          `/${locale}/auth/login?callbackUrl=${encodeURIComponent(fullUrl)}`
        );
        return;
      }
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-5"
      >
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Заявка отправлена
          </p>
        </div>
        <ol className="mt-4 space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
            <span>
              Свяжемся в течение 24 часов и пришлём реквизиты для оплаты.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
            <span>
              После оплаты передадим полный пакет: координаты, архивные данные
              опробования, юридический статус и контакты.
            </span>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        id="lead-unlock-message"
        aria-label="Коротко: ваш интерес или вопрос (необязательно)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Коротко: ваш интерес / вопрос (необязательно)"
        rows={3}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
      />
      <input
        id="lead-unlock-phone"
        type="tel"
        aria-label="Телефон для связи"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Телефон для связи"
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        aria-busy={state === 'sending'}
        className="w-full px-4 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-60"
      >
        {state === 'sending'
          ? 'Отправка…'
          : session?.user
            ? 'Запросить доступ'
            : 'Войти и запросить доступ'}
      </button>
      {state === 'error' && (
        <p className="text-xs text-red-500 text-center">
          Не удалось отправить. Попробуйте ещё раз.
        </p>
      )}
    </form>
  );
}
