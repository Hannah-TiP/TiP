'use client';

import { useCallback } from 'react';
import ActivityDetailContent from '@/components/activity/ActivityDetailContent';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AIChatActivityCarouselWidget, AIChatWidgetResponse } from '@/types/ai-chat';
import EntityCarousel from './EntityCarousel';

interface Props {
  widget: AIChatActivityCarouselWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function ActivityCarousel({ widget, onSubmit, disabled }: Props) {
  const { t } = useLanguage();
  const fetchActivity = useCallback((id: number) => apiClient.getActivityById(id), []);

  return (
    <EntityCarousel
      items={widget.activities}
      entityLabel={t('widget.carousel_entity_activity')}
      selectLabel={t('widget.carousel_select_activity')}
      onSubmit={onSubmit}
      disabled={disabled}
      fetchEntity={fetchActivity}
      renderDetail={(activity) => <ActivityDetailContent activity={activity} />}
      buildValue={(selections) => ({
        widget_id: widget.widget_id,
        widget_type: 'activity_carousel',
        value: { activity_id: selections[0].id, name: selections[0].name },
      })}
      testIdPrefix="activity"
    />
  );
}
