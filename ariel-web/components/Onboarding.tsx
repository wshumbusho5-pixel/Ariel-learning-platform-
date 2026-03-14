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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-black">
        <div
          className="h-full bg-violet-400 transition-all duration-500"
          style={{ width: `${(step / 2) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #2f3336' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Ariel wordmark */}
          <span
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 22,
              color: '#fff',
              letterSpacing: 1,
            }}
          >
            ar<span style={{ color: '#9B7FFF' }}>i</span>el
          </span>
          <span style={{ fontSize: 13, color: '#8b9099' }}>Step {step} of 2</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8">

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
                  Where are you learning?
                </h2>
                <p className="text-zinc-500 text-sm mt-1">This helps us personalise your experience.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EDUCATION_LEVELS.map((level) => {
                  const selected = data.educationLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setData({ ...data, educationLevel: level.id })}
                      className="p-5 rounded-2xl text-left transition-all"
                      style={{
                        border: selected ? '2px solid #fff' : '2px solid #27272a',
                        background: selected ? 'rgba(255,255,255,0.08)' : 'transparent',
                      }}
                      onMouseEnter={e => {
                        if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = '#52525b';
                      }}
                      onMouseLeave={e => {
                        if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = '#27272a';
                      }}
                    >
                      <span className="text-2xl mb-2 block">{level.icon}</span>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: selected ? '#fff' : '#d4d4d8' }}
                      >
                        {level.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
                  What do you want to learn?
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Pick everything that interests you. You can change this later.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = data.subjects.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className="rounded-2xl text-left transition-all"
                      style={{
                        border: selected ? '2px solid #fff' : '2px solid #27272a',
                        background: selected ? 'rgba(255,255,255,0.08)' : 'transparent',
                        padding: '12px',
                      }}
                      onMouseEnter={e => {
                        if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = '#52525b';
                      }}
                      onMouseLeave={e => {
                        if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = '#27272a';
                      }}
                    >
                      <span className="text-lg mb-1.5 block">{subject.icon}</span>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          color: selected ? '#fff' : '#d4d4d8',
                        }}
                      >
                        {subject.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-5" style={{ borderTop: '1px solid #2f3336' }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Back button */}
          {step > 1 && (
            <button
              onClick={() => setStep(1)}
              className="transition-all font-semibold text-sm"
              style={{
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 14,
                paddingBottom: 14,
                borderRadius: 999,
                border: '1px solid #3f3f46',
                color: '#d4d4d8',
                background: 'transparent',
              }}
            >
              Back
            </button>
          )}

          {/* N selected label (step 2 only) */}
          {step === 2 && (
            <span
              className="font-semibold"
              style={{ fontSize: 13, color: '#8b9099' }}
            >
              {data.subjects.length} selected
            </span>
          )}

          <div className="flex-1" />

          {/* Next / Get started button */}
          <button
            onClick={handleNext}
            disabled={!canContinue || saving}
            className="transition-all font-bold text-sm"
            style={{
              paddingLeft: 32,
              paddingRight: 32,
              paddingTop: 14,
              paddingBottom: 14,
              borderRadius: 999,
              border: 'none',
              cursor: canContinue && !saving ? 'pointer' : 'not-allowed',
              background: canContinue && !saving ? '#fff' : '#27272a',
              color: canContinue && !saving ? '#000' : '#52525b',
            }}
          >
            {saving ? 'Saving...' : step === 2 ? 'Get started' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
