'use client';

import { useCallback } from 'react';
import RestaurantDetailContent from '@/components/restaurant/RestaurantDetailContent';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AIChatRestaurantCarouselWidget, AIChatWidgetResponse } from '@/types/ai-chat';
import EntityCarousel from './EntityCarousel';

interface Props {
  widget: AIChatRestaurantCarouselWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function RestaurantCarousel({ widget, onSubmit, disabled }: Props) {
  const { t } = useLanguage();
  const fetchRestaurant = useCallback((id: number) => apiClient.getRestaurantById(id), []);

  return (
    <EntityCarousel
      items={widget.restaurants}
      entityLabel={t('widget.carousel_entity_restaurant')}
      selectLabel={t('widget.carousel_select_restaurant')}
      onSubmit={onSubmit}
      disabled={disabled}
      fetchEntity={fetchRestaurant}
      renderDetail={(restaurant) => <RestaurantDetailContent restaurant={restaurant} />}
      buildValue={(selections) => ({
        widget_id: widget.widget_id,
        widget_type: 'restaurant_carousel',
        value: { restaurant_id: selections[0].id, name: selections[0].name },
      })}
      testIdPrefix="restaurant"
    />
  );
}
