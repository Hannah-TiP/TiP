import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import WidgetResponseDisplay from '@/components/ai-chat/WidgetResponseDisplay';
import type { AIChatWidgetResponse } from '@/types/ai-chat';

afterEach(() => {
  cleanup();
});

describe('WidgetResponseDisplay', () => {
  it('renders date range with formatted dates', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-1',
      widget_type: 'date_range_picker',
      value: { start_date: '2026-05-01', end_date: '2026-05-10' },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-date-range');
    expect(el).toBeDefined();
    expect(el.textContent).toContain('May');
    expect(el.textContent).toContain('2026');
  });

  it('renders date range fallback when dates are missing', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-1',
      widget_type: 'date_range_picker',
      value: {},
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-date-range');
    expect(el.textContent).toBe('Dates selected');
  });

  it('renders number stepper as chips', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-2',
      widget_type: 'number_stepper',
      value: { values: { adults: 2, kids: 1 } },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-number-stepper');
    expect(el).toBeDefined();
    expect(el.textContent).toContain('2 Adults');
    expect(el.textContent).toContain('1 Kids');
  });

  it('renders number stepper fallback when empty', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-2',
      widget_type: 'number_stepper',
      value: { values: {} },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-number-stepper');
    expect(el.textContent).toBe('Travelers selected');
  });

  it('renders option selector value as pill', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-3',
      widget_type: 'option_selector',
      value: { value: 'leisure' },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-option-selector');
    expect(el.textContent).toBe('leisure');
  });

  it('renders hotel carousel with hotel ID', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: { hotel_id: 100 },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-hotel-carousel');
    expect(el.textContent).toContain('Hotel 100');
  });

  it('renders hotel carousel fallback when hotel_id is null', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: {},
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-hotel-carousel');
    expect(el.textContent).toBe('Hotel selected');
  });

  it('renders multiple selected hotels as a comma-joined list', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: {
        hotels: [
          { hotel_id: 100, name: 'Ritz Paris' },
          { hotel_id: 101, name: 'Four Seasons' },
        ],
      },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-hotel-carousel');
    expect(el.textContent).toContain('Ritz Paris');
    expect(el.textContent).toContain('Four Seasons');
    expect(el.textContent).toContain('Ritz Paris, Four Seasons');
  });

  it('falls back to "Hotel <id>" for a multi entry with a null name', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: {
        hotels: [
          { hotel_id: 100, name: 'Ritz Paris' },
          { hotel_id: 101, name: null },
        ],
      },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-hotel-carousel');
    expect(el.textContent).toBe('Ritz Paris, Hotel 101');
  });

  it('still renders a single-shape hotel response (backward compatible)', () => {
    const response: AIChatWidgetResponse = {
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: { hotel_id: 679, name: 'Aman Tokyo' },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-hotel-carousel');
    expect(el.textContent).toBe('Aman Tokyo');
  });
});
