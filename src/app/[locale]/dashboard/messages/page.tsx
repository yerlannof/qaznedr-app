'use client';

import { useState } from 'react';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import MessagingSystem from '@/components/features/MessagingSystem';
import Footer from '@/components/layouts/Footer';
import { MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface MessageStats {
  totalConversations: number;
  unreadMessages: number;
  todayMessages: number;
  activeConversations: number;
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const [showMessaging, setShowMessaging] = useState(false);

  // Mock stats - в реальном приложении данные будут из API
  const stats: MessageStats = {
    totalConversations: 12,
    unreadMessages: 3,
    todayMessages: 8,
    activeConversations: 5,
  };

  const statCards = [
    {
      title: 'Всего диалогов',
      value: stats.totalConversations,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Непрочитанные',
      value: stats.unreadMessages,
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Сегодня сообщений',
      value: stats.todayMessages,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Активные диалоги',
      value: stats.activeConversations,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSimple />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Сообщения</h1>
              <p className="text-gray-600 mt-2">
                Управляйте всеми вашими диалогами с покупателями и продавцами
              </p>
            </div>
            <button
              onClick={() => setShowMessaging(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 hover:shadow-md transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Открыть чат
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Последние диалоги
          </h2>

          <div className="space-y-4">
            {/* Mock conversation previews */}
            {[
              {
                id: '1',
                title: 'Месторождение Кашаган',
                lastMessage: 'Здравствуйте, интересует ваше объявление...',
                time: '2 мин назад',
                unread: true,
                avatar: '👤',
              },
              {
                id: '2',
                title: 'Лицензия на золото в Карагандинской области',
                lastMessage:
                  'Спасибо за информацию, рассмотрим ваше предложение',
                time: '1 час назад',
                unread: false,
                avatar: '👨‍💼',
              },
              {
                id: '3',
                title: 'Медное месторождение',
                lastMessage: 'Когда можно провести осмотр участка?',
                time: '3 часа назад',
                unread: true,
                avatar: '👩‍💼',
              },
            ].map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  conversation.unread
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : ''
                }`}
                onClick={() => setShowMessaging(true)}
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                  {conversation.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-medium truncate ${
                        conversation.unread ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {conversation.title}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {conversation.time}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-1 truncate ${
                      conversation.unread
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread && (
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowMessaging(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Показать все диалоги
            </button>
          </div>
        </div>
      </div>

      {/* MessagingSystem Modal */}
      {showMessaging && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMessaging(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Сообщения</h2>
              <button
                onClick={() => setShowMessaging(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <MessagingSystem />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
