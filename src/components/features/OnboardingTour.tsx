'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Heart,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'qaznedr_onboarding_v1';

const STEPS = [
  {
    icon: Search,
    title: 'Найдите проект',
    body: 'Каталог объявлений с фильтрами по минералу, региону и типу лицензии. Карта Казахстана покажет, где что есть.',
  },
  {
    icon: Heart,
    title: 'Сохраняйте интересное',
    body: 'Кнопка «Заинтересоваться» отправит сигнал продавцу — вы попадаете в его уведомления, никто не теряется.',
  },
  {
    icon: MessageSquare,
    title: 'Общайтесь напрямую',
    body: 'Контакты продавца открываются после регистрации. Никаких посредников и комиссий.',
  },
  {
    icon: User,
    title: 'Заполните профиль',
    body: 'Чем подробнее ваш профиль, тем выше доверие. Верифицированные продавцы получают значок и приоритет в поиске.',
  },
];

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) !== 'completed') {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'completed');
    }
  };

  if (!open) return null;

  const Step = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-700 shadow-medium p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Пропустить"
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-[#0A84FF]/10 flex items-center justify-center">
          <Step.icon className="w-6 h-6 text-[#0A84FF]" />
        </div>

        <h2 className="mt-5 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          {Step.title}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {Step.body}
        </p>

        <div className="mt-6 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step
                  ? 'w-8 bg-gray-900 dark:bg-gray-50'
                  : 'w-1.5 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>
          ) : (
            <button
              type="button"
              onClick={close}
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
            >
              Пропустить
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isLast) close();
              else setStep((s) => s + 1);
            }}
            className="inline-flex items-center gap-1 px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            {isLast ? 'Начать' : 'Далее'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
