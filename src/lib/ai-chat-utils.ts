import { apiClient } from '@/lib/api-client';
import type { AIChatSessionMetadata } from '@/types/ai-chat';
import type { TripVersion } from '@/types/trip';

export interface TripChatSession {
  trip_id: number;
  session: AIChatSessionMetadata;
}

export async function createTripChatSession(
  currentVersion: Partial<TripVersion> = { title: 'New Trip' },
): Promise<TripChatSession> {
  const trip = await apiClient.createTrip(currentVersion);
  const session = await apiClient.createChatSessionForTrip(trip.id);

  return {
    trip_id: trip.id,
    session,
  };
}
