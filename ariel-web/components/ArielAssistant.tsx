'use client';

import { useState } from 'react';
import { aiChatAPI } from '@/lib/api';

export default function ArielAssistant() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState([
    { text: "Hey! I'm Ariel—ask me to explain, quiz, or plan your next study sprint. 👋", isBot: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { icon: '🎴', label: 'Create cards', prompt: 'Generate 5 flashcards from this topic: ' },
    { icon: '📚', label: 'Study tips', prompt: 'Give me 3 quick study tips for my next exam.' },
    { icon: '🔥', label: 'Boost streak', prompt: 'Give me a 10-minute review plan to keep my streak alive.' },
    { icon: '❓', label: 'Help', prompt: 'What can you do for me right now?' },
  ];

  const sendToAI = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInputText('');
    setIsSending(true);
    setIsTyping(true);

    try {
      const response = await aiChatAPI.sendMessage(userMessage);
      const reply = response?.reply || "I'm here to help! Let's try that again.";
      setMessages(prev => [...prev, { text: reply, isBot: true }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "I'm having trouble reaching the server. Try again in a moment.", isBot: true }]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendToAI(prompt);
  };

  const handleSend = async () => {
    await sendToAI(inputText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="group relative"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse"></div>

          {/* Main button */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-all cursor-pointer animate-float">
            <span className="text-3xl">✨</span>
          </div>

          {/* Notification badge */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">AI</span>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat with Ariel
          </div>
        </button>
      ) : (
        <div className="glass-card rounded-3xl w-96 shadow-2xl animate-scaleIn overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Ariel AI</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <p className="text-xs text-white/90">Always here to help</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-white/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.isBot
                    ? 'bg-white shadow-sm'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                }`}>
                  <p className={`text-sm ${msg.isBot ? 'text-gray-800' : 'text-white'}`}>
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-white/50 border-t border-gray-200/50">
            <p className="text-xs text-gray-600 font-semibold mb-2">Quick actions:</p>
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/80 transition-all group"
                  >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-xs text-gray-600 font-semibold">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Ariel to explain, quiz, or plan."
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-600 focus:outline-none text-sm"
                disabled={isSending}
              />
              <button
                onClick={handleSend}
                disabled={isSending}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
