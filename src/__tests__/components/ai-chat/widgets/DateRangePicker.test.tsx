import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DateRangePicker from '@/components/ai-chat/widgets/DateRangePicker';
import enTranslations from '@/translations/en.json';
import krTranslations from '@/translations/kr.json';
import type { AIChatDateRangePickerWidget } from '@/types/ai-chat';

const mockUseLanguage = vi.fn();

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => mockUseLanguage(),
}));

vi.mock('@/components/DatePickerDropdown', () => ({
  default: ({
    onChange,
    onClose,
  }: {
    onChange: (start: string, end: string) => void;
    onClose: () => void;
  }) => (
    <div data-testid="mock-date-picker">
      <button data-testid="mock-select-dates" onClick={() => onChange('2026-06-01', '2026-06-05')}>
        Select
      </button>
      <button data-testid="mock-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

afterEach(() => cleanup());

function setLocale(lang: 'en' | 'kr') {
  const translations = lang === 'en' ? enTranslations : krTranslations;
  mockUseLanguage.mockReturnValue({
    t: (key: string) => (translations as Record<string, string>)[key] ?? key,
    lang,
    setLang: () => {},
  });
}

function makeWidget(overrides?: Partial<AIChatDateRangePickerWidget>): AIChatDateRangePickerWidget {
  return {
    widget_id: 'w1',
    widget_type: 'date_range_picker',
    ...overrides,
  };
}

describe('DateRangePicker', () => {
  it('renders localized strings in English', () => {
    setLocale('en');
    render(<DateRangePicker widget={makeWidget()} onSubmit={vi.fn()} />);

    expect(screen.getByText('Select dates')).toBeTruthy();
    expect(screen.getByTestId('date-range-trigger').textContent).toBe('Choose dates');
    expect(screen.getByTestId('date-range-submit').textContent).toBe('Confirm dates');
  });

  it('renders localized strings in Korean', () => {
    setLocale('kr');
    render(<DateRangePicker widget={makeWidget()} onSubmit={vi.fn()} />);

    expect(screen.getByText('날짜 선택')).toBeTruthy();
    expect(screen.getByTestId('date-range-trigger').textContent).toBe('날짜를 선택하세요');
    expect(screen.getByTestId('date-range-submit').textContent).toBe('날짜 확인');
  });

  it('shows sent state in English after submission', () => {
    setLocale('en');
    const onSubmit = vi.fn();
    render(<DateRangePicker widget={makeWidget()} onSubmit={onSubmit} />);

    // Open picker and select dates
    fireEvent.click(screen.getByTestId('date-range-trigger'));
    fireEvent.click(screen.getByTestId('mock-select-dates'));

    // Submit
    fireEvent.click(screen.getByTestId('date-range-submit'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('date-range-submit').textContent).toBe('Sent');
  });

  it('shows sent state in Korean after submission', () => {
    setLocale('kr');
    const onSubmit = vi.fn();
    render(<DateRangePicker widget={makeWidget()} onSubmit={onSubmit} />);

    // Open picker and select dates
    fireEvent.click(screen.getByTestId('date-range-trigger'));
    fireEvent.click(screen.getByTestId('mock-select-dates'));

    // Submit
    fireEvent.click(screen.getByTestId('date-range-submit'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('date-range-submit').textContent).toBe('전송됨');
  });
});
