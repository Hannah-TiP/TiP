import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WidgetRenderer from '@/components/ai-chat/widgets/WidgetRenderer';
import type { UIBlock } from '@/types/ai-chat';

afterEach(() => {
  cleanup();
});

describe('WidgetRenderer factory', () => {
  it('dispatches to NumberStepper for number_stepper type', () => {
    const block: UIBlock = {
      id: 'w-1',
      type: 'number_stepper',
      label: 'Travelers',
      config: {
        fields: [{ key: 'adults', label: 'Adults', min: 1, max: 5, default: 2 }],
      },
    };

    const onSubmit = vi.fn();
    render(<WidgetRenderer block={block} onSubmit={onSubmit} />);

    expect(screen.getByText('Travelers')).toBeDefined();
    expect(screen.getByText('Adults')).toBeDefined();
    expect(screen.getByTestId('stepper-value-adults').textContent).toBe('2');

    fireEvent.click(screen.getByTestId('stepper-inc-adults'));
    fireEvent.click(screen.getByTestId('stepper-submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-1',
      widget_type: 'number_stepper',
      value: { adults: 3 },
    });
  });

  it('dispatches to OptionSelector for option_selector type', () => {
    const block: UIBlock = {
      id: 'w-2',
      type: 'option_selector',
      label: 'Purpose',
      config: {
        options: [
          { value: 'leisure', label: 'Leisure' },
          { value: 'business', label: 'Business' },
        ],
      },
    };

    const onSubmit = vi.fn();
    render(<WidgetRenderer block={block} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('option-leisure'));

    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-2',
      widget_type: 'option_selector',
      value: { value: 'leisure', label: 'Leisure' },
    });
  });

  it('dispatches to DateRangePicker for date_range_picker type', () => {
    const block: UIBlock = {
      id: 'w-3',
      type: 'date_range_picker',
      label: 'Travel dates',
      config: { min_date: '2026-04-01' },
    };

    render(<WidgetRenderer block={block} onSubmit={() => {}} />);

    expect(screen.getByText('Travel dates')).toBeDefined();
    expect(screen.getByTestId('date-range-trigger')).toBeDefined();
    expect(screen.getByTestId('date-range-submit')).toBeDefined();
  });

  it('dispatches to HotelCarousel for hotel_carousel type', () => {
    const block: UIBlock = {
      id: 'w-4',
      type: 'hotel_carousel',
      label: 'Hotels',
      config: {
        hotels: [
          { id: 100, name: { en: 'Test Hotel' }, star_rating: '5' },
          { id: 101, name: 'Plain Name Hotel' },
        ],
      },
    };

    const onSubmit = vi.fn();
    render(<WidgetRenderer block={block} onSubmit={onSubmit} />);

    expect(screen.getByText('Test Hotel')).toBeDefined();
    expect(screen.getByText('Plain Name Hotel')).toBeDefined();

    fireEvent.click(screen.getByTestId('hotel-card-100'));
    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: { hotel_id: 100, hotel_name: 'Test Hotel' },
    });
  });

  it('renders nothing for unknown widget type (e.g. confirm_summary, deferred)', () => {
    const block: UIBlock = {
      id: 'w-5',
      type: 'confirm_summary',
      label: 'Confirm',
      config: {},
    };

    const { container } = render(<WidgetRenderer block={block} onSubmit={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
