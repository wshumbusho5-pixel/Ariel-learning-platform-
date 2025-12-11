'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateStreamPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('study_session');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAndGoLive = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your stream');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');

      // Create stream
      const createResponse = await fetch('http://localhost:8003/api/livestream/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          subject: subject || null,
          is_public: true,
          allow_comments: true,
          allow_reactions: true,
          save_recording: true,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create stream');
      }

      const stream = await createResponse.json();

      // Start stream immediately
      const startResponse = await fetch(`http://localhost:8003/api/livestream/${stream.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start stream');
      }

      // Redirect to broadcast page
      router.push(`/live/${stream.id}/broadcast`);
    } catch (error) {
      console.error('Failed to create stream:', error);
      alert('Failed to create stream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Live Stream</h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chemistry Exam Prep Session"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what your stream is about..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            >
              <option value="study_session">📚 Study Session</option>
              <option value="lecture">🎓 Lecture</option>
              <option value="q_and_a">❓ Q&A</option>
              <option value="tutorial">💡 Tutorial</option>
              <option value="exam_prep">📝 Exam Prep</option>
              <option value="discussion">💬 Discussion</option>
              <option value="other">🎥 Other</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Chemistry, Mathematics, Physics"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Before you go live:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• Grant camera and microphone permissions</li>
                  <li>• Your stream will be public and visible to all users</li>
                  <li>• Recording will be saved automatically</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAndGoLive}
              disabled={loading || !title.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Go Live
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
