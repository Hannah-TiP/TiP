'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import BirthDatePicker from '@/components/BirthDatePicker';
import { apiClient } from '@/lib/api-client';
import { getLocalizedText } from '@/types/common';
import type { User } from '@/types/auth';
import type { City } from '@/types/location';

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function MyProfile() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [cityId, setCityId] = useState<number | undefined>(undefined);

  const [cities, setCities] = useState<City[]>([]);

  // Track if form is dirty
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/sign-in');
      return;
    }
    if (sessionStatus === 'authenticated') {
      loadProfile();
      loadCities();
    }
  }, [sessionStatus, router]);

  async function loadCities() {
    try {
      const data = await apiClient.getCities('en');
      setCities(data);
    } catch (err) {
      console.error('Cities load error:', err);
    }
  }

  async function loadProfile() {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getProfile();
      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setGender(data.gender || '');
      setBirthday(data.birthday || '');
      setCityId(data.city_id ?? undefined);
    } catch (err) {
      setError('Failed to load profile. Please try again.');
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value);
      setIsDirty(true);
      setSuccess('');
    };
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await apiClient.updateProfile({
        first_name: firstName,
        last_name: lastName,
        gender: gender || undefined,
        birthday: birthday || undefined,
        city_id: cityId,
      });
      setSuccess('Profile updated successfully.');
      setIsDirty(false);
      // Reload profile to get fresh data
      await loadProfile();
    } catch (err) {
      setError('Failed to save changes. Please try again.');
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setGender(profile.gender || '');
      setBirthday(profile.birthday || '');
      setCityId(profile.city_id ?? undefined);
      setIsDirty(false);
      setError('');
      setSuccess('');
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]';

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="My Profile" />

      <section className="max-w-4xl mx-auto px-6 mt-8 mb-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-5" />
                <div className="grid grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j}>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1.5" />
                      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {!loading && profile && (
          <>
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Personal Information</h2>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={handleFieldChange(setFirstName)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={handleFieldChange(setLastName)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={handleFieldChange(setGender)}
                    className={inputClass}
                  >
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date of Birth
                  </label>
                  <BirthDatePicker
                    value={birthday}
                    onChange={(v) => {
                      setBirthday(v);
                      setIsDirty(true);
                      setSuccess('');
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <select
                    value={cityId ?? ''}
                    onChange={(e) => {
                      setCityId(e.target.value ? Number(e.target.value) : undefined);
                      setIsDirty(true);
                      setSuccess('');
                    }}
                    className={inputClass}
                  >
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {getLocalizedText(city.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Membership
                  </label>
                  <input
                    type="text"
                    value={
                      profile.membership
                        ? profile.membership.charAt(0).toUpperCase() + profile.membership.slice(1)
                        : 'White'
                    }
                    disabled
                    className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Security</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Password</p>
                  <p className="text-sm text-gray-400 mt-0.5">Change your account password</p>
                </div>
                <button className="text-sm font-medium text-[#1E3D2F] hover:underline">
                  Change Password
                </button>
              </div>
            </div>

            {/* Travel Styles */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Travel Styles</h2>
              {profile.travel_styles && profile.travel_styles.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {profile.travel_styles.map((style) => (
                    <span
                      key={style}
                      className="bg-[#1E3D2F] text-white text-sm px-4 py-2 rounded-full"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  No travel styles set yet. Complete onboarding or update your preferences to
                  personalize future recommendations.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={!isDirty || saving}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#1E3D2F] rounded-lg hover:bg-[#163024] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
