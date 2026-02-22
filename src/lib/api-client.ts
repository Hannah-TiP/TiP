import type { User } from '@/types/auth';
import type { Hotel, City } from '@/types/hotel';
import type {
  CreateSessionResponse,
  SendMessageResponse,
  ChatHistoryResponse,
  MessageType,
  S3UploadCredentialsResponse,
  AnalyzeImageResponse,
  TranscribeAudioResponse,
} from '@/types/ai-chat';
import type { Trip, TripDetail } from '@/types/trip';

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
    page?: number;
    per_page?: number;
    city_id?: number;
    language?: string;
  }): Promise<Hotel[]> {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.per_page !== undefined) searchParams.set('per_page', params.per_page.toString());
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
    if (params?.exclude_canceled !== undefined) searchParams.set('exclude_canceled', params.exclude_canceled.toString());

    const query = searchParams.toString();
    const endpoint = `/trip/list${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: { items: Trip[] } }>(endpoint);
    return response.data.items;
  }

  async getTripById(id: number): Promise<TripDetail> {
    const response = await this.request<{ data: TripDetail }>(`/trip/${id}`);
    return response.data;
  }

  // AI Chat methods
  async createChatSession(language: string = 'en'): Promise<CreateSessionResponse> {
    return this.request<CreateSessionResponse>('/ai-chat/create-session', {
      method: 'POST',
      body: JSON.stringify({ language }),
    });
  }

  async sendMessage(
    sessionId: string,
    content: string,
    messageType: MessageType = 'text'
  ): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>('/ai-chat/message', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        content,
        message_type: messageType,
      }),
    });
  }

  async getChatHistory(
    sessionId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<ChatHistoryResponse> {
    return this.request<ChatHistoryResponse>(
      `/ai-chat/history/${sessionId}?page=${page}&per_page=${perPage}`
    );
  }

  // S3 Direct Upload Methods
  async getS3UploadCredentials(
    sessionId: string,
    mediaType: 'image' | 'audio',
    fileExtension: string
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
    file: File
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
      formFields: Object.keys(formData)
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
        responseBody: text
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

  async analyzeImageUrl(
    sessionId: string,
    mediaUrl: string,
    width?: number,
    height?: number,
    filename?: string
  ): Promise<AnalyzeImageResponse> {
    return this.request<AnalyzeImageResponse>('/media/analyze-image', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        media_url: mediaUrl,
        width,
        height,
        filename,
      }),
    });
  }

  async transcribeAudioUrl(
    sessionId: string,
    mediaUrl: string,
    duration?: number,
    filename?: string
  ): Promise<TranscribeAudioResponse> {
    return this.request<TranscribeAudioResponse>('/media/transcribe-audio', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        media_url: mediaUrl,
        duration,
        filename,
      }),
    });
  }
}

export const apiClient = new ApiClient();
