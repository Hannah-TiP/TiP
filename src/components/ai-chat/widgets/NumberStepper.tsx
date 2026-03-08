'use client';

import { useState } from 'react';
import type { UIBlock, WidgetResponsePayload } from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';

interface StepperField {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
}

interface Props {
  block: UIBlock;
  onSubmit: (payload: WidgetResponsePayload) => void;
  disabled?: boolean;
}

export default function NumberStepper({ block, onSubmit }: Props) {
  const { t } = useLanguage();
  const config = block.config as { fields: StepperField[] };
  const fields = config.fields || [];

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const f of fields) init[f.key] = f.default;
    return init;
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (key: string, delta: number) => {
    if (submitted) return;
    const field = fields.find((f) => f.key === key);
    if (!field) return;
    const next = Math.max(field.min, Math.min(field.max, (values[key] || 0) + delta));
    setValues({ ...values, [key]: next });
  };

  const handleConfirm = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit({
      widget_id: block.id,
      widget_type: 'number_stepper',
      value: values,
    });
  };

  // Map field keys to translated labels
  const getLabel = (key: string, fallback: string) => {
    if (key === 'adults') return t('widget.stepper_adults');
    if (key === 'kids') return t('widget.stepper_kids');
    return fallback;
  };

  return (
    <div className="mt-3 rounded-xl bg-white border border-gray-100 p-4 shadow-sm max-w-[320px]">
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between">
            <span className="font-inter text-sm text-[#1E3D2F] font-medium">
              {getLabel(field.key, field.label)}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => update(field.key, -1)}
                disabled={submitted || values[field.key] <= field.min}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-[#1E3D2F] hover:bg-gray-50 disabled:opacity-30"
              >
                −
              </button>
              <span className="font-inter text-sm font-semibold text-[#1E3D2F] min-w-[24px] text-center">
                {values[field.key]}
              </span>
              <button
                onClick={() => update(field.key, 1)}
                disabled={submitted || values[field.key] >= field.max}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-[#1E3D2F] hover:bg-gray-50 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      {!submitted && (
        <button
          onClick={handleConfirm}
          className="mt-4 w-full rounded-lg bg-[#1E3D2F] py-2 text-[12px] font-semibold text-white hover:opacity-90"
        >
          {t('widget.date_done')}
        </button>
      )}
    </div>
  );
}
