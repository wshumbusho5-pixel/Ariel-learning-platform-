'use client';

import { useState, useEffect } from 'react';
import { storiesAPI } from '@/lib/api';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateStoryModal({ isOpen, onClose, onSuccess }: CreateStoryModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data = await storiesAPI.getStoryTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0]);
        setContent(data[0].example_text);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !selectedTemplate) return;

    setIsSubmitting(true);
    try {
      await storiesAPI.createStory({
        story_type: selectedTemplate.template_type,
        content: content,
        background_color: selectedTemplate.background_color,
        visibility: 'followers',
      });

      onSuccess?.();
      onClose();
      setContent('');
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Story</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Templates */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Choose a style</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {templates.map((template) => (
              <button
                key={template.template_type}
                onClick={() => {
                  setSelectedTemplate(template);
                  setContent(template.example_text);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedTemplate?.template_type === template.template_type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{template.emoji}</div>
                <div className="text-xs font-medium text-gray-900">{template.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className="rounded-2xl p-6 min-h-[300px] flex items-center justify-center text-center"
            style={{ backgroundColor: selectedTemplate?.background_color || '#667EEA' }}
          >
            <div className="w-full">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent text-white text-xl font-bold text-center placeholder-white placeholder-opacity-60 outline-none resize-none"
                style={{ minHeight: '120px' }}
                maxLength={280}
              />
              <div className="text-white text-opacity-70 text-sm mt-4">
                {content.length}/280
              </div>
            </div>
          </div>

          {selectedTemplate && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              <span className="font-medium">{selectedTemplate.description}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Story'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            Your story will be visible to followers for 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}
