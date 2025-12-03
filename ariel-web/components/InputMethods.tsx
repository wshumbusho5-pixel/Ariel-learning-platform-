'use client';

import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface InputMethodsProps {
  onQuestionsLoaded: (questions: any[]) => void;
}

export default function InputMethods({ onQuestionsLoaded }: InputMethodsProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'bulk' | 'pdf' | 'image'>('url');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL input
  const [url, setUrl] = useState('');

  // Bulk text input
  const [bulkText, setBulkText] = useState('');

  const handleURLSubmit = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/scraper/scrape-url`, { url });
      onQuestionsLoaded(response.data.question_set);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to scrape URL');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkText) return;

    // Split by newlines or numbers (1., 2., etc.)
    const questions = bulkText
      .split(/\n+/)
      .map(q => q.trim().replace(/^\d+[\.)]\s*/, ''))
      .filter(q => q.length > 5);

    if (questions.length === 0) {
      setError('No valid questions found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/scraper/bulk-questions`, { questions });
      onQuestionsLoaded(response.data.question_set);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process questions');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, endpoint: string) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/scraper/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onQuestionsLoaded(response.data.question_set);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'url', label: 'Paste URL', icon: '🔗' },
            { id: 'bulk', label: 'Bulk Questions', icon: '📝' },
            { id: 'pdf', label: 'Upload PDF', icon: '📄' },
            { id: 'image', label: 'Upload Image', icon: '📸' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste link to past papers or questions
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/past-papers"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleURLSubmit}
                disabled={loading || !url}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Extracting questions...' : 'Extract Questions'}
              </button>
            </div>
          )}

          {/* Bulk Text Tab */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste your questions (one per line)
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="1. What is photosynthesis?&#10;2. Name the capital of France&#10;3. What is 2 + 2?"
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleBulkSubmit}
                disabled={loading || !bulkText}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Processing...' : 'Process Questions'}
              </button>
            </div>
          )}

          {/* PDF Upload Tab */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'upload-pdf');
                  }}
                  className="hidden"
                  id="pdf-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {loading ? 'Processing...' : 'Click to upload PDF or drag and drop'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Image Upload Tab */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'upload-image');
                  }}
                  className="hidden"
                  id="image-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {loading ? 'Processing with OCR...' : 'Click to upload image or drag and drop'}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
