"use client";

import type { UIBlock, WidgetResponsePayload } from '@/types/ai-chat';
import DateRangePicker from './DateRangePicker';
import NumberStepper from './NumberStepper';
import OptionSelector from './OptionSelector';
import HotelCarousel from './HotelCarousel';
import ConfirmSummary from './ConfirmSummary';

interface WidgetRendererProps {
  block: UIBlock;
  onSubmit: (payload: WidgetResponsePayload) => void;
  disabled?: boolean;
}

const WIDGET_MAP: Record<string, React.ComponentType<{ block: UIBlock; onSubmit: (payload: WidgetResponsePayload) => void; disabled?: boolean }>> = {
  date_range_picker: DateRangePicker,
  number_stepper: NumberStepper,
  option_selector: OptionSelector,
  hotel_carousel: HotelCarousel,
  confirm_summary: ConfirmSummary,
};

export default function WidgetRenderer({ block, onSubmit, disabled }: WidgetRendererProps) {
  const Component = WIDGET_MAP[block.type];
  if (!Component) return null;
  return <Component block={block} onSubmit={onSubmit} disabled={disabled} />;
}
