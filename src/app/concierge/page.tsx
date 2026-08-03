'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MessageList from '@/components/ai-chat/MessageList';
import ChatInput from '@/components/ai-chat/ChatInput';
import ConversationSidebar, {
  type ConciergeSession,
} from '@/components/ai-chat/ConversationSidebar';
import TripDetailPanel from '@/components/ai-chat/TripDetailPanel';
import RequestHumanCTA from '@/components/ai-chat/RequestHumanCTA';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { createTripChatSession } from '@/lib/ai-chat-utils';
import { getTripWithVersion, type TripWithVersion } from '@/lib/trip-utils';
import { logChatResponse } from '@/lib/debug-log';
import {
  buildPrefillSeedMessage,
  buildPrefillTripVersion,
  parseSearchPrefill,
} from '@/lib/search-prefill';
import type {
  AIChatMessage,
  AIChatSessionMetadata,
  AIChatSessionWithTrip,
  SendAIChatMessageData,
  PendingMessage,
  AIChatWidgetResponse,
} from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePreviewMode } from '@/hooks/usePreviewMode';

function sortSessions(
  bundles: AIChatSessionWithTrip[],
  detailsByTripId: Record<number, TripWithVersion | null>,
): ConciergeSession[] {
  return bundles
    .map((bundle) => ({
      session: bundle.session,
      trip: bundle.trip,
      tripDetail: detailsByTripId[bundle.session.trip_id] ?? null,
    }))
    .sort((a, b) => {
      const aTime = a.session.last_message_at ? new Date(a.session.last_message_at).getTime() : 0;
      const bTime = b.session.last_message_at ? new Date(b.session.last_message_at).getTime() : 0;
      return bTime - aTime;
    });
}

export default function ConciergePage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3D2F] mx-auto mb-4" />
            <p className="font-inter text-sm text-gray-600">{t('chat.loading')}</p>
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
  const { t, lang } = useLanguage();
  const { isPreview } = usePreviewMode();

  const [rawSessions, setRawSessions] = useState<AIChatSessionWithTrip[]>([]);
  const [detailsByTripId, setDetailsByTripId] = useState<Record<number, TripWithVersion | null>>(
    {},
  );
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Mobile-only slide-over drawers (< md). On desktop the sidebar and trip
  // panel live in the flex flow and these flags are inert.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTripPanelOpen, setMobileTripPanelOpen] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [highlightToken, setHighlightToken] = useState(0);
  const [pendingMessage, setPendingMessage] = useState<PendingMessage | null>(null);

  const sessions = useMemo(
    () => sortSessions(rawSessions, detailsByTripId),
    [rawSessions, detailsByTripId],
  );

  const activeSession = sessions.find((item) => item.session.id === activeSessionId) ?? null;
  const tripDetail = activeSession?.tripDetail ?? null;
  const activeTitle = tripDetail?.currentVersion?.title?.trim() || t('chat.new_trip');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Read params from the Next.js router state (not window.location) —
      // during an App Router transition the DOM URL can briefly trail the
      // route state, dropping the prefill query string on the redirect.
      const queryString = searchParams.toString();
      const fullPath = queryString ? `/concierge?${queryString}` : '/concierge';
      router.push(`/sign-in?redirect=${encodeURIComponent(fullPath)}`);
    }
  }, [authLoading, isAuthenticated, router, searchParams]);

  // While the chat is in human mode (admin has taken over), poll the message
  // history every second so admin replies surface in near-real-time. AI mode
  // doesn't need this — assistant replies arrive in the POST response.
  const isHumanMode = activeSession?.session.status === 'human';
  const activeTripId = activeSession?.session.trip_id ?? null;
  useEffect(() => {
    if (!isHumanMode || activeTripId == null) return;
    const id = window.setInterval(async () => {
      try {
        const history = await apiClient.getChatHistory(activeTripId);
        setMessages(history);
      } catch {
        // Silent — transient errors during polling shouldn't trigger UI noise.
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [isHumanMode, activeTripId]);

  // Lock body scroll while either mobile drawer is open, and close the open
  // drawer on Escape (mirrors the Modal.tsx pattern).
  const anyDrawerOpen = mobileSidebarOpen || mobileTripPanelOpen;
  useEffect(() => {
    if (!anyDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
        setMobileTripPanelOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [anyDrawerOpen]);

  async function hydrateTripDetail(tripId: number): Promise<TripWithVersion | null> {
    try {
      const detail = await getTripWithVersion(tripId, lang);
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
    knownSessions: AIChatSessionWithTrip[] = rawSessions,
  ) {
    const selected = knownSessions.find((item) => item.session.id === sessionId);
    if (!selected) return;

    setActiveSessionId(sessionId);
    setMessages([]);
    localStorage.setItem('concierge_active_session_id', String(sessionId));

    await Promise.all([
      loadSessionHistory(selected.session.trip_id),
      detailsByTripId[selected.session.trip_id] === undefined
        ? hydrateTripDetail(selected.session.trip_id)
        : Promise.resolve(detailsByTripId[selected.session.trip_id]),
    ]);
  }

  async function handleNewChat() {
    try {
      setError(null);
      const { session: createdSession } = await createTripChatSession(undefined, lang);
      // Refetch the canonical bundle list so the new session arrives with
      // its trip joined — we don't have the trip from the create response
      // alone.
      const refreshed = await apiClient.listChatSessions();
      setRawSessions(refreshed);
      await hydrateTripDetail(createdSession.trip_id);
      await selectSession(createdSession.id, refreshed);
    } catch (err) {
      console.error('[Concierge] Failed to create new chat:', err);
      setError(t('chat.new_chat_error'));
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

        // Prefill flow takes precedence over both trip_id resume and
        // last-active-session restore: every click on the homepage
        // SearchBar ALWAYS spins up a brand-new chat session pre-filled
        // with the user's search values.
        const prefill = parseSearchPrefill(searchParams);
        if (prefill) {
          try {
            const version = buildPrefillTripVersion(prefill);
            const { session: createdSession } = await createTripChatSession(version, lang);
            if (cancelled) return;

            const refreshed = await apiClient.listChatSessions();
            if (cancelled) return;
            setRawSessions(refreshed);
            await hydrateTripDetail(createdSession.trip_id);
            await selectSession(createdSession.id, refreshed);

            // Strip the query so a refresh doesn't re-fire the prefill flow.
            router.replace('/concierge', { scroll: false });

            // `t` from useLanguage is narrowed to a literal-union of
            // known keys; cast widens it for the helper (which has its
            // own key constants).
            const seedMessage = buildPrefillSeedMessage(
              prefill,
              t as (key: string) => string,
              lang,
            );
            if (seedMessage) {
              await handleSendMessage(seedMessage, createdSession);
            }
            return;
          } catch (err) {
            console.error('[Concierge] Failed to consume prefill:', err);
            setError('Failed to start your search. Please try again.');
            // Fall through to default bootstrap so the user isn't stranded.
          }
        }

        const tripIdParam = searchParams.get('trip_id');
        const actionParam = searchParams.get('action');

        if (tripIdParam) {
          const tripId = Number.parseInt(tripIdParam, 10);
          const existingForTrip = fetchedSessions.find((item) => item.session.trip_id === tripId);

          if (existingForTrip) {
            await selectSession(existingForTrip.session.id, fetchedSessions);
            if (!cancelled && actionParam === 'submit') {
              router.replace(`/concierge?trip_id=${tripId}`, { scroll: false });
              await handleSendMessage(t('chat.submit_trip_message'), existingForTrip.session);
            }
            return;
          }

          try {
            const createdSession = await apiClient.createChatSessionForTrip(tripId);
            if (cancelled) return;

            // Refetch to pick up the new session with its trip joined.
            const refreshed = await apiClient.listChatSessions();
            if (cancelled) return;
            setRawSessions(refreshed);
            await hydrateTripDetail(createdSession.trip_id);
            await selectSession(createdSession.id, refreshed);

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
            ? fetchedSessions.find((item) => item.session.id === Number.parseInt(storedId, 10))
            : null;

          await selectSession(
            storedSession?.session.id ?? fetchedSessions[0].session.id,
            fetchedSessions,
          );
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
      let refreshedBundles: AIChatSessionWithTrip[] | null = null;
      try {
        refreshedBundles = await apiClient.listChatSessions();
      } catch (err) {
        console.error('[Concierge] Failed to refresh sessions:', err);
      }

      setRawSessions((prev) => {
        if (refreshedBundles) {
          // Keep order stable by promoting the just-used session to the top.
          const updated = refreshedBundles.find((item) => item.session.id === targetSession.id);
          if (updated) {
            const others = refreshedBundles.filter((item) => item.session.id !== targetSession.id);
            return [updated, ...others];
          }
          return refreshedBundles;
        }
        // Refresh failed — patch the existing bundle's session field with
        // the new last_message_at so ordering still reflects activity.
        return prev.map((bundle) =>
          bundle.session.id === targetSession.id
            ? {
                ...bundle,
                session: {
                  ...bundle.session,
                  last_message_at: lastMsg.sent_at ?? new Date().toISOString(),
                },
              }
            : bundle,
        );
      });

      let hydratedDetail: TripWithVersion | null = null;
      let hydrateError: unknown;
      try {
        hydratedDetail = await getTripWithVersion(tripId, lang);
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

      const updatedLastMessageAt =
        data.assistant_message?.sent_at ?? data.user_message.sent_at ?? new Date().toISOString();

      setRawSessions((prev) => {
        const updated = prev.find((item) => item.session.id === targetSession.id);
        if (!updated) return prev;
        const patched: AIChatSessionWithTrip = {
          ...updated,
          session: { ...updated.session, last_message_at: updatedLastMessageAt },
        };
        const others = prev.filter((item) => item.session.id !== targetSession.id);
        return [patched, ...others];
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
          <p className="font-inter text-sm text-gray-600">{t('chat.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem-1px)] flex-col bg-white">
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 md:px-[60px] py-3">
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
        {/* Desktop sidebar — part of the flex flow at >= md only. On mobile it
            is removed from the flow and surfaced as a slide-over drawer. */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:landscape:flex items-center justify-center w-8 bg-[#FAFAF8] border-r border-gray-100 hover:bg-gray-100 transition-colors"
            title={t('chat.open_conversations')}
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

        <div className="hidden lg:landscape:flex" data-testid="desktop-conversation-sidebar">
          <ConversationSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={(sessionId) => selectSession(sessionId)}
            onNewChat={handleNewChat}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(true)}
          />
        </div>

        <div className="flex-1 flex flex-col border-r border-gray-100 min-w-0">
          {/* Mobile toolbar (< md): sidebar toggle | active session title | trip-detail toggle */}
          <div
            className="flex lg:landscape:hidden items-center justify-between px-4 py-2 border-b border-gray-100"
            data-testid="mobile-toolbar"
          >
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label={t('chat.open_conversations')}
              data-testid="mobile-sidebar-toggle"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 text-gray-600 hover:text-[#1E3D2F] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <span
              className="font-inter text-sm font-medium text-[#1E3D2F] truncate px-2"
              data-testid="mobile-toolbar-title"
            >
              {activeTitle}
            </span>
            <button
              type="button"
              onClick={() => setMobileTripPanelOpen(true)}
              aria-label={t('chat.open_trip_details')}
              data-testid="mobile-trip-panel-toggle"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 text-gray-600 hover:text-[#1E3D2F] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </button>
          </div>

          <MessageList
            key={activeSessionId ?? 'none'}
            messages={messages}
            isLoading={isLoading}
            pendingMessage={pendingMessage}
            onWidgetSubmit={handleWidgetSubmit}
          />
          {activeSession && (
            <RequestHumanCTA
              sessionStatus={activeSession.session.status}
              tripId={activeSession.session.trip_id}
              onRequested={async () => {
                try {
                  const [refreshedBundles, history] = await Promise.all([
                    apiClient.listChatSessions(),
                    apiClient.getChatHistory(activeSession.session.trip_id),
                  ]);
                  setRawSessions(refreshedBundles);
                  setMessages(history);
                } catch (err) {
                  console.error('[Concierge] Failed to refresh after human request:', err);
                }
              }}
            />
          )}
          {activeSession?.session.status === 'human' && (
            <div
              className="bg-[#FFF7E6] border-t border-[#FFD591] px-4 md:px-[60px] py-3 flex items-center gap-2"
              data-testid="human-takeover-banner"
            >
              <span className="font-inter text-xs uppercase tracking-wider text-[#C4956A] font-semibold">
                {t('chat.concierge_team')}
              </span>
              <span className="font-inter text-sm text-gray-700">
                {t('chat.human_takeover_notice')}
              </span>
            </div>
          )}
          <ChatInput
            onSendMessage={(content) => handleSendMessage(content)}
            onUploadAudio={handleUploadAudio}
            isLoading={isLoading}
          />
        </div>

        {/* Desktop trip detail panel — flex flow at >= md only. */}
        <div className="hidden lg:landscape:flex" data-testid="desktop-trip-detail-panel">
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

        {/* Mobile sidebar drawer (< md) — slides from the left. */}
        {mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/30 lg:landscape:hidden"
              onClick={() => setMobileSidebarOpen(false)}
              data-testid="mobile-sidebar-backdrop"
            />
            <div
              className="fixed inset-y-0 left-0 z-40 flex w-[280px] max-w-[85%] flex-col bg-[#FAFAF8] shadow-xl transition-transform duration-300 ease-in-out lg:landscape:hidden translate-x-0"
              data-testid="mobile-sidebar-drawer"
            >
              <div className="flex justify-end px-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label={t('chat.close_conversations')}
                  data-testid="mobile-sidebar-close"
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
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
              <div className="flex min-h-0 flex-1 [&>div]:flex-1">
                <ConversationSidebar
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={(sessionId) => {
                    setMobileSidebarOpen(false);
                    selectSession(sessionId);
                  }}
                  onNewChat={() => {
                    setMobileSidebarOpen(false);
                    handleNewChat();
                  }}
                  isCollapsed={false}
                  onToggleCollapse={() => setMobileSidebarOpen(false)}
                />
              </div>
            </div>
          </>
        )}

        {/* Mobile trip detail drawer (< md) — slides from the right. */}
        {mobileTripPanelOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/30 lg:landscape:hidden"
              onClick={() => setMobileTripPanelOpen(false)}
              data-testid="mobile-trip-panel-backdrop"
            />
            <div
              className="fixed inset-y-0 right-0 z-40 flex w-[85%] max-w-[420px] flex-col bg-[#FAFAF8] shadow-xl transition-transform duration-300 ease-in-out lg:landscape:hidden translate-x-0"
              data-testid="mobile-trip-panel-drawer"
            >
              <div className="flex justify-end px-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileTripPanelOpen(false)}
                  aria-label={t('chat.close_trip_details')}
                  data-testid="mobile-trip-panel-close"
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
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
              <div className="flex min-h-0 flex-1 [&>div]:flex-1">
                <TripDetailPanel
                  tripDetail={tripDetail}
                  onSubmitTrip={
                    activeSession
                      ? () => handleSendMessage(t('chat.submit_trip_message'))
                      : undefined
                  }
                  isLoading={isLoading}
                  highlightedFields={highlightedFields}
                  highlightToken={highlightToken}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
