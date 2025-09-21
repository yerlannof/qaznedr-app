'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  Search,
  Check,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import Image from 'next/image';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  edited: boolean;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  participant?: {
    id: string;
    name: string;
    avatar?: string;
    online?: boolean;
  };
}

export default function MessagingSystemMobile() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const user = useUser();

  useEffect(() => {
    if (user?.id) {
      loadConversations();
      subscribeToMessages();
    }
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          messages(content, created_at),
          profiles!participant1_id(id, name, avatar),
          profiles!participant2_id(id, name, avatar)
        `
        )
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const formattedConversations =
        data?.map((conv) => ({
          ...conv,
          participant:
            conv.participant1_id === user.id
              ? conv.profiles_participant2_id
              : conv.profiles_participant1_id,
        })) || [];

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:profiles!sender_id(id, name, avatar)
        `
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user?.id) return;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: messageContent,
      });

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.new.conversation_id === selectedConversation?.id) {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
          // Update conversation list
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const MessageStatus = ({ message }: { message: Message }) => {
    if (message.sender_id !== user?.id) return null;

    if (!message.read) {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
    return <CheckCheck className="w-4 h-4 text-blue-600" />;
  };

  // Mobile view - show conversations or messages
  if (selectedConversation) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col safe-inset">
        {/* Mobile Message Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-top">
          <button
            onClick={() => setSelectedConversation(null)}
            className="touch-target -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              {selectedConversation.participant?.avatar ? (
                <Image
                  src={selectedConversation.participant.avatar}
                  alt={selectedConversation.participant.name || ''}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {selectedConversation.participant?.name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedConversation.participant?.name}
                </h3>
                {selectedConversation.participant?.online && (
                  <span className="text-xs text-green-600">Online</span>
                )}
              </div>
            </div>
          </div>

          <button className="touch-target">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="touch-target">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 mobile-scroll">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  message.sender_id === user?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <div
                  className={`flex items-center gap-1 mt-1 ${
                    message.sender_id === user?.id ? 'justify-end' : ''
                  }`}
                >
                  <span
                    className={`text-xs ${
                      message.sender_id === user?.id
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: false,
                      locale: ru,
                    })}
                  </span>
                  <MessageStatus message={message} />
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
              </div>
              <span className="text-sm">Typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Mobile Input Area */}
        <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              inputMode="text"
              autoComplete="off"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="touch-target p-3 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations List View
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 safe-inset">
      {/* Mobile Header */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-top">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Messages
        </h1>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            inputMode="search"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto mobile-scroll">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No conversations yet
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg touch-target">
              Start New Chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => {
                setSelectedConversation(conversation);
                loadMessages(conversation.id);
              }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-target"
            >
              {conversation.participant?.avatar ? (
                <Image
                  src={conversation.participant.avatar}
                  alt={conversation.participant.name || ''}
                  width={48}
                  height={48}
                  className="rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium">
                    {conversation.participant?.name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {conversation.participant?.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {conversation.last_message_at &&
                      formatDistanceToNow(
                        new Date(conversation.last_message_at),
                        { addSuffix: true, locale: ru }
                      )}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {conversation.last_message || 'No messages yet'}
                </p>
              </div>

              {conversation.unread_count && conversation.unread_count > 0 && (
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {conversation.unread_count}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
