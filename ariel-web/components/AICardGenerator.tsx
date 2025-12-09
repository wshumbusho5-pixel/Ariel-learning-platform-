'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { aiGeneratorAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function AICardGenerator() {
  const router = useRouter();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [numCards, setNumCards] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const [success, setSuccess] = useState(false);

  const subjectIcons: Record<string, { icon: string; color: string }> = {
    mathematics: { icon: '➗', color: 'from-blue-500 to-cyan-500' },
    physics: { icon: '⚛️', color: 'from-purple-500 to-pink-500' },
    chemistry: { icon: '🧪', color: 'from-green-500 to-emerald-500' },
    biology: { icon: '🧬', color: 'from-emerald-500 to-teal-500' },
    'computer-science': { icon: '💻', color: 'from-cyan-500 to-blue-500' },
    english: { icon: '📖', color: 'from-pink-500 to-rose-500' },
    history: { icon: '🏛️', color: 'from-orange-500 to-amber-500' },
    geography: { icon: '🌍', color: 'from-teal-500 to-cyan-500' },
    economics: { icon: '💰', color: 'from-yellow-500 to-orange-500' },
    business: { icon: '📊', color: 'from-indigo-500 to-purple-500' },
  };

  useEffect(() => {
    if (user?.subjects) {
      const formattedSubjects = user.subjects.map((subject: string) => ({
        id: subject,
        name: subject.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        icon: subjectIcons[subject]?.icon || '📚',
        color: subjectIcons[subject]?.color || 'from-gray-500 to-slate-500'
      }));
      setSubjects(formattedSubjects);
    }
  }, [user]);

  const handleGenerateForSubject = async () => {
    if (!selectedSubject) return;

    setGenerating(true);
    setSuccess(false);

    try {
      await aiGeneratorAPI.generateForSubject(selectedSubject, numCards);
      setSuccess(true);

      setTimeout(() => {
        router.push('/deck');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to generate cards:', error);
      alert(error.response?.data?.detail || 'Failed to generate cards. Make sure OpenAI API key is configured.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateDailyCards = async () => {
    setGeneratingDaily(true);
    setSuccess(false);

    try {
      const result = await aiGeneratorAPI.generateDailyCards(5);
      setSuccess(true);

      alert(`Generated ${result.total_cards} cards across ${result.subjects.length} subjects!`);

      setTimeout(() => {
        router.push('/deck');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to generate daily cards:', error);
      alert(error.response?.data?.detail || 'Failed to generate daily cards. Make sure OpenAI API key is configured.');
    } finally {
      setGeneratingDaily(false);
    }
  };

  if (!user?.subjects || subjects.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">AI Card Generator</h3>
        <p className="text-gray-600 mb-4">
          Complete your onboarding to start generating personalized flashcards!
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
        >
          Complete Onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Cards Generator */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 rounded-3xl p-8 text-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
              ✨
            </div>
            <div>
              <h3 className="text-2xl font-bold">Daily AI Cards</h3>
              <p className="text-white/80">Fresh content for all your subjects</p>
            </div>
          </div>

          <p className="text-white/90 mb-6">
            Generate 5 personalized flashcards for each of your enrolled subjects.
            Perfect for daily study routine!
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-2"
              >
                <span className="text-xl">{subject.icon}</span>
                <span className="font-medium">{subject.name}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerateDailyCards}
            disabled={generatingDaily}
            className="w-full px-8 py-4 bg-white text-purple-900 font-bold text-lg rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
          >
            {generatingDaily ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-purple-900 border-t-transparent rounded-full animate-spin"></div>
                <span>Generating cards with AI...</span>
              </div>
            ) : (
              <span>🚀 Generate Daily Cards</span>
            )}
          </button>
        </div>
      </div>

      {/* Custom Subject Generator */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl">
            🎯
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Custom Generator</h3>
            <p className="text-gray-600">Focus on a specific subject</p>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Subject
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedSubject === subject.id
                    ? `border-purple-500 bg-gradient-to-br ${subject.color} text-white shadow-lg scale-105`
                    : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                }`}
              >
                <div className="text-3xl mb-2">{subject.icon}</div>
                <div className="text-sm font-semibold">{subject.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Number of Cards */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Number of Cards: {numCards}
          </label>
          <input
            type="range"
            min="5"
            max="20"
            step="5"
            value={numCards}
            onChange={(e) => setNumCards(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 cards</span>
            <span>10 cards</span>
            <span>15 cards</span>
            <span>20 cards</span>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateForSubject}
          disabled={!selectedSubject || generating}
          className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {generating ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating {numCards} cards...</span>
            </div>
          ) : (
            <span>Generate Cards</span>
          )}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-6 animate-slideUp">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-bold text-lg">Cards Generated Successfully!</p>
              <p className="text-white/90">Redirecting to your deck...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
