'use client';

import { useState } from 'react';
import type { AIChatOptionSelectorWidget, AIChatWidgetResponse } from '@/types/ai-chat';

interface Props {
  widget: AIChatOptionSelectorWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function OptionSelector({ widget, onSubmit, disabled }: Props) {
  const options = widget.options ?? [];
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(value: string) {
    if (disabled || selected) return;
    setSelected(value);
    onSubmit({
      widget_id: widget.widget_id,
      widget_type: 'option_selector',
      value: { value },
    });
  }

  if (options.length === 0) return null;

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="font-inter text-xs text-gray-500 mb-2">{widget.label ?? 'Select an option'}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={disabled || !!selected}
              className={`px-4 py-2 rounded-full border text-sm transition-colors disabled:opacity-60 ${
                isSelected
                  ? 'bg-[#1E3D2F] text-white border-[#1E3D2F]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              data-testid={`option-${option.value}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
