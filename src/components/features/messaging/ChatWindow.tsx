'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button-new';
import {
  Send,
  Paperclip,
  Image,
  MoreVertical,
  Phone,
  Video,
  Search,
  ChevronLeft,
  Check,
  CheckCheck,
  Edit2,
  Reply,
  Smile,
  Mic,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'offer';
  attachments: any[];
  created_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  sender?: {
    id: string;
    name: string;
    avatar_url: string | null;
    is_online?: boolean;
  };
  read_receipts?: Array<{
    user_id: string;
    read_at: string;
  }>;
  reply_to?: Message;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'support';
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
  participants: Array<{
    user_id: string;
    role: string;
    user: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  }>;
  deposit?: {
    id: string;
    title: string;
    mineral: string;
    price: number;
  };
  unread_count?: number;
}

interface ChatWindowProps {
  conversationId?: string;
  recipientId?: string;
  depositId?: string;
  onClose?: () => void;
}

export function ChatWindow({
  conversationId,
  recipientId,
  depositId,
  onClose,
}: ChatWindowProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
    if (conversationId) {
      loadConversation(conversationId);
    } else if (recipientId) {
      createOrGetConversation();
    }
  }, [conversationId, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          handleNewMessage(payload.new as Message);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        // Handle presence updates
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversation]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadConversation = async (id: string) => {
    setLoading(true);

    // Load conversation details
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select(
        `
        *,
        participants:conversation_participants(
          user_id,
          role,
          unread_count,
          user:auth.users(
            id,
            raw_user_meta_data->name,
            raw_user_meta_data->avatar_url
          )
        ),
        deposit:kazakhstan_deposits(
          id,
          title,
          mineral,
          price
        )
      `
      )
      .eq('id', id)
      .single();

    if (convError) {
      console.error('Error loading conversation:', convError);
      setLoading(false);
      return;
    }

    setConversation(conv);

    // Load messages
    const { data: msgs, error: msgError } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:auth.users(
          id,
          raw_user_meta_data->name,
          raw_user_meta_data->avatar_url
        ),
        reply_to:messages(
          id,
          content,
          sender:auth.users(
            id,
            raw_user_meta_data->name
          )
        )
      `
      )
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (!msgError && msgs) {
      setMessages(msgs);
      markMessagesAsRead(id);
    }

    setLoading(false);
  };

  const createOrGetConversation = async () => {
    if (!recipientId || !currentUserId) return;

    const { data, error } = await (supabase as any).rpc('create_direct_conversation', {
      p_user1_id: currentUserId,
      p_user2_id: recipientId,
      p_deposit_id: depositId,
    });

    if (!error && data) {
      loadConversation(data);
    }
  };

  const markMessagesAsRead = async (convId: string) => {
    if (!currentUserId) return;

    await (supabase as any).rpc('mark_messages_as_read', {
      p_conversation_id: convId,
      p_user_id: currentUserId,
    });
  };

  const handleNewMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    if (message.sender_id !== currentUserId) {
      markMessagesAsRead(message.conversation_id);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: messageContent,
        type: 'text',
        reply_to_id: replyTo?.id,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } else {
      setReplyTo(null);
    }

    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ru,
    });
  };

  const getOtherParticipant = () => {
    if (!conversation || conversation.type !== 'direct') return null;
    return conversation.participants.find((p) => p.user_id !== currentUserId)
      ?.user;
  };

  if (loading) {
    return (
      <Card className="flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Загрузка чата...</p>
        </div>
      </Card>
    );
  }

  const otherUser = getOtherParticipant();

  return (
    <Card className="flex flex-col h-full" padding="none">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            {otherUser?.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {otherUser?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {conversation?.title || otherUser?.name || 'Чат'}
            </h3>
            {conversation?.deposit && (
              <p className="text-sm text-gray-500">
                {conversation.deposit.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                {/* Reply Preview */}
                {message.reply_to && (
                  <div className="mb-1 px-3 py-2 bg-gray-100 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500">
                      {message.reply_to.sender?.name}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {message.reply_to.content}
                    </p>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </span>

                    {isOwn && (
                      <span className="text-blue-100">
                        {message.read_receipts &&
                        message.read_receipts.length > 0 ? (
                          <CheckCheck className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Ответ на сообщение</p>
                <p className="text-sm text-gray-700 line-clamp-1">
                  {replyTo.content}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReplyTo(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <Image className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              disabled={sending}
            />
          </div>

          <Button variant="ghost" size="icon">
            <Smile className="w-5 h-5" />
          </Button>

          {newMessage.trim() ? (
            <Button
              onClick={sendMessage}
              disabled={sending}
              leftIcon={<Send className="w-5 h-5" />}
            >
              Отправить
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRecording(!isRecording)}
              className={isRecording ? 'text-red-600' : ''}
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
