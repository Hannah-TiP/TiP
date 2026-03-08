'use client';

import { useState } from 'react';
import type { UIBlock, WidgetResponsePayload } from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  block: UIBlock;
  onSubmit: (payload: WidgetResponsePayload) => void;
  disabled?: boolean;
}

export default function ConfirmSummary({ block, onSubmit, disabled }: Props) {
  const { t } = useLanguage();
  const config = block.config as { trip_summary: Record<string, unknown> };
  const summary = config.trip_summary || {};
  const [submitted, setSubmitted] = useState(false);

  const handleAction = (confirmed: boolean) => {
    if (submitted || disabled) return;
    setSubmitted(true);
    onSubmit({
      widget_id: block.id,
      widget_type: 'confirm_summary',
      value: { confirmed },
    });
  };

  const rows = [
    {
      key: 'destination_city_ids',
      label: t('chat.destination'),
      value: summary.custom_destinations || summary.destination_city_ids,
    },
    {
      key: 'dates',
      label: t('chat.dates'),
      value:
        summary.start_date && summary.end_date
          ? `${summary.start_date} – ${summary.end_date}`
          : null,
    },
    {
      key: 'travelers',
      label: t('chat.travelers'),
      value: summary.adults
        ? `${summary.adults} ${t(Number(summary.adults) === 1 ? 'common.adult' : 'common.adults')}${summary.kids ? `, ${summary.kids} ${t(Number(summary.kids) === 1 ? 'common.kid' : 'common.kids')}` : ''}`
        : null,
    },
    {
      key: 'purpose',
      label: t('chat.purpose'),
      value: summary.purpose ? String(summary.purpose).replace('-', ' ') : null,
    },
    {
      key: 'service_type',
      label: 'Service',
      value: summary.service_type ? String(summary.service_type).replace('-', ' ') : null,
    },
    {
      key: 'budget',
      label: t('chat.budget'),
      value: summary.budget ? `$${Number(summary.budget).toLocaleString()}` : null,
    },
  ].filter((r) => r.value);

  return (
    <div className="mt-3 rounded-xl bg-white border border-gray-100 p-4 shadow-sm max-w-[360px]">
      <h4 className="font-cormorant text-lg font-semibold text-[#1E3D2F] mb-3">
        {t('widget.confirm_title')}
      </h4>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between font-inter text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="text-[#1E3D2F] font-medium text-right max-w-[180px] capitalize">
              {String(row.value)}
            </span>
          </div>
        ))}
      </div>
      {!submitted && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => handleAction(false)}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
          >
            {t('widget.confirm_edit')}
          </button>
          <button
            onClick={() => handleAction(true)}
            className="flex-1 rounded-lg bg-[#1E3D2F] py-2 text-[12px] font-semibold text-white hover:opacity-90"
          >
            {t('widget.confirm_button')}
          </button>
        </div>
      )}
    </div>
  );
}
