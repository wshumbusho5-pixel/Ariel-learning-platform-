'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
    { id: 'high-school', label: 'High School', icon: '🎓', color: 'from-blue-500 to-cyan-500' },
    { id: 'university', label: 'University', icon: '🏛️', color: 'from-purple-500 to-pink-500' },
    { id: 'professional', label: 'Professional', icon: '💼', color: 'from-orange-500 to-red-500' },
    { id: 'self-study', label: 'Self Study', icon: '📚', color: 'from-green-500 to-emerald-500' }
  ];

  const highSchoolYears = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const universityYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];

  const commonSubjects = [
    { id: 'mathematics', label: 'Mathematics', icon: '➗', color: 'bg-blue-500' },
    { id: 'physics', label: 'Physics', icon: '⚛️', color: 'bg-purple-500' },
    { id: 'chemistry', label: 'Chemistry', icon: '🧪', color: 'bg-green-500' },
    { id: 'biology', label: 'Biology', icon: '🧬', color: 'bg-emerald-500' },
    { id: 'computer-science', label: 'Computer Science', icon: '💻', color: 'bg-cyan-500' },
    { id: 'english', label: 'English', icon: '📖', color: 'bg-pink-500' },
    { id: 'history', label: 'History', icon: '🏛️', color: 'bg-orange-500' },
    { id: 'geography', label: 'Geography', icon: '🌍', color: 'bg-teal-500' },
    { id: 'economics', label: 'Economics', icon: '💰', color: 'bg-yellow-500' },
    { id: 'business', label: 'Business', icon: '📊', color: 'bg-indigo-500' }
  ];

  const learningGoals = [
    { id: 'exam-prep', label: 'Exam Preparation', icon: '📝' },
    { id: 'concept-mastery', label: 'Concept Mastery', icon: '🎯' },
    { id: 'quick-review', label: 'Quick Review', icon: '⚡' },
    { id: 'homework-help', label: 'Homework Help', icon: '✏️' }
  ];

  const studyPreferences = [
    { id: 'visual', label: 'Visual Learner', icon: '👁️', desc: 'Learn best with diagrams & images' },
    { id: 'practice', label: 'Practice Heavy', icon: '🔄', desc: 'Learn by doing exercises' },
    { id: 'theory', label: 'Theory Focused', icon: '📚', desc: 'Understand concepts deeply' },
    { id: 'interactive', label: 'Interactive', icon: '🎮', desc: 'Prefer hands-on learning' }
  ];

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Final step - save profile
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
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const selectEducationLevel = (level: string) => {
    setData({ ...data, educationLevel: level });
  };

  const selectYearLevel = (year: string) => {
    setData({ ...data, yearLevel: year });
  };

  const toggleSubject = (subject: string) => {
    const subjects = data.subjects.includes(subject)
      ? data.subjects.filter(s => s !== subject)
      : [...data.subjects, subject];
    setData({ ...data, subjects });
  };

  const toggleGoal = (goal: string) => {
    const goals = data.learningGoals.includes(goal)
      ? data.learningGoals.filter(g => g !== goal)
      : [...data.learningGoals, goal];
    setData({ ...data, learningGoals: goals });
  };

  const togglePreference = (pref: string) => {
    const prefs = data.studyPreferences.includes(pref)
      ? data.studyPreferences.filter(p => p !== pref)
      : [...data.studyPreferences, pref];
    setData({ ...data, studyPreferences: prefs });
  };

  const canContinue = () => {
    switch (step) {
      case 1: return data.educationLevel !== '';
      case 2: return data.yearLevel !== '';
      case 3: return data.subjects.length > 0;
      case 4: return data.learningGoals.length > 0;
      case 5: return data.studyPreferences.length > 0;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 z-50 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative h-full flex flex-col">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Welcome to Ariel
            </h1>
            <span className="text-white/60 text-sm font-medium">
              Step {step} of 5
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl animate-slideUp">
            {/* Step 1: Education Level */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    What's your education level?
                  </h2>
                  <p className="text-white/60 text-lg">
                    Help us personalize your learning experience
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                  {educationLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => selectEducationLevel(level.id)}
                      className={`p-8 rounded-3xl border-2 transition-all transform hover:scale-105 ${
                        data.educationLevel === level.id
                          ? 'border-white bg-white/10 shadow-2xl scale-105'
                          : 'border-white/20 glass-dark hover:border-white/40'
                      }`}
                    >
                      <div className="text-6xl mb-4">{level.icon}</div>
                      <h3 className="text-2xl font-bold text-white mb-2">{level.label}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Year Level */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    Which year are you in?
                  </h2>
                  <p className="text-white/60 text-lg">
                    We'll tailor content to your curriculum
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                  {(data.educationLevel === 'high-school' ? highSchoolYears : universityYears).map((year) => (
                    <button
                      key={year}
                      onClick={() => selectYearLevel(year)}
                      className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        data.yearLevel === year
                          ? 'border-white bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl scale-105'
                          : 'border-white/20 glass-dark hover:border-white/40'
                      }`}
                    >
                      <h3 className="text-xl font-bold text-white">{year}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Subjects */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    What are you studying?
                  </h2>
                  <p className="text-white/60 text-lg">
                    Select all subjects you're currently learning
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12">
                  {commonSubjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        data.subjects.includes(subject.id)
                          ? `border-white ${subject.color} shadow-2xl scale-105`
                          : 'border-white/20 glass-dark hover:border-white/40'
                      }`}
                    >
                      <div className="text-3xl mb-2">{subject.icon}</div>
                      <h3 className="text-base font-bold text-white">{subject.label}</h3>
                    </button>
                  ))}
                </div>
                <p className="text-center text-white/40 text-sm mt-6">
                  Selected: {data.subjects.length} subject{data.subjects.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Step 4: Learning Goals */}
            {step === 4 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    What's your goal?
                  </h2>
                  <p className="text-white/60 text-lg">
                    We'll focus on what matters most to you
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                  {learningGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-8 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        data.learningGoals.includes(goal.id)
                          ? 'border-white bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl scale-105'
                          : 'border-white/20 glass-dark hover:border-white/40'
                      }`}
                    >
                      <div className="text-5xl mb-3">{goal.icon}</div>
                      <h3 className="text-xl font-bold text-white">{goal.label}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Study Preferences */}
            {step === 5 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    How do you learn best?
                  </h2>
                  <p className="text-white/60 text-lg">
                    We'll adapt our teaching style to match yours
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                  {studyPreferences.map((pref) => (
                    <button
                      key={pref.id}
                      onClick={() => togglePreference(pref.id)}
                      className={`p-8 rounded-2xl border-2 transition-all transform hover:scale-105 text-left ${
                        data.studyPreferences.includes(pref.id)
                          ? 'border-white bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl scale-105'
                          : 'border-white/20 glass-dark hover:border-white/40'
                      }`}
                    >
                      <div className="text-4xl mb-3">{pref.icon}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{pref.label}</h3>
                      <p className="text-white/70 text-sm">{pref.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-3 rounded-full glass-dark text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canContinue() || saving}
              className="flex-1 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:scale-105 transition-all"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving your preferences...</span>
                </div>
              ) : (
                step === 5 ? '🚀 Start Learning' : 'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
