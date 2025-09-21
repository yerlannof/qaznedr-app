'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Search,
  Plus,
  Pin,
  Circle,
  BellOff,
} from 'lucide-react';

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'support';
  title: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
  last_message_sender_id: string | null;
  participants: Array<{
    user_id: string;
    unread_count: number;
    is_pinned: boolean;
    is_muted: boolean;
    user: {
      id: string;
      name: string;
      avatar_url: string | null;
      email: string;
    };
  }>;
  deposit?: {
    id: string;
    title: string;
    mineral: string;
  };
}

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export function ConversationsList({
  onSelectConversation,
  selectedConversationId,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    getCurrentUser();
    loadConversations();
  }, []);

  useEffect(() => {
    // Subscribe to conversation updates
    const subscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadConversations = async () => {
    if (!currentUserId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        participants:conversation_participants(
          user_id,
          unread_count,
          is_pinned,
          is_muted,
          user:auth.users(
            id,
            raw_user_meta_data->name,
            raw_user_meta_data->avatar_url,
            email
          )
        ),
        deposit:kazakhstan_deposits(
          id,
          title,
          mineral
        )
      `
      )
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
    } else {
      setConversations(data || []);
    }

    setLoading(false);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.type !== 'direct') return null;
    return conversation.participants.find((p) => p.user_id !== currentUserId);
  };

  const getCurrentParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.user_id === currentUserId);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Вчера';
    } else if (days < 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;

    const otherParticipant = getOtherParticipant(conversation);
    if (otherParticipant) {
      return otherParticipant.user.name || otherParticipant.user.email;
    }

    return 'Чат';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar_url) return conversation.avatar_url;

    const otherParticipant = getOtherParticipant(conversation);
    return otherParticipant?.user.avatar_url || null;
  };

  const getAvatarInitial = (conversation: Conversation) => {
    const title = getConversationTitle(conversation);
    return title.charAt(0).toUpperCase();
  };

  const filteredConversations = conversations.filter((conv) => {
    const currentParticipant = getCurrentParticipant(conv);

    // Apply filter
    if (
      filter === 'unread' &&
      (!currentParticipant || currentParticipant.unread_count === 0)
    ) {
      return false;
    }
    if (
      filter === 'pinned' &&
      (!currentParticipant || !currentParticipant.is_pinned)
    ) {
      return false;
    }

    // Apply search
    if (searchQuery) {
      const title = getConversationTitle(conv).toLowerCase();
      const query = searchQuery.toLowerCase();
      if (!title.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Sort conversations: pinned first, then by last message
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aParticipant = getCurrentParticipant(a);
    const bParticipant = getCurrentParticipant(b);

    if (aParticipant?.is_pinned && !bParticipant?.is_pinned) return -1;
    if (!aParticipant?.is_pinned && bParticipant?.is_pinned) return 1;

    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;

    return bTime - aTime;
  });

  if (loading) {
    return (
      <Card className="h-full">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col" padding="none">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Сообщения</h2>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Новый чат
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по чатам..."
            className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Все
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Непрочитанные
          </Button>
          <Button
            variant={filter === 'pinned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pinned')}
            leftIcon={<Pin className="w-3 h-3" />}
          >
            Закрепленные
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Нет сообщений</p>
            <p className="text-sm text-gray-500 mt-1">
              Начните новый чат, чтобы общаться с другими пользователями
            </p>
          </div>
        ) : (
          sortedConversations.map((conversation) => {
            const currentParticipant = getCurrentParticipant(conversation);
            const unreadCount = currentParticipant?.unread_count || 0;
            const isPinned = currentParticipant?.is_pinned || false;
            const isMuted = currentParticipant?.is_muted || false;
            const isSelected = conversation.id === selectedConversationId;
            const avatar = getConversationAvatar(conversation);

            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="relative w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {avatar ? (
                        <Image
                          src={avatar}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {getAvatarInitial(conversation)}
                        </span>
                      )}
                    </div>
                    {/* Online indicator */}
                    {conversation.type === 'direct' && (
                      <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {getConversationTitle(conversation)}
                        </h3>
                        {isPinned && <Pin className="w-3 h-3 text-gray-400" />}
                        {isMuted && (
                          <BellOff className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>

                    {/* Last message */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message_text || 'Нет сообщений'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Deposit info */}
                    {conversation.deposit && (
                      <p className="text-xs text-gray-500 mt-1">
                        {conversation.deposit.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
