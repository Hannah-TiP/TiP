'use client';

import { useCallback } from 'react';
import HotelDetailContent from '@/components/hotel/HotelDetailContent';
import { apiClient } from '@/lib/api-client';
import type {
  AIChatHotelCarouselWidget,
  AIChatWidgetResponse,
  HotelCarouselValue,
} from '@/types/ai-chat';
import EntityCarousel from './EntityCarousel';

interface Props {
  widget: AIChatHotelCarouselWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function HotelCarousel({ widget, onSubmit, disabled }: Props) {
  const fetchHotel = useCallback((id: number) => apiClient.getHotelById(id), []);

  return (
    <EntityCarousel
      items={widget.hotels}
      entityLabel="Hotel"
      selectLabel="Select this hotel"
      onSubmit={onSubmit}
      disabled={disabled}
      multiSelect
      fetchEntity={fetchHotel}
      renderDetail={(hotel) => <HotelDetailContent hotel={hotel} />}
      buildValue={(selections) => {
        const value: HotelCarouselValue =
          selections.length > 1
            ? { hotels: selections.map((s) => ({ hotel_id: s.id, name: s.name })) }
            : { hotel_id: selections[0].id, name: selections[0].name };
        return {
          widget_id: widget.widget_id,
          widget_type: 'hotel_carousel',
          value,
        };
      }}
      testIdPrefix="hotel"
    />
  );
}
