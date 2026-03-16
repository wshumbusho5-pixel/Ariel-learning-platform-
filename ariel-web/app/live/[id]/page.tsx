'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

interface StreamComment {
  id: string;
  user_id: string;
  username: string;
  profile_picture?: string;
  message: string;
  timestamp: string;
}

interface StreamInfo {
  id: string;
  streamer_username: string;
  streamer_profile_picture?: string;
  streamer_verified: boolean;
  title: string;
  description?: string;
  category: string;
  subject?: string;
  status: string;
  playback_url?: string;
  viewers_count: number;
  likes_count: number;
  is_liked_by_current_user: boolean;
  is_following_streamer: boolean;
}

export default function LiveStreamPage() {
  const router = useRouter();
  const params = useParams();
  const streamId = params.id as string;

  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [comments, setComments] = useState<StreamComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStream();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [streamId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const loadStream = async () => {
    try {
      const response = await api.get(`/api/livestream/${streamId}`);
      setStream(response.data);
    } catch (error) {
      console.error('Failed to load stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/api/livestream/${streamId}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'comment') {
        setComments(prev => [...prev, data as StreamComment]);
      } else if (data.type === 'viewer_count') {
        setStream(prev => prev ? { ...prev, viewers_count: data.count } : null);
      } else if (data.type === 'reaction') {
        // Handle reactions (visual effects)
        showReaction(data.reaction_type);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  };

  const showReaction = (type: string) => {
    // Create floating emoji animation
    const emoji = document.createElement('div');
    emoji.className = 'reaction-emoji';
    emoji.textContent = type === 'like' ? '❤️' : type === 'fire' ? '🔥' : '👏';
    emoji.style.cssText = `
      position: fixed;
      bottom: ${Math.random() * 30 + 10}%;
      right: ${Math.random() * 20 + 5}%;
      font-size: 32px;
      animation: floatUp 2s ease-out forwards;
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(emoji);
    setTimeout(() => emoji.remove(), 2000);
  };

  const handleSendComment = () => {
    if (!newComment.trim() || !wsRef.current) return;

    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    wsRef.current.send(JSON.stringify({
      type: 'comment',
      user_id: userData.id,
      username: userData.username,
      profile_picture: userData.profile_picture,
      message: newComment,
    }));

    setNewComment('');
  };

  const handleReaction = (type: string) => {
    if (!wsRef.current) return;

    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    wsRef.current.send(JSON.stringify({
      type: 'reaction',
      user_id: userData.id,
      reaction_type: type,
    }));

    showReaction(type);
  };

  const handleLike = async () => {
    try {
      await api.post(`/api/livestream/${streamId}/like`);

      setStream(prev => prev ? {
        ...prev,
        is_liked_by_current_user: !prev.is_liked_by_current_user,
        likes_count: prev.is_liked_by_current_user ? prev.likes_count - 1 : prev.likes_count + 1
      } : null);
    } catch (error) {
      console.error('Failed to like stream:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-white font-medium">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="fixed inset-0 bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Stream not found</h2>
          <button
            onClick={() => router.push('/live')}
            className="px-6 py-2 bg-white text-black rounded-lg font-semibold"
          >
            Back to Streams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col">
      {/* Video Player */}
      <div className="flex-1 relative bg-gray-900">
        {stream.status === 'live' && stream.playback_url ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-lg">Stream is live!</p>
              <p className="text-sm text-gray-400 mt-2">Playback URL: {stream.playback_url}</p>
              <p className="text-xs text-gray-500 mt-4">
                (Video player integration required)
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-6xl mb-4">📡</div>
              <p className="text-lg">Stream Offline</p>
              <p className="text-sm text-gray-400 mt-2">This stream has ended or hasn't started yet</p>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/live')}
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {stream.status === 'live' && (
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
              <div className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold rounded flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                {stream.viewers_count}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stream Info & Chat */}
      <div className="h-2/5 bg-white flex flex-col">
        {/* Stream Info */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="font-bold text-gray-900 text-lg mb-2">{stream.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center">
                {stream.streamer_profile_picture ? (
                  <img
                    src={stream.streamer_profile_picture}
                    alt={stream.streamer_username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-xs">
                    {stream.streamer_username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-semibold text-sm text-gray-900">
                {stream.streamer_username}
                {stream.streamer_verified && ' ✓'}
              </span>
            </div>

            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                stream.is_liked_by_current_user
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className={`w-4 h-4 ${stream.is_liked_by_current_user ? 'fill-current' : 'fill-none'}`} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs font-semibold">{stream.likes_count}</span>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {comments.map((comment, index) => (
            <div key={index} className="flex gap-2">
              <span className="font-semibold text-sm text-gray-900">{comment.username}:</span>
              <span className="text-sm text-gray-700">{comment.message}</span>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Chat Input & Reactions */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => handleReaction('like')}
              className="px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-lg"
            >
              ❤️
            </button>
            <button
              onClick={() => handleReaction('fire')}
              className="px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-lg"
            >
              🔥
            </button>
            <button
              onClick={() => handleReaction('clap')}
              className="px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-lg"
            >
              👏
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="Say something..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
            <button
              onClick={handleSendComment}
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
