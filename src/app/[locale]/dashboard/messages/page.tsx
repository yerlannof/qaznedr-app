'use client';

import { useState } from 'react';
import Navigation from '@/components/layouts/Navigation';
import MessagingSystem from '@/components/features/MessagingSystem';
import Footer from '@/components/layouts/Footer';
import { MessageSquare, Users, TrendingUp, Clock, X, User } from 'lucide-react';

interface MessageStats {
  totalConversations: number;
  unreadMessages: number;
  todayMessages: number;
  activeConversations: number;
}

export default function MessagesPage() {
  const [showMessaging, setShowMessaging] = useState(false);

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
    },
    {
      title: 'Непрочитанные',
      value: stats.unreadMessages,
      icon: Users,
    },
    {
      title: 'Сегодня',
      value: stats.todayMessages,
      icon: TrendingUp,
    },
    {
      title: 'Активные',
      value: stats.activeConversations,
      icon: Clock,
    },
  ];

  const conversations = [
    {
      id: '1',
      title: 'Месторождение Кашаган',
      lastMessage: 'Здравствуйте, интересует ваше объявление...',
      time: '2 мин назад',
      unread: true,
    },
    {
      id: '2',
      title: 'Лицензия на золото в Карагандинской области',
      lastMessage: 'Спасибо за информацию, рассмотрим ваше предложение',
      time: '1 час назад',
      unread: false,
    },
    {
      id: '3',
      title: 'Медное месторождение',
      lastMessage: 'Когда можно провести осмотр участка?',
      time: '3 часа назад',
      unread: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />

      <div className="pt-20">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              Сообщения
            </h1>
            <button
              onClick={() => setShowMessaging(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A84FF] text-white rounded-lg font-medium hover:bg-[#0070E0] transition-colors text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Открыть чат
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      {stat.title}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Conversations */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Последние диалоги
            </h2>

            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    conversation.unread
                      ? 'border-l-2 border-[#0A84FF] pl-3'
                      : ''
                  }`}
                  onClick={() => setShowMessaging(true)}
                >
                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`text-sm truncate ${
                          conversation.unread
                            ? 'font-semibold text-gray-900 dark:text-gray-50'
                            : 'font-medium text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {conversation.title}
                      </h3>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {conversation.time}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate ${
                        conversation.unread
                          ? 'text-gray-700 dark:text-gray-300 font-medium'
                          : 'text-gray-400'
                      }`}
                    >
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unread && (
                    <div className="w-2 h-2 bg-[#0A84FF] rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <button
                onClick={() => setShowMessaging(true)}
                className="text-xs text-[#0A84FF] hover:underline font-medium"
              >
                Показать все диалоги
              </button>
            </div>
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
          <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-[#141414] shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                Сообщения
              </h2>
              <button
                onClick={() => setShowMessaging(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
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
