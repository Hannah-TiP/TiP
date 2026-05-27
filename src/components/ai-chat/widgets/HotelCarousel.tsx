'use client';

import { useCallback } from 'react';
import HotelDetailContent from '@/components/hotel/HotelDetailContent';
import { apiClient } from '@/lib/api-client';
import type { AIChatHotelCarouselWidget, AIChatWidgetResponse } from '@/types/ai-chat';
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
      fetchEntity={fetchHotel}
      renderDetail={(hotel) => <HotelDetailContent hotel={hotel} />}
      buildValue={(id, name) => ({
        widget_id: widget.widget_id,
        widget_type: 'hotel_carousel',
        value: { hotel_id: id, name },
      })}
      testIdPrefix="hotel"
    />
  );
}
