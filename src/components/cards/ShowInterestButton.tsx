'use client';

import { useState } from 'react';
import { Heart, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

interface ShowInterestButtonProps {
  listingId: string;
  sellerId?: string;
  variant?: 'compact' | 'full';
}

export default function ShowInterestButton({
  listingId,
  sellerId,
  variant = 'full',
}: ShowInterestButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { locale } = useTranslation();
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>(
    'idle'
  );

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push(`/${locale}/auth/login`);
      return;
    }

    if (state === 'sent' || state === 'loading') return;

    setState('loading');
    try {
      const res = await fetch('/api/contact-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          seller_id: sellerId,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setState('sent');
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const isSent = state === 'sent';
  const isLoading = state === 'loading';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || isSent}
        aria-label={isSent ? 'Интерес отправлен' : 'Заинтересоваться'}
        className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
          isSent
            ? 'border-[#0A84FF] bg-[#0A84FF]/10 text-[#0A84FF]'
            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-50 hover:text-gray-900 dark:hover:text-gray-50'
        }`}
      >
        {isSent ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || isSent}
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
        isSent
          ? 'border-[#0A84FF] bg-[#0A84FF]/10 text-[#0A84FF]'
          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-50 hover:text-gray-900 dark:hover:text-gray-50'
      }`}
    >
      {isSent ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Отправлено
        </>
      ) : (
        <>
          <Heart className="w-3.5 h-3.5" />
          {isLoading ? 'Отправка…' : 'Заинтересоваться'}
        </>
      )}
    </button>
  );
}
