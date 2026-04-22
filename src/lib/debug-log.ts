'use client';

import { isPreviewModeAllowed } from '@/lib/preview-mode';
import type { AIChatMessage } from '@/types/ai-chat';
import type { TripVersion } from '@/types/trip';

export interface LogChatResponseParams {
  userMessage: AIChatMessage;
  assistantMessage: AIChatMessage | null;
  tripVersion?: TripVersion | null;
  tripVersionError?: unknown;
}

/**
 * Emit a structured debug group describing one chat response cycle.
 *
 * Gated on isPreviewModeAllowed(): only logs when
 * NEXT_PUBLIC_ENABLE_PREVIEW_MODE=true (staging + local), never in production.
 */
export function logChatResponse({
  userMessage,
  assistantMessage,
  tripVersion,
  tripVersionError,
}: LogChatResponseParams): void {
  if (!isPreviewModeAllowed()) return;

  const timestamp = new Date().toISOString();
  console.group(`Concierge chat response @ ${timestamp}`);
  console.log('user_message', userMessage);
  console.log('assistant_message', assistantMessage);
  if (tripVersionError !== undefined) {
    console.log('tripVersion_error', tripVersionError);
  } else {
    console.log('tripVersion', tripVersion);
  }
  console.groupEnd();
}
