'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, DollarSign, UserPlus } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import UsageChart from '@/components/admin/UsageChart';
import { adminAPI } from '@/lib/adminApi';

interface DashboardStats {
  active_users_today: number;
  questions_answered_today: number;
  ai_cost_today: number;
  new_signups_today: number;
  daily_active_users: Array<{ date: string; count: number }>;
  questions_per_day: Array<{ date: string; count: number }>;
  cost_per_day: Array<{ date: string; cost: number }>;
  total_users: number;
  total_questions: number;
  total_ai_cost: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load dashboard stats');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor your platform's performance and user activity
        </p>
      </div>

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Users Today"
          value={stats.active_users_today}
          icon={Users}
          subtitle={`${stats.total_users} total users`}
        />
        <StatsCard
          title="Questions Answered"
          value={stats.questions_answered_today}
          icon={MessageSquare}
          subtitle={`${stats.total_questions.toLocaleString()} all-time`}
        />
        <StatsCard
          title="AI Cost Today"
          value={`$${stats.ai_cost_today.toFixed(2)}`}
          icon={DollarSign}
          subtitle={`$${stats.total_ai_cost.toFixed(2)} total`}
        />
        <StatsCard
          title="New Sign-ups"
          value={stats.new_signups_today}
          icon={UserPlus}
          subtitle="Today"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UsageChart
          data={stats.daily_active_users}
          title="Daily Active Users (7 days)"
          dataKey="count"
          color="#ea580c"
        />
        <UsageChart
          data={stats.questions_per_day}
          title="Questions per Day"
          dataKey="count"
          color="#2563eb"
        />
      </div>

      <div className="grid grid-cols-1">
        <UsageChart
          data={stats.cost_per_day}
          title="AI Costs per Day"
          dataKey="cost"
          color="#dc2626"
        />
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Summary</h3>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Users</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_users}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Questions</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.total_questions.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Lifetime AI Cost</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${stats.total_ai_cost.toFixed(2)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
