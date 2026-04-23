import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AIChatMessage } from '@/types/ai-chat';
import type { TripVersion } from '@/types/trip';

vi.mock('@/lib/preview-mode', () => ({
  isPreviewModeAllowed: vi.fn(),
}));

import { logChatResponse } from '@/lib/debug-log';
import { isPreviewModeAllowed } from '@/lib/preview-mode';

const mockedIsPreviewModeAllowed = vi.mocked(isPreviewModeAllowed);

const userMessage: AIChatMessage = {
  id: 1,
  user_id: 10,
  trip_id: 100,
  role: 'user',
  message_type: 'text',
  content: 'Plan a trip to Paris',
};

const assistantMessage: AIChatMessage = {
  id: 2,
  user_id: 10,
  trip_id: 100,
  role: 'assistant',
  message_type: 'text',
  content: 'Sure, let me help.',
};

const tripVersion: TripVersion = {
  id: 7,
  trip_id: 100,
  schema_version: 1,
  adults: 2,
  kids: 0,
};

describe('logChatResponse', () => {
  let groupSpy: ReturnType<typeof vi.spyOn>;
  let groupEndSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    groupSpy = vi.spyOn(console, 'group').mockImplementation(() => undefined);
    groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    groupSpy.mockRestore();
    groupEndSpy.mockRestore();
    logSpy.mockRestore();
    mockedIsPreviewModeAllowed.mockReset();
  });

  it('emits a console group with user/assistant/tripVersion when preview mode is allowed', () => {
    mockedIsPreviewModeAllowed.mockReturnValue(true);

    logChatResponse({
      userMessage,
      assistantMessage,
      tripVersion,
    });

    expect(groupSpy).toHaveBeenCalledTimes(1);
    expect(groupSpy.mock.calls[0][0]).toMatch(/^Concierge chat response @ /);

    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(logSpy).toHaveBeenNthCalledWith(1, 'user_message', userMessage);
    expect(logSpy).toHaveBeenNthCalledWith(2, 'assistant_message', assistantMessage);
    expect(logSpy).toHaveBeenNthCalledWith(3, 'tripVersion', tripVersion);

    expect(groupEndSpy).toHaveBeenCalledTimes(1);
  });

  it('stays silent when preview mode is not allowed', () => {
    mockedIsPreviewModeAllowed.mockReturnValue(false);

    logChatResponse({
      userMessage,
      assistantMessage,
      tripVersion,
    });

    expect(groupSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(groupEndSpy).not.toHaveBeenCalled();
  });

  it('logs tripVersion_error variant when an error is passed', () => {
    mockedIsPreviewModeAllowed.mockReturnValue(true);
    const err = new Error('hydrate failed');

    logChatResponse({
      userMessage,
      assistantMessage,
      tripVersionError: err,
    });

    expect(groupSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(logSpy).toHaveBeenNthCalledWith(1, 'user_message', userMessage);
    expect(logSpy).toHaveBeenNthCalledWith(2, 'assistant_message', assistantMessage);
    expect(logSpy).toHaveBeenNthCalledWith(3, 'tripVersion_error', err);
    expect(groupEndSpy).toHaveBeenCalledTimes(1);
  });

  it('logs tripVersion as null when omitted (audio path)', () => {
    mockedIsPreviewModeAllowed.mockReturnValue(true);

    logChatResponse({
      userMessage,
      assistantMessage,
    });

    expect(groupSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(logSpy).toHaveBeenNthCalledWith(3, 'tripVersion', undefined);
  });
});
