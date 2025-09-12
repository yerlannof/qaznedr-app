'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layouts/Navigation';
import { AuctionCard } from '@/components/features/auctions/AuctionCard';
import { createClient } from '@/lib/supabase/client';
import { Gavel, TrendingUp, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button-new';
import Link from 'next/link';

interface Auction {
  id: string;
  deposit_id: string;
  start_date: string;
  end_date: string;
  starting_price: number;
  current_price: number | null;
  reserve_price: number | null;
  buy_now_price: number | null;
  bid_increment: number;
  status: 'PENDING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  winner_id: string | null;
  created_at: string;
  updated_at: string;
  deposit: any; // Will be joined from kazakhstan_deposits
  bids_count?: number;
  time_left?: string;
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'ending' | 'ended'>(
    'active'
  );
  const supabase = createClient();

  useEffect(() => {
    loadAuctions();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('auctions-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auctions' },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        handleBidUpdate
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const loadAuctions = async () => {
    setLoading(true);

    let query = supabase.from('auctions').select(`
        *,
        deposit:kazakhstan_deposits(
          id,
          title,
          description,
          mineral,
          region,
          city,
          area,
          images,
          verified
        ),
        bids(count)
      `);

    // Apply filters
    if (filter === 'active') {
      query = query.eq('status', 'ACTIVE');
    } else if (filter === 'ending') {
      const in24Hours = new Date();
      in24Hours.setHours(in24Hours.getHours() + 24);
      query = query
        .eq('status', 'ACTIVE')
        .lte('end_date', in24Hours.toISOString());
    } else if (filter === 'ended') {
      query = query.eq('status', 'ENDED');
    }

    const { data, error } = await query.order('end_date', { ascending: true });

    if (error) {
      console.error('Error loading auctions:', error);
    } else {
      // Calculate time left for each auction
      const auctionsWithTime =
        data?.map((auction: any) => ({
          ...auction,
          bids_count: auction.bids?.[0]?.count || 0,
          time_left: calculateTimeLeft(auction.end_date),
        })) || [];

      setAuctions(auctionsWithTime);
    }

    setLoading(false);
  };

  const handleRealtimeUpdate = (payload: any) => {
    loadAuctions(); // Reload for simplicity, could optimize
  };

  const handleBidUpdate = (payload: any) => {
    // Update bid counts and current prices
    loadAuctions();
  };

  const calculateTimeLeft = (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Завершен';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} дн. ${hours} ч.`;
    if (hours > 0) return `${hours} ч. ${minutes} мин.`;
    return `${minutes} мин.`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Gavel className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Аукционы месторождений</h1>
          </div>
          <p className="text-xl text-blue-100 mb-8">
            Участвуйте в торгах и получите лучшие предложения
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl">
            <div>
              <div className="text-3xl font-bold">
                {auctions.filter((a) => a.status === 'ACTIVE').length}
              </div>
              <div className="text-blue-200">Активных аукционов</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {
                  auctions.filter(
                    (a) => a.time_left && a.time_left.includes('ч.')
                  ).length
                }
              </div>
              <div className="text-blue-200">Завершаются сегодня</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {auctions.reduce((sum, a) => sum + (a.bids_count || 0), 0)}
              </div>
              <div className="text-blue-200">Всего ставок</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Все аукционы
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
              leftIcon={<TrendingUp className="w-4 h-4" />}
            >
              Активные
            </Button>
            <Button
              variant={filter === 'ending' ? 'default' : 'outline'}
              onClick={() => setFilter('ending')}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Завершаются
            </Button>
            <Button
              variant={filter === 'ended' ? 'default' : 'outline'}
              onClick={() => setFilter('ended')}
            >
              Завершенные
            </Button>
          </div>

          <Link href="/auctions/create">
            <Button variant="default">Создать аукцион</Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
              >
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Auctions Grid */}
        {!loading && auctions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && auctions.length === 0 && (
          <div className="text-center py-12">
            <Gavel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет активных аукционов
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'active'
                ? 'В данный момент нет активных торгов'
                : 'Нет аукционов в выбранной категории'}
            </p>
            <Link href="/listings">
              <Button variant="outline">Посмотреть объявления</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
