import type { User } from '@/types/auth';

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async login(email: string, password: string, deviceId: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, device_id: deviceId }),
    });
  }

  async register(email: string, password: string, deviceId: string, code: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        device_id: deviceId,
        verification_code: code,
        code_type: 'register'
      }),
    });
  }

  async sendVerificationCode(email: string, type: 'register' | 'forgot-password') {
    return this.request('/auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code_type: type === 'register' ? 'register' : 'forgot-password'
      }),
    });
  }

  async resetPassword(email: string, code: string, password: string, deviceId: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        verification_code: code,
        password,
        device_id: deviceId
      }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }
}

export const apiClient = new ApiClient();
