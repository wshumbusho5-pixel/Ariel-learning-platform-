export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  GITHUB = 'github',
}

export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

export enum EducationLevel {
  HIGH_SCHOOL = 'high-school',
  UNIVERSITY = 'university',
  PROFESSIONAL = 'professional',
  SELF_STUDY = 'self-study',
}

export interface UserAISettings {
  provider: string | null;
  model: string | null;
  has_api_key: boolean;
  updated_at: string | null;
}

export interface User {
  id: string | null;
  email: string;
  username: string | null;
  full_name: string | null;
  auth_provider: AuthProvider;
  provider_id: string | null;
  profile_picture: string | null;
  role: UserRole;

  // Education Profile
  education_level: EducationLevel | null;
  year_level: string | null;
  subjects: string[];
  learning_goals: string[];
  study_preferences: string[];
  onboarding_completed: boolean;

  // Gamification
  total_points: number;
  current_streak: number;
  longest_streak: number;
  level: number;

  // Social
  followers: string[];
  following: string[];
  followers_count: number;
  following_count: number;
  bio: string | null;
  is_profile_public: boolean;
  school: string | null;
  courses: string[];

  // Metadata
  is_active: boolean;
  is_verified: boolean;
  is_teacher: boolean;
  is_bot: boolean;
  created_at: string;
  last_login: string | null;
  last_seen: string | null;
  ai_settings: UserAISettings | null;
}

export interface UserCreate {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: Record<string, unknown>;
}

export interface UserProfileUpdate {
  full_name?: string;
  username?: string;
  bio?: string;
  education_level?: EducationLevel;
  year_level?: string;
  subjects?: string[];
  learning_goals?: string[];
  study_preferences?: string[];
  onboarding_completed?: boolean;
}
