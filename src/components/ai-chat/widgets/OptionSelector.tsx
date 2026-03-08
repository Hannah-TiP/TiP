'use client';

import { useState } from 'react';
import type { UIBlock, WidgetResponsePayload } from '@/types/ai-chat';

interface Option {
  value: string;
  label: string;
}

interface Props {
  block: UIBlock;
  onSubmit: (payload: WidgetResponsePayload) => void;
  disabled?: boolean;
}

export default function OptionSelector({ block, onSubmit, disabled }: Props) {
  const config = block.config as { options: Option[]; multi_select?: boolean };
  const options = config.options || [];
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (value: string) => {
    if (submitted || disabled) return;
    setSelected(value);
    setSubmitted(true);
    onSubmit({
      widget_id: block.id,
      widget_type: 'option_selector',
      value: { selected: value },
    });
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleSelect(opt.value)}
          disabled={submitted || disabled}
          className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors border
            ${
              selected === opt.value
                ? 'bg-[#1E3D2F] text-white border-[#1E3D2F]'
                : submitted
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-[#1E3D2F] border-gray-200 hover:border-[#1E3D2F] hover:bg-[#1E3D2F]/5'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
