import type { User, UpdateProfileData } from '@/types/auth';
import type { Hotel } from '@/types/hotel';
import type { Activity } from '@/types/activity';
import type { Restaurant } from '@/types/restaurant';
import type { City, Country, Region } from '@/types/location';
import type { Trip, TripVersion } from '@/types/trip';
import type {
  AIChatMessage,
  AIChatMessagesResponse,
  AIChatSessionMetadata,
  AIChatSessionsResponse,
  AIChatMessageType,
  SendAIChatMessageRequest,
  SendAIChatMessageResponse,
  S3UploadCredentialsResponse,
} from '@/types/ai-chat';
import type { DestinationSuggestion } from '@/types/destination';

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

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, code: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        verification_code: code,
        code_type: 'register',
      }),
    });
  }

  async sendVerificationCode(email: string, type: 'register' | 'forgot-password') {
    return this.request('/auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code_type: type === 'register' ? 'register' : 'forgot-password',
      }),
    });
  }

  async resetPassword(email: string, code: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        verification_code: code,
        password,
      }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Profile methods
  async getProfile(): Promise<User> {
    const response = await this.request<{ data: User }>('/profile');
    return response.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<void> {
    await this.request('/profile/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Country methods
  async getCountries(): Promise<Country[]> {
    const response = await this.request<{ data: Country[] }>('/countries');
    return response.data;
  }

  // Region methods
  async getRegions(language: string = 'en'): Promise<Region[]> {
    const response = await this.request<{ data: Region[] }>(`/regions?language=${language}`);
    return response.data;
  }

  // Destination search
  async searchDestinations(
    q: string,
    params?: { limit?: number; language?: string },
  ): Promise<DestinationSuggestion[]> {
    const searchParams = new URLSearchParams({ q });
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.language) searchParams.set('language', params.language);

    const response = await this.request<{ data: DestinationSuggestion[] }>(
      `/destinations/search?${searchParams}`,
    );
    return response.data;
  }

  // Hotel methods
  async getHotels(params?: {
    country_id?: number;
    star_rating?: string;
    q?: string;
    city_id?: number;
    destination?: string;
    language?: string;
    include_draft?: boolean;
  }): Promise<Hotel[]> {
    const searchParams = new URLSearchParams();
    if (params?.city_id !== undefined) searchParams.set('city_id', params.city_id.toString());
    if (params?.country_id !== undefined)
      searchParams.set('country_id', params.country_id.toString());
    if (params?.destination) searchParams.set('destination', params.destination);
    if (params?.star_rating) searchParams.set('star_rating', params.star_rating);
    if (params?.q) searchParams.set('q', params.q);
    if (params?.language) searchParams.set('language', params.language);
    if (params?.include_draft) searchParams.set('include_draft', 'true');

    const query = searchParams.toString();
    const endpoint = `/hotels${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: Hotel[] }>(endpoint);
    return response.data;
  }

  async getHotelBySlug(slug: string): Promise<Hotel> {
    const response = await this.request<{ data: Hotel }>(`/hotels/${slug}`);
    return response.data;
  }

  // Activity methods
  async getActivities(params?: {
    city_id?: number;
    category?: string;
    language?: string;
    include_draft?: boolean;
  }): Promise<Activity[]> {
    const searchParams = new URLSearchParams();
    if (params?.city_id !== undefined) searchParams.set('city_id', params.city_id.toString());
    if (params?.category) searchParams.set('category', params.category);
    if (params?.language) searchParams.set('language', params.language);
    if (params?.include_draft) searchParams.set('include_draft', 'true');

    const query = searchParams.toString();
    const endpoint = `/activities${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: Activity[] }>(endpoint);
    return response.data;
  }

  async getActivityBySlug(slug: string): Promise<Activity> {
    const response = await this.request<{ data: Activity }>(`/activities/${slug}`);
    return response.data;
  }

  // Restaurant methods
  async getRestaurants(params?: {
    city_id?: number;
    language?: string;
    include_draft?: boolean;
  }): Promise<Restaurant[]> {
    const searchParams = new URLSearchParams();
    if (params?.city_id !== undefined) searchParams.set('city_id', params.city_id.toString());
    if (params?.language) searchParams.set('language', params.language);
    if (params?.include_draft) searchParams.set('include_draft', 'true');

    const query = searchParams.toString();
    const endpoint = `/restaurants${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: Restaurant[] }>(endpoint);
    return response.data;
  }

  async getRestaurantBySlug(slug: string): Promise<Restaurant> {
    const response = await this.request<{ data: Restaurant }>(`/restaurants/${slug}`);
    return response.data;
  }

  // City methods
  async getCities(language: string = 'en'): Promise<City[]> {
    const response = await this.request<{ data: City[] }>(`/cities?language=${language}`);
    return response.data;
  }

  async searchCities(q: string, language: string = 'en'): Promise<City[]> {
    const response = await this.request<{ data: City[] }>(
      `/cities?q=${encodeURIComponent(q)}&language=${language}`,
    );
    return response.data;
  }

  async getCityById(id: number): Promise<City> {
    const response = await this.request<{ data: City }>(`/cities/${id}`);
    return response.data;
  }

  // Trip methods
  async getTrips(params?: {
    status?: string;
    page?: number;
    per_page?: number;
    exclude_canceled?: boolean;
  }): Promise<Trip[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.per_page !== undefined) searchParams.set('per_page', params.per_page.toString());
    if (params?.exclude_canceled !== undefined)
      searchParams.set('exclude_canceled', params.exclude_canceled.toString());

    const query = searchParams.toString();
    const endpoint = `/trip/list${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: Trip[] }>(endpoint);
    return response.data;
  }

  async getTripById(id: number): Promise<Trip> {
    const response = await this.request<{ data: Trip }>(`/trip/${id}`);
    return response.data;
  }

  async getCurrentTripVersion(id: number): Promise<TripVersion> {
    const response = await this.request<{ data: TripVersion }>(`/trip/${id}/current-version`);
    return response.data;
  }

  async createTrip(currentVersion: Partial<TripVersion> = {}): Promise<Trip> {
    const response = await this.request<{ data: Trip }>('/trip/create', {
      method: 'POST',
      body: JSON.stringify({
        current_version: currentVersion,
      }),
    });
    return response.data;
  }

  // AI Chat methods
  async listChatSessions(): Promise<AIChatSessionMetadata[]> {
    const response = await this.request<AIChatSessionsResponse>('/ai-chat/sessions');
    return response.data ?? [];
  }

  async createChatSessionForTrip(tripId: number): Promise<AIChatSessionMetadata> {
    const response = await this.request<{ data: AIChatSessionMetadata }>(
      '/ai-chat/create-session-for-trip',
      {
        method: 'POST',
        body: JSON.stringify({ trip_id: tripId }),
      },
    );
    return response.data as AIChatSessionMetadata;
  }

  async sendMessage(
    tripId: number,
    payload: SendAIChatMessageRequest,
  ): Promise<SendAIChatMessageResponse> {
    return this.request<SendAIChatMessageResponse>(`/ai-chat/trips/${tripId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
      }),
    });
  }

  async getChatHistory(tripId: number): Promise<AIChatMessage[]> {
    const response = await this.request<AIChatMessagesResponse>(
      `/ai-chat/trips/${tripId}/messages`,
    );
    return response.data ?? [];
  }

  // S3 Direct Upload Methods
  async getS3UploadCredentials(
    sessionId: string,
    mediaType: 'image' | 'audio',
    fileExtension: string,
  ): Promise<S3UploadCredentialsResponse> {
    return this.request<S3UploadCredentialsResponse>('/media/get-upload-credentials', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        media_type: mediaType,
        file_extension: fileExtension,
      }),
    });
  }

  async uploadToS3(
    uploadUrl: string,
    formData: Record<string, string>,
    file: File,
  ): Promise<string> {
    const form = new FormData();

    // Add all form fields from backend first (order matters for S3)
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value);
    });

    // Add Content-Type field explicitly (required by S3 policy)
    // This must match the file's actual MIME type
    form.append('Content-Type', file.type);

    // Add the file last (required by S3)
    form.append('file', file);

    console.log('[ApiClient] Uploading to S3:', {
      uploadUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      formFields: Object.keys(formData),
    });

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
      // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Upload failed');
      console.error('[ApiClient] S3 upload failed:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: text,
      });
      throw new Error(`S3 upload failed: ${text}`);
    }

    console.log('[ApiClient] S3 upload successful');

    // Extract the file URL from the Location header or construct it
    const location = response.headers.get('Location');
    if (location) {
      return location;
    }

    // If no Location header, construct URL from upload URL and key
    const key = formData['key'];
    const baseUrl = uploadUrl.split('?')[0];
    return `${baseUrl}/${key}`;
  }

  async sendAudioMessage(tripId: number, mediaUrl: string): Promise<SendAIChatMessageResponse> {
    return this.sendMessage(tripId, {
      message_type: 'audio' as AIChatMessageType,
      media_url: mediaUrl,
    });
  }
}

export const apiClient = new ApiClient();
