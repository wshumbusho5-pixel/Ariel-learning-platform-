'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import api from '@/lib/api';
import SideNav from '@/components/SideNav';

interface StudyRoom {
  id: string;
  host_id: string;
  host_name: string;
  title: string;
  description?: string;
  subject?: string;
  participants: string[];
  max_participants: number;
  status: string;
  created_at: string;
}

export default function StudyRoomsPage() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: '',
    description: '',
    subject: '',
    max_participants: 10,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/study-rooms/active');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    try {
      await api.post('/api/study-rooms/create', newRoom);
      setShowCreateModal(false);
      setNewRoom({ title: '', description: '', subject: '', max_participants: 10 });
      loadRooms();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      await api.post(`/api/study-rooms/${roomId}/join`);
      loadRooms();
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const leaveRoom = async (roomId: string) => {
    try {
      await api.post(`/api/study-rooms/${roomId}/leave`);
      loadRooms();
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'just started';
    if (minutes < 60) return `started ${minutes}m ago`;
    return `started ${hours}h ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen lg:pl-[72px] bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-violet-300 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-[#09090b] pb-24 lg:pl-[72px]">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between ">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-400 flex items-center justify-center">
                <span className="text-3xl">🏠</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Study Rooms
                </h1>
                <p className="text-sm text-zinc-500 font-semibold">Study together, learn faster</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-violet-400 hover:bg-violet-300 text-white rounded-lg font-semibold transition-colors"
            >
              + Create Room
            </button>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {rooms.length === 0 ? (
          <div className="text-center py-20 ">
            <div className="w-32 h-32 rounded-3xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-6xl">🏠</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No active study rooms</h3>
            <p className="text-zinc-500 mb-8">Create one to start studying with others!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-violet-400 hover:bg-violet-300 text-white rounded-lg font-semibold transition-colors"
            >
              Create Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                className="border border-zinc-800 bg-zinc-900 rounded-xl p-6 hover:border-zinc-600 transition-colors "
                style={{animationDelay: `${idx * 0.1}s`}}
              >
                {/* Room Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-600 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {room.subject ? room.subject[0].toUpperCase() : '📖'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{room.title}</h3>
                      <p className="text-sm text-zinc-500">by {room.host_name}</p>
                    </div>
                  </div>
                  {room.status === 'active' && (
                    <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                      LIVE
                    </div>
                  )}
                </div>

                {/* Description */}
                {room.description && (
                  <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{room.description}</p>
                )}

                {/* Room Info */}
                <div className="flex items-center gap-4 mb-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{room.participants.length}/{room.max_participants}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>{formatTimestamp(room.created_at)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => joinRoom(room.id)}
                  className="w-full py-2.5 bg-violet-400 hover:bg-violet-300 text-white rounded-lg font-semibold transition-colors"
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-zinc-700">
            <h2 className="text-2xl font-bold text-white mb-6">Create Study Room</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Room Title</label>
                <input
                  type="text"
                  value={newRoom.title}
                  onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-700 bg-zinc-800 text-white focus:border-violet-300 focus:outline-none placeholder:text-zinc-600"
                  placeholder="e.g., Physics Study Session"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Subject</label>
                <input
                  type="text"
                  value={newRoom.subject}
                  onChange={(e) => setNewRoom({ ...newRoom, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-700 bg-zinc-800 text-white focus:border-violet-300 focus:outline-none placeholder:text-zinc-600"
                  placeholder="e.g., Physics"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Description</label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-700 bg-zinc-800 text-white focus:border-violet-300 focus:outline-none placeholder:text-zinc-600"
                  rows={3}
                  placeholder="What are you studying?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Max Participants</label>
                <input
                  type="number"
                  value={newRoom.max_participants}
                  onChange={(e) => setNewRoom({ ...newRoom, max_participants: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-700 bg-zinc-800 text-white focus:border-violet-300 focus:outline-none placeholder:text-zinc-600"
                  min="2"
                  max="50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-2xl font-bold hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createRoom}
                className="flex-1 py-2.5 bg-violet-400 hover:bg-violet-300 text-white rounded-lg font-semibold transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

    </div>
    </>
  );
}
