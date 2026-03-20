'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Eye,
  Users,
  Clock,
  TrendingUp,
  Shield,
  CheckCircle,
  Star,
  MessageCircle,
  Heart,
} from 'lucide-react';

// Mock data for real-time activity
const ACTIVITY_MESSAGES = [
  'Иван К. только что просмотрел это месторождение',
  'Арман Б. добавил в избранное месторождение золота',
  'ТОО "КазМинерал" проявил интерес к этому объекту',
  'Сауле М. сравнивает цены на нефтяные участки',
  'Данияр К. запросил дополнительную информацию',
  'ТОО "Недра Плюс" изучает документы по лицензии',
  'Айгуль С. связалась с продавцом',
  'Марат Т. добавил месторождение в сравнение',
];

interface SocialProofProps {
  className?: string;
  depositId?: string;
  viewCount?: number;
  interestedCount?: number;
}

// Real-time Activity Indicator
export function LiveActivityIndicator({
  className = '',
}: {
  className?: string;
}) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % ACTIVITY_MESSAGES.length);
        setIsVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className={`fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm z-50 ${className}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium">
                {ACTIVITY_MESSAGES[currentMessage]}
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                только что
              </p>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Viewing Count Component
export function ViewingNowIndicator({
  depositId,
  className = '',
}: {
  depositId?: string;
  className?: string;
}) {
  const [viewingCount, setViewingCount] = useState(0);

  useEffect(() => {
    // Simulate real-time viewing count
    const baseCount = Math.floor(Math.random() * 15) + 3; // 3-18 people
    setViewingCount(baseCount);

    const interval = setInterval(() => {
      const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      setViewingCount((prev) => Math.max(1, prev + change));
    }, 8000);

    return () => clearInterval(interval);
  }, [depositId]);

  if (viewingCount === 0) return null;

  return (
    <div
      className={`inline-flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium ${className}`}
    >
      <Eye className="w-3 h-3" />
      <span>{viewingCount} человек смотрят сейчас</span>
    </div>
  );
}

// Interest Level Indicator
export function InterestLevelIndicator({
  interestedCount = 0,
  className = '',
}: {
  interestedCount?: number;
  className?: string;
}) {
  const getInterestLevel = (count: number) => {
    if (count >= 50)
      return { level: 'Очень высокий', color: 'red', icon: '🔥' };
    if (count >= 20) return { level: 'Высокий', color: 'orange', icon: '📈' };
    if (count >= 10) return { level: 'Умеренный', color: 'yellow', icon: '👀' };
    return { level: 'Низкий', color: 'gray', icon: '👁️' };
  };

  const interest = getInterestLevel(interestedCount);

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${className}`}
      style={{
        backgroundColor: `${
          interest.color === 'red'
            ? '#fee2e2'
            : interest.color === 'orange'
              ? '#fed7aa'
              : interest.color === 'yellow'
                ? '#fef3c7'
                : '#f3f4f6'
        }`,
        borderColor: `${
          interest.color === 'red'
            ? '#fecaca'
            : interest.color === 'orange'
              ? '#fdba74'
              : interest.color === 'yellow'
                ? '#fde68a'
                : '#e5e7eb'
        }`,
      }}
    >
      <span className="text-lg">{interest.icon}</span>
      <div className="text-sm">
        <div className="font-medium text-gray-800">
          Интерес: {interest.level}
        </div>
        <div className="text-gray-600">
          {interestedCount} человек заинтересованы
        </div>
      </div>
    </div>
  );
}

// Trust Badge Component
export function TrustBadge({
  type,
  verified = false,
  rating,
  className = '',
}: {
  type: 'seller' | 'listing' | 'company';
  verified?: boolean;
  rating?: number;
  className?: string;
}) {
  const getBadgeInfo = () => {
    switch (type) {
      case 'seller':
        return {
          icon: Shield,
          title: verified ? 'Проверенный продавец' : 'Новый продавец',
          color: verified ? 'green' : 'gray',
          description: verified
            ? 'Документы подтверждены'
            : 'Проходит проверку',
        };
      case 'listing':
        return {
          icon: CheckCircle,
          title: verified ? 'Проверенное объявление' : 'На проверке',
          color: verified ? 'blue' : 'yellow',
          description: verified
            ? 'Лицензия подтверждена'
            : 'Документы на проверке',
        };
      case 'company':
        return {
          icon: Star,
          title: 'Рейтинг компании',
          color: 'gold',
          description: rating ? `${rating.toFixed(1)} из 5.0` : 'Нет рейтинга',
        };
      default:
        return {
          icon: Shield,
          title: 'Статус не определен',
          color: 'gray',
          description: '',
        };
    }
  };

  const badge = getBadgeInfo();
  const Icon = badge.icon;

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border bg-white shadow-sm ${className}`}
    >
      <Icon
        className={`w-4 h-4 ${
          badge.color === 'green'
            ? 'text-green-600'
            : badge.color === 'blue'
              ? 'text-blue-600'
              : badge.color === 'gold'
                ? 'text-yellow-500'
                : badge.color === 'yellow'
                  ? 'text-yellow-600'
                  : 'text-gray-500'
        }`}
      />
      <div className="text-sm">
        <div className="font-medium text-gray-800">{badge.title}</div>
        {badge.description && (
          <div className="text-gray-600 text-xs">{badge.description}</div>
        )}
      </div>
      {rating && type === 'company' && (
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < Math.floor(rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Recent Activity Feed
export function RecentActivityFeed({
  depositId,
  className = '',
}: {
  depositId?: string;
  className?: string;
}) {
  const [activities] = useState([
    {
      id: 1,
      type: 'view',
      user: 'Анонимный пользователь',
      action: 'просмотрел объявление',
      time: '2 минуты назад',
      icon: Eye,
    },
    {
      id: 2,
      type: 'interest',
      user: 'ТОО "НедраИнвест"',
      action: 'проявил интерес',
      time: '15 минут назад',
      icon: Heart,
    },
    {
      id: 3,
      type: 'message',
      user: 'Марат К.',
      action: 'отправил сообщение',
      time: '1 час назад',
      icon: MessageCircle,
    },
    {
      id: 4,
      type: 'comparison',
      user: 'Айгуль С.',
      action: 'добавил в сравнение',
      time: '2 часа назад',
      icon: TrendingUp,
    },
  ]);

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
    >
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
        <Users className="w-4 h-4" />
        <span>Недавняя активность</span>
      </h4>

      <div className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-center space-x-3 text-sm"
            >
              <div className="flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">
                  {activity.user}
                </span>
                <span className="text-gray-600 ml-1">{activity.action}</span>
              </div>
              <div className="text-gray-500 text-xs">{activity.time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Social Proof Container
export default function SocialProof({
  depositId,
  viewCount = 0,
  interestedCount = 0,
  className = '',
}: SocialProofProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <ViewingNowIndicator depositId={depositId} />
        <TrustBadge type="listing" verified={true} />
        <TrustBadge type="seller" verified={true} />
        <TrustBadge type="company" rating={4.2} />
      </div>

      <InterestLevelIndicator interestedCount={interestedCount} />

      <RecentActivityFeed depositId={depositId} />
    </div>
  );
}
