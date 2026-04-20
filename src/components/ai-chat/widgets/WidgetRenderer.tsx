'use client';

import type { AIChatWidget, AIChatWidgetResponse } from '@/types/ai-chat';
import DateRangePicker from './DateRangePicker';
import NumberStepper from './NumberStepper';
import OptionSelector from './OptionSelector';
import HotelCarousel from './HotelCarousel';

export interface WidgetRendererProps {
  block: AIChatWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function WidgetRenderer({ block, onSubmit, disabled }: WidgetRendererProps) {
  switch (block.widget_type) {
    case 'date_range_picker':
      return <DateRangePicker widget={block} onSubmit={onSubmit} disabled={disabled} />;
    case 'number_stepper':
      return <NumberStepper widget={block} onSubmit={onSubmit} disabled={disabled} />;
    case 'option_selector':
      return <OptionSelector widget={block} onSubmit={onSubmit} disabled={disabled} />;
    case 'hotel_carousel':
      return <HotelCarousel widget={block} onSubmit={onSubmit} disabled={disabled} />;
    default:
      return null;
  }
}
