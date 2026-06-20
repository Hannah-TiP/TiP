'use client';

import { useState } from 'react';
import type {
  AIChatNumberStepperWidget,
  AIChatWidgetResponse,
  NumberStepperField,
} from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  widget: AIChatNumberStepperWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

/**
 * The stepper field labels (`Adults (12+)` / `Kids (under 12)`) are LLM-generated
 * verbatim by the backend, so they cannot be localized server-side. Map the known
 * field keys to localized catalog strings; fall back to the backend label for any
 * unknown key.
 */
export function getStepperFieldLabel(
  field: NumberStepperField,
  t: (key: 'widget.stepper_adults' | 'widget.stepper_kids') => string,
): string {
  if (field.key === 'adults') return t('widget.stepper_adults');
  if (field.key === 'kids') return t('widget.stepper_kids');
  return field.label;
}

export default function NumberStepper({ widget, onSubmit, disabled }: Props) {
  const { t } = useLanguage();
  const fields = widget.fields ?? [];
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const field of fields) {
      initial[field.key] = field.default ?? field.min ?? 0;
    }
    return initial;
  });
  const [submitted, setSubmitted] = useState(false);

  function adjust(key: string, delta: number) {
    const field = fields.find((f) => f.key === key);
    if (!field) return;
    const min = field.min ?? 0;
    const max = field.max ?? 99;
    setValues((prev) => {
      const next = (prev[key] ?? 0) + delta;
      return { ...prev, [key]: Math.max(min, Math.min(max, next)) };
    });
  }

  function handleSubmit() {
    setSubmitted(true);
    onSubmit({
      widget_id: widget.widget_id,
      widget_type: 'number_stepper',
      value: { values: { ...values } },
    });
  }

  if (fields.length === 0) return null;

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="font-inter text-xs text-gray-500 mb-3">{t('widget.stepper_select')}</p>
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between gap-3">
            <span className="font-inter text-sm text-gray-700">
              {getStepperFieldLabel(field, t)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjust(field.key, -1)}
                disabled={disabled || submitted}
                className="w-7 h-7 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                data-testid={`stepper-dec-${field.key}`}
              >
                −
              </button>
              <span
                className="w-6 text-center font-inter text-sm"
                data-testid={`stepper-value-${field.key}`}
              >
                {values[field.key] ?? 0}
              </span>
              <button
                type="button"
                onClick={() => adjust(field.key, 1)}
                disabled={disabled || submitted}
                className="w-7 h-7 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                data-testid={`stepper-inc-${field.key}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || submitted}
          className="px-4 py-2 bg-[#1E3D2F] text-white text-sm rounded-full hover:bg-[#2a5240] disabled:opacity-50"
          data-testid="stepper-submit"
        >
          {submitted ? t('widget.stepper_sent') : t('widget.stepper_confirm')}
        </button>
      </div>
    </div>
  );
}
