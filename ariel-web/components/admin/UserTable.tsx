'use client';

import { formatDistanceToNow } from 'date-fns';

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
}

interface UserTableProps {
  users: User[];
  onUserClick?: (userId: string) => void;
  onUpdateUser?: (userId: string, data: any) => void;
}

export default function UserTable({ users, onUserClick, onUpdateUser }: UserTableProps) {
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (onUpdateUser) {
      await onUpdateUser(userId, { role: newRole });
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Activity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stats
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Joined
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr
              key={user.user_id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onUserClick?.(user.user_id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-medium text-sm">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.username || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleRoleChange(user.user_id, e.target.value);
                  }}
                  className="text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-orange-500"
                  style={{
                    backgroundColor:
                      user.role === 'admin'
                        ? '#fef3c7'
                        : user.role === 'premium'
                        ? '#dbeafe'
                        : '#f3f4f6',
                    color:
                      user.role === 'admin'
                        ? '#92400e'
                        : user.role === 'premium'
                        ? '#1e40af'
                        : '#374151',
                  }}
                >
                  <option value="user">User</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {user.last_active
                    ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true })
                    : 'Never'}
                </div>
                <div className="text-sm text-gray-500">
                  {user.current_streak > 0 ? `🔥 ${user.current_streak} day streak` : 'No streak'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.total_questions} questions</div>
                <div className="text-sm text-gray-500">
                  Level {user.level} • {user.total_points} pts
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
