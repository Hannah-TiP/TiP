'use client';

import { useCallback } from 'react';
import RestaurantDetailContent from '@/components/restaurant/RestaurantDetailContent';
import { apiClient } from '@/lib/api-client';
import type { AIChatRestaurantCarouselWidget, AIChatWidgetResponse } from '@/types/ai-chat';
import EntityCarousel from './EntityCarousel';

interface Props {
  widget: AIChatRestaurantCarouselWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function RestaurantCarousel({ widget, onSubmit, disabled }: Props) {
  const fetchRestaurant = useCallback((id: number) => apiClient.getRestaurantById(id), []);

  return (
    <EntityCarousel
      items={widget.restaurants}
      entityLabel="Restaurant"
      selectLabel="Select this restaurant"
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
