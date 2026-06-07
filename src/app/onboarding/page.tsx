'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import CityAutocomplete from '@/components/CityAutocomplete';
import type { User } from '@/types/auth';
import type { MyReferralsResponse } from '@/types/stay-credit';
import { useLanguage } from '@/contexts/LanguageContext';

const TRAVEL_STYLES = [
  { value: 'Solo Retreat', icon: '\u{1F9D8}', description: 'Peaceful, personal time' },
  {
    value: 'Family Memories',
    icon: '\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}',
    description: 'Kid-friendly adventures',
  },
  { value: 'Romantic Escape', icon: '\u{1F495}', description: 'Intimate experiences' },
  { value: 'Adventure Seeker', icon: '\u{1F3D4}️', description: 'Thrill and excitement' },
  { value: 'Cultural Explorer', icon: '\u{1F3DB}️', description: 'Heritage and history' },
  { value: 'Wellness Focus', icon: '\u{1F33F}', description: 'Health and rejuvenation' },
];

// Steps: 1 = Referral, 2 = Name, 3 = Location, 4 = Birthday, 5 = Travel
const TOTAL_STEPS = 5;

// Backend code format is 8 chars from a 30-char alphabet; accept a generous
// alphanumeric superset client-side and let the backend canonicalize.
const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{4,16}$/i;

function parseBirthday(birthday?: string): { month: string; day: string; year: string } {
  if (!birthday) return { month: '', day: '', year: '' };
  try {
    const parts = birthday.split('-');
    if (parts.length === 3) return { year: parts[0], month: parts[1], day: parts[2] };
  } catch {}
  return { month: '', day: '', year: '' };
}

// Determine the first incomplete onboarding step from profile data.
// Step 1 (referral) is sticky — once seen, never re-prompt.
// Steps 2-3 are required; 4-5 are optional (skippable).
function getStartStep(profile: User): number {
  if (!profile.referral_onboarding_seen) return 1;
  if (!profile.first_name || !profile.last_name) return 2;
  if (!profile.city_id) return 3;
  if (!profile.birthday) return 4;
  return 5;
}

function OnboardingFlow() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?ref= is carried through after signup so the referral step can prefill.
  const rawRef = searchParams?.get('ref') ?? '';
  const initialRefCode = REFERRAL_CODE_PATTERN.test(rawRef) ? rawRef.toUpperCase() : '';

  const [step, setStep] = useState(0); // 0 = loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Referral
  const [referralCode, setReferralCode] = useState(initialRefCode);
  const [referredBy, setReferredBy] = useState<MyReferralsResponse['referred_by']>(null);

  // Step 2: Name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 3: Location
  const [cityId, setCityId] = useState<number | undefined>(undefined);

  // Step 4: Birthday
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  // Step 5: Travel styles
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Load profile + referral attribution on mount, resume at first incomplete step
  useEffect(() => {
    let cancelled = false;

    Promise.all([apiClient.getProfile(), apiClient.getMyReferrals().catch(() => null)])
      .then(([profile, referrals]) => {
        if (cancelled) return;

        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setCityId(profile.city_id ?? undefined);
        const birth = parseBirthday(profile.birthday);
        setBirthMonth(birth.month);
        setBirthDay(birth.day);
        setBirthYear(birth.year);
        setSelectedStyles(profile.travel_styles || []);
        setReferredBy(referrals?.referred_by ?? null);

        setStep(getStartStep(profile));
      })
      .catch(() => {
        if (!cancelled) setStep(1);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleStyle(value: string) {
    setSelectedStyles((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  }

  function formatBirth(): string | undefined {
    if (!birthMonth || !birthDay || !birthYear) return undefined;
    return `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
  }

  // Save current step's data to backend
  async function saveStep(currentStep: number): Promise<boolean> {
    setIsSaving(true);
    try {
      if (currentStep === 1) {
        // Only attempt a claim when the user actually has an unclaimed code
        // typed in AND isn't already attributed. The backend treats unknown
        // codes as no-op (returns referred_by=null) so a stale value won't
        // throw — but we still don't want to round-trip when there's
        // nothing to do.
        if (!referredBy && referralCode) {
          const result = await apiClient.claimReferral(referralCode);
          setReferredBy(result.referred_by);
        }
        // Mark the step as seen regardless of claim outcome — this is the
        // skip-persistence the whole step hinges on.
        await apiClient.updateProfile({ referral_onboarding_seen: true });
      } else if (currentStep === 2) {
        await apiClient.updateProfile({ first_name: firstName, last_name: lastName });
      } else if (currentStep === 3) {
        await apiClient.updateProfile({ city_id: cityId });
      } else if (currentStep === 4) {
        await apiClient.updateProfile({ birthday: formatBirth() });
      }
      // Step 5 is saved in handleComplete
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.error_save_failed'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleComplete() {
    setIsLoading(true);
    setError('');

    try {
      await apiClient.updateProfile({
        travel_styles: selectedStyles.length > 0 ? selectedStyles : undefined,
        onboarding_completed: true,
      });
      router.push('/my-page');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.error_generic'));
      setIsLoading(false);
    }
  }

  async function handleNext() {
    if (step === 1 && referralCode && !REFERRAL_CODE_PATTERN.test(referralCode)) {
      setError(t('onboarding.error_referral_format'));
      return;
    }
    if (step === 2 && (!firstName.trim() || !lastName.trim())) {
      setError(t('onboarding.error_name_required'));
      return;
    }
    if (step === 3 && !cityId) {
      setError(t('onboarding.error_city_required'));
      return;
    }
    setError('');

    if (step < TOTAL_STEPS) {
      const saved = await saveStep(step);
      if (saved) setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  async function handleSkip() {
    setError('');
    if (step === 1) {
      // Even on skip, mark the step as seen so we don't re-prompt on resume.
      const saved = await saveStep(1);
      if (!saved) return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  }

  // Generate year/month/day options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 16 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth =
    birthMonth && birthYear ? new Date(parseInt(birthYear), parseInt(birthMonth), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Steps 1 (referral), 4 (birthday), 5 (travel) are skippable.
  const isSkippable = step === 1 || step === 4 || step === 5;
  const saving = isLoading || isSaving;

  const selectClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F] appearance-none bg-white';
  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]';

  if (step === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-light">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-dark border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-light">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-4 md:px-10">
        <Link href="/">
          <Image
            src="/bible_TIP_profil_400x400px.svg"
            alt={t('onboarding.logo_alt')}
            className="h-9"
            width={36}
            height={36}
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Progress bar */}
        <div className="mb-10 flex w-full max-w-md items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? 'bg-green-dark' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="w-full max-w-md">
          {/* Step 1: Referral */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[28px] italic text-green-dark md:text-[36px]">
                  {referredBy
                    ? t('onboarding.invited_title_yes')
                    : t('onboarding.invited_title_no')}
                </h1>
                <p className="mt-2 text-gray-text">
                  {referredBy ? t('onboarding.invited_body_yes') : t('onboarding.invited_body_no')}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-6 shadow-lg md:p-8">
                {referredBy ? (
                  <div className="text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-[3px] text-[#C4956A]">
                      {t('onboarding.invitation_received')}
                    </span>
                    <div className="mt-2 text-sm text-gray-text">
                      {t('onboarding.continue_setup')}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {t('onboarding.referral_label')}
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder={t('onboarding.referral_placeholder')}
                      maxLength={16}
                      className={`${inputClass} font-mono tracking-[2px]`}
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-gray-400">
                      {t('onboarding.referral_skip_hint')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Name */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[28px] italic text-green-dark md:text-[36px]">
                  {t('onboarding.name_title')}
                </h1>
                <p className="mt-2 text-gray-text">{t('onboarding.name_subtitle')}</p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-6 shadow-lg md:p-8">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {t('onboarding.first_name')}
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('onboarding.first_name_placeholder')}
                      className={inputClass}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {t('onboarding.last_name')}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('onboarding.last_name_placeholder')}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[28px] italic text-green-dark md:text-[36px]">
                  {t('onboarding.location_title')}
                </h1>
                <p className="mt-2 text-gray-text">{t('onboarding.location_subtitle')}</p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-6 shadow-lg md:p-8">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {t('onboarding.home_city')}
                  </label>
                  <CityAutocomplete
                    value={cityId}
                    onChange={(id) => setCityId(id)}
                    placeholder={t('onboarding.city_placeholder')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Birthday */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[28px] italic text-green-dark md:text-[36px]">
                  {t('onboarding.birthday_title')}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-text">
                  {t('onboarding.birthday_subtitle')}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-6 shadow-lg md:p-8">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {t('onboarding.month')}
                    </label>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t('onboarding.month')}</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {t('onboarding.day')}
                    </label>
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t('onboarding.day')}</option>
                      {days.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {t('onboarding.year')}
                    </label>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t('onboarding.year')}</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-gray-400">
                  {t('onboarding.birthday_optional_hint')}
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Travel Styles */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[28px] italic text-green-dark md:text-[36px]">
                  {t('onboarding.travel_title')}
                </h1>
                <p className="mt-2 text-gray-text">{t('onboarding.travel_subtitle')}</p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-6 shadow-lg md:p-8">
                <div className="grid grid-cols-2 gap-3">
                  {TRAVEL_STYLES.map((style) => {
                    const selected = selectedStyles.includes(style.value);
                    return (
                      <button
                        key={style.value}
                        onClick={() => toggleStyle(style.value)}
                        className={`flex flex-col items-center rounded-xl border-2 p-5 text-center transition-all ${
                          selected
                            ? 'border-green-dark bg-green-dark/5'
                            : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                        }`}
                      >
                        <span className="mb-2 text-3xl">{style.icon}</span>
                        <p
                          className={`text-sm font-medium ${selected ? 'text-green-dark' : 'text-gray-700'}`}
                        >
                          {style.value}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">{style.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="text-sm font-medium text-gray-text hover:text-green-dark"
                >
                  {t('onboarding.back')}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isSkippable && !(step === 1 && referredBy) && (
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="px-6 py-3 text-sm font-medium text-gray-text hover:text-green-dark disabled:opacity-50"
                >
                  {t('onboarding.skip')}
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={saving}
                className="h-12 rounded-full bg-green-dark px-8 text-sm font-medium text-white transition hover:bg-[#163024] disabled:opacity-50"
              >
                {saving
                  ? t('onboarding.saving')
                  : step === TOTAL_STEPS
                    ? t('onboarding.get_started')
                    : t('onboarding.continue')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  // useSearchParams requires a Suspense boundary in App Router.
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}
