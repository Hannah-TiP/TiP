import { apiClient } from '@/lib/api-client';
import type { Lang } from '@/contexts/LanguageContext';
import type { AIChatSessionMetadata } from '@/types/ai-chat';
import type { TripVersion } from '@/types/trip';

export interface TripChatSession {
  trip_id: number;
  session: AIChatSessionMetadata;
}

export async function createTripChatSession(
  currentVersion: Partial<TripVersion> = { title: 'New Trip' },
  language?: Lang,
): Promise<TripChatSession> {
  const trip = await apiClient.createTrip(currentVersion, language);
  const session = await apiClient.createChatSessionForTrip(trip.id);

  return {
    trip_id: trip.id,
    session,
  };
}
