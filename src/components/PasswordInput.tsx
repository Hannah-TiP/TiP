'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Lucide font codepoints (verified against the @latest lucide-static CDN font
// pinned in layout.tsx): eye = U+E0BA, eye-off = U+E0BB.
const EYE = '';
const EYE_OFF = '';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function PasswordInput({ className = '', disabled, ...props }: PasswordInputProps) {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        disabled={disabled}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        aria-label={showPassword ? t('password.hide') : t('password.show')}
        aria-pressed={showPassword}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text transition-colors hover:text-green-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="icon-lucide" aria-hidden="true">
          {showPassword ? EYE_OFF : EYE}
        </span>
      </button>
    </div>
  );
}
