import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WidgetRenderer from '@/components/ai-chat/widgets/WidgetRenderer';
import type { AIChatWidget } from '@/types/ai-chat';

afterEach(() => {
  cleanup();
});

describe('WidgetRenderer factory', () => {
  it('dispatches to NumberStepper for number_stepper type', () => {
    const widget: AIChatWidget = {
      widget_id: 'w-1',
      widget_type: 'number_stepper',
      fields: [{ key: 'adults', label: 'Adults', min: 1, max: 5, default: 2 }],
    };

    const onSubmit = vi.fn();
    render(<WidgetRenderer block={widget} onSubmit={onSubmit} />);

    expect(screen.getByText('Adults')).toBeDefined();
    expect(screen.getByTestId('stepper-value-adults').textContent).toBe('2');

    fireEvent.click(screen.getByTestId('stepper-inc-adults'));
    fireEvent.click(screen.getByTestId('stepper-submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-1',
      widget_type: 'number_stepper',
      value: { values: { adults: 3 } },
    });
  });

  it('dispatches to OptionSelector for option_selector type', () => {
    const widget: AIChatWidget = {
      widget_id: 'w-2',
      widget_type: 'option_selector',
      label: 'Purpose',
      options: [
        { value: 'leisure', label: 'Leisure' },
        { value: 'business', label: 'Business' },
      ],
    };

    const onSubmit = vi.fn();
    render(<WidgetRenderer block={widget} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('option-leisure'));

    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-2',
      widget_type: 'option_selector',
      value: { value: 'leisure' },
    });
  });

  it('dispatches to DateRangePicker for date_range_picker type', () => {
    const widget: AIChatWidget = {
      widget_id: 'w-3',
      widget_type: 'date_range_picker',
      min_date: '2026-04-01',
    };

    render(<WidgetRenderer block={widget} onSubmit={() => {}} />);

    expect(screen.getByTestId('date-range-trigger')).toBeDefined();
    expect(screen.getByTestId('date-range-submit')).toBeDefined();
  });

  it('dispatches to HotelCarousel for hotel_carousel type', () => {
    const widget: AIChatWidget = {
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      hotels: [
        { id: 100, name: 'Ritz Paris', image_url: null, overview: null, benefits: [] },
        { id: 101, name: 'Four Seasons', image_url: null, overview: null, benefits: [] },
      ],
    };

    const onSubmit = vi.fn();
    render(<WidgetRenderer block={widget} onSubmit={onSubmit} />);

    expect(screen.getByText('Ritz Paris')).toBeDefined();
    expect(screen.getByText('Four Seasons')).toBeDefined();

    fireEvent.click(screen.getByTestId('hotel-card-100'));
    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: { hotel_id: 100, name: 'Ritz Paris' },
    });
  });

  it('renders nothing for unknown widget type', () => {
    const widget = {
      widget_id: 'w-5',
      widget_type: 'confirm_summary',
    } as unknown as AIChatWidget;

    const { container } = render(<WidgetRenderer block={widget} onSubmit={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
