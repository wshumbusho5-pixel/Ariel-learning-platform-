import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuth } from '../../../lib/useAuth';
import { authAPI } from '../../../lib/api';

describe('useAuth Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    localStorage.clear();
    useAuth.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuth.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('login', () => {
    it('should set user and token in state', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };
      const mockToken = 'test-token-123';

      useAuth.getState().login(mockUser, mockToken);

      const state = useAuth.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should save token to localStorage', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };
      const mockToken = 'test-token-123';

      useAuth.getState().login(mockUser, mockToken);

      expect(localStorage.getItem('auth_token')).toBe(mockToken);
    });

    it('should update isAuthenticated to true', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };

      useAuth.getState().login(mockUser, 'token');

      expect(useAuth.getState().isAuthenticated).toBe(true);
    });

    it('should set isLoading to false', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };

      useAuth.getState().login(mockUser, 'token');

      expect(useAuth.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Setup logged in state
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };
      useAuth.getState().login(mockUser, 'test-token');
    });

    it('should clear user from state', () => {
      useAuth.getState().logout();

      expect(useAuth.getState().user).toBeNull();
    });

    it('should clear token from state', () => {
      useAuth.getState().logout();

      expect(useAuth.getState().token).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      useAuth.getState().logout();

      expect(useAuth.getState().isAuthenticated).toBe(false);
    });

    it('should remove token from localStorage', () => {
      expect(localStorage.getItem('auth_token')).toBe('test-token');

      useAuth.getState().logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('should set isLoading to false when no token exists', async () => {
      localStorage.clear();

      await useAuth.getState().checkAuth();

      const state = useAuth.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should authenticate user with valid token', async () => {
      localStorage.setItem('auth_token', 'valid-token');

      await useAuth.getState().checkAuth();

      const state = useAuth.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isLoading).toBe(false);
    });

    it('should set token in state from localStorage', async () => {
      localStorage.setItem('auth_token', 'valid-token');

      await useAuth.getState().checkAuth();

      expect(useAuth.getState().token).toBe('valid-token');
    });

    it('should clear state and localStorage on invalid token', async () => {
      localStorage.setItem('auth_token', 'invalid-token');

      await useAuth.getState().checkAuth();

      const state = useAuth.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      localStorage.setItem('auth_token', 'will-cause-error');

      await useAuth.getState().checkAuth();

      const state = useAuth.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should call getCurrentUser API with token', async () => {
      localStorage.setItem('auth_token', 'valid-token');
      const getCurrentUserSpy = vi.spyOn(authAPI, 'getCurrentUser');

      await useAuth.getState().checkAuth();

      expect(getCurrentUserSpy).toHaveBeenCalled();
    });
  });

  describe('State Transitions', () => {
    it('should transition from logged out to logged in', () => {
      const initialState = useAuth.getState();
      expect(initialState.isAuthenticated).toBe(false);

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };
      useAuth.getState().login(mockUser, 'token');

      const loggedInState = useAuth.getState();
      expect(loggedInState.isAuthenticated).toBe(true);
      expect(loggedInState.user).toEqual(mockUser);
    });

    it('should transition from logged in to logged out', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };
      useAuth.getState().login(mockUser, 'token');

      expect(useAuth.getState().isAuthenticated).toBe(true);

      useAuth.getState().logout();

      const loggedOutState = useAuth.getState();
      expect(loggedOutState.isAuthenticated).toBe(false);
      expect(loggedOutState.user).toBeNull();
      expect(loggedOutState.token).toBeNull();
    });

    it('should handle multiple login calls', () => {
      const user1 = {
        id: '1',
        email: 'user1@example.com',
        role: 'user',
        total_points: 50,
        level: 1,
        current_streak: 3,
      };
      const user2 = {
        id: '2',
        email: 'user2@example.com',
        role: 'user',
        total_points: 200,
        level: 5,
        current_streak: 10,
      };

      useAuth.getState().login(user1, 'token1');
      expect(useAuth.getState().user?.email).toBe('user1@example.com');

      useAuth.getState().login(user2, 'token2');
      expect(useAuth.getState().user?.email).toBe('user2@example.com');
      expect(localStorage.getItem('auth_token')).toBe('token2');
    });
  });

  describe('localStorage Synchronization', () => {
    it('should keep localStorage in sync with state on login', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };

      useAuth.getState().login(mockUser, 'sync-token');

      expect(localStorage.getItem('auth_token')).toBe('sync-token');
      expect(useAuth.getState().token).toBe('sync-token');
    });

    it('should keep localStorage in sync with state on logout', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        total_points: 100,
        level: 2,
        current_streak: 5,
      };
      useAuth.getState().login(mockUser, 'sync-token');

      expect(localStorage.getItem('auth_token')).toBe('sync-token');

      useAuth.getState().logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(useAuth.getState().token).toBeNull();
    });
  });
});
