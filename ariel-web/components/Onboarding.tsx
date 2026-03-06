'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/api';

interface OnboardingData {
  educationLevel: string;
  subjects: string[];
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

const EDUCATION_LEVELS = [
  { id: 'high-school', label: 'High School', icon: '🏫' },
  { id: 'university', label: 'University', icon: '🎓' },
  { id: 'professional', label: 'Professional', icon: '💼' },
  { id: 'self-study', label: 'Self Study', icon: '📖' },
];

const SUBJECT_OPTIONS = [
  { id: 'gospel', label: 'Gospel & Faith', icon: '✝️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'economics', label: 'Economics', icon: '📈' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'health', label: 'Health & Medicine', icon: '🧬' },
  { id: 'mathematics', label: 'Mathematics', icon: '📐' },
  { id: 'sciences', label: 'Sciences', icon: '🔬' },
  { id: 'history', label: 'History', icon: '🏛️' },
  { id: 'literature', label: 'Literature', icon: '📚' },
  { id: 'languages', label: 'Languages', icon: '🌍' },
  { id: 'law', label: 'Law', icon: '⚖️' },
  { id: 'arts', label: 'Arts & Music', icon: '🎨' },
  { id: 'psychology', label: 'Psychology', icon: '🧠' },
  { id: 'engineering', label: 'Engineering', icon: '⚙️' },
  { id: 'geography', label: 'Geography', icon: '🗺️' },
  { id: 'other', label: 'Other', icon: '✨' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({ educationLevel: '', subjects: [] });

  const toggleSubject = (id: string) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(id)
        ? prev.subjects.filter(s => s !== id)
        : [...prev.subjects, id],
    }));
  };

  const canContinue = step === 1 ? !!data.educationLevel : data.subjects.length > 0;

  const handleNext = async () => {
    if (step === 1) { setStep(2); return; }
    setSaving(true);
    try {
      await authAPI.updateProfile({
        education_level: data.educationLevel,
        subjects: data.subjects,
        onboarding_completed: true,
      });
      onComplete(data);
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col">
      {/* Progress */}
      <div className="h-0.5 bg-zinc-800">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(step / 2) * 100}%` }} />
      </div>

      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <h1 className="text-base font-bold text-white">Set up Ariel</h1>
          </div>
          <span className="text-sm text-zinc-600">{step} of 2</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8">

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Where are you learning?</h2>
                <p className="text-zinc-500 text-sm mt-1">This helps us personalise your experience.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EDUCATION_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setData({ ...data, educationLevel: level.id })}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      data.educationLevel === level.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{level.icon}</span>
                    <p className={`font-semibold text-sm ${data.educationLevel === level.id ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {level.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">What do you want to learn?</h2>
                <p className="text-zinc-500 text-sm mt-1">Pick everything that interests you. You can change this later.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = data.subjects.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-xl mb-1.5 block">{subject.icon}</span>
                      <p className={`font-semibold text-sm leading-tight ${selected ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {subject.label}
                      </p>
                    </button>
                  );
                })}
              </div>
              {data.subjects.length > 0 && (
                <p className="text-sm text-zinc-600">{data.subjects.length} selected</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3.5 rounded-2xl border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-800 transition-all text-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canContinue || saving}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${
              canContinue && !saving
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : step === 2 ? 'Get started' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
