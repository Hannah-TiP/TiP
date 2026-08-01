import type { PaginatedData, PaginatedResult } from '@/types/common';
import { toPaginatedResult } from '@/types/common';
import type {
  User,
  UpdateProfileData,
  DeleteAccountRequest,
  DeleteAccountResponse,
} from '@/types/auth';
import type { Lang } from '@/contexts/LanguageContext';
import type { Hotel } from '@/types/hotel';
import type { Activity, ActivityKind } from '@/types/activity';
import type { Restaurant } from '@/types/restaurant';
import type { SignatureJourney } from '@/types/signatureJourney';
import type {
  MagazineArticle,
  MagazineArticleDetail,
  MagazineArticleType,
  MagazineFacetOptions,
} from '@/types/magazine';
import type { City, Country, Region } from '@/types/location';
import { magazineArticlesQuery, type MagazineListFilters } from '@/lib/magazine-list';
import type {
  Trip,
  CreateTripFromHotelResponse,
  TripVersion,
  TripWithActiveQuote,
} from '@/types/trip';
import type { QuoteWithVersion } from '@/types/quote';
import type {
  ShareTripRequest,
  ShareTripResponse,
  SharedTripDetail,
  SharedTripItem,
} from '@/types/trip-share';
import type { CheckoutSessionResponse, WidgetConfig } from '@/types/payment';
import type {
  AIChatMessage,
  AIChatMessagesResponse,
  AIChatSessionMetadata,
  AIChatSessionsResponse,
  AIChatSessionWithTrip,
  AIChatMessageType,
  SendAIChatMessageRequest,
  SendAIChatMessageResponse,
  RequestHumanResponse,
  S3UploadCredentialsResponse,
} from '@/types/ai-chat';
import type { DestinationSuggestion } from '@/types/destination';
import type { MemberFreeNightSummary } from '@/types/free-night';
import type {
  ClaimReferralResponse,
  EligibleCredit,
  MyReferralsResponse,
  RedeemPromoCodeResponse,
  StayCredit,
} from '@/types/stay-credit';
import { REDEEM_ERROR_CODE_MAP, RedeemPromoCodeError } from '@/types/stay-credit';
import type {
  CreateReview,
  ReviewAggregate,
  ReviewEntityType,
  ReviewListResponse,
  ReviewWithAuthor,
  UpdateReview,
} from '@/types/review';

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

  async sendVerificationCode(
    email: string,
    type: 'register' | 'forgot-password' | 'account_deletion',
  ) {
    return this.request('/auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({
        email,
        // The proxy forwards `code_type` verbatim; every union member maps 1:1
        // to a backend code_type.
        code_type: type,
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

  // Self-service account deletion (SMA-187/188). Re-auth payload: password
  // accounts send `password`, social-only accounts send a fresh
  // `verification_code` (code_type `account_deletion`). `language` is
  // forwarded to the backend so re-auth error messages come back localized.
  async deleteAccount(
    payload: DeleteAccountRequest,
    language: Lang = 'en',
  ): Promise<DeleteAccountResponse> {
    const response = await this.request<{ data: DeleteAccountResponse }>(
      `/me/delete?language=${language}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/me/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async getMyCredits(): Promise<StayCredit[]> {
    const response = await this.request<{ data: StayCredit[] }>('/me/credits');
    return response.data ?? [];
  }

  async getMyFreeNights(): Promise<MemberFreeNightSummary> {
    const response = await this.request<{ data: MemberFreeNightSummary }>('/me/free-nights');
    return response.data;
  }

  async getMyReferrals(): Promise<MyReferralsResponse> {
    const response = await this.request<{ data: MyReferralsResponse }>('/me/referrals');
    return response.data;
  }

  // Redeem an admin-created promo/campaign code, crediting the redeemer's
  // wallet. On failure throws a RedeemPromoCodeError carrying a distinct
  // code so the UI can show the right localized message.
  async redeemPromoCode(code: string): Promise<RedeemPromoCodeResponse> {
    const response = await fetch(`${this.baseUrl}/me/credits/redeem-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    });

    const payload = await response
      .json()
      .catch(() => ({}) as { code?: number; message?: string; data?: RedeemPromoCodeResponse });

    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      const mapped = payload.code ? REDEEM_ERROR_CODE_MAP[payload.code] : undefined;
      throw new RedeemPromoCodeError(
        mapped ?? 'generic',
        payload.message || 'Could not redeem this code.',
      );
    }

    return payload.data as RedeemPromoCodeResponse;
  }

  async claimReferral(code: string): Promise<ClaimReferralResponse> {
    const response = await this.request<{ data: ClaimReferralResponse }>('/me/referrals/claim', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return response.data;
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

  // Persist the logged-in user's UI language to their account so the backend's
  // request-language resolution (and transactional emails) use the right locale.
  async updateLanguagePreference(language: Lang): Promise<void> {
    const body: UpdateProfileData = { language_preference: language };
    await this.request('/profile/update', {
      method: 'POST',
      body: JSON.stringify(body),
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
    const searchParams = new URLSearchParams();
    // An empty query is valid — it returns the top bookable destinations.
    if (q.trim()) searchParams.set('q', q.trim());
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
    region_id?: number;
    city_id?: number;
    star_rating?: string;
    q?: string;
    language?: string;
    include_draft?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResult<Hotel>> {
    const searchParams = new URLSearchParams();
    if (params?.city_id !== undefined) searchParams.set('city_id', params.city_id.toString());
    if (params?.country_id !== undefined)
      searchParams.set('country_id', params.country_id.toString());
    if (params?.region_id !== undefined) searchParams.set('region_id', params.region_id.toString());
    if (params?.star_rating) searchParams.set('star_rating', params.star_rating);
    if (params?.q) searchParams.set('q', params.q);
    if (params?.language) searchParams.set('language', params.language);
    if (params?.include_draft) searchParams.set('include_draft', 'true');
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.per_page !== undefined) searchParams.set('per_page', params.per_page.toString());

    const query = searchParams.toString();
    const endpoint = `/hotels${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: PaginatedData<Hotel> }>(endpoint);
    return toPaginatedResult(response.data);
  }

  async getHotelBySlug(slug: string, language?: string): Promise<Hotel> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: Hotel }>(`/hotels/${slug}${query}`);
    return response.data;
  }

  async getHotelById(id: number, language?: string): Promise<Hotel> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: Hotel }>(`/hotels/by-id/${id}${query}`);
    return response.data;
  }

  // Activity methods
  async getActivities(params?: {
    city_id?: number;
    category?: string;
    kind?: ActivityKind;
    language?: string;
    include_draft?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResult<Activity>> {
    const searchParams = new URLSearchParams();
    if (params?.city_id !== undefined) searchParams.set('city_id', params.city_id.toString());
    if (params?.category) searchParams.set('category', params.category);
    if (params?.kind) searchParams.set('kind', params.kind);
    if (params?.language) searchParams.set('language', params.language);
    if (params?.include_draft) searchParams.set('include_draft', 'true');
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.per_page !== undefined) searchParams.set('per_page', params.per_page.toString());

    const query = searchParams.toString();
    const endpoint = `/activities${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: PaginatedData<Activity> }>(endpoint);
    return toPaginatedResult(response.data);
  }

  async getActivityBySlug(slug: string, language?: string): Promise<Activity> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: Activity }>(`/activities/${slug}${query}`);
    return response.data;
  }

  async getActivityById(id: number, language?: string): Promise<Activity> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: Activity }>(`/activities/by-id/${id}${query}`);
    return response.data;
  }

  // Signature journey methods
  async getSignatureJourneys(params?: {
    city_id?: number;
    /** Free-text search over journey titles AND city names, EN + KR (SMA-229). */
    q?: string;
    language?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResult<SignatureJourney>> {
    const searchParams = new URLSearchParams();
    if (params?.city_id !== undefined) searchParams.set('city_id', params.city_id.toString());
    if (params?.q) searchParams.set('q', params.q);
    if (params?.language) searchParams.set('language', params.language);
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.per_page !== undefined) searchParams.set('per_page', params.per_page.toString());

    const query = searchParams.toString();
    const endpoint = `/signature-journeys${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: PaginatedData<SignatureJourney> }>(endpoint);
    return toPaginatedResult(response.data);
  }

  async getSignatureJourneyBySlug(slug: string, language?: string): Promise<SignatureJourney> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: SignatureJourney }>(
      `/signature-journeys/${slug}${query}`,
    );
    return response.data;
  }

  // Magazine methods
  /**
   * Browser path for a magazine article detail (client-island needs). `type` is
   * the SINGULAR backend enum — the plural URL segment must be mapped to it by
   * the caller (via `typeEnumFromSegment`). Forwards the UI language as
   * `?language=`.
   */
  async getMagazineArticle(
    type: MagazineArticleType,
    slug: string,
    lang?: string,
  ): Promise<MagazineArticleDetail> {
    const query = lang ? `?language=${lang}` : '';
    const response = await this.request<{ data: MagazineArticleDetail }>(
      `/magazine/articles/${type}/${slug}${query}`,
    );
    return response.data;
  }

  /**
   * List published magazine articles with facet filters (index page). Maps the
   * filter state to query params via {@link magazineArticlesQuery} and resolves
   * a slim `PaginatedResult` for the shared infinite-list hook.
   */
  async getMagazineArticles(
    filters: MagazineListFilters = {},
  ): Promise<PaginatedResult<MagazineArticle>> {
    const query = magazineArticlesQuery(filters).toString();
    const endpoint = `/magazine/articles${query ? `?${query}` : ''}`;
    const response = await this.request<{ data: PaginatedData<MagazineArticle> }>(endpoint);
    return toPaginatedResult(response.data);
  }

  /** Filter options (country/city/brand/tag) among published magazine articles. */
  async getMagazineFacets(lang?: string): Promise<MagazineFacetOptions> {
    const query = lang ? `?language=${lang}` : '';
    const response = await this.request<{ data: MagazineFacetOptions }>(`/magazine/facets${query}`);
    return response.data;
  }

  // Restaurant methods
  async getRestaurants(params?: {
    city_id?: number;
    language?: string;
    include_draft?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResult<Restaurant>> {
    const searchParams = new URLSearchParams();
    if (params?.city_id !== undefined) searchParams.set('city_id', params.city_id.toString());
    if (params?.language) searchParams.set('language', params.language);
    if (params?.include_draft) searchParams.set('include_draft', 'true');
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.per_page !== undefined) searchParams.set('per_page', params.per_page.toString());

    const query = searchParams.toString();
    const endpoint = `/restaurants${query ? `?${query}` : ''}`;

    const response = await this.request<{ data: PaginatedData<Restaurant> }>(endpoint);
    return toPaginatedResult(response.data);
  }

  async getRestaurantBySlug(slug: string, language?: string): Promise<Restaurant> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: Restaurant }>(`/restaurants/${slug}${query}`);
    return response.data;
  }

  async getRestaurantById(id: number, language?: string): Promise<Restaurant> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: Restaurant }>(`/restaurants/by-id/${id}${query}`);
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

  async getCityById(id: number, language?: string): Promise<City> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: City }>(`/cities/${id}${query}`);
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

  async getTripById(id: number): Promise<TripWithActiveQuote> {
    const response = await this.request<{ data: TripWithActiveQuote }>(`/trip/${id}`);
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

  /**
   * Create a draft trip seeded with a hotel as the accommodation preference,
   * plus the AI chat session for that trip. Used by the hotel detail page's
   * Reserve / Ask Concierge CTAs.
   */
  async createTripFromHotel(payload: {
    hotel_id: number;
    start_date?: string;
    end_date?: string;
    adults?: number;
  }): Promise<CreateTripFromHotelResponse> {
    const response = await this.request<{ data: CreateTripFromHotelResponse }>(
      '/trips/from-hotel',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return response.data;
  }

  /**
   * Submit a fully-specified hotel-anchored trip request directly to the
   * concierge team. Lands the trip in WAITING_FOR_PROPOSAL status and seeds
   * the chat thread with a confirmation message — no AI back-and-forth.
   * Used by the hotel detail page's Submit Request CTA.
   */
  async submitRequestFromHotel(payload: {
    hotel_id: number;
    start_date: string;
    end_date: string;
    adults: number;
    kids: number;
  }): Promise<CreateTripFromHotelResponse> {
    const response = await this.request<{ data: CreateTripFromHotelResponse }>(
      '/trips/submit-request-from-hotel',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return response.data;
  }

  // Trip sharing methods
  /**
   * Share a trip by email (max 10 recipients). Owners set any visibility;
   * recipients who reshare cannot escalate beyond their own permissions —
   * the backend clamps and echoes the applied settings.
   */
  async shareTrip(tripId: number, payload: ShareTripRequest): Promise<ShareTripResponse> {
    const response = await this.request<{ data: ShareTripResponse }>(`/trip/${tripId}/share`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  /** List trips shared TO the current user. */
  async getSharedTrips(): Promise<SharedTripItem[]> {
    const response = await this.request<{ data: SharedTripItem[] }>('/me/shared-trips');
    return response.data;
  }

  /** Read-only detail of a single shared trip (auth-gated server-side). */
  async getSharedTripDetail(tripId: number): Promise<SharedTripDetail> {
    const response = await this.request<{ data: SharedTripDetail }>(`/shared-trips/${tripId}`);
    return response.data;
  }

  // Quote methods
  async getQuote(id: number): Promise<QuoteWithVersion> {
    const response = await this.request<{ data: QuoteWithVersion }>(`/quotes/${id}`);
    return response.data;
  }

  /**
   * Fetch the most recent quote for a trip the caller owns.
   *
   * Backend `/api/v2/quotes?trip_id=...` returns quotes sorted by id desc,
   * so the latest is `data[0]`. Returns `null` when the trip has no quotes
   * yet — callers can render conditionally without distinguishing missing
   * vs. empty.
   */
  async getLatestQuoteForTrip(tripId: number): Promise<QuoteWithVersion | null> {
    const response = await this.request<{ data: QuoteWithVersion[] }>(`/quotes?trip_id=${tripId}`);
    return response.data[0] ?? null;
  }

  // Stay credits on quotes
  async listEligibleCreditsForQuote(quoteId: number): Promise<EligibleCredit[]> {
    const response = await this.request<{ data: EligibleCredit[] }>(
      `/quotes/${quoteId}/eligible-credits`,
    );
    return response.data ?? [];
  }

  async applyQuoteCredit(quoteId: number, creditId: number): Promise<QuoteWithVersion> {
    const response = await this.request<{ data: QuoteWithVersion }>(
      `/quotes/${quoteId}/credits/${creditId}`,
      { method: 'POST' },
    );
    return response.data;
  }

  async removeQuoteCredit(quoteId: number, creditId: number): Promise<QuoteWithVersion> {
    const response = await this.request<{ data: QuoteWithVersion }>(
      `/quotes/${quoteId}/credits/${creditId}`,
      { method: 'DELETE' },
    );
    return response.data;
  }

  /**
   * Complete a SENT quote whose total is 0 (fully covered by credits) —
   * marks it PAID without a Flywire checkout (SMA-237).
   */
  async completeZeroTotalQuote(quoteId: number): Promise<QuoteWithVersion> {
    const response = await this.request<{ data: QuoteWithVersion }>(
      `/quotes/${quoteId}/zero-total-payment`,
      { method: 'POST' },
    );
    return response.data;
  }

  // Payment methods (Flywire checkout)
  async createCheckoutSession(quoteId: number): Promise<CheckoutSessionResponse> {
    const response = await this.request<{ data: CheckoutSessionResponse }>(
      `/quotes/${quoteId}/checkout-session`,
      { method: 'POST' },
    );
    return response.data;
  }

  async getWidgetConfig(paymentId: number): Promise<WidgetConfig> {
    const response = await this.request<{ data: WidgetConfig }>(
      `/payments/${paymentId}/widget-config`,
    );
    return response.data;
  }

  // AI Chat methods
  async listChatSessions(): Promise<AIChatSessionWithTrip[]> {
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

  async requestHumanConcierge(tripId: number): Promise<RequestHumanResponse> {
    const response = await this.request<{ data: RequestHumanResponse }>(
      `/ai-chat/trips/${tripId}/request-human`,
      { method: 'POST' },
    );
    return response.data;
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

  // Wishlist methods
  async getWishlist(language?: string): Promise<Hotel[]> {
    const query = language ? `?language=${language}` : '';
    const response = await this.request<{ data: Hotel[] }>(`/wishlist${query}`);
    return response.data;
  }

  async getWishlistIds(): Promise<number[]> {
    const response = await this.request<{ data: number[] }>('/wishlist/ids');
    return response.data;
  }

  async addToWishlist(hotelId: number): Promise<void> {
    await this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ hotel_id: hotelId }),
    });
  }

  async removeFromWishlist(hotelId: number): Promise<void> {
    await this.request(`/wishlist/${hotelId}`, {
      method: 'DELETE',
    });
  }

  // Review methods
  async getReviewsByEntity(
    entityType: ReviewEntityType,
    entityId: number,
  ): Promise<ReviewListResponse> {
    const response = await this.request<{ data: ReviewListResponse }>(
      `/reviews/by-entity/${entityType}/${entityId}`,
    );
    return response.data;
  }

  async getReviewAggregates(
    entityType: ReviewEntityType,
    entityIds: number[],
  ): Promise<Record<number, ReviewAggregate>> {
    if (entityIds.length === 0) return {};
    const searchParams = new URLSearchParams({
      entity_type: entityType,
      entity_ids: entityIds.join(','),
    });
    const response = await this.request<{ data: Record<number, ReviewAggregate> }>(
      `/reviews/aggregates?${searchParams.toString()}`,
    );
    return response.data;
  }

  async getReview(reviewId: number): Promise<ReviewWithAuthor> {
    const response = await this.request<{ data: ReviewWithAuthor }>(`/reviews/${reviewId}`);
    return response.data;
  }

  async createReview(payload: CreateReview): Promise<ReviewWithAuthor> {
    const response = await this.request<{ data: ReviewWithAuthor }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async updateReview(reviewId: number, payload: UpdateReview): Promise<ReviewWithAuthor> {
    const response = await this.request<{ data: ReviewWithAuthor }>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async deleteReview(reviewId: number): Promise<void> {
    await this.request(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
