# Frontend i18n Audit — SMA-82 (Phase 4)

Every `.tsx` under `src/app/` and `src/components/` (test files excluded), classified as:

- **`migrated-in-this-pr`** — contained user-facing English; migrated to `useLanguage().t(...)` with EN+KR catalog entries.
- **`i18n-clean`** — already routes all user-facing copy through `t()` (no remaining hardcoded literals).
- **`internal-only`** — no user-facing English string literals (layout/logic/icon-only; remaining literals are `data-testid`, `className`, enum/data values, dev logs, or fixed bilingual KR business-registration data).

**Counts:** `i18n-clean` = 21 · `migrated-in-this-pr` = 48 · `internal-only` = 16 · total = 85

## ESLint guard

A local rule `i18n/no-literal-string` (`eslint-rules/no-literal-string.js`, registered in `eslint.config.mjs`, run by `npm run lint`) errors on any NEW hardcoded JSX text child or hardcoded `alt`/`title`/`placeholder`/`aria-label` attribute literal not wrapped in `t()`. It does NOT flag `data-testid`/`className`/`id`/`href`/`role`, call expressions (`{t(...)}`), pure punctuation/numbers, or bare lowercase enum tokens. Test files are excluded. Per-line opt-out: `// eslint-disable-next-line i18n/no-literal-string`. Fixtures: `src/__tests__/eslint-rules/no-literal-string.test.ts` (violating / valid / opted-out).

The rule runs at **error severity across the whole `src/**/\*.tsx` surface\*\*; this PR migrated every file it flagged, so catalog and guard are in sync (0 lint errors at merge).

### Rule limitation handled manually

The rule only flags _bare_ string literals. Conditional-expression attributes like `aria-label={cond ? 'A' : 'B'}` are not flagged by AST shape, so they were found and migrated by a manual grep sweep (`WishlistButton`, `PasswordInput`, the home partner-brands aria-label).

## Notable exemptions

- `src/components/Footer.tsx` — the KR business-registration block is fixed legal data, identical in both locales; the one line the rule catches (contains an ASCII email) carries a documented `eslint-disable-next-line`.

## Audit table

| File                                                    | Classification        | Reason                                                                                                                         |
| ------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/about/page.tsx`                                | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/app/activity/[id]/page.tsx`                        | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/checkout/flywire/page.tsx`                     | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/concierge/page.tsx`                            | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/dream-hotels/page.tsx`                         | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/forgot-password/page.tsx`                      | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/hotel/[id]/page.tsx`                           | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/app/layout.tsx`                                    | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/app/more-dreams/page.tsx`                          | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/my-page/credits/page.tsx`                      | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/app/my-page/layout.tsx`                            | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/app/my-page/membership/page.tsx`                   | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/my-page/my-profile/page.tsx`                   | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/my-page/page.tsx`                              | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/my-page/referrals/page.tsx`                    | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/app/my-page/travel-history/[id]/page.tsx`          | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/my-page/travel-history/[id]/reviews/page.tsx`  | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/my-page/travel-history/page.tsx`               | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/my-page/trip/[id]/page.tsx`                    | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/my-page/wishlist/page.tsx`                     | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/onboarding/page.tsx`                           | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/page.tsx`                                      | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/privacy-policy/page.tsx`                       | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/app/quotes/[id]/page.tsx`                          | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/register/page.tsx`                             | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/restaurant/[id]/page.tsx`                      | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/sign-in/page.tsx`                              | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/signature-journeys/page.tsx`                   | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/app/terms-of-service/page.tsx`                     | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/ActivityCard.tsx`                       | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/BirthDatePicker.tsx`                    | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/CityAutocomplete.tsx`                   | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/CookieConsentBanner.tsx`                | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/DatePickerDropdown.tsx`                 | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/DestinationDropdown.tsx`                | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/DraftBadge.tsx`                         | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/Footer.tsx`                             | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/GuestsDropdown.tsx`                     | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/Header.tsx`                             | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/HotelMap.tsx`                           | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/MobileNav.tsx`                          | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/Modal.tsx`                              | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/PasswordInput.tsx`                      | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/PreviewBanner.tsx`                      | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/SearchBar.tsx`                          | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/SignInModal.tsx`                        | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/SubNav.tsx`                             | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/TravelStyleDropdown.tsx`                | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/TripTypeDropdown.tsx`                   | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/WishlistButton.tsx`                     | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/activity/ActivityDetailContent.tsx`     | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/ai-chat/ChatInput.tsx`                  | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/ai-chat/ConversationSidebar.tsx`        | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/ai-chat/MessageBubble.tsx`              | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/ai-chat/MessageList.tsx`                | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/ai-chat/RequestHumanCTA.tsx`            | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/ai-chat/TripDetailPanel.tsx`            | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/ai-chat/WidgetResponseDisplay.tsx`      | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/ai-chat/widgets/ActivityCarousel.tsx`   | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/ai-chat/widgets/DateRangePicker.tsx`    | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/ai-chat/widgets/EntityCarousel.tsx`     | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/ai-chat/widgets/HotelCarousel.tsx`      | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/ai-chat/widgets/NumberStepper.tsx`      | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/ai-chat/widgets/OptionSelector.tsx`     | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/ai-chat/widgets/QuoteSent.tsx`          | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/ai-chat/widgets/RestaurantCarousel.tsx` | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/ai-chat/widgets/WidgetRenderer.tsx`     | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/credits/RedeemCodeSection.tsx`          | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/hotel/AmenityGrid.tsx`                  | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/hotel/BookingCard.tsx`                  | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/hotel/CroppedImage.tsx`                 | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/hotel/FaqAccordion.tsx`                 | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/hotel/HeroGallery.tsx`                  | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/hotel/HotelBenefits.tsx`                | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/hotel/HotelBreadcrumb.tsx`              | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/hotel/HotelDetailContent.tsx`           | `i18n-clean`          | Already routes user-facing copy through useLanguage().t() (pre-PR or no remaining literals).                                   |
| `src/components/hotel/LocationSection.tsx`              | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/hotel/RoomGrid.tsx`                     | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/hotel/SectionTitle.tsx`                 | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/hotel/StickyBookingBar.tsx`             | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/restaurant/RestaurantDetailContent.tsx` | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/reviews/EntityRatingBadge.tsx`          | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
| `src/components/reviews/EntityReviews.tsx`              | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/reviews/ReviewSessionItem.tsx`          | `migrated-in-this-pr` | User-facing copy migrated to t() with EN+KR entries.                                                                           |
| `src/components/reviews/StarRating.tsx`                 | `internal-only`       | No user-facing English string literals (pure layout/logic/icon component; only data-testid/className/enum tokens/data labels). |
