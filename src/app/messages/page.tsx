'use client';

import { useState } from 'react';
import Navigation from '@/components/layouts/Navigation';
import { ConversationsList } from '@/components/features/messaging/ConversationsList';
import { ChatWindow } from '@/components/features/messaging/ChatWindow';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileView(true); // On mobile, show chat window
  };

  const handleCloseChat = () => {
    setIsMobileView(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-16">
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div
              className={`md:col-span-1 border-r border-gray-200 ${
                isMobileView ? 'hidden md:block' : 'block'
              }`}
            >
              <ConversationsList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId || undefined}
              />
            </div>

            {/* Chat Window */}
            <div
              className={`md:col-span-2 ${
                isMobileView ? 'block' : 'hidden md:block'
              }`}
            >
              {selectedConversationId ? (
                <ChatWindow
                  conversationId={selectedConversationId}
                  onClose={handleCloseChat}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Выберите чат
                    </h3>
                    <p className="text-gray-600">
                      Выберите существующий чат или начните новый разговор
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
