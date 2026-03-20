import apiClient from '@/shared/api/client';
import { NOTIFICATIONS } from '@/shared/api/endpoints';
import type { Notification, NotificationSummary } from '@/shared/types/notification';

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface NotificationsListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

export interface MarkReadResponse {
  success: boolean;
}

export interface MarkAllReadResponse {
  updated_count: number;
}

export interface ClearAllResponse {
  deleted_count: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of notifications.
 * GET /api/notifications/?limit=&offset=
 */
export async function getNotifications(
  limit = 20,
  offset = 0,
): Promise<NotificationsListResponse> {
  const res = await apiClient.get<NotificationsListResponse>(
    `${NOTIFICATIONS.LIST}?limit=${limit}&offset=${offset}`,
  );
  return res.data;
}

/**
 * Mark a single notification as read.
 * POST /api/notifications/{id}/read
 */
export async function markRead(id: string): Promise<MarkReadResponse> {
  const res = await apiClient.post<MarkReadResponse>(NOTIFICATIONS.markRead(id));
  return res.data;
}

/**
 * Mark all notifications as read.
 * POST /api/notifications/read-all
 */
export async function markAllRead(): Promise<MarkAllReadResponse> {
  const res = await apiClient.post<MarkAllReadResponse>(NOTIFICATIONS.READ_ALL);
  return res.data;
}

/**
 * Delete / clear all notifications.
 * DELETE /api/notifications/clear-all
 */
export async function clearAll(): Promise<ClearAllResponse> {
  const res = await apiClient.delete<ClearAllResponse>(NOTIFICATIONS.CLEAR_ALL);
  return res.data;
}

/**
 * Fetch unread notification count and summary.
 * GET /api/notifications/summary → { unread_count, ... }
 */
export async function getSummary(): Promise<NotificationSummary> {
  const res = await apiClient.get<NotificationSummary>(NOTIFICATIONS.SUMMARY);
  return res.data;
}
