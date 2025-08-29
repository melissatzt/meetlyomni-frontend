import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loginApi } from '../authApi';
import type { LoginCredentials, User } from '../types';

// Reset environment variable
vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('authApi', () => {
  const mockCredentials: LoginCredentials = {
    email: 'test@example.com',
    password: 'password',
  };

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('loginApi', () => {
    it('should make POST request to correct URL with credentials', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ user: mockUser }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await loginApi(mockCredentials);

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockCredentials),
      });
    });

    it('should use default API_BASE_URL when not provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ user: mockUser }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await loginApi(mockCredentials);

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
    });

    it('should return user data on successful login', async () => {
      const expectedResponse = { user: mockUser };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(expectedResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await loginApi(mockCredentials);

      expect(result).toEqual(expectedResponse);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });

    it('should throw error with message from response on 401', async () => {
      const errorResponse = { error: 'Invalid credentials' };
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue(errorResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(loginApi(mockCredentials)).rejects.toThrow('Invalid credentials');
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });

    it('should use JSON.stringify(err) when response has no error message', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(loginApi(mockCredentials)).rejects.toThrow('{}');
    });

    it('should throw friendly message when JSON parsing fails', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(loginApi(mockCredentials)).rejects.toThrow('Login failed (error code: 400)');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(loginApi(mockCredentials)).rejects.toThrow('Network error');
    });

    it('should handle different HTTP error codes', async () => {
      const testCases = [
        { status: 400, expectedError: '{}' },
        { status: 403, expectedError: '{}' },
        { status: 404, expectedError: '{}' },
        { status: 500, expectedError: '{}' },
      ];

      for (const testCase of testCases) {
        mockFetch.mockClear();
        const mockResponse = {
          ok: false,
          status: testCase.status,
          json: vi.fn().mockResolvedValue({}),
        };
        mockFetch.mockResolvedValue(mockResponse);

        await expect(loginApi(mockCredentials)).rejects.toThrow(testCase.expectedError);
      }
    });

    it('should send credentials with every request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ user: mockUser }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await loginApi(mockCredentials);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.credentials).toBe('include');
    });

    it('should send correct Content-Type header', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ user: mockUser }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await loginApi(mockCredentials);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });
});
