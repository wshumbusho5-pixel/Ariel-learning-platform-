'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/api';

interface OnboardingData {
  educationLevel: string;
  yearLevel: string;
  subjects: string[];
  learningGoals: string[];
  studyPreferences: string[];
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    educationLevel: '',
    yearLevel: '',
    subjects: [],
    learningGoals: [],
    studyPreferences: []
  });

  const educationLevels = [
    { id: 'high-school', label: 'High School' },
    { id: 'university', label: 'University' },
    { id: 'professional', label: 'Professional' },
    { id: 'self-study', label: 'Self Study' }
  ];

  const commonSubjects = [
    { id: 'mathematics', label: 'Mathematics' },
    { id: 'physics', label: 'Physics' },
    { id: 'chemistry', label: 'Chemistry' },
    { id: 'biology', label: 'Biology' },
    { id: 'computer-science', label: 'Computer Science' },
    { id: 'english', label: 'English' },
    { id: 'history', label: 'History' },
    { id: 'geography', label: 'Geography' },
    { id: 'economics', label: 'Economics' },
    { id: 'business', label: 'Business' }
  ];

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setSaving(true);
      try {
        await authAPI.updateProfile({
          education_level: data.educationLevel,
          year_level: data.yearLevel,
          subjects: data.subjects,
          learning_goals: data.learningGoals,
          study_preferences: data.studyPreferences,
          onboarding_completed: true
        });
        onComplete(data);
      } catch (error) {
        console.error('Failed to save profile:', error);
        alert('Failed to save your preferences. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const selectEducationLevel = (level: string) => {
    setData({ ...data, educationLevel: level });
  };

  const toggleSubject = (subject: string) => {
    const subjects = data.subjects.includes(subject)
      ? data.subjects.filter(s => s !== subject)
      : [...data.subjects, subject];
    setData({ ...data, subjects });
  };

  const canContinue = () => {
    if (step === 1) return data.educationLevel !== '';
    if (step === 2) return data.subjects.length > 0;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div
          className="h-full bg-blue-600 transition-all duration-500"
          style={{ width: `${(step / 2) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Set up your account</h1>
          <span className="text-sm text-gray-400">{step} of 2</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-6 py-8">

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Education level</h2>
                <p className="text-gray-500 text-sm">Helps us show you relevant content.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {educationLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => selectEducationLevel(level.id)}
                    className={`p-4 rounded-xl border-2 text-left font-semibold text-sm transition-all ${
                      data.educationLevel === level.id
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">What are you studying?</h2>
                <p className="text-gray-500 text-sm">Select all that apply.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {commonSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`p-4 rounded-xl border-2 text-left font-semibold text-sm transition-all ${
                      data.subjects.includes(subject.id)
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {subject.label}
                  </button>
                ))}
              </div>
              {data.subjects.length > 0 && (
                <p className="text-sm text-gray-400">{data.subjects.length} selected</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-5 border-t border-gray-100">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canContinue() || saving}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
              canContinue() && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : step === 2 ? 'Get started' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
