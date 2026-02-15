import type { User } from '@/types/auth';
import type { Hotel, City } from '@/types/hotel';

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

  // Hotel methods
  async getHotels(params?: {
    skip?: number;
    limit?: number;
    city_id?: number;
    language?: string;
  }): Promise<Hotel[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.set('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params?.city_id !== undefined) searchParams.set('city_id', params.city_id.toString());
    if (params?.language) searchParams.set('language', params.language);

    const query = searchParams.toString();
    const endpoint = `/hotels${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: { items: Hotel[] } }>(endpoint);
    return response.data.items;
  }

  async getRecommendedHotels(language: string = 'en'): Promise<Hotel[]> {
    const response = await this.request<{ data: Hotel[] }>(
      `/hotels/recommend?language=${language}`
    );
    return response.data;
  }

  async getHotelById(hotelId: number | string): Promise<Hotel> {
    const response = await this.request<{ data: Hotel }>(
      `/hotels/${hotelId}`
    );
    return response.data;
  }

  // City methods
  async getCities(language: string = 'en'): Promise<City[]> {
    const response = await this.request<{ data: City[] }>(
      `/cities?language=${language}`
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
