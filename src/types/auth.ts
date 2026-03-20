export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  verification_code: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  birthday?: string;
  city_id?: number | null;
  membership?: string;
  is_verified: boolean;
  onboarding_completed?: boolean;
  travel_styles?: string[];
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  gender?: string;
  birthday?: string;
  city_id?: number | null;
  travel_styles?: string[];
  onboarding_completed?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationCode: (email: string, type: 'register' | 'forgot-password') => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}
