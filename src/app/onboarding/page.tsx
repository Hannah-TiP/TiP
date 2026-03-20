'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { User } from '@/types/auth';
import type { City } from '@/types/location';

const TRAVEL_STYLES = [
  { value: 'Solo Retreat', icon: '\u{1F9D8}', description: 'Peaceful, personal time' },
  {
    value: 'Family Memories',
    icon: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}',
    description: 'Kid-friendly adventures',
  },
  { value: 'Romantic Escape', icon: '\u{1F495}', description: 'Intimate experiences' },
  { value: 'Adventure Seeker', icon: '\u{1F3D4}\uFE0F', description: 'Thrill and excitement' },
  { value: 'Cultural Explorer', icon: '\u{1F3DB}\uFE0F', description: 'Heritage and history' },
  { value: 'Wellness Focus', icon: '\u{1F33F}', description: 'Health and rejuvenation' },
];

const TOTAL_STEPS = 4;

function parseBirthday(birthday?: string): { month: string; day: string; year: string } {
  if (!birthday) return { month: '', day: '', year: '' };
  try {
    const parts = birthday.split('-');
    if (parts.length === 3) return { year: parts[0], month: parts[1], day: parts[2] };
  } catch {}
  return { month: '', day: '', year: '' };
}

// Determine the first incomplete onboarding step from profile data
// Steps 1-2 are required, steps 3-4 are optional (skippable)
function getStartStep(profile: User): number {
  if (!profile.first_name || !profile.last_name) return 1;
  if (!profile.city_id) return 2;
  // Steps 3 and 4 are optional — once required steps are done,
  // resume at the first optional step that's still empty, or step 4
  if (!profile.birthday) return 3;
  return 4;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 2: Location
  const [cityId, setCityId] = useState<number | undefined>(undefined);
  const [cities, setCities] = useState<City[]>([]);

  // Step 3: Birthday
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  // Step 4: Travel styles
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Load profile + countries on mount, resume at first incomplete step
  useEffect(() => {
    let cancelled = false;

    Promise.all([apiClient.getProfile(), apiClient.getCities('en')])
      .then(([profile, cityList]) => {
        if (cancelled) return;

        // Populate form from existing profile data
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setCityId(profile.city_id ?? undefined);
        const birth = parseBirthday(profile.birthday);
        setBirthMonth(birth.month);
        setBirthDay(birth.day);
        setBirthYear(birth.year);
        setSelectedStyles(profile.travel_styles || []);
        setCities(cityList);

        // Jump to first incomplete step
        setStep(getStartStep(profile));
      })
      .catch(() => {
        if (!cancelled) setStep(1); // fallback to step 1 on error
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
        await apiClient.updateProfile({ first_name: firstName, last_name: lastName });
      } else if (currentStep === 2) {
        await apiClient.updateProfile({ city_id: cityId });
      } else if (currentStep === 3) {
        await apiClient.updateProfile({ birthday: formatBirth() });
      }
      // Step 4 is saved in handleComplete
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
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
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  }

  async function handleNext() {
    if (step === 1 && (!firstName.trim() || !lastName.trim())) {
      setError('Please enter your first and last name');
      return;
    }
    if (step === 2 && !cityId) {
      setError('Please select your city');
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

  const isSkippable = step === 3 || step === 4;
  const saving = isLoading || isSaving;

  const selectClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F] appearance-none bg-white';
  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]';

  // Loading state while fetching profile
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
      <div className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-10">
        <Link href="/">
          <Image
            src="/bible_TIP_profil_400x400px.svg"
            alt="TiP"
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
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[36px] italic text-green-dark">Welcome to TiP</h1>
                <p className="mt-2 text-gray-text">
                  Let&apos;s get to know you so we can personalize your travel experience.
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-8 shadow-lg">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className={inputClass}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[36px] italic text-green-dark">
                  Where do you call home?
                </h1>
                <p className="mt-2 text-gray-text">
                  This helps us personalize recommendations around the city you know best.
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-8 shadow-lg">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Home City
                  </label>
                  <select
                    value={cityId ?? ''}
                    onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : undefined)}
                    className={selectClass}
                  >
                    <option value="">Select your city</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Birthday */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[36px] italic text-green-dark">
                  When&apos;s your birthday?
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-text">
                  Our members receive a special birthday surprise each year. Don&apos;t miss out on
                  your personalized gift.
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-8 shadow-lg">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Month</label>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Day</label>
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Day</option>
                      {days.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Year</label>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-gray-400">
                  This is optional &mdash; but we&apos;d love to celebrate with you.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Travel Styles */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-primary text-[36px] italic text-green-dark">
                  How do you love to travel?
                </h1>
                <p className="mt-2 text-gray-text">
                  Pick as many as you like &mdash; we&apos;ll tailor recommendations to your style.
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-white p-8 shadow-lg">
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
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isSkippable && (
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="px-6 py-3 text-sm font-medium text-gray-text hover:text-green-dark disabled:opacity-50"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={saving}
                className="h-12 rounded-full bg-green-dark px-8 text-sm font-medium text-white transition hover:bg-[#163024] disabled:opacity-50"
              >
                {saving ? 'Saving...' : step === TOTAL_STEPS ? 'Get Started' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
