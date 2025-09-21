'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import { wsNotificationService } from '@/lib/notifications/websocket-service';
import {
  Send,
  Paperclip,
  MoreVertical,
  Search,
  Phone,
  Video,
  Info,
  Archive,
  Trash2,
  Check,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: string[];
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
  replyTo?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  listingId?: string;
  listingTitle?: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: string;
  };
}

export default function MessagingSystem() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const user = useUser();
  const supabase = createClient();

  // Load conversations
  useEffect(() => {
    if (!user?.id) return;
    loadConversations();
    setupRealtimeSubscription();
  }, [user?.id]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch conversations
      const { data: convos } = await supabase
        .from('conversations')
        .select(
          `
          *,
          messages (
            id,
            content,
            sender_id,
            created_at,
            read_at
          ),
          profiles!conversations_participants (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .or(`participant1.eq.${user.id},participant2.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (convos) {
        const formattedConversations: Conversation[] = await Promise.all(
          convos.map(async (convo) => {
            const otherUserId =
              convo.participant1 === user.id
                ? convo.participant2
                : convo.participant1;
            const { data: otherUserProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', otherUserId)
              .single();

            // Get unread count
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .eq('conversation_id', convo.id)
              .eq('receiver_id', user.id)
              .is('read_at', null);

            // Get last message
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', convo.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              id: convo.id,
              participants: [convo.participant1, convo.participant2],
              lastMessage: lastMsg,
              unreadCount: unreadCount || 0,
              listingId: convo.listing_id,
              listingTitle: convo.listing_title,
              otherUser: {
                id: otherUserId,
                name: otherUserProfile?.full_name || 'Unknown User',
                avatar: otherUserProfile?.avatar_url,
                isOnline: false, // Will be updated via WebSocket
                lastSeen: otherUserProfile?.last_seen,
              },
            };
          })
        );

        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgs) {
        setMessages(
          msgs.map((msg) => ({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            attachments: msg.attachments,
            readAt: msg.read_at,
            createdAt: msg.created_at,
            updatedAt: msg.updated_at,
            replyTo: msg.reply_to,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user?.id) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: user.id,
      receiverId: selectedConversation.otherUser.id,
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add message
    setMessages((prev) => [...prev, newMessage]);
    setMessageText('');

    try {
      // Save to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          receiver_id: selectedConversation.otherUser.id,
          content: messageText,
        })
        .select()
        .single();

      if (error) throw error;

      // Update with real ID
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...data, id: data.id } : msg))
      );

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message_id: data.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);

      // Send WebSocket notification
      wsNotificationService.sendNotification(
        selectedConversation.otherUser.id,
        {
          type: 'NEW_MESSAGE' as any,
          title: `New message from ${user.user_metadata?.full_name || 'User'}`,
          message: messageText.substring(0, 100),
          data: {
            conversationId: selectedConversation.id,
            messageId: data.id,
          },
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .is('read_at', null);

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiverId === user.id && !msg.readAt
            ? { ...msg, readAt: new Date().toISOString() }
            : msg
        )
      );

      // Update conversation unread count
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleTyping = () => {
    if (!selectedConversation || !user?.id) return;

    // Send typing indicator
    wsNotificationService.sendTypingIndicator(
      selectedConversation.otherUser.id,
      true
    );

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      wsNotificationService.sendTypingIndicator(
        selectedConversation.otherUser.id,
        false
      );
    }, 2000);
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // Add to messages if in current conversation
          if (selectedConversation?.id === newMessage.conversationId) {
            setMessages((prev) => [...prev, newMessage]);
          }

          // Update conversation list
          loadConversations();
        }
      )
      .subscribe();

    // WebSocket typing indicators
    wsNotificationService.on('onNotification', (notification) => {
      if (notification.type === ('USER_TYPING' as any)) {
        setOtherUserTyping(notification.data?.isTyping || false);
        if (notification.data?.isTyping) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    });

    return () => {
      messageSubscription.unsubscribe();
    };
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await supabase.from('conversations').delete().eq('id', conversationId);

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border">
      {/* Conversations List */}
      <div className="w-1/3 border-r">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="overflow-y-auto h-full">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {conv.otherUser.avatar ? (
                        <img
                          src={conv.otherUser.avatar}
                          alt={conv.otherUser.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 text-sm">
                          {conv.otherUser.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {conv.otherUser.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-900 truncate">
                        {conv.otherUser.name}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(conv.lastMessage.createdAt),
                            { addSuffix: true }
                          )}
                        </span>
                      )}
                    </div>
                    {conv.listingTitle && (
                      <p className="text-xs text-blue-600 mt-1">
                        Re: {conv.listingTitle}
                      </p>
                    )}
                    {conv.lastMessage && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conv.lastMessage.senderId === user?.id && 'You: '}
                        {conv.lastMessage.content}
                      </p>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white mt-1">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {selectedConversation.otherUser.avatar ? (
                    <img
                      src={selectedConversation.otherUser.avatar}
                      alt={selectedConversation.otherUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600">
                      {selectedConversation.otherUser.name
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">
                    {selectedConversation.otherUser.name}
                  </p>
                  {otherUserTyping ? (
                    <p className="text-sm text-green-600">Typing...</p>
                  ) : selectedConversation.otherUser.isOnline ? (
                    <p className="text-sm text-green-600">Online</p>
                  ) : selectedConversation.otherUser.lastSeen ? (
                    <p className="text-sm text-gray-500">
                      Last seen{' '}
                      {formatDistanceToNow(
                        new Date(selectedConversation.otherUser.lastSeen),
                        { addSuffix: true }
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Info className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => deleteConversation(selectedConversation.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Trash2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div
                      className={`flex items-center justify-end mt-1 space-x-1 ${
                        message.senderId === user?.id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      <span className="text-xs">
                        {new Date(message.createdAt).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                      {message.senderId === user?.id &&
                        (message.readAt ? (
                          <CheckCheck className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        ))}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
