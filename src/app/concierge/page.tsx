'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import MessageList from '@/components/ai-chat/MessageList';
import ChatInput from '@/components/ai-chat/ChatInput';
import ConversationSidebar, {
  type ConciergeSession,
} from '@/components/ai-chat/ConversationSidebar';
import TripDetailPanel from '@/components/ai-chat/TripDetailPanel';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { createTripChatSession } from '@/lib/ai-chat-utils';
import { getTripWithVersion, type TripWithVersion } from '@/lib/trip-utils';
import { logChatResponse } from '@/lib/debug-log';
import type {
  AIChatMessage,
  AIChatSessionMetadata,
  SendAIChatMessageData,
  PendingMessage,
  AIChatWidgetResponse,
} from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePreviewMode } from '@/hooks/usePreviewMode';

function sortSessions(
  sessions: AIChatSessionMetadata[],
  detailsByTripId: Record<number, TripWithVersion | null>,
): ConciergeSession[] {
  return sessions
    .map((session) => ({
      session,
      tripDetail: detailsByTripId[session.trip_id] ?? null,
    }))
    .sort((a, b) => {
      const aTime = a.session.last_message_at ? new Date(a.session.last_message_at).getTime() : 0;
      const bTime = b.session.last_message_at ? new Date(b.session.last_message_at).getTime() : 0;
      return bTime - aTime;
    });
}

export default function ConciergePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3D2F] mx-auto mb-4" />
            <p className="font-inter text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ConciergeContent />
    </Suspense>
  );
}

function ConciergeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';
  const { t } = useLanguage();
  const { isPreview } = usePreviewMode();

  const [rawSessions, setRawSessions] = useState<AIChatSessionMetadata[]>([]);
  const [detailsByTripId, setDetailsByTripId] = useState<Record<number, TripWithVersion | null>>(
    {},
  );
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [highlightToken, setHighlightToken] = useState(0);
  const [pendingMessage, setPendingMessage] = useState<PendingMessage | null>(null);

  const sessions = useMemo(
    () => sortSessions(rawSessions, detailsByTripId),
    [rawSessions, detailsByTripId],
  );

  const activeSession = sessions.find((item) => item.session.id === activeSessionId) ?? null;
  const tripDetail = activeSession?.tripDetail ?? null;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/concierge');
    }
  }, [authLoading, isAuthenticated, router]);

  async function hydrateTripDetail(tripId: number): Promise<TripWithVersion | null> {
    try {
      const detail = await getTripWithVersion(tripId);
      setDetailsByTripId((prev) => ({ ...prev, [tripId]: detail }));
      return detail;
    } catch (err) {
      console.error('[Concierge] Failed to fetch trip:', err);
      setDetailsByTripId((prev) => ({ ...prev, [tripId]: null }));
      return null;
    }
  }

  async function loadSessionHistory(tripId: number) {
    try {
      const history = await apiClient.getChatHistory(tripId);
      setMessages(history);
    } catch (err) {
      console.error('[Concierge] Failed to load history:', err);
      setMessages([]);
    }
  }

  async function selectSession(
    sessionId: number,
    knownSessions: AIChatSessionMetadata[] = rawSessions,
  ) {
    const selected = knownSessions.find((item) => item.id === sessionId);
    if (!selected) return;

    setActiveSessionId(sessionId);
    setMessages([]);
    localStorage.setItem('concierge_active_session_id', String(sessionId));

    await Promise.all([
      loadSessionHistory(selected.trip_id),
      detailsByTripId[selected.trip_id] === undefined
        ? hydrateTripDetail(selected.trip_id)
        : Promise.resolve(detailsByTripId[selected.trip_id]),
    ]);
  }

  async function handleNewChat() {
    try {
      setError(null);
      const { session: createdSession } = await createTripChatSession();
      setRawSessions((prev) => {
        const deduped = prev.filter((item) => item.id !== createdSession.id);
        return [createdSession, ...deduped];
      });
      await hydrateTripDetail(createdSession.trip_id);
      await selectSession(createdSession.id, [createdSession, ...rawSessions]);
    } catch (err) {
      console.error('[Concierge] Failed to create new chat:', err);
      setError('Failed to create new chat session.');
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const init = async () => {
      try {
        setIsBootstrapping(true);
        const fetchedSessions = await apiClient.listChatSessions();
        if (cancelled) return;

        setRawSessions(fetchedSessions);

        const tripIdParam = searchParams.get('trip_id');
        const actionParam = searchParams.get('action');

        if (tripIdParam) {
          const tripId = Number.parseInt(tripIdParam, 10);
          const existingForTrip = fetchedSessions.find((item) => item.trip_id === tripId);

          if (existingForTrip) {
            await selectSession(existingForTrip.id, fetchedSessions);
            if (!cancelled && actionParam === 'submit') {
              router.replace(`/concierge?trip_id=${tripId}`, { scroll: false });
              await handleSendMessage(t('chat.submit_trip_message'), existingForTrip);
            }
            return;
          }

          try {
            const createdSession = await apiClient.createChatSessionForTrip(tripId);
            if (cancelled) return;

            const updatedSessions = [createdSession, ...fetchedSessions];
            setRawSessions(updatedSessions);
            await hydrateTripDetail(createdSession.trip_id);
            await selectSession(createdSession.id, updatedSessions);

            if (!cancelled && actionParam === 'submit') {
              router.replace(`/concierge?trip_id=${tripId}`, { scroll: false });
              await handleSendMessage(t('chat.submit_trip_message'), createdSession);
            }
            return;
          } catch (err) {
            console.error('[Concierge] Failed to create session for trip:', err);
          }
        }

        if (fetchedSessions.length > 0) {
          const storedId = localStorage.getItem('concierge_active_session_id');
          const storedSession = storedId
            ? fetchedSessions.find((item) => item.id === Number.parseInt(storedId, 10))
            : null;

          await selectSession(storedSession?.id ?? fetchedSessions[0].id, fetchedSessions);
        } else {
          await handleNewChat();
        }
      } catch (err) {
        console.error('[Concierge] Failed to initialize:', err);
        if (!cancelled) {
          setError('Failed to initialize chat. Please refresh the page.');
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function sendChatMessage(
    targetSession: AIChatSessionMetadata,
    content: string,
    widgetResponse: AIChatWidgetResponse | null,
  ) {
    if (!targetSession.trip_id) {
      console.error('[Concierge] Session has no trip_id; cannot send message');
      setError('Chat session is missing its trip identifier. Please refresh.');
      return;
    }

    const tripId = targetSession.trip_id;

    setPendingMessage({
      content: widgetResponse ? '' : content,
      widget_response: widgetResponse,
      sent_at: new Date().toISOString(),
    });

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.sendMessage(tripId, {
        content: widgetResponse ? '' : content,
        message_type: 'text',
        widget_response: widgetResponse,
        include_draft: isPreview,
      });

      const data: SendAIChatMessageData | undefined = response.data;
      if (!data) {
        throw new Error('Missing message response data');
      }

      setPendingMessage(null);

      setMessages((prev) => {
        const next = [...prev, data.user_message];
        if (data.assistant_message) {
          next.push(data.assistant_message);
        }
        return next;
      });

      const lastMsg = data.assistant_message ?? data.user_message;
      // Refetch the canonical session list so any out-of-band mode flips by
      // an admin (AI -> human or human -> AI) are reflected immediately --
      // the customer endpoint does not return updated session metadata, and
      // we need session.status accurate for the takeover banner.
      let refreshedSessions: AIChatSessionMetadata[] | null = null;
      try {
        refreshedSessions = await apiClient.listChatSessions();
      } catch (err) {
        console.error('[Concierge] Failed to refresh sessions:', err);
      }

      const updatedSession: AIChatSessionMetadata = refreshedSessions?.find(
        (item) => item.id === targetSession.id,
      ) ?? {
        ...targetSession,
        last_message_at: lastMsg.sent_at ?? new Date().toISOString(),
      };
      setRawSessions((prev) => {
        if (refreshedSessions) {
          // Keep order stable by promoting the just-used session to the top.
          const others = refreshedSessions.filter((item) => item.id !== updatedSession.id);
          return [updatedSession, ...others];
        }
        const deduped = prev.filter((item) => item.id !== updatedSession.id);
        return [updatedSession, ...deduped];
      });

      let hydratedDetail: TripWithVersion | null = null;
      let hydrateError: unknown;
      try {
        hydratedDetail = await getTripWithVersion(tripId);
        setDetailsByTripId((prev) => ({ ...prev, [tripId]: hydratedDetail }));
      } catch (err) {
        hydrateError = err;
        console.error('[Concierge] Failed to fetch trip:', err);
        setDetailsByTripId((prev) => ({ ...prev, [tripId]: null }));
      }

      logChatResponse({
        userMessage: data.user_message,
        assistantMessage: data.assistant_message,
        tripVersion: hydrateError ? undefined : (hydratedDetail?.currentVersion ?? null),
        tripVersionError: hydrateError,
      });

      if (data.field_updated && data.field_updated.length > 0) {
        setHighlightedFields(data.field_updated);
        setHighlightToken((t) => t + 1);
      }
    } catch (err) {
      console.error('[Concierge] Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      setPendingMessage(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(content: string, sessionOverride?: AIChatSessionMetadata) {
    const targetSession = sessionOverride ?? activeSession?.session ?? null;
    if (!targetSession || !content.trim()) return;
    await sendChatMessage(targetSession, content, null);
  }

  async function handleWidgetSubmit(response: AIChatWidgetResponse) {
    const targetSession = activeSession?.session ?? null;
    if (!targetSession) return;
    await sendChatMessage(targetSession, '', response);
  }

  async function handleUploadAudio(file: File) {
    const targetSession = activeSession?.session ?? null;
    if (!targetSession) return;

    setIsLoading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop() || 'm4a';
      const credentialsResponse = await apiClient.getS3UploadCredentials(
        String(targetSession.trip_id),
        'audio',
        ext,
      );
      const credentialsData = credentialsResponse.data || credentialsResponse;
      const uploadUrl = credentialsData.upload_url;
      const formData = credentialsData.form_data;
      const mediaUrl = credentialsData.public_url;

      if (!uploadUrl || !formData || !mediaUrl) {
        throw new Error('Invalid credentials response');
      }

      await apiClient.uploadToS3(uploadUrl, formData, file);
      const response = await apiClient.sendAudioMessage(targetSession.trip_id, mediaUrl);
      const data = response.data;

      if (!data) {
        throw new Error('Missing audio message response data');
      }

      setMessages((prev) => {
        const next = [...prev, data.user_message];
        if (data.assistant_message) {
          next.push(data.assistant_message);
        }
        return next;
      });

      const updatedSession: AIChatSessionMetadata = {
        ...targetSession,
        last_message_at:
          data.assistant_message?.sent_at ?? data.user_message.sent_at ?? new Date().toISOString(),
      };

      setRawSessions((prev) => {
        const deduped = prev.filter((item) => item.id !== updatedSession.id);
        return [updatedSession, ...deduped];
      });

      logChatResponse({
        userMessage: data.user_message,
        assistantMessage: data.assistant_message,
      });
    } catch (err) {
      console.error('[Concierge] Failed to upload audio:', err);
      setError('Failed to upload audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading || isBootstrapping) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3D2F] mx-auto mb-4" />
          <p className="font-inter text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <TopBar activeLink="Concierge" />

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-[60px] py-3">
          <div className="flex items-center justify-between">
            <p className="font-inter text-sm text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-red-800 hover:text-red-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex items-center justify-center w-8 bg-[#FAFAF8] border-r border-gray-100 hover:bg-gray-100 transition-colors"
            title="Expand sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <ConversationSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(sessionId) => selectSession(sessionId)}
          onNewChat={handleNewChat}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(true)}
        />

        <div className="flex-1 flex flex-col border-r border-gray-100">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            pendingMessage={pendingMessage}
            onWidgetSubmit={handleWidgetSubmit}
          />
          {activeSession?.session.status === 'human' && (
            <div
              className="bg-[#FFF7E6] border-t border-[#FFD591] px-[60px] py-3 flex items-center gap-2"
              data-testid="human-takeover-banner"
            >
              <span className="font-inter text-xs uppercase tracking-wider text-[#C4956A] font-semibold">
                Concierge Team
              </span>
              <span className="font-inter text-sm text-gray-700">
                A human concierge is taking over from here. The AI is paused.
              </span>
            </div>
          )}
          <ChatInput
            onSendMessage={(content) => handleSendMessage(content)}
            onUploadAudio={handleUploadAudio}
            isLoading={isLoading}
          />
        </div>

        <TripDetailPanel
          tripDetail={tripDetail}
          onSubmitTrip={
            activeSession ? () => handleSendMessage(t('chat.submit_trip_message')) : undefined
          }
          isLoading={isLoading}
          highlightedFields={highlightedFields}
          highlightToken={highlightToken}
        />
      </div>
    </div>
  );
}
