import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NumberStepper from '@/components/ai-chat/widgets/NumberStepper';
import enTranslations from '@/translations/en.json';
import krTranslations from '@/translations/kr.json';
import type { AIChatNumberStepperWidget } from '@/types/ai-chat';

const mockUseLanguage = vi.fn();

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => mockUseLanguage(),
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

function makeWidget(overrides?: Partial<AIChatNumberStepperWidget>): AIChatNumberStepperWidget {
  return {
    widget_id: 'w1',
    widget_type: 'number_stepper',
    fields: [
      { key: 'adults', label: 'Adults', min: 1, max: 10, default: 2 },
      { key: 'kids', label: 'Kids', min: 0, max: 6, default: 0 },
    ],
    ...overrides,
  };
}

describe('NumberStepper', () => {
  it('renders the submit button in English', () => {
    setLocale('en');
    render(<NumberStepper widget={makeWidget()} onSubmit={vi.fn()} />);

    expect(screen.getByText('Select values')).toBeTruthy();
    expect(screen.getByTestId('stepper-submit').textContent).toBe('Submit');
  });

  it('renders the submit button in Korean', () => {
    setLocale('kr');
    render(<NumberStepper widget={makeWidget()} onSubmit={vi.fn()} />);

    expect(screen.getByText('값 선택')).toBeTruthy();
    expect(screen.getByTestId('stepper-submit').textContent).toBe('제출');
  });

  it('shows sent state in Korean after submission', () => {
    setLocale('kr');
    const onSubmit = vi.fn();
    render(<NumberStepper widget={makeWidget()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('stepper-submit'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('stepper-submit').textContent).toBe('전송됨');
  });

  it('shows sent state in English after submission', () => {
    setLocale('en');
    const onSubmit = vi.fn();
    render(<NumberStepper widget={makeWidget()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('stepper-submit'));

    expect(screen.getByTestId('stepper-submit').textContent).toBe('Sent');
  });
});
