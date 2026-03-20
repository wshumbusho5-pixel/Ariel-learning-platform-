import apiClient from '@/shared/api/client';
import { STORIES } from '@/shared/api/endpoints';
import type { StoryGroup, StoryResponse } from '@/shared/types/story';

export interface CreateStoryPayload {
  story_type: string;
  content: string;
  background_color?: string;
  image_url?: string | null;
  achievement_id?: string | null;
  visibility?: string;
}

export interface StoryTemplate {
  id: string;
  name: string;
  background_color: string;
  content_placeholder: string;
}

/**
 * Fetch the stories feed — all followed users' story groups.
 * GET /api/stories/feed
 */
export async function getStoriesFeed(): Promise<StoryGroup[]> {
  const res = await apiClient.get<StoryGroup[]>(STORIES.FEED);
  return res.data;
}

/**
 * Fetch the current user's own stories.
 * GET /api/stories/my-stories
 */
export async function getMyStories(): Promise<StoryResponse[]> {
  const res = await apiClient.get<StoryResponse[]>(STORIES.MY_STORIES);
  return res.data;
}

/**
 * Mark a story as viewed.
 * POST /api/stories/{id}/view
 */
export async function viewStory(id: string): Promise<void> {
  await apiClient.post(STORIES.view(id));
}

/**
 * Create a new story.
 * POST /api/stories/
 */
export async function createStory(payload: CreateStoryPayload): Promise<StoryResponse> {
  const res = await apiClient.post<StoryResponse>(STORIES.CREATE, payload);
  return res.data;
}

/**
 * Fetch story creation templates.
 * GET /api/stories/templates/list
 */
export async function getTemplates(): Promise<StoryTemplate[]> {
  const res = await apiClient.get<StoryTemplate[]>(STORIES.TEMPLATES);
  return res.data;
}
