'use client';

import { useState, useEffect } from 'react';
import { messagesAPI } from '@/lib/api';

interface ShareTarget {
  type: 'card' | 'reel';
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
}

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_username?: string;
  other_user_full_name?: string;
  other_user_profile_picture?: string;
  last_message_content?: string;
}

interface ShareSheetProps {
  target: ShareTarget;
  onClose: () => void;
}

function Avatar({ name, src }: { name?: string; src?: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <img
        src={src.replace(/^https?:\/\/[^/]+/, '')}
        alt={name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function ShareSheet({ target, onClose }: ShareSheetProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    messagesAPI.getConversations()
      .then(data => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (convo: Conversation) => {
    if (sending || sent.has(convo.id)) return;
    setSending(convo.id);

    try {
      const caption = target.type === 'card'
        ? `Check out this card: "${target.title}"`
        : `Check out this video: "${target.title}"`;

      await messagesAPI.sendMessage(
        convo.id,
        caption,
        target.type === 'card' ? 'card_share' : 'reel_share',
        undefined,
        target.type === 'card' ? target.id : undefined,
        undefined,
        target.type === 'reel' ? target.id : undefined,
      );
      setSent(prev => new Set([...prev, convo.id]));
    } catch {}

    setSending(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[399] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — sits above the bottom nav on mobile (nav is ~56px + safe area) */}
      <div className="fixed bottom-0 left-0 right-0 z-[400] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-zinc-900">Share via Message</h2>
        </div>

        {/* Preview card */}
        <div className="mx-4 mt-3 mb-2 p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3 flex-shrink-0">
          {target.thumbnail ? (
            <img
              src={target.thumbnail.replace(/^https?:\/\/[^/]+/, '')}
              alt={target.title}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              {target.type === 'card' ? (
                <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 truncate">{target.title}</p>
            {target.subtitle && (
              <p className="text-xs text-zinc-500 truncate mt-0.5">{target.subtitle}</p>
            )}
            <span className="inline-block mt-1 text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              {target.type === 'card' ? 'Flash Card' : 'Video'}
            </span>
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6" style={{ paddingBottom: 'max(1.5rem, calc(80px + env(safe-area-inset-bottom, 0px)))' }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-400">
              No conversations yet. Start chatting first.
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map(convo => {
                const name = convo.other_user_full_name || convo.other_user_username || 'Unknown';
                const isSent = sent.has(convo.id);
                const isSending = sending === convo.id;

                return (
                  <button
                    key={convo.id}
                    onClick={() => handleSend(convo)}
                    disabled={isSent || isSending}
                    className="w-full flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60"
                  >
                    <Avatar name={name} src={convo.other_user_profile_picture} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{name}</p>
                      {convo.other_user_username && (
                        <p className="text-xs text-zinc-400 truncate">@{convo.other_user_username}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isSent ? (
                        <span className="text-xs font-semibold text-emerald-600">Sent</span>
                      ) : isSending ? (
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin" />
                      ) : (
                        <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">
                          Send
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
