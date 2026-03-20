'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI, authAPI, cardsAPI, reelsAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'reels' | 'stats' | 'achievements'>('grid');
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [myCards, setMyCards] = useState<any[]>([]);
  const [myReels, setMyReels] = useState<any[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarBroken, setAvatarBroken] = useState(false);

  // Cropper
  const CROP_SIZE = 280;
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropImgNatural, setCropImgNatural] = useState({ w: 1, h: 1 });
  // Live values stored in refs — never cause re-renders during gesture
  const cropPosRef = useRef({ x: 0, y: 0 });
  const cropScaleRef = useRef(1);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const lastPinchDist = useRef<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      loadData();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading]);

  const loadData = async () => {
    checkAuth();
    const results = await Promise.allSettled([
      progressAPI.getStats(),
      gamificationAPI.getStats(),
      cardsAPI.getMyDeck({ limit: 50 }),
      reelsAPI.getMyReels(50),
    ]);
    if (results[0].status === 'fulfilled') setStats(results[0].value);
    if (results[1].status === 'fulfilled') setGamification(results[1].value);
    if (results[2].status === 'fulfilled') {
      const d = results[2].value;
      setMyCards(Array.isArray(d) ? d : d?.cards ?? []);
    }
    if (results[3].status === 'fulfilled') {
      const d = results[3].value;
      setMyReels(Array.isArray(d) ? d : []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const openEditSheet = () => {
    setEditName(user?.full_name || '');
    setEditUsername(user?.username || '');
    setEditBio((user as any)?.bio || '');
    setEditError('');
    setShowEditSheet(true);
  };

  const handleSaveProfile = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      await authAPI.updateProfile({
        full_name: editName.trim() || undefined,
        username: editUsername.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      await checkAuth();
      setShowEditSheet(false);
    } catch (e: any) {
      setEditError(e?.response?.data?.detail || 'Failed to save. Try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      setCropImgNatural({ w: probe.naturalWidth, h: probe.naturalHeight });
      setCropperSrc(url);
      cropScaleRef.current = 1;
      cropPosRef.current = { x: 0, y: 0 };
    };
    probe.src = url;
    setAvatarError('');
    e.target.value = '';
  };

  // cover scale: smallest multiplier that makes image fill the circle
  const coverScale = Math.max(CROP_SIZE / cropImgNatural.w, CROP_SIZE / cropImgNatural.h);
  const displayW = cropImgNatural.w * coverScale;
  const displayH = cropImgNatural.h * coverScale;

  // Apply transform directly to DOM — zero re-renders during gesture
  const applyTransform = () => {
    const img = cropImgRef.current;
    if (!img) return;
    const { x, y } = cropPosRef.current;
    const s = cropScaleRef.current;
    img.style.width = `${displayW * s}px`;
    img.style.height = `${displayH * s}px`;
    img.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  };

  const handleCropSave = useCallback(async () => {
    if (!cropperSrc) return;
    const img = new Image();
    img.src = cropperSrc;
    await new Promise(res => { img.onload = res; });

    const outputSize = 400;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    const cv = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    const dScale = outputSize / CROP_SIZE;
    const s = cropScaleRef.current;
    const { x, y } = cropPosRef.current;
    const dw = img.naturalWidth  * cv * s * dScale;
    const dh = img.naturalHeight * cv * s * dScale;
    const dx = outputSize / 2 + x * dScale - dw / 2;
    const dy = outputSize / 2 + y * dScale - dh / 2;
    ctx.drawImage(img, dx, dy, dw, dh);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      URL.revokeObjectURL(cropperSrc);
      setCropperSrc(null);
      setAvatarUploading(true);
      setAvatarBroken(false);
      try {
        const f = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        await authAPI.uploadProfilePicture(f);
        await checkAuth();
      } catch (err: any) {
        setAvatarError(err?.response?.data?.detail || 'Upload failed. Try again.');
      } finally {
        setAvatarUploading(false);
      }
    }, 'image/jpeg', 0.92);
  }, [cropperSrc, cropImgNatural, displayW, displayH]);

  // Pointer (mouse/stylus) handlers
  const handleCropPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // handled by touch events
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, posX: cropPosRef.current.x, posY: cropPosRef.current.y };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || !isDraggingRef.current) return;
    cropPosRef.current = {
      x: dragStart.current.posX + (e.clientX - dragStart.current.x),
      y: dragStart.current.posY + (e.clientY - dragStart.current.y),
    };
    applyTransform();
  };

  const handleCropWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cropScaleRef.current = Math.max(1, Math.min(4, cropScaleRef.current - e.deltaY * 0.003));
    applyTransform();
  };

  // Touch handlers — smooth pinch-zoom + drag with no React re-renders
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      isDraggingRef.current = false;
      lastPinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    } else if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, posX: cropPosRef.current.x, posY: cropPosRef.current.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      if (lastPinchDist.current !== null) {
        const ratio = d / lastPinchDist.current;
        cropScaleRef.current = Math.max(1, Math.min(4, cropScaleRef.current * ratio));
        applyTransform();
      }
      lastPinchDist.current = d;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      cropPosRef.current = {
        x: dragStart.current.posX + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.posY + (e.touches[0].clientY - dragStart.current.y),
      };
      applyTransform();
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    lastPinchDist.current = null;
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen lg:pl-[72px] bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-zinc-300">Sign in to view your profile</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-700"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-violet-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-zinc-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const level = gamification?.level_info?.current_level || 1;
  const progress = gamification?.level_info?.progress_percentage || 0;
  const totalCards = myCards.length || stats?.total_cards || 0;
  const cardsReviewed = stats?.total_reviews || 0;
  const cardsMastered = stats?.cards_mastered || 0;
  const streakDays = stats?.current_streak || 0;
  const followers = (user as any)?.followers_count ?? (user as any)?.followers?.length ?? 0;
  const following = (user as any)?.following_count ?? (user as any)?.following?.length ?? 0;

  return (
    <>
      <SideNav />
      <div className="min-h-screen pb-20 bg-[#09090b] lg:pl-[72px]">

        {/* Header */}
        <div className="sticky top-0 z-50 bg-[#09090b] border-b border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')}>
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-base font-black text-white">{user?.username || 'Profile'}</h1>
            <button onClick={handleLogout}>
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">

          {/* Profile header */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-start gap-6 mb-4">
              <div className="flex-shrink-0">
                <label className="relative w-24 h-24 block cursor-pointer group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                  />
                  <div className="w-24 h-24 rounded-full ring-2 ring-zinc-700 overflow-hidden">
                    {avatarUploading ? (
                      <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" />
                      </div>
                    ) : user?.profile_picture && !avatarBroken ? (
                      <img
                        src={user.profile_picture}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover"
                        onError={() => setAvatarBroken(true)}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-3xl">
                          {user?.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </label>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-3 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-black text-white">{totalCards}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">cards</p>
                  </div>
                  <button onClick={() => router.push('/profile/followers')} className="text-center">
                    <p className="text-xl font-black text-white">{followers}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">followers</p>
                  </button>
                  <button onClick={() => router.push('/profile/following')} className="text-center">
                    <p className="text-xl font-black text-white">{following}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">following</p>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={openEditSheet}
                    className="flex-1 py-1.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white rounded-lg transition-colors border border-zinc-700"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-1.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-sm font-semibold text-zinc-400 rounded-lg transition-colors border border-zinc-800"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>

            {avatarError && (
              <p className="text-xs text-red-400 mb-3">{avatarError}</p>
            )}

            <div className="mb-4">
              <p className="text-[17px] font-black text-white mb-0.5">
                {user?.username || user?.full_name}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs font-semibold text-zinc-500">Level {level}</span>
                <div className="w-px h-3 bg-zinc-700" />
                {streakDays > 0 ? (
                  <span className="text-xs font-bold text-orange-400">{streakDays} day streak 🔥</span>
                ) : (
                  <span className="text-xs text-zinc-600">Start your streak</span>
                )}
              </div>
              {(user as any)?.bio && (
                <p className="text-sm text-zinc-400 mt-1.5">{(user as any).bio}</p>
              )}
              {user?.subjects && user.subjects.length > 0 && (
                <p className="text-sm text-zinc-500 mt-1">
                  Studying {user.subjects.slice(0, 3).join(', ')}
                </p>
              )}
            </div>

            {/* Highlight bubbles */}
            <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {/* Streak */}
              <button onClick={() => router.push('/leaderboard')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors ${
                  streakDays > 0 ? 'border-orange-500/50 bg-orange-500/10 hover:border-orange-400' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                }`}>
                  <svg className={`w-6 h-6 ${streakDays > 0 ? 'text-orange-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                  </svg>
                </div>
                <p className={`text-[10px] font-semibold ${streakDays > 0 ? 'text-orange-400' : 'text-zinc-500'}`}>
                  {streakDays > 0 ? `${streakDays}d streak` : '0d streak'}
                </p>
              </button>

              {/* Level */}
              <button onClick={() => router.push('/achievements')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-violet-500/40 bg-violet-500/10 flex items-center justify-center hover:border-violet-400 transition-colors">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>
                <p className="text-[10px] font-semibold text-violet-400">Level {level}</p>
              </button>

              {/* Trophies */}
              <button onClick={() => router.push('/achievements')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-amber-500/40 bg-amber-500/10 flex items-center justify-center hover:border-amber-400 transition-colors">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                </div>
                <p className="text-[10px] font-semibold text-amber-400">Trophies</p>
              </button>

              {/* Cards */}
              <button onClick={() => router.push('/deck')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-sky-500/40 bg-sky-500/10 flex items-center justify-center hover:border-sky-400 transition-colors">
                  <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                  </svg>
                </div>
                <p className="text-[10px] font-semibold text-sky-400">{totalCards} cards</p>
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="border-t border-zinc-800">
            <div className="flex">
              {(['grid', 'reels', 'stats', 'achievements'] as const).map((tab) => {
                const icons: Record<string, string> = {
                  grid: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
                  reels: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
                  stats: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                  achievements: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 border-b-2 transition-colors ${
                      activeTab === tab ? 'border-white' : 'border-transparent'
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 mx-auto ${activeTab === tab ? 'text-white' : 'text-zinc-600'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[tab]} />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-4">

            {/* Cards grid */}
            {activeTab === 'grid' && (
              myCards.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎴</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">No cards yet</p>
                  <p className="text-xs text-zinc-500">Cards you create will appear here.</p>
                  <button
                    onClick={() => router.push('/create-cards')}
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-violet-500 text-white hover:bg-violet-400 transition-colors"
                  >
                    Create cards
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {myCards.map((card: any) => (
                    <div
                      key={card.id}
                      onClick={() => router.push('/deck')}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-violet-500/50 transition-all"
                      style={{ minHeight: '140px' }}
                    >
                      {card.subject && (
                        <span className="inline-block text-[10px] font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                          {card.subject}
                        </span>
                      )}
                      <p className="text-[13px] text-white font-semibold leading-snug line-clamp-4">
                        {card.question}
                      </p>
                      {card.answer && (
                        <p className="text-[11px] text-zinc-500 mt-2 line-clamp-2 leading-snug">
                          {card.answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Reels grid */}
            {activeTab === 'reels' && (
              myReels.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎬</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">No reels yet</p>
                  <p className="text-xs text-zinc-500">Reels you upload will appear here.</p>
                  <button
                    onClick={() => router.push('/reels/upload')}
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-violet-500 text-white hover:bg-violet-400 transition-colors"
                  >
                    Upload reel
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {myReels.map((reel: any) => {
                    const thumb = reel.thumbnail_url?.replace(/^https?:\/\/[^/]+/, '');
                    return (
                      <div
                        key={reel.id}
                        onClick={() => router.push('/reels')}
                        className="aspect-[9/16] bg-zinc-900 rounded relative overflow-hidden cursor-pointer group"
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {thumb && (
                          <img src={thumb} alt={reel.title} className="absolute inset-0 w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-[9px] text-white font-semibold truncate">{reel.title}</p>
                          <p className="text-[8px] text-white/60">{reel.views || 0} views</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Stats */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-black text-white">Level Progress</h3>
                    <span className="text-xs font-semibold text-zinc-500">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {gamification?.level_info?.points_to_next_level || 0} XP to Level {level + 1}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Cards', value: totalCards },
                    { label: 'Reviews Done', value: cardsReviewed },
                    { label: 'Mastered', value: cardsMastered },
                    { label: 'Accuracy', value: `${stats?.retention_rate || 0}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <p className="text-2xl font-black text-white">{stat.value}</p>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-base font-black text-white mb-3">Study Streak</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Current</p>
                      <p className="text-2xl font-black text-white">{streakDays} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Best</p>
                      <p className="text-2xl font-black text-white">{stats?.longest_streak || 0} days</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements */}
            {activeTab === 'achievements' && (
              <div className="space-y-3">
                {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
                  gamification.achievements.filter((a: any) => a.unlocked).map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">{achievement.icon || '🏆'}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm mb-1">{achievement.name}</h4>
                        <p className="text-xs text-zinc-500 mb-1">{achievement.description}</p>
                        {achievement.unlocked_at && (
                          <p className="text-xs text-zinc-600">
                            {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-amber-500/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                      </svg>
                    </div>
                    <h3 className="text-base font-black text-white mb-2">No achievements yet</h3>
                    <p className="text-sm text-zinc-500">Keep studying to unlock achievements!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>

      {/* Avatar cropper modal */}
      {cropperSrc && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4">
            <button
              onClick={() => { URL.revokeObjectURL(cropperSrc); setCropperSrc(null); }}
              className="text-[15px] font-semibold" style={{ color: '#8b9099' }}
            >
              Cancel
            </button>
            <p className="text-[15px] font-bold" style={{ color: '#e7e9ea' }}>Move and scale</p>
            <button
              onClick={handleCropSave}
              className="text-[15px] font-bold text-violet-400"
            >
              Done
            </button>
          </div>

          {/* Full-screen image drag area */}
          <div
            className="flex-1 relative overflow-hidden select-none"
            style={{ cursor: 'grab', touchAction: 'none' }}
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={() => { isDraggingRef.current = false; }}
            onPointerCancel={() => { isDraggingRef.current = false; }}
            onWheel={handleCropWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Dim overlay with circle cutout */}
            <div className="absolute inset-0 pointer-events-none z-10" style={{
              background: 'radial-gradient(circle ' + (CROP_SIZE / 2) + 'px at 50% 50%, transparent ' + (CROP_SIZE / 2) + 'px, rgba(0,0,0,0.6) ' + (CROP_SIZE / 2) + 'px)',
            }} />
            {/* Circle border */}
            <div className="absolute pointer-events-none z-10 rounded-full" style={{
              width: CROP_SIZE,
              height: CROP_SIZE,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid rgba(255,255,255,0.8)',
            }} />

            {/* The image — transform applied directly via ref for smooth gesture */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={cropImgRef}
              src={cropperSrc}
              alt="crop"
              draggable={false}
              style={{
                position: 'absolute',
                width: displayW,
                height: displayH,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                userSelect: 'none',
                pointerEvents: 'none',
                willChange: 'transform, width, height',
              }}
            />
          </div>

          {/* Zoom slider */}
          <div className="px-8 pb-6 pt-5 flex items-center gap-4">
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#8b9099' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="range" min={1} max={4} step={0.01}
              defaultValue={1}
              onChange={e => {
                cropScaleRef.current = parseFloat(e.target.value);
                applyTransform();
              }}
              className="flex-1 accent-violet-500 h-1"
            />
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#8b9099' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>
      )}

      {/* Edit Profile sheet */}
      {showEditSheet && (
        <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setShowEditSheet(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl pb-10 animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-5">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>

            <div className="px-5 space-y-4 max-w-lg mx-auto">
              <h2 className="text-base font-black text-white">Edit Profile</h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Full name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-violet-400 placeholder:text-zinc-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Username</label>
                <input
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-violet-400 placeholder:text-zinc-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={3}
                  maxLength={160}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-violet-400 placeholder:text-zinc-600 text-sm resize-none"
                />
                <p className="text-xs text-zinc-600 text-right mt-0.5">{editBio.length}/160</p>
              </div>

              {editError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{editError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowEditSheet(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 font-semibold text-sm hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-colors disabled:opacity-60"
                >
                  {editSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
