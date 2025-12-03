'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import UserTable from '@/components/admin/UserTable';
import { adminAPI } from '@/lib/adminApi';

interface User {
  user_id: string;
  email: string;
  username?: string;
  role: string;
  created_at: string;
  last_active?: string;
  total_questions: number;
  current_streak: number;
  total_points: number;
  level: number;
  ai_cost: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers(0, 100);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      await adminAPI.updateUser(userId, data);
      // Refresh users list
      await fetchUsers();
      alert('User updated successfully');
    } catch (err: any) {
      alert(`Failed to update user: ${err.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const handleExportUsers = () => {
    // Create CSV content
    const headers = ['Email', 'Username', 'Role', 'Questions', 'Points', 'Level', 'Streak', 'AI Cost', 'Created'];
    const rows = filteredUsers.map((user) => [
      user.email,
      user.username || '',
      user.role,
      user.total_questions,
      user.total_points,
      user.level,
      user.current_streak,
      user.ai_cost.toFixed(2),
      new Date(user.created_at).toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ariel-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    premium: users.filter((u) => u.role === 'premium').length,
    free: users.filter((u) => u.role === 'user').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">Manage and monitor all platform users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Users</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Admin</p>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.admin}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Premium</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.premium}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Free</p>
          <p className="mt-2 text-3xl font-semibold text-gray-600">{stats.free}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">Free Users</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportUsers}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <UserTable
        users={filteredUsers}
        onUserClick={(userId) => console.log('View user:', userId)}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
}
