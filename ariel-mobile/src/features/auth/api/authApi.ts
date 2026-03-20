import apiClient from '@/shared/api/client';
import { AUTH } from '@/shared/api/endpoints';
import { User, UserCreate, UserProfileUpdate } from '@/shared/types/user';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>(AUTH.LOGIN, { email, password });
    return data;
  },

  register: async (payload: UserCreate): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<RegisterResponse>(AUTH.REGISTER, payload);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>(AUTH.ME);
    return data;
  },

  updateProfile: async (payload: UserProfileUpdate): Promise<User> => {
    const { data } = await apiClient.put<User>(AUTH.PROFILE, payload);
    return data;
  },
};
