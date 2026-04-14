'use client';

import type {
  UIBlock,
  WidgetResponse,
  DateRangePickerConfig,
  NumberStepperConfig,
  OptionSelectorConfig,
  HotelCarouselConfig,
} from '@/types/ai-chat';
import DateRangePicker from './DateRangePicker';
import NumberStepper from './NumberStepper';
import OptionSelector from './OptionSelector';
import HotelCarousel from './HotelCarousel';

export interface WidgetRendererProps {
  block: UIBlock;
  onSubmit: (response: WidgetResponse) => void;
  disabled?: boolean;
}

export default function WidgetRenderer({ block, onSubmit, disabled }: WidgetRendererProps) {
  switch (block.type) {
    case 'date_range_picker':
      return (
        <DateRangePicker
          block={block}
          config={block.config as DateRangePickerConfig}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case 'number_stepper':
      return (
        <NumberStepper
          block={block}
          config={block.config as NumberStepperConfig}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case 'option_selector':
      return (
        <OptionSelector
          block={block}
          config={block.config as OptionSelectorConfig}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case 'hotel_carousel':
      return (
        <HotelCarousel
          block={block}
          config={block.config as HotelCarouselConfig}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}
