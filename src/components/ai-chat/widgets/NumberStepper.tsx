'use client';

import { useState } from 'react';
import type { NumberStepperConfig, UIBlock, WidgetResponse } from '@/types/ai-chat';

interface Props {
  block: UIBlock;
  config: NumberStepperConfig;
  onSubmit: (response: WidgetResponse) => void;
  disabled?: boolean;
}

export default function NumberStepper({ block, config, onSubmit, disabled }: Props) {
  const fields = config.fields ?? [];
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
      widget_id: block.id,
      widget_type: 'number_stepper',
      value: { ...values },
    });
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="font-inter text-xs text-gray-500 mb-3">{block.label}</p>
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between gap-3">
            <span className="font-inter text-sm text-gray-700">{field.label}</span>
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
          {submitted ? 'Sent' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}
