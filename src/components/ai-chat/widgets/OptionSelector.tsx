'use client';

import { useState } from 'react';
import type { OptionSelectorConfig, UIBlock, WidgetResponse } from '@/types/ai-chat';

interface Props {
  block: UIBlock;
  config: OptionSelectorConfig;
  onSubmit: (response: WidgetResponse) => void;
  disabled?: boolean;
}

export default function OptionSelector({ block, config, onSubmit, disabled }: Props) {
  const options = config.options ?? [];
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(value: string, label: string) {
    if (disabled || selected) return;
    setSelected(value);
    onSubmit({
      widget_id: block.id,
      widget_type: 'option_selector',
      value: { value, label },
    });
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="font-inter text-xs text-gray-500 mb-2">{block.label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => handleSelect(option.value, option.label)}
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
