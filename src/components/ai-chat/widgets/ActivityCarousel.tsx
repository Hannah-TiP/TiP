'use client';

import { useCallback } from 'react';
import ActivityDetailContent from '@/components/activity/ActivityDetailContent';
import { apiClient } from '@/lib/api-client';
import type { AIChatActivityCarouselWidget, AIChatWidgetResponse } from '@/types/ai-chat';
import EntityCarousel from './EntityCarousel';

interface Props {
  widget: AIChatActivityCarouselWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function ActivityCarousel({ widget, onSubmit, disabled }: Props) {
  const fetchActivity = useCallback((id: number) => apiClient.getActivityById(id), []);

  return (
    <EntityCarousel
      items={widget.activities}
      entityLabel="Activity"
      selectLabel="Select this activity"
      onSubmit={onSubmit}
      disabled={disabled}
      fetchEntity={fetchActivity}
      renderDetail={(activity) => <ActivityDetailContent activity={activity} />}
      buildValue={(id, name) => ({
        widget_id: widget.widget_id,
        widget_type: 'activity_carousel',
        value: { activity_id: id, name },
      })}
      testIdPrefix="activity"
    />
  );
}
