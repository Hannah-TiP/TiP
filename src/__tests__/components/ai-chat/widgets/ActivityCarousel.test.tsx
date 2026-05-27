/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ActivityCarousel from '@/components/ai-chat/widgets/ActivityCarousel';
import { apiClient } from '@/lib/api-client';
import type { AIChatActivityCarouselWidget } from '@/types/ai-chat';
import type { Activity } from '@/types/activity';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} alt={props.alt} />
  ),
}));

vi.mock('@/components/activity/ActivityDetailContent', () => ({
  default: ({ activity }: { activity: Activity }) => (
    <div data-testid="activity-detail-content">{activity.slug}</div>
  ),
}));

const WIDGET: AIChatActivityCarouselWidget = {
  widget_id: 'w-activities',
  widget_type: 'activity_carousel',
  activities: [
    {
      id: 10,
      name: 'Louvre Tour',
      image_url: null,
      description: null,
      category: 'museum',
      kind: 'local_experience',
    },
    {
      id: 11,
      name: 'Seine Cruise',
      image_url: null,
      description: null,
      category: 'tour',
      kind: 'local_experience',
    },
  ],
};

const FAKE_ACTIVITY: Activity = {
  id: 10,
  slug: 'louvre-tour',
  status: 'published',
  schema_version: 1,
  name: { en: 'Louvre Tour', kr: null },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

beforeEach(() => {
  vi.spyOn(apiClient, 'getActivityById').mockResolvedValue(FAKE_ACTIVITY);
});

describe('ActivityCarousel modal preview flow', () => {
  it('clicking a card opens the preview modal but does NOT fire onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<ActivityCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('activity-card-10'));

    await waitFor(() => {
      expect(screen.getByTestId('modal-dialog')).toBeDefined();
    });
    await waitFor(() => {
      expect(screen.getByTestId('activity-detail-content')).toBeDefined();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(apiClient.getActivityById).toHaveBeenCalledWith(10);
  });

  it('closing the modal via Cancel does NOT fire onSubmit and keeps the carousel active', async () => {
    const onSubmit = vi.fn();
    render(<ActivityCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('activity-card-10'));
    await waitFor(() => screen.getByTestId('activity-preview-cancel'));

    fireEvent.click(screen.getByTestId('activity-preview-cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });

    expect(onSubmit).not.toHaveBeenCalled();

    const otherCard = screen.getByTestId('activity-card-11');
    expect(otherCard.hasAttribute('disabled')).toBe(false);
  });

  it('closing the modal via ESC does NOT fire onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<ActivityCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('activity-card-10'));
    await waitFor(() => screen.getByTestId('modal-dialog'));

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Select this activity" fires onSubmit with the exact payload shape and disables the carousel', async () => {
    const onSubmit = vi.fn();
    render(<ActivityCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('activity-card-10'));
    await waitFor(() => screen.getByTestId('activity-preview-confirm'));

    fireEvent.click(screen.getByTestId('activity-preview-confirm'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-activities',
      widget_type: 'activity_carousel',
      value: { activity_id: 10, name: 'Louvre Tour' },
    });

    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });

    expect(screen.getByTestId('activity-card-10').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('activity-card-11').hasAttribute('disabled')).toBe(true);
  });

  it('shows an error state and a Close button when the fetch fails', async () => {
    vi.spyOn(apiClient, 'getActivityById').mockRejectedValueOnce(new Error('boom'));

    const onSubmit = vi.fn();
    render(<ActivityCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('activity-card-10'));

    await waitFor(() => {
      expect(screen.getByTestId('activity-preview-error')).toBeDefined();
    });

    expect(screen.queryByTestId('activity-detail-content')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
