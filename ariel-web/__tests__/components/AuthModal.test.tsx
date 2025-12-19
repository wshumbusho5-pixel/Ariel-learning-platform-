import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '../../components/AuthModal';
import { authAPI } from '../../lib/api';

describe('AuthModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <AuthModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
    });

    it('should show login title in login mode', () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('should render login form elements', () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch from login to register mode', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const signUpButton = screen.getByText('Sign up');
      await userEvent.click(signUpButton);

      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('johndoe')).toBeInTheDocument();
    });

    it('should switch from register to login mode', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Switch to register
      await userEvent.click(screen.getByText('Sign up'));
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();

      // Switch back to login
      await userEvent.click(screen.getByText('Sign in'));
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('John Doe')).not.toBeInTheDocument();
    });

    it('should clear error when switching modes', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Trigger an error by submitting with short password
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'short');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Switch mode should clear error
      await userEvent.click(screen.getByText('Sign up'));

      expect(screen.queryByText(/Password must be at least 8 characters/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission - Login', () => {
    it('should submit login form successfully', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should save token to localStorage on successful login', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeTruthy();
      });
    });

    it('should have submit button that processes login', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      expect(submitButton).toBeInTheDocument();

      await userEvent.click(submitButton);

      // Verify the submission completed successfully
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show error on failed login', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(screen.getByText(/Incorrect email or password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - Register', () => {
    it('should submit register form successfully', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Switch to register mode
      await userEvent.click(screen.getByText('Sign up'));

      await userEvent.type(screen.getByPlaceholderText('John Doe'), 'Test User');
      await userEvent.type(screen.getByPlaceholderText('johndoe'), 'testuser');
      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'newuser@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error when registering with existing email', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      await userEvent.click(screen.getByText('Sign up'));

      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'existing@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(screen.getByText(/User with this email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should show error for password less than 8 characters', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'short');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for password longer than 72 characters', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const longPassword = 'a'.repeat(73);

      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), longPassword);
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(screen.getByText(/Password is too long/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user types in email field', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Trigger error
      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'short');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Type in email field should clear error
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'new@example.com');

      expect(screen.queryByText(/Password must be at least 8 characters/i)).not.toBeInTheDocument();
    });

    it('should clear error when user types in password field', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Trigger error
      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'short');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Type in password field should clear error
      const passwordInput = screen.getByPlaceholderText('••••••••');
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'newpassword123');

      expect(screen.queryByText(/Password must be at least 8 characters/i)).not.toBeInTheDocument();
    });
  });

  describe('Modal Closing', () => {
    it('should close modal when close button is clicked', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const closeButton = screen.getByRole('button', { name: '' }); // SVG button
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear all fields when modal closes', async () => {
      const { rerender } = render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Fill in form
      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');

      // Close modal
      const closeButton = screen.getByRole('button', { name: '' });
      await userEvent.click(closeButton);

      // Reopen modal
      rerender(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });

    it('should reset to login mode when modal reopens', async () => {
      const { rerender } = render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Switch to register mode
      await userEvent.click(screen.getByText('Sign up'));
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();

      // Close modal
      rerender(
        <AuthModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Reopen modal
      rerender(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    });
  });

  describe('OAuth', () => {
    it('should show alert when Google OAuth button is clicked', async () => {
      const alertMock = vi.fn();
      global.alert = alertMock;

      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const googleButton = screen.getByText('Google').closest('button');
      if (googleButton) {
        await userEvent.click(googleButton);
      }

      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('google OAuth will be implemented')
      );
    });

    it('should show alert when GitHub OAuth button is clicked', async () => {
      const alertMock = vi.fn();
      global.alert = alertMock;

      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const githubButton = screen.getByText('GitHub').closest('button');
      if (githubButton) {
        await userEvent.click(githubButton);
      }

      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('github OAuth will be implemented')
      );
    });
  });

  describe('Error Message Display', () => {
    it('should display error message in red box', async () => {
      render(
        <AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'short');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        const errorElement = screen.getByText(/Password must be at least 8 characters/i);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.className).toContain('text-red-700');
      });
    });
  });
});
