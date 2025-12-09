'use client';

import { useState, useEffect, useRef } from 'react';
import { messagesAPI } from '@/lib/api';
import Link from 'next/link';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_username?: string;
  other_user_full_name?: string;
  other_user_profile_picture?: string;
  other_user_is_verified: boolean;
  last_message_content?: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  unread_count: number;
  is_archived: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: string;
  content: string;
  is_sent_by_current_user: boolean;
  sender_username?: string;
  sender_full_name?: string;
  sender_profile_picture?: string;
  created_at: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await messagesAPI.getConversations();
      setConversations(data);

      // Auto-select first conversation
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await messagesAPI.getMessages(conversationId);
      // Reverse to show oldest first
      setMessages(data.reverse());

      // Mark conversation as read
      setConversations(conversations.map(c =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setIsSending(true);
      const sentMessage = await messagesAPI.sendMessage(selectedConversation.id, newMessage);
      setMessages([...messages, sentMessage]);
      setNewMessage('');

      // Update conversation's last message
      setConversations(conversations.map(c =>
        c.id === selectedConversation.id
          ? { ...c, last_message_content: newMessage, last_message_at: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-600 font-medium">No conversations yet</p>
              <p className="text-sm text-gray-500 mt-1">Find users to start chatting!</p>
            </div>
          )}

          {!isLoading && conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 ${
                selectedConversation?.id === conversation.id
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {conversation.other_user_profile_picture ? (
                    <img
                      src={conversation.other_user_profile_picture}
                      alt={conversation.other_user_username || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (conversation.other_user_username?.[0] || conversation.other_user_full_name?.[0] || 'U').toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {conversation.other_user_full_name || conversation.other_user_username || 'User'}
                      </p>
                      {conversation.other_user_is_verified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {conversation.last_message_at && (
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${
                      conversation.unread_count > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                    }`}>
                      {conversation.last_message_content || 'No messages yet'}
                    </p>
                    {conversation.unread_count > 0 && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                        <span className="text-xs font-bold text-white">{conversation.unread_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${selectedConversation.other_user_id}`} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {selectedConversation.other_user_profile_picture ? (
                    <img
                      src={selectedConversation.other_user_profile_picture}
                      alt={selectedConversation.other_user_username || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (selectedConversation.other_user_username?.[0] || selectedConversation.other_user_full_name?.[0] || 'U').toUpperCase()
                  )}
                </div>
              </Link>
              <div>
                <Link href={`/profile/${selectedConversation.other_user_id}`} className="font-semibold text-gray-900 hover:underline">
                  {selectedConversation.other_user_full_name || selectedConversation.other_user_username || 'User'}
                </Link>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_sent_by_current_user ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-md ${message.is_sent_by_current_user ? 'order-2' : ''}`}>
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.is_sent_by_current_user
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${message.is_sent_by_current_user ? 'text-right' : ''}`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h3>
            <p className="text-gray-600">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
