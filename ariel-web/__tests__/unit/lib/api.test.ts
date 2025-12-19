import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authAPI, cardsAPI, aiChatAPI } from '../../../lib/api';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ===== AUTH API TESTS =====

  describe('authAPI', () => {
    describe('register', () => {
      it('should register a new user successfully', async () => {
        const result = await authAPI.register(
          'newuser@example.com',
          'password123',
          'newuser',
          'New User'
        );

        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('user');
        expect(result.user.email).toBe('newuser@example.com');
      });

      it('should fail when registering with existing email', async () => {
        await expect(
          authAPI.register('existing@example.com', 'password123')
        ).rejects.toThrow();
      });

      it('should work with minimal data (no username/fullName)', async () => {
        const result = await authAPI.register('minimal@example.com', 'password123');

        expect(result).toHaveProperty('access_token');
        expect(result.user.email).toBe('minimal@example.com');
      });
    });

    describe('login', () => {
      it('should login with correct credentials', async () => {
        const result = await authAPI.login('test@example.com', 'password123');

        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('user');
        expect(result.user.email).toBe('test@example.com');
      });

      it('should fail with incorrect password', async () => {
        await expect(
          authAPI.login('test@example.com', 'wrongpassword')
        ).rejects.toThrow();
      });

      it('should fail with non-existent email', async () => {
        await expect(
          authAPI.login('nonexistent@example.com', 'password123')
        ).rejects.toThrow();
      });
    });

    describe('oauthLogin', () => {
      it('should login with Google OAuth', async () => {
        const result = await authAPI.oauthLogin('google', 'valid-google-token');

        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('user');
      });

      it('should login with GitHub OAuth', async () => {
        const result = await authAPI.oauthLogin('github', 'valid-github-token');

        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('user');
      });

      it('should fail with invalid provider', async () => {
        await expect(
          authAPI.oauthLogin('facebook' as any, 'some-token')
        ).rejects.toThrow();
      });
    });

    describe('getCurrentUser', () => {
      it('should get current user with valid token', async () => {
        localStorage.setItem('auth_token', 'valid-token');

        const result = await authAPI.getCurrentUser();

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email');
        expect(result.email).toBe('test@example.com');
      });

      it('should fail without auth token', async () => {
        await expect(authAPI.getCurrentUser()).rejects.toThrow();
      });
    });

    describe('updateProfile', () => {
      it('should update user profile', async () => {
        localStorage.setItem('auth_token', 'valid-token');

        const result = await authAPI.updateProfile({
          education_level: 'university',
          subjects: ['Math', 'Physics'],
        });

        expect(result).toHaveProperty('email');
        expect(result.education_level).toBe('university');
      });

      it('should fail without auth token', async () => {
        await expect(
          authAPI.updateProfile({ education_level: 'university' })
        ).rejects.toThrow();
      });
    });
  });

  // ===== CARDS API TESTS =====

  describe('cardsAPI', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
    });

    describe('createCard', () => {
      it('should create a new card', async () => {
        const cardData = {
          question: 'What is TypeScript?',
          answer: 'A typed superset of JavaScript',
          subject: 'Programming',
          difficulty: 'easy',
        };

        const result = await cardsAPI.createCard(cardData);

        expect(result).toHaveProperty('id');
        expect(result.question).toBe(cardData.question);
      });

      it('should fail without auth token', async () => {
        localStorage.clear();

        await expect(
          cardsAPI.createCard({ question: 'Test', answer: 'Test' })
        ).rejects.toThrow();
      });
    });

    describe('getMyDeck', () => {
      it('should get user deck', async () => {
        const result = await cardsAPI.getMyDeck();

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should filter by subject', async () => {
        const result = await cardsAPI.getMyDeck({ subject: 'Geography' });

        expect(Array.isArray(result)).toBe(true);
      });

      it('should fail without auth token', async () => {
        localStorage.clear();

        await expect(cardsAPI.getMyDeck()).rejects.toThrow();
      });
    });

    describe('getCard', () => {
      it('should get card by ID', async () => {
        const result = await cardsAPI.getCard('1');

        expect(result).toHaveProperty('id');
        expect(result.id).toBe('1');
        expect(result).toHaveProperty('question');
        expect(result).toHaveProperty('answer');
      });

      it('should fail for non-existent card', async () => {
        await expect(cardsAPI.getCard('nonexistent')).rejects.toThrow();
      });
    });

    describe('updateCard', () => {
      it('should update card', async () => {
        const updateData = {
          question: 'Updated question',
          difficulty: 'hard',
        };

        const result = await cardsAPI.updateCard('1', updateData);

        expect(result.question).toBe(updateData.question);
        expect(result.difficulty).toBe(updateData.difficulty);
      });

      it('should fail without auth token', async () => {
        localStorage.clear();

        await expect(
          cardsAPI.updateCard('1', { question: 'Updated' })
        ).rejects.toThrow();
      });

      it('should fail for non-existent card', async () => {
        await expect(
          cardsAPI.updateCard('nonexistent', { question: 'Updated' })
        ).rejects.toThrow();
      });
    });

    describe('deleteCard', () => {
      it('should delete card', async () => {
        const result = await cardsAPI.deleteCard('1');

        expect(result).toHaveProperty('message');
      });

      it('should fail without auth token', async () => {
        localStorage.clear();

        await expect(cardsAPI.deleteCard('1')).rejects.toThrow();
      });

      it('should fail for non-existent card', async () => {
        await expect(cardsAPI.deleteCard('nonexistent')).rejects.toThrow();
      });
    });
  });

  // ===== AI CHAT API TESTS =====

  describe('aiChatAPI', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
    });

    describe('sendMessage', () => {
      it('should send message and get response', async () => {
        const result = await aiChatAPI.sendMessage('Hello, AI!');

        expect(result).toHaveProperty('reply');
        expect(result.reply).toContain('Hello, AI!');
        expect(result).toHaveProperty('cards');
      });

      it('should send message with context', async () => {
        const result = await aiChatAPI.sendMessage(
          'Explain this',
          'Context: Learn about React'
        );

        expect(result).toHaveProperty('reply');
      });

      it('should fail without auth token', async () => {
        localStorage.clear();

        await expect(aiChatAPI.sendMessage('Hello')).rejects.toThrow();
      });
    });
  });
});
