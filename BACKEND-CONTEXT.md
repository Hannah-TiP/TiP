# Backend Hotel API - Existing Infrastructure

## Discovery Summary

The tip-backend repository **already has a complete, production-ready hotel API** implemented. No need to create backend infrastructure from scratch.

---

## API Endpoints Available

### Client API (Public)
**Base URL**: `http://localhost:8000/api/v1/hotel`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List hotels with pagination, city filter, language filter |
| `/city/{city_id}` | GET | Get all hotels for a specific city |
| `/{hotel_id}` | GET | Get hotel details with activities, restaurants, review summary |
| `/restaurant/{restaurant_id}` | GET | Get restaurant details |
| `/activity/{activity_id}` | GET | Get activity details with reviews |
| `/hotels/recommend` | GET | Get recommended hotels |

### Backoffice API (Admin)
**Base URL**: `http://localhost:8000/api/v1/backoffice/hotels`

**CRUD Operations**: Create, Read, Update, Delete hotels
**Link Groups**: Manage multi-language hotel linking
**Reviews**: List and manage hotel reviews

---

## Database Schema

### Hotels Table

**Location**: MySQL database `tip_database`, table `hotels`

**Core Fields**:
- `id` - Auto-generated integer
- `name` - Hotel name
- `city_id` - Foreign key to cities table
- `star_rating` - String (e.g., "5")
- `address` - Full address
- `latitude`, `longitude` - Geocoding coordinates
- `description` - Text description
- `image` - JSON array of image URLs
- `available_rooms` - JSON array of room types
- `content` - LONGTEXT HTML content
- `status` - Boolean (active/inactive)
- `language` - String (e.g., "en", "kr")
- `recommended` - Boolean flag

**Service Fields**:
- Transfer services: `transfers_available`, `transfer_vehicle_types`, `transfer_capacity`, `transfer_description`, `transfer_photos`
- Spa services: `spa_available`, `spa_included_facilities`, `spa_treatment_name`, `spa_treatment_type`, `spa_duration`, `spa_description`, `spa_photos`
- Special experiences: `special_experience_available`, `special_experience_title`, `special_experience_type`, `special_experience_duration`, `special_experience_description`, `special_experience_photos`

**Review Fields**:
- `total_reviews` - Integer count
- `average_rating` - Decimal (0.00-5.00)
- `rating_distribution` - JSON (e.g., `{"1": 0, "2": 1, "3": 5, "4": 20, "5": 30}`)

**Multi-Language**:
- `link_group_id` - Foreign key to hotel_link_groups table

### Related Tables
- `countries` - Country master data
- `cities` - City master data (has country_id)
- `hotel_link_groups` - Groups same hotel across languages
- `restaurants` - Related restaurants
- `activities` - Related activities

---

## Response Structure Example

**GET /api/v1/hotel/{hotel_id}** returns:

```json
{
  "id": 1,
  "name": "Le Bristol Paris",
  "city_id": 5,
  "city": {
    "id": 5,
    "name": "Paris",
    "country": {
      "id": 1,
      "name": "France"
    }
  },
  "star_rating": "5",
  "address": "112 Rue du Faubourg Saint-Honoré, 75008 Paris",
  "latitude": 48.8717,
  "longitude": 2.3164,
  "description": "A legendary Parisian palace...",
  "image": [
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&h=600",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=500"
  ],
  "available_rooms": ["Superior Room", "Deluxe Suite", "Royal Suite"],
  "content": "<div>Full HTML content...</div>",
  "language": "en",
  "recommended": true,
  "review_summary": {
    "total_reviews": 127,
    "average_rating": 4.8,
    "rating_distribution": {
      "1": 2,
      "2": 3,
      "3": 8,
      "4": 42,
      "5": 72
    }
  },
  "transfers_available": true,
  "transfer_vehicle_types": "Sedan, Luxury SUV",
  "transfer_capacity": 4,
  "spa_available": true,
  "spa_treatment_name": "Le Bristol Signature Massage",
  "activities": [
    {
      "id": 10,
      "name": "Private Louvre Tour",
      "type": "Cultural"
    }
  ],
  "restaurants": [
    {
      "id": 5,
      "name": "Epicure",
      "cuisine_type": "French Haute Cuisine"
    }
  ]
}
```

---

## Key Differences from Frontend Hard-Coded Data

### Frontend (Current Hard-Coded)
```typescript
{
  id: "le-bristol-paris",        // String slug
  name: "Le Bristol Paris",
  location: "Paris, France",      // String
  rating: 9.6,                    // 0-10 scale
  image: "single-url",            // Single image
  tag: "Palace"                   // String tag
}
```

### Backend (Database)
```json
{
  "id": 1,                        // Integer
  "name": "Le Bristol Paris",
  "city_id": 5,                   // Structured relationship
  "city": { "name": "Paris", "country": { "name": "France" } },
  "average_rating": 4.8,          // 0-5 scale
  "image": ["url1", "url2"],      // Array of images
  "star_rating": "5"              // Hotel star rating (not review score)
}
```

### Mapping Required
- `location` ← Combine `city.name + ", " + city.country.name`
- `rating` ← Convert `average_rating * 2` (5.0 scale → 10.0 scale)
- `image` ← Use `image[0]` (first image from array)
- `tag` ← Derive from `star_rating` or custom logic

---

## Backend File Locations

### Models
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/models/city.py` - Hotel model
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/models/hotel_link.py` - Link group model

### Services
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/services/client/hotel.py` - Client business logic
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/services/backoffice/hotel.py` - Admin business logic

### Schemas
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/schemas/client/hotel.py` - Client request/response schemas
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/schemas/backoffice/hotel.py` - Backoffice schemas

### Routes
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/api/client/v1/hotel.py` - Client API routes
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/api/backoffice/v1/hotel.py` - Backoffice API routes

### Route Registration
- `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/app/route/route.py` - Main router

---

## Features Already Implemented

✅ **Full CRUD** - Create, read, update, delete hotels via backoffice API
✅ **Pagination** - Skip/limit for hotel lists
✅ **Filtering** - By city, language, star rating, keyword, recommended status
✅ **Multi-language** - Same hotel in multiple languages with link groups
✅ **Review aggregation** - Automatic review statistics across linked hotels
✅ **Geocoding** - Automatic lat/lng from address
✅ **HTML sanitization** - Safe content rendering
✅ **Related content** - Activities and restaurants linked to hotels
✅ **Service management** - Transfers, spa, special experiences
✅ **Image handling** - Multiple images per hotel (JSON array)
✅ **Recommended hotels** - Curated hotel selection

---

## What We Need to Build (Frontend Only)

1. **Next.js BFF Proxy Routes**:
   - `src/app/api/hotels/route.ts` → Proxy to `/api/v1/hotel`
   - `src/app/api/hotels/[id]/route.ts` → Proxy to `/api/v1/hotel/{id}`
   - `src/app/api/hotels/recommend/route.ts` → Proxy to `/api/v1/hotel/hotels/recommend`

2. **API Client Extension**:
   - Add hotel methods to `src/lib/api-client.ts`

3. **Type Definitions**:
   - Create `src/types/hotel.ts` matching backend response structure
   - Add transformation utilities for frontend compatibility

4. **Component Updates**:
   - Update `src/app/page.tsx` (homepage featured hotels)
   - Update `src/app/dream-hotels/page.tsx` (hotel listings)
   - Update `src/app/hotel/[id]/page.tsx` (hotel detail)
   - Add loading/error states

5. **Data Transformation Layer**:
   - Map backend response to frontend expectations
   - Handle rating scale conversion (5.0 → 10.0)
   - Combine city + country for location string
   - Extract first image from array

---

## Next Steps

1. **Check if database has hotel data**:
   ```bash
   cd ~/Documents/ParisClass/tip-backend
   mysql -u tip_user -p tip_database -e "SELECT id, name, city_id, language FROM hotels LIMIT 5;"
   ```

2. **Test existing API**:
   ```bash
   curl http://localhost:8000/api/v1/hotel
   curl http://localhost:8000/api/v1/hotel/1
   ```

3. **Create frontend integration** (BFF proxy + API client + components)

---

## Important Notes

- **No backend work needed** - API is production-ready
- **Database schema is different** - Need transformation layer
- **Rating scales differ** - Backend uses 0-5, frontend displays 0-10
- **Multi-language support exists** - Can filter by `language=en` or `language=kr`
- **Images are arrays** - Backend stores multiple images, frontend uses single URL
- **City structure** - Backend has normalized city/country tables, frontend has flat location string
- **Review system exists** - Hotels have review summaries, not just static ratings

---

## Benefits of Existing Infrastructure

1. **Production-ready** - Already handles edge cases, validation, error handling
2. **Scalable** - Pagination, indexing, optimized queries
3. **Feature-rich** - Reviews, multi-language, services, related content
4. **Maintainable** - Proper separation (models, services, schemas, routes)
5. **Admin interface ready** - Backoffice API for hotel management
6. **Extensible** - Easy to add filters, sorting, search capabilities

---

## Local Development Setup with Seed Data

### Starting Local Backend

```bash
cd ~/Documents/ParisClass/tip-backend

# Check if services are running
./check-services.sh

# Start backend (starts MySQL, Redis, FastAPI)
./start-backend.sh

# Stop backend
./stop-backend.sh
```

The backend will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/api/v1/health

### Seeding Local Database with Sample Hotels

If your local database is empty, use the seed script to populate it with sample hotel data:

```bash
cd ~/Documents/ParisClass/tip-backend
source venv/bin/activate
python seed_hotels.py
```

**What it does**:
- Creates 7 countries (France, Japan, UK, Hong Kong, Australia, French Polynesia, Thailand)
- Creates 7 cities with country relationships
- Creates 8 luxury hotels with complete data:
  - Le Bristol Paris, Aman Tokyo, Claridge's, The Peninsula Hong Kong
  - Park Hyatt Sydney, Four Seasons Bora Bora, Mandarin Oriental Bangkok, Ritz Paris
- Each hotel includes: star rating, address, description, images, rooms, reviews

**Seed Script Location**: `/Users/smalltinkerlab/Documents/ParisClass/tip-backend/seed_hotels.py`

The script uses async SQLAlchemy and checks for existing data to avoid duplicates.

---

## Switching Between Local and Production Backend

### Environment Configuration

Frontend environment variables are in `.env.local`:

```bash
# Local development
API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_S3_ENDPOINT=https://tip-s3-bucket.s3.us-west-1.amazonaws.com

# Production testing
API_BASE_URL=http://52.52.21.225:8000
NEXT_PUBLIC_S3_ENDPOINT=https://tip-s3-bucket.s3.us-west-1.amazonaws.com
```

### Quick Switch Commands

**Switch to Local**:
```bash
# Edit .env.local - update line:
API_BASE_URL=http://localhost:8000

# Restart Next.js dev server
npm run dev
```

**Switch to Production**:
```bash
# Edit .env.local - update line:
API_BASE_URL=http://52.52.21.225:8000

# Restart Next.js dev server
npm run dev
```

### Production API Access Requirements

**Prerequisites**:
1. AWS Security Group must whitelist your IP address
   - Get your IP: `curl https://api.ipify.org`
   - Add to AWS EC2 Security Group: `Custom TCP`, Port `8000`, Source = Your IP

2. Alternative: Use SSH tunnel (no AWS access needed)
   ```bash
   # In separate terminal
   ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem \
       -L 8001:localhost:8000 \
       ubuntu@52.52.21.225 -N

   # Then use in .env.local:
   API_BASE_URL=http://localhost:8001
   ```

**Production Stats**:
- 517+ hotels in production database (vs. 8 in local seed)
- Multiple images per hotel (up to 17 images)
- Real city data and locations
- Actual review ratings

---

## S3 Image Configuration

### Image Path Structure

Production images are stored in S3 with paths like:
```
tip/hotel/17569701777922스크린샷 2025-09-04 오후 4.11.06.png
```

### Image URL Transformation

Frontend automatically converts S3 paths to full URLs:

**Helper Function** (`src/types/hotel.ts`):
```typescript
export function getImageUrl(imagePath?: string): string {
  if (!imagePath) return '/placeholder.jpg';

  // If already full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Convert S3 path to full URL
  const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${s3Endpoint}/${cleanPath}`;
}
```

**S3 Configuration**:
- Bucket: `tip-s3-bucket`
- Region: `us-west-1`
- Endpoint: `https://tip-s3-bucket.s3.us-west-1.amazonaws.com`

**Usage in Components**:
```typescript
import { getImageUrl } from "@/types/hotel";

<img src={getImageUrl(hotel.image?.[0])} alt={hotel.name} />
```

---

## Frontend Integration Implementation

### Files Created

1. **TypeScript Types** - `src/types/hotel.ts`
   - Hotel, City, ReviewSummary, Activity, Restaurant interfaces
   - Helper functions: `formatLocation()`, `getImageUrl()`, `getHotelImages()`
   - Extracts country from address field (backend City schema lacks country)

2. **API Client Extension** - `src/lib/api-client.ts`
   - `getHotels(params)` - List hotels with pagination/filters
   - `getRecommendedHotels(language)` - Get recommended hotels
   - `getHotelById(id)` - Get hotel details

3. **Next.js BFF Proxy Routes**:
   - `src/app/api/hotels/route.ts` - Hotels list proxy
   - `src/app/api/hotels/[id]/route.ts` - Hotel detail proxy (Next.js 15 async params)
   - `src/app/api/hotels/recommend/route.ts` - Recommended hotels proxy

4. **Updated Components**:
   - `src/app/dream-hotels/page.tsx` - Fetches from API, loading states
   - `src/app/hotel/[id]/page.tsx` - Dynamic hotel details, 404 handling

### Key Implementation Decisions

1. **No Data Transformation Layer**: Frontend uses backend schema directly
   - Simpler code, fewer bugs
   - Rating stays 0-5 scale (not converted to 0-10)
   - Country extracted from address field via helper

2. **Room Details**: Kept hard-coded with TODO comments
   - Backend only has room names in `available_rooms` array
   - No pricing, sizes, or features yet
   - Easy to find and replace when backend adds room details API

3. **Next.js 15 Compatibility**: Dynamic route params are Promises
   ```typescript
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params; // Must await
   }
   ```

### Testing Endpoints

```bash
# Local backend
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/hotel
curl http://localhost:8000/api/v1/hotel/1

# Frontend proxy (works with local or production)
curl http://localhost:3000/api/hotels
curl http://localhost:3000/api/hotels/1
curl http://localhost:3000/api/hotels/recommend

# Production backend (requires security group access)
curl http://52.52.21.225:8000/api/v1/health
curl http://52.52.21.225:8000/api/v1/hotel
```

---

## Known Limitations & Future Enhancements

### Current Limitations

1. **City Schema**: Backend City object only has `id` and `name`, no country
   - **Workaround**: Extract country from address field
   - **Future**: Update backend City schema to include country relationship

2. **Room Details**: Backend lacks detailed room information (prices, sizes, features)
   - **Current**: Hard-coded in frontend with TODO comments
   - **Future**: Add room management to backend API

3. **Image Access**: S3 bucket may require public access or presigned URLs
   - **Current**: Works if S3 bucket has public read policy
   - **Future**: Consider CloudFront CDN or presigned URL API

### Future Enhancements

- Search & Filters (city, price, rating)
- Pagination UI (load more, page numbers)
- Language toggle (EN/KR) connected to API
- Server Components for better SEO (requires refactoring from client components)
- Image optimization with Next.js Image component
- Caching strategy (ISR, client-side cache)

---

**Last Updated**: 2026-02-14
**Status**: Frontend integration complete, working with local and production databases
