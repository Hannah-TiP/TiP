# 🔐 Authentication Architecture & Context

**Last Updated**: February 15, 2026 (Evening)
**Status**: ✅ Fully Functional (Local & Production)

---

## Overview

TiP uses a secure JWT-based authentication system with Next.js API routes acting as a proxy layer between the frontend and the FastAPI backend. This architecture provides several benefits:

- **Security**: httpOnly cookies prevent XSS attacks
- **Separation of Concerns**: Frontend doesn't manage sensitive tokens directly
- **Flexibility**: Easy to switch between local and production backends
- **Consistency**: Single API client interface for all requests

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                         │
│  • React Components (sign-in, register, forgot-password)        │
│  • AuthContext (global auth state management)                   │
│  • API Client (frontend wrapper for /api calls)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ fetch('/api/auth/login')
                             │ credentials: 'include'
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes (Proxy)                    │
│  • src/app/api/auth/login/route.ts                             │
│  • src/app/api/auth/register/route.ts                          │
│  • src/app/api/auth/me/route.ts                                │
│  • Reads API_BASE_URL from .env                                │
│  • Sets/reads httpOnly cookies                                 │
│  • Proxies to backend with proper headers                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ fetch(API_BASE_URL + '/api/v1/auth/login')
                             │ Bearer token in Authorization header
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│  • tip-backend/app/api/client/v1/auth.py                        │
│  • Returns ApiResponse wrapped JSON                             │
│  • JWT token generation and validation                          │
│  • MySQL user database                                          │
│  • Email verification via Brevo                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Implementation Details

### 1. Backend Response Structure

**⚠️ IMPORTANT**: The backend wraps ALL responses in an `ApiResponse` format:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer"
  }
}
```

**Frontend must extract from `responseData.data`, NOT from the root level.**

**✅ Correct:**
```typescript
const responseData = await response.json();
const { access_token, refresh_token } = responseData.data; // ✓
```

**❌ Wrong:**
```typescript
const data = await response.json();
const { access_token, refresh_token } = data; // ✗ Will be undefined!
```

This was a common bug that prevented login from working initially.

---

### 2. Cookie Handling in Next.js API Routes

**⚠️ IMPORTANT**: In Next.js 16 App Router, cookies must be set on the `NextResponse` object, not via `cookies()` from `next/headers`.

**✅ Correct:**
```typescript
// Create response FIRST
const nextResponse = NextResponse.json({ success: true });

// Then set cookies on the response object
nextResponse.cookies.set('access_token', access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 30, // 30 minutes
  path: '/',
});

return nextResponse;
```

**❌ Wrong:**
```typescript
const cookieStore = await cookies();
cookieStore.set('access_token', access_token, {...});
return NextResponse.json({ success: true });
// ✗ Cookies won't be sent to browser!
```

---

## Authentication Flow

### Login Flow

```
1. User enters email/password on /sign-in page
   ↓
2. AuthContext.login() called
   ↓
3. apiClient.login(email, password, deviceId)
   → POST /api/auth/login
   ↓
4. Next.js API route receives request
   → Proxies to ${API_BASE_URL}/api/v1/auth/login
   ↓
5. Backend validates credentials
   → Returns { code: 200, data: { access_token, refresh_token } }
   ↓
6. Next.js API route extracts tokens from responseData.data
   → Sets httpOnly cookies (access_token, refresh_token, device_id)
   → Returns { success: true }
   ↓
7. Frontend receives success
   → Calls refreshUser() to fetch user data
   → POST /api/auth/me
   ↓
8. Next.js /api/auth/me route reads access_token cookie
   → Proxies to backend with Authorization: Bearer {token}
   → Returns user data
   ↓
9. AuthContext updates user state
   → Redirects to /my-page
```

### Auto-Authentication on Page Load

```
1. App loads, AuthContext mounts
   ↓
2. useEffect calls refreshUser()
   → GET /api/auth/me
   ↓
3. Next.js API route reads access_token cookie
   → If no cookie: returns 401
   → If cookie exists: proxies to backend
   ↓
4. Backend validates token and returns user data
   ↓
5. AuthContext sets user state
   → User is authenticated
```

---

## Environment Configuration

### Development (.env.local)

```bash
# Backend URL - Switch between local and production
API_BASE_URL=http://localhost:8000              # Local backend
# API_BASE_URL=http://52.52.21.225:8000        # Production backend

# Client-side API prefix (for frontend API calls)
NEXT_PUBLIC_API_BASE_URL=/api

# Other config
NODE_ENV=development
NEXT_PUBLIC_S3_ENDPOINT=https://tip-s3-bucket.s3.us-west-1.amazonaws.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCvuIeToY749vTwHT861pguNbKruezH8Do
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=9ea03d770ea3aa9e813825b5
```

### Switching Backends

**To use local backend:**
```bash
API_BASE_URL=http://localhost:8000
```

**To use production backend:**
```bash
API_BASE_URL=http://52.52.21.225:8000
```

No other changes needed - all authentication will work seamlessly.

---

## API Routes Reference

### Authentication Endpoints

All routes in `src/app/api/auth/`:

| Route | Method | Purpose | Backend Endpoint |
|-------|--------|---------|------------------|
| `/api/auth/login` | POST | User login | `/api/v1/auth/login` |
| `/api/auth/register` | POST | User registration | `/api/v1/auth/register` |
| `/api/auth/me` | GET | Get current user | `/api/v1/auth/me` |
| `/api/auth/logout` | POST | User logout | `/api/v1/auth/logout` |
| `/api/auth/refresh` | POST | Refresh access token | `/api/v1/auth/refresh` |
| `/api/auth/send-verification` | POST | Send email code | `/api/v1/auth/send-verification` |
| `/api/auth/reset-password` | POST | Reset password | `/api/v1/auth/reset-password` |

### Example: Login Route Implementation

**File**: `src/app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, device_id } = body;

    // 1. Proxy to backend
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Language': 'en',
      },
      body: JSON.stringify({ email, password, device_id }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.detail || 'Login failed' },
        { status: response.status }
      );
    }

    // 2. Extract tokens from backend response (wrapped in ApiResponse)
    const responseData = await response.json();
    const { access_token, refresh_token, token_type } = responseData.data; // ← .data is crucial!

    // 3. Create response and set httpOnly cookies
    const nextResponse = NextResponse.json({ success: true });

    nextResponse.cookies.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30, // 30 minutes
      path: '/',
    });

    nextResponse.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    nextResponse.cookies.set('device_id', device_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Frontend Integration

### AuthContext Usage

**Provider Setup** (in `src/app/layout.tsx`):

```tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Using in Components**:

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Route Protection

**Middleware** (`src/middleware.ts`):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/my-page'];
const authRoutes = ['/sign-in'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const isAuthenticated = !!accessToken;

  // Redirect unauthenticated users trying to access protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/my-page', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/my-page/:path*', '/sign-in'],
};
```

### Authentication-Aware UI Components

The application's UI adapts based on authentication state:

#### Landing Page (`src/app/page.tsx`)

The landing page navigation shows different buttons based on whether the user is authenticated:

```tsx
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav>
      {/* Other nav links */}

      <Link href="/my-page">MY PAGE</Link>

      {isAuthenticated ? (
        <button onClick={logout}>LOG OUT</button>
      ) : (
        <Link href="/sign-in">SIGN IN</Link>
      )}
    </nav>
  );
}
```

**Behavior**:
- **Not authenticated**: Shows "SIGN IN" link → Navigates to `/sign-in` page
- **Authenticated**: Shows "LOG OUT" button → Calls `logout()` function, clears cookies, redirects to home

**Note**: Previously used a non-functional `SignInModal` component. Now uses direct navigation to the actual sign-in page for consistent user experience.

#### TopBar Component (`src/components/TopBar.tsx`)

Used on other pages (Dream Hotels, Concierge, etc.):

```tsx
const { user, isAuthenticated, logout } = useAuth();

{isAuthenticated && user ? (
  <>
    <Link href="/my-page">MY PAGE</Link>
    <button onClick={logout}>LOGOUT</button>
  </>
) : (
  <Link href="/sign-in">SIGN IN</Link>
)}
```

---

## Security Features

### 1. httpOnly Cookies
- **Benefit**: JavaScript cannot access tokens, preventing XSS attacks
- **Implementation**: Set via Next.js API routes, not client-side
- **Storage**: Browser securely stores and sends with each request

### 2. Token Expiration
- **Access Token**: 30 minutes (short-lived)
- **Refresh Token**: 7 days (long-lived)
- **Auto-refresh**: Frontend can request new access token using refresh token

### 3. Device Fingerprinting
- **Purpose**: Track sessions per device
- **Implementation**: `src/lib/device.ts` generates stable device IDs
- **Stored**: In httpOnly cookie alongside tokens

### 4. CORS Protection
- **SameSite**: `lax` prevents CSRF attacks
- **Credentials**: `include` allows cookie transmission
- **Backend**: Configured CORS origins in FastAPI

### 5. Route Protection
- **Middleware**: Server-side checks before rendering
- **Client Guards**: AuthContext prevents unauthorized access
- **Redirect**: Preserves intended destination after login

---

## Common Issues & Solutions

### Issue 1: Login Returns 200 but User Not Authenticated

**Symptom**: POST /api/auth/login succeeds (200) but GET /api/auth/me returns 401

**Cause**: Cookies not being set properly in response

**Solution**:
1. Create `NextResponse` first
2. Set cookies on `nextResponse.cookies.set()`
3. Return the response object

```typescript
// ✓ Correct
const nextResponse = NextResponse.json({ success: true });
nextResponse.cookies.set('access_token', token, {...});
return nextResponse;
```

---

### Issue 2: Tokens Are `undefined` After Login

**Symptom**: `access_token` and `refresh_token` are undefined when extracting from response

**Cause**: Backend wraps response in `{ code, message, data }` but frontend extracts from root level

**Solution**: Extract from `responseData.data`:

```typescript
// ✓ Correct
const responseData = await response.json();
const { access_token } = responseData.data;

// ✗ Wrong
const data = await response.json();
const { access_token } = data; // undefined!
```

---

### Issue 3: Cookies Not Sent in Subsequent Requests

**Symptom**: Cookies are set but not included in /api/auth/me request

**Cause**: Missing `credentials: 'include'` in fetch options

**Solution**: Always include credentials in API client:

```typescript
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${this.baseUrl}${endpoint}`, {
    ...options,
    credentials: 'include', // ← Critical!
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response.json();
}
```

---

### Issue 4: Backend Returns Different Response Format

**Symptom**: Login works locally but fails in production (or vice versa)

**Cause**: Backend API response structure changed or differs between environments

**Solution**:
1. Test backend endpoint directly with curl
2. Verify response structure matches expectations
3. Check backend's `ApiResponse.success()` implementation
4. Ensure frontend extracts from correct path in response

```bash
# Test backend directly
curl -X POST http://52.52.21.225:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"pass123","device_id":"test"}'
```

---

## Testing Authentication

### Manual Testing Flow

1. **Start Frontend**:
   ```bash
   cd TiP
   npm run dev
   ```

2. **Test Registration**:
   - Visit http://localhost:3000/register
   - Enter email and password
   - Request verification code
   - Complete registration
   - Should redirect to /my-page

3. **Test Login**:
   - Logout or use incognito window
   - Visit http://localhost:3000/sign-in
   - Enter credentials
   - Should redirect to /my-page

4. **Test Protected Routes**:
   - Logout
   - Try accessing http://localhost:3000/my-page
   - Should redirect to /sign-in?redirect=/my-page
   - Login and verify redirect back to /my-page

5. **Test Landing Page Authentication UI**:
   - Visit http://localhost:3000 (home page)
   - When not logged in: Should see "SIGN IN" button
   - Click "SIGN IN" → Should navigate to /sign-in page
   - Login successfully → Return to home page
   - Should now see "LOG OUT" button instead
   - Click "LOG OUT" → Should logout and show "SIGN IN" again

6. **Test Token Refresh**:
   - Login and wait 30+ minutes
   - Make an API request
   - Should auto-refresh token if refresh_token is still valid

### Using Browser DevTools

**Network Tab**:
1. Open DevTools → Network
2. Login and watch the requests:
   - POST /api/auth/login → Should have Set-Cookie headers
   - GET /api/auth/me → Should have Cookie header

**Application/Storage Tab**:
1. Go to Cookies → http://localhost:3000
2. Should see:
   - `access_token` (httpOnly, Lax, 30min)
   - `refresh_token` (httpOnly, Lax, 7 days)
   - `device_id` (httpOnly, Lax, 1 year)

**Console**:
- No errors related to authentication
- AuthContext logs state changes (if debug enabled)

---

## File Reference

### Core Authentication Files

```
TiP/
├── src/
│   ├── app/
│   │   ├── api/auth/                   # Next.js API proxy routes
│   │   │   ├── login/route.ts          # ⭐ Login handler
│   │   │   ├── register/route.ts       # ⭐ Registration handler
│   │   │   ├── me/route.ts             # ⭐ Get current user
│   │   │   ├── logout/route.ts         # Logout handler
│   │   │   ├── refresh/route.ts        # Token refresh
│   │   │   ├── send-verification/route.ts
│   │   │   └── reset-password/route.ts
│   │   ├── page.tsx                    # ⭐ Landing page (auth-aware nav)
│   │   ├── sign-in/page.tsx            # Login UI
│   │   ├── register/page.tsx           # Registration UI
│   │   └── forgot-password/page.tsx    # Password reset UI
│   ├── contexts/
│   │   └── AuthContext.tsx             # ⭐ Global auth state
│   ├── lib/
│   │   ├── api-client.ts               # ⭐ Frontend API wrapper
│   │   └── device.ts                   # Device fingerprinting
│   ├── types/
│   │   └── auth.ts                     # TypeScript types
│   ├── middleware.ts                   # ⭐ Route protection
│   └── components/
│       ├── TopBar.tsx                  # Auth-aware navigation
│       ├── ProtectedRoute.tsx          # Component guard
│       └── SignInModal.tsx             # ⚠️ DEPRECATED - Use /sign-in page
├── .env.local                          # ⭐ API_BASE_URL config
└── AUTHENTICATION-CONTEXT.md           # This file
```

### Backend Authentication Files

```
tip-backend/
├── app/
│   ├── api/client/v1/
│   │   └── auth.py                     # ⭐ Auth endpoints
│   ├── services/client/
│   │   └── auth.py                     # Auth business logic
│   ├── schemas/
│   │   ├── response.py                 # ⭐ ApiResponse wrapper
│   │   └── client/auth.py              # Request/response models
│   └── models/
│       └── user.py                     # User database model
└── .env                                # Backend config
```

---

## Quick Reference Commands

### Start Development Environment

```bash
# Start frontend with production backend
cd ~/Documents/ParisClass/TiP
npm run dev

# Frontend will proxy to production backend at:
# http://52.52.21.225:8000
```

### Switch to Local Backend

```bash
# 1. Edit .env.local
API_BASE_URL=http://localhost:8000

# 2. Start local backend
cd ~/Documents/ParisClass/tip-backend
./start-backend.sh

# 3. Restart frontend
cd ~/Documents/ParisClass/TiP
npm run dev
```

### Debug Authentication Issues

```bash
# Check backend health
curl http://52.52.21.225:8000/api/v1/health

# Test login endpoint directly
curl -X POST http://52.52.21.225:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Language: en' \
  -d '{"email":"test@test.com","password":"test123","device_id":"test"}'

# Check frontend server logs
# Look for POST /api/auth/login and GET /api/auth/me requests
```

---

## Best Practices

### 1. Always Use AuthContext
❌ Don't manage tokens directly in components
✅ Use `useAuth()` hook for all auth operations

### 2. Never Access Cookies Client-Side
❌ Don't use `document.cookie` or localStorage for tokens
✅ Let Next.js API routes handle all cookie operations

### 3. Handle Loading States
```tsx
const { user, isLoading, isAuthenticated } = useAuth();

if (isLoading) return <Spinner />;
if (!isAuthenticated) return <LoginPrompt />;
return <AuthenticatedContent user={user} />;
```

### 4. Graceful Error Handling
```typescript
try {
  await login(email, password);
} catch (error) {
  // Show user-friendly error message
  setError(error instanceof Error ? error.message : 'Login failed');
}
```

### 5. Test Both Backends
- Develop with local backend for fast iteration
- Test with production backend before deploying
- Verify environment variables are correct for each

---

## Related Documentation

- **TiP Project Overview**: `/Users/smalltinkerlab/Documents/ParisClass/TiP/CLAUDE.md`
- **Root Project Context**: `/Users/smalltinkerlab/Documents/ParisClass/CLAUDE.md`
- **Backend Documentation**: `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/CLAUDE.md`
- **Backend Setup**: `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/BACKEND-SETUP.md`

---

**🎉 Authentication is fully functional! You can now develop locally with production backend access.**
