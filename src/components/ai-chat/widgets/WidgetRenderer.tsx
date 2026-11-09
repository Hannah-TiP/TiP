'use client';

import type { AIChatWidget, AIChatWidgetResponse } from '@/types/ai-chat';
import ActivityCarousel from './ActivityCarousel';
import DateRangePicker from './DateRangePicker';
import HotelCarousel from './HotelCarousel';
import NumberStepper from './NumberStepper';
import OptionSelector from './OptionSelector';
import QuoteSent from './QuoteSent';
import RestaurantCarousel from './RestaurantCarousel';

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
    case 'activity_carousel':
      return <ActivityCarousel widget={block} onSubmit={onSubmit} disabled={disabled} />;
    case 'restaurant_carousel':
      return <RestaurantCarousel widget={block} onSubmit={onSubmit} disabled={disabled} />;
    case 'quote_sent':
      // A link to the quote, not an answer to a question: it stays tappable
      // after later messages (the concierge usually follows up with text).
      return <QuoteSent widget={block} />;
    default:
      return null;
  }
}
