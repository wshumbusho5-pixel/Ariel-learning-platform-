'use client';

import { useEffect, useState } from 'react';
import { Brain, Zap, FileText, Image, Link2, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import { adminAPI } from '@/lib/adminApi';

interface UsageMetrics {
  openai_requests: number;
  openai_tokens: number;
  openai_cost: number;
  anthropic_requests: number;
  anthropic_tokens: number;
  anthropic_cost: number;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  urls_scraped: number;
  pdfs_processed: number;
  images_processed: number;
  scraper_success_rate: number;
  avg_response_time_ms: number;
  error_rate: number;
}

export default function UsagePage() {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState(7);

  useEffect(() => {
    fetchMetrics();
  }, [timeframe]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsageMetrics(timeframe);
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load usage metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading usage metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor AI usage, costs, and performance metrics</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* AI Provider Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Provider Usage</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* OpenAI */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">OpenAI</h3>
              <Brain className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.openai_requests.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tokens</p>
                <p className="text-lg font-medium text-gray-700">{metrics.openai_tokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cost</p>
                <p className="text-lg font-bold text-green-600">${metrics.openai_cost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Anthropic */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Anthropic (Claude)</h3>
              <Zap className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.anthropic_requests.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tokens</p>
                <p className="text-lg font-medium text-gray-700">{metrics.anthropic_tokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cost</p>
                <p className="text-lg font-bold text-orange-600">${metrics.anthropic_cost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Total AI Usage</h3>
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs opacity-90">Total Requests</p>
                <p className="text-2xl font-semibold">{metrics.total_requests.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs opacity-90">Total Tokens</p>
                <p className="text-lg font-medium">{metrics.total_tokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs opacity-90">Total Cost</p>
                <p className="text-2xl font-bold">${metrics.total_cost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scraper Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Scraper Performance</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="URLs Scraped"
            value={metrics.urls_scraped}
            icon={Link2}
            subtitle={`${timeframe} day${timeframe > 1 ? 's' : ''}`}
          />
          <StatsCard
            title="PDFs Processed"
            value={metrics.pdfs_processed}
            icon={FileText}
            subtitle={`${timeframe} day${timeframe > 1 ? 's' : ''}`}
          />
          <StatsCard
            title="Images OCR'd"
            value={metrics.images_processed}
            icon={Image}
            subtitle={`${timeframe} day${timeframe > 1 ? 's' : ''}`}
          />
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.scraper_success_rate}%</p>
              </div>
              <div className="ml-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Average Response Time</h3>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">{metrics.avg_response_time_ms.toFixed(0)}</p>
              <p className="text-sm text-gray-500 mt-1">milliseconds</p>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                {metrics.avg_response_time_ms < 1000 ? (
                  <span className="text-green-600">✓ Excellent performance</span>
                ) : metrics.avg_response_time_ms < 2000 ? (
                  <span className="text-yellow-600">⚠ Acceptable performance</span>
                ) : (
                  <span className="text-red-600">⚠ Slow performance</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Error Rate</h3>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">{metrics.error_rate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">of requests failed</p>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                {metrics.error_rate < 1 ? (
                  <span className="text-green-600">✓ Very low error rate</span>
                ) : metrics.error_rate < 5 ? (
                  <span className="text-yellow-600">⚠ Moderate error rate</span>
                ) : (
                  <span className="text-red-600">⚠ High error rate - investigate</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
        <div className="space-y-4">
          {/* OpenAI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">OpenAI</span>
              <span className="text-sm font-semibold text-gray-900">${metrics.openai_cost.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${(metrics.openai_cost / metrics.total_cost) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Anthropic */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Anthropic</span>
              <span className="text-sm font-semibold text-gray-900">${metrics.anthropic_cost.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{
                  width: `${(metrics.anthropic_cost / metrics.total_cost) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Average cost per request */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Average Cost per Request</span>
              <span className="text-lg font-bold text-gray-900">
                ${metrics.total_requests > 0 ? (metrics.total_cost / metrics.total_requests).toFixed(4) : '0.0000'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
