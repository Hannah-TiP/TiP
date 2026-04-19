import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import WidgetResponseDisplay from '@/components/ai-chat/WidgetResponseDisplay';
import type { WidgetResponse } from '@/types/ai-chat';

afterEach(() => {
  cleanup();
});

describe('WidgetResponseDisplay', () => {
  it('renders date range with formatted dates', () => {
    const response: WidgetResponse = {
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
    const response: WidgetResponse = {
      widget_id: 'w-1',
      widget_type: 'date_range_picker',
      value: {},
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-date-range');
    expect(el.textContent).toBe('Dates selected');
  });

  it('renders number stepper as chips', () => {
    const response: WidgetResponse = {
      widget_id: 'w-2',
      widget_type: 'number_stepper',
      value: { adults: 2, kids: 1 },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-number-stepper');
    expect(el).toBeDefined();
    expect(el.textContent).toContain('2 Adults');
    expect(el.textContent).toContain('1 Kids');
  });

  it('renders number stepper fallback when empty', () => {
    const response: WidgetResponse = {
      widget_id: 'w-2',
      widget_type: 'number_stepper',
      value: {},
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-number-stepper');
    expect(el.textContent).toBe('Travelers selected');
  });

  it('renders option selector label as pill', () => {
    const response: WidgetResponse = {
      widget_id: 'w-3',
      widget_type: 'option_selector',
      value: { value: 'leisure', label: 'Leisure' },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-option-selector');
    expect(el.textContent).toBe('Leisure');
  });

  it('renders option selector with value fallback when label missing', () => {
    const response: WidgetResponse = {
      widget_id: 'w-3',
      widget_type: 'option_selector',
      value: { value: 'business' },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-option-selector');
    expect(el.textContent).toBe('business');
  });

  it('renders hotel carousel with hotel name', () => {
    const response: WidgetResponse = {
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: { hotel_id: 100, hotel_name: 'Ritz Paris' },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-hotel-carousel');
    expect(el.textContent).toContain('Ritz Paris');
  });

  it('renders hotel carousel fallback when name missing', () => {
    const response: WidgetResponse = {
      widget_id: 'w-4',
      widget_type: 'hotel_carousel',
      value: { hotel_id: 100 },
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-hotel-carousel');
    expect(el.textContent).toBe('Hotel selected');
  });

  it('renders default fallback for unknown widget type', () => {
    const response: WidgetResponse = {
      widget_id: 'w-5',
      widget_type: 'unknown_type',
      value: {},
    };

    render(<WidgetResponseDisplay response={response} />);

    const el = screen.getByTestId('widget-response-default');
    expect(el.textContent).toBe('Selection confirmed');
  });
});
