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
    physics: { icon: '⚛️', color: 'from-zinc-500 to-zinc-600' },
    chemistry: { icon: '🧪', color: 'from-green-500 to-sky-500' },
    biology: { icon: '🧬', color: 'from-sky-500 to-teal-500' },
    'computer-science': { icon: '💻', color: 'from-cyan-500 to-blue-500' },
    english: { icon: '📖', color: 'from-zinc-400 to-zinc-500' },
    history: { icon: '🏛️', color: 'from-orange-500 to-amber-500' },
    geography: { icon: '🌍', color: 'from-teal-500 to-cyan-500' },
    economics: { icon: '💰', color: 'from-yellow-500 to-orange-500' },
    business: { icon: '📊', color: 'from-zinc-600 to-zinc-700' },
  };

  useEffect(() => {
    if (user?.subjects) {
      const formattedSubjects = user.subjects.map((subject: string) => ({
        id: subject,
        name: subject.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        icon: subjectIcons[subject]?.icon || '📚',
        color: subjectIcons[subject]?.color || 'from-zinc-500 to-zinc-600'
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
      <div className="border border-gray-200 rounded-xl p-8 text-center bg-gray-50">
        <h3 className="text-xl font-bold text-gray-900 mb-2">AI Card Generator</h3>
        <p className="text-gray-600 mb-4">
          Complete your onboarding to start generating personalized flashcards!
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Complete Onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Cards Generator */}
      <div className="bg-zinc-900 rounded-xl p-6 text-white">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-2xl">
              ✨
            </div>
            <div>
              <h3 className="text-xl font-bold">Daily AI Cards</h3>
              <p className="text-white/70">Fresh content for all your subjects</p>
            </div>
          </div>

          <p className="text-white/80 mb-5">
            Generate 5 personalized flashcards for each of your enrolled subjects.
            Perfect for daily study routine!
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="px-4 py-2 bg-white/15 rounded-full flex items-center gap-2"
              >
                <span className="text-xl">{subject.icon}</span>
                <span className="font-medium">{subject.name}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerateDailyCards}
            disabled={generatingDaily}
            className="w-full px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generatingDaily ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                <span>Generating cards with AI...</span>
              </div>
            ) : (
              <span>Generate Daily Cards</span>
            )}
          </button>
        </div>
      </div>

      {/* Custom Subject Generator */}
      <div className="border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            
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
                    ? `border-blue-600 bg-blue-50 text-blue-900`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{subject.icon}</div>
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating {numCards} cards...</span>
            </div>
          ) : (
            <span>Generate Cards</span>
          )}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-green-800">Cards generated successfully</p>
              <p className="text-green-600 text-sm">Redirecting to your deck...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
