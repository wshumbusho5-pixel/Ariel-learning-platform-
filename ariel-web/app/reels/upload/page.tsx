'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ReelUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const categories = [
    'Math', 'Science', 'History', 'Language', 'Programming',
    'Art', 'Music', 'Study Tips', 'Life Skills', 'Other',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }
    setSelectedFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      alert('Please select a video and add a title');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setStatusText('Uploading video…');

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('auth_token') || '';

      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (category) formData.append('category', category);
      if (hashtags.trim()) {
        const tags = hashtags.split('#').filter(t => t.trim()).map(t => t.trim());
        formData.append('hashtags', JSON.stringify(tags));
      }

      // Use XHR instead of axios — no timeout, real upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiBase}/api/reels/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 95));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.detail || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed — check your connection'));
        xhr.send(formData);
      });

      setUploadProgress(100);
      setStatusText('Done!');
      setTimeout(() => router.push('/reels'), 500);

    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error?.message || 'Upload failed. Please try again.');
      setUploading(false);
      setStatusText('');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="sticky top-0 bg-black border-b border-gray-800 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/reels')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Upload Clip</h1>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || uploading}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              selectedFile && title.trim() && !uploading
                ? 'bg-violet-500 hover:bg-violet-400'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {uploading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Video picker */}
        <div className="mb-6">
          {!videoPreview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] bg-gray-900 rounded-2xl border-2 border-dashed border-gray-700 hover:border-violet-400 transition-colors flex flex-col items-center justify-center gap-4"
            >
              <div className="w-20 h-20 bg-zinc-700 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg mb-1">Select video to upload</p>
                <p className="text-gray-400 text-sm">Videos longer than 60s are trimmed automatically</p>
              </div>
            </button>
          ) : (
            <div className="relative">
              <video
                ref={videoPreviewRef}
                src={videoPreview}
                className="w-full aspect-[9/16] bg-black rounded-2xl object-cover"
                controls
              />
              <button
                onClick={() => { setSelectedFile(null); setVideoPreview(null); }}
                className="absolute top-4 right-4 w-10 h-10 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* Progress */}
        {uploading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{statusText}</span>
              <span className="text-sm font-semibold text-white">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's this clip about?"
              maxLength={100}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-400 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers more…"
              maxLength={500}
              rows={4}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-400 transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-400 transition-colors"
            >
              <option value="">Select a category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Hashtags</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#physics #experiment #cool"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-400 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Separate with # (e.g. #math #tutorial)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
