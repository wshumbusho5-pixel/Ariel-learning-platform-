'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

interface StreamInfo {
  id: string;
  title: string;
  status: string;
  viewers_count: number;
}

export default function BroadcastPage() {
  const router = useRouter();
  const params = useParams();
  const streamId = params.id as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [camError, setCamError] = useState('');
  const [ending, setEnding] = useState(false);
  const [comments, setComments] = useState<{ username: string; message: string }[]>([]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const startCamera = useCallback(async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
    } catch {
      setCamError('Camera or microphone access denied. Please allow permissions and try again.');
    }
  }, []);

  useEffect(() => {
    // Load stream info
    api.get(`/api/livestream/${streamId}`)
      .then(r => { setStream(r.data); setViewers(r.data.viewers_count || 0); })
      .catch(() => {});

    startCamera();

    // WebSocket for viewer count and comments
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    try {
      const ws = new WebSocket(`${wsUrl}/api/livestream/${streamId}/ws`);
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'viewer_count') setViewers(data.count);
        if (data.type === 'comment') setComments(prev => [...prev.slice(-50), { username: data.username, message: data.message }]);
      };
      wsRef.current = ws;
    } catch {}

    // Elapsed timer
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      wsRef.current?.close();
      clearInterval(timerRef.current!);
    };
  }, [streamId, startCamera]);

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(v => !v);
  };

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(v => !v);
  };

  const handleEnd = async () => {
    if (!confirm('End stream for all viewers?')) return;
    setEnding(true);
    try {
      await api.post(`/api/livestream/${streamId}/end`);
    } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
    clearInterval(timerRef.current!);
    router.push('/live');
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">

      {/* Camera feed */}
      <div className="flex-1 relative overflow-hidden">
        {camError ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950">
            <div className="text-center px-6">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{camError}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!camOn ? 'invisible' : ''}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            {!camOn && (
              <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {(stream?.title?.[0] || 'L').toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4">
          {/* LIVE badge + timer */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-red-600 rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
            <div className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-md">
              <span className="text-white text-xs font-mono font-semibold">{formatTime(elapsed)}</span>
            </div>
          </div>

          {/* Viewers */}
          <div className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-md flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-zinc-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <span className="text-white text-xs font-semibold">{viewers}</span>
          </div>
        </div>

        {/* Title */}
        {stream?.title && (
          <div className="absolute bottom-4 left-4 right-20">
            <p className="text-white text-sm font-semibold drop-shadow line-clamp-1">{stream.title}</p>
          </div>
        )}

        {/* Comments overlay */}
        <div className="absolute bottom-12 left-4 right-4 space-y-1 pointer-events-none">
          {comments.slice(-4).map((c, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold text-sky-300">{c.username}</span>
              <span className="text-white ml-1">{c.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-black border-t border-zinc-800 px-6 py-5">
        <div className="flex items-center justify-center gap-6 max-w-sm mx-auto">

          {/* Mic toggle */}
          <button
            onClick={toggleMic}
            className={`flex flex-col items-center gap-1.5 ${micOn ? 'text-white' : 'text-red-400'}`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${micOn ? 'bg-zinc-800' : 'bg-red-900/40 border border-red-800/60'}`}>
              {micOn ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </div>
            <span className="text-xs font-medium">{micOn ? 'Mute' : 'Unmuted'}</span>
          </button>

          {/* End stream */}
          <button
            onClick={handleEnd}
            disabled={ending}
            className="flex flex-col items-center gap-1.5 text-red-400"
          >
            <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </div>
            <span className="text-xs font-medium text-red-400">{ending ? 'Ending...' : 'End'}</span>
          </button>

          {/* Camera toggle */}
          <button
            onClick={toggleCam}
            className={`flex flex-col items-center gap-1.5 ${camOn ? 'text-white' : 'text-red-400'}`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${camOn ? 'bg-zinc-800' : 'bg-red-900/40 border border-red-800/60'}`}>
              {camOn ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                </svg>
              )}
            </div>
            <span className="text-xs font-medium">{camOn ? 'Camera' : 'No cam'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
