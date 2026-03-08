"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from "@/components/TopBar";
import MessageList from '@/components/ai-chat/MessageList';
import ChatInput from '@/components/ai-chat/ChatInput';
import ConversationSidebar from '@/components/ai-chat/ConversationSidebar';
import TripDetailPanel from '@/components/ai-chat/TripDetailPanel';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import type {
  AIMessage,
  TripContext,
  SessionWithTrip,
  ChatHistoryResponse,
  CreateSessionResponse,
  ListSessionsResponse,
  SendMessageResponse,
  AnalyzeImageResponse,
  TranscribeAudioResponse,
  WidgetResponsePayload,
  ConverseResponse,
} from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';

function isSuccessResponse(response: { success?: boolean; code?: number }): boolean {
  return response.success === true || response.code === 200;
}

export default function ConciergePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3D2F] mx-auto mb-4" />
          <p className="font-inter text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
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
  const { lang } = useLanguage();

  const [sessions, setSessions] = useState<SessionWithTrip[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripContext, setTripContext] = useState<TripContext | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tripRefreshKey, setTripRefreshKey] = useState(0);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/concierge');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load chat history for a session and set messages + tripContext
  async function loadSessionHistory(sid: string) {
    try {
      const historyResponse = await apiClient.getChatHistory(sid, 1, 50) as ChatHistoryResponse;
      const isSuccess = isSuccessResponse(historyResponse);
      const historyData = historyResponse.data;

      if (isSuccess && historyData?.messages && historyData.messages.length > 0) {
        const chronologicalMessages = [...historyData.messages].reverse();
        setMessages(chronologicalMessages);

        const latestMessage = chronologicalMessages[chronologicalMessages.length - 1];
        setTripContext(latestMessage.message_metadata?.trip_context ?? null);
      } else {
        setMessages([]);
        setTripContext(null);
      }
    } catch (err) {
      console.error('[Concierge] Failed to load history:', err);
      setMessages([]);
      setTripContext(null);
    }
  }

  // Select a session: update active state and load its history
  async function selectSession(sid: string, sessionsList: SessionWithTrip[]) {
    const found = sessionsList.find(s => s.session_id === sid);
    setActiveSessionId(sid);
    setActiveTripId(found?.trip_id ?? null);
    setTripContext(null);
    localStorage.setItem('concierge_active_session_id', sid);
    await loadSessionHistory(sid);
  }

  // Create a new chat session and select it
  async function handleNewChat() {
    try {
      const response = await apiClient.createChatSession(lang) as CreateSessionResponse;
      const isSuccess = isSuccessResponse(response);
      const responseData = response.data;

      if (isSuccess && responseData) {
        const newSession: SessionWithTrip = {
          session_id: responseData.session_id,
          trip_id: responseData.trip_id ?? null,
          trip_title: null,
          trip_status: 'draft',
          trip_destinations: null,
          trip_start_date: null,
          trip_end_date: null,
          last_message_at: new Date().toISOString(),
          message_count: 1,
        };

        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(responseData.session_id);
        setActiveTripId(responseData.trip_id ?? null);
        setTripContext(null);
        localStorage.setItem('concierge_active_session_id', responseData.session_id);

        if (responseData.chat_history && responseData.chat_history.length > 0) {
          const initialMessages: AIMessage[] = responseData.chat_history.map((msg, index) => ({
            id: index,
            session_id: responseData.session_id,
            role: msg.role,
            content: msg.content,
            message_type: 'text' as const,
            created_at: new Date().toISOString(),
          }));
          setMessages(initialMessages);
        }
      }
    } catch (err) {
      console.error('[Concierge] Failed to create new chat:', err);
      setError('Failed to create new chat session.');
    }
  }

  // Initialize: fetch sessions and handle ?trip_id query param
  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      try {
        // Fetch all sessions
        const sessionsResponse = await apiClient.listChatSessions() as ListSessionsResponse;
        const isSuccess = isSuccessResponse(sessionsResponse);
        const sessionsList = (isSuccess && sessionsResponse.data) ? sessionsResponse.data : [];
        setSessions(sessionsList);

        // Handle ?trip_id query param (from trip detail "Edit in Concierge" button)
        const tripIdParam = searchParams.get('trip_id');
        if (tripIdParam) {
          const tripId = parseInt(tripIdParam, 10);
          const existingForTrip = sessionsList.find(s => s.trip_id === tripId);

          if (existingForTrip) {
            await selectSession(existingForTrip.session_id, sessionsList);
            return;
          }

          // Create a session for this trip
          try {
            const response = await apiClient.createChatSessionForTrip(tripId) as CreateSessionResponse;
            const respSuccess = isSuccessResponse(response);
            const respData = response.data;

            if (respSuccess && respData) {
              const newSession: SessionWithTrip = {
                session_id: respData.session_id,
                trip_id: tripId,
                trip_title: null,
                trip_status: null,
                trip_destinations: null,
                trip_start_date: null,
                trip_end_date: null,
                last_message_at: new Date().toISOString(),
                message_count: 1,
              };
              const updatedSessions = [newSession, ...sessionsList];
              setSessions(updatedSessions);
              await selectSession(respData.session_id, updatedSessions);
              return;
            }
          } catch (err) {
            console.error('[Concierge] Failed to create session for trip:', err);
          }
        }

        // Default: select most recent session or create one
        if (sessionsList.length > 0) {
          const storedId = localStorage.getItem('concierge_active_session_id');
          const storedSession = storedId ? sessionsList.find(s => s.session_id === storedId) : null;

          if (storedSession) {
            await selectSession(storedSession.session_id, sessionsList);
          } else {
            await selectSession(sessionsList[0].session_id, sessionsList);
          }
        } else {
          // No sessions at all — create one
          await handleNewChat();
        }
      } catch (err) {
        console.error('[Concierge] Failed to initialize:', err);
        setError('Failed to initialize chat. Please refresh the page.');
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Refresh sessions list (used after trip_created)
  async function refreshSessions() {
    try {
      const sessionsResponse = await apiClient.listChatSessions() as ListSessionsResponse;
      const isSuccess = isSuccessResponse(sessionsResponse);
      if (isSuccess && sessionsResponse.data) {
        setSessions(sessionsResponse.data);
      }
    } catch (err) {
      console.error('[Concierge] Failed to refresh sessions:', err);
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !activeSessionId) return;
    await handleConverse(content);
  };

  // Unified converse handler — used for both text messages and widget responses
  const handleConverse = async (content: string, widgetResponse?: WidgetResponsePayload) => {
    if (!activeSessionId) return;

    setIsLoading(true);
    setError(null);

    // Add optimistic user message (only for text, not widget — widget msg comes from backend)
    const TEMP_USER_MSG_ID = -1;
    if (content.trim() && !widgetResponse) {
      const userMessage: AIMessage = {
        id: TEMP_USER_MSG_ID,
        session_id: activeSessionId,
        role: 'user',
        content,
        message_type: 'text',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
    }

    try {
      const response = await apiClient.converse(activeSessionId, content, widgetResponse) as ConverseResponse;
      const isSuccess = isSuccessResponse(response);
      const responseData = response.data;

      if (isSuccess && responseData) {
        // Replace temp user message ID with the real DB ID
        if (responseData.user_message_id) {
          setMessages(prev =>
            prev.map(m =>
              m.id === TEMP_USER_MSG_ID ? { ...m, id: responseData.user_message_id! } : m
            )
          );
        }

        const assistantMessage: AIMessage = {
          id: responseData.assistant_message_id,
          session_id: activeSessionId,
          role: 'assistant',
          content: responseData.response,
          message_type: 'text',
          message_metadata: {
            ui_blocks: responseData.ui_blocks,
            field_updated: responseData.field_updated,
          },
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Refresh right pane with updated trip
        setTripRefreshKey(prev => prev + 1);

        // Update tripContext from the response trip data
        if (responseData.trip) {
          setTripContext({
            destination: responseData.trip.preset_destination_cities_names || responseData.trip.custom_destination_cities || undefined,
            start_date: responseData.trip.start_date || undefined,
            end_date: responseData.trip.end_date || undefined,
            adults: responseData.trip.adults,
            kids: responseData.trip.kids,
            purpose: responseData.trip.purpose,
            budget: responseData.trip.budget || undefined,
            service_type: responseData.trip.service_type || undefined,
          });
        }

        // Update sidebar session with latest trip data from the response
        if (responseData.trip && responseData.field_updated?.length) {
          setSessions(prev =>
            prev.map(s =>
              s.session_id === activeSessionId
                ? {
                    ...s,
                    trip_title: s.trip_title,
                    trip_destinations:
                      responseData.trip!.preset_destination_cities_names ||
                      responseData.trip!.custom_destination_cities ||
                      s.trip_destinations,
                    trip_start_date: responseData.trip!.start_date ?? s.trip_start_date,
                    trip_end_date: responseData.trip!.end_date ?? s.trip_end_date,
                    trip_status: responseData.trip!.status ?? s.trip_status,
                    message_count: s.message_count + (widgetResponse ? 1 : 2),
                    last_message_at: new Date().toISOString(),
                  }
                : s
            )
          );
        }
      }
    } catch (err) {
      console.error('[Concierge] Failed to converse:', err);
      setError('Failed to send message. Please try again.');
      // Remove optimistic user message on error
      if (content.trim() && !widgetResponse) {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWidgetSubmit = async (payload: WidgetResponsePayload) => {
    await handleConverse('', payload);
  };

  const handleUploadImage = async (file: File) => {
    if (!activeSessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const credentialsResponse = await apiClient.getS3UploadCredentials(activeSessionId, 'image', ext);
      const credentialsData = credentialsResponse.data || credentialsResponse;
      const uploadUrl = credentialsData.upload_url;
      const formData = credentialsData.form_data;
      const mediaUrl = credentialsData.public_url;

      if (!uploadUrl || !formData || !mediaUrl) throw new Error('Invalid credentials response');

      await apiClient.uploadToS3(uploadUrl, formData, file);

      const userImageMessage: AIMessage = {
        id: messages.length,
        session_id: activeSessionId,
        role: 'user',
        content: '',
        message_type: 'image',
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userImageMessage]);

      const analysisResponse = await apiClient.analyzeImageUrl(activeSessionId, mediaUrl, undefined, undefined, file.name);
      const typedAnalysisResponse = analysisResponse as AnalyzeImageResponse;
      const isSuccess = isSuccessResponse(typedAnalysisResponse);
      const responseData = typedAnalysisResponse.data;

      if (isSuccess && responseData) {
        let parsedAnalysisResult: { landmark?: string; location?: string; description?: string } | undefined;
        if (responseData.analysis_result) {
          try {
            parsedAnalysisResult = typeof responseData.analysis_result === 'string'
              ? JSON.parse(responseData.analysis_result)
              : responseData.analysis_result;
          } catch { /* ignore */ }
        }

        const assistantMessage: AIMessage = {
          id: messages.length + 1,
          session_id: activeSessionId,
          role: 'assistant',
          content: responseData.response,
          message_type: 'text',
          message_metadata: {
            intent: responseData.intent,
            analysis_result: parsedAnalysisResult,
            trips: responseData.trips,
            has_trips: responseData.has_trips,
          },
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (responseData.message_metadata?.trip_context) {
          setTripContext(responseData.message_metadata.trip_context);
        }
      }
    } catch (err) {
      console.error('[Concierge] Failed to upload image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAudio = async (file: File) => {
    if (!activeSessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop() || 'm4a';
      const credentialsResponse = await apiClient.getS3UploadCredentials(activeSessionId, 'audio', ext);
      const credentialsData = credentialsResponse.data || credentialsResponse;
      const uploadUrl = credentialsData.upload_url;
      const formData = credentialsData.form_data;
      const mediaUrl = credentialsData.public_url;

      if (!uploadUrl || !formData || !mediaUrl) throw new Error('Invalid credentials response');

      await apiClient.uploadToS3(uploadUrl, formData, file);

      const userAudioMessage: AIMessage = {
        id: messages.length,
        session_id: activeSessionId,
        role: 'user',
        content: '',
        message_type: 'audio',
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userAudioMessage]);

      const transcriptionResponse = await apiClient.transcribeAudioUrl(activeSessionId, mediaUrl, undefined, file.name);
      const typedTranscriptionResponse = transcriptionResponse as TranscribeAudioResponse;
      const isSuccess = isSuccessResponse(typedTranscriptionResponse);
      const responseData = typedTranscriptionResponse.data;

      if (isSuccess && responseData) {
        setMessages(prev => {
          const updatedMessages = [...prev];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage.message_type === 'audio') {
            lastMessage.content = responseData.transcription;
            lastMessage.message_metadata = { transcription: responseData.transcription };
          }
          return updatedMessages;
        });

        const assistantMessage: AIMessage = {
          id: messages.length + 1,
          session_id: activeSessionId,
          role: 'assistant',
          content: responseData.response,
          message_type: 'text',
          message_metadata: {
            intent: responseData.intent,
            trips: responseData.trips,
            has_trips: responseData.has_trips,
          },
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (responseData.message_metadata?.trip_context) {
          setTripContext(responseData.message_metadata.trip_context);
        }
      }
    } catch (err) {
      console.error('[Concierge] Failed to upload audio:', err);
      setError('Failed to upload audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state during auth check
  if (authLoading) {
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

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-[60px] py-3">
          <div className="flex items-center justify-between">
            <p className="font-inter text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Expand button when sidebar collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex items-center justify-center w-8 bg-[#FAFAF8] border-r border-gray-100 hover:bg-gray-100 transition-colors"
            title="Expand sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Left sidebar: Conversation list */}
        <ConversationSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(sid) => selectSession(sid, sessions)}
          onNewChat={handleNewChat}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(true)}
        />

        {/* Chat area (center) */}
        <div className="flex-1 flex flex-col border-r border-gray-100">
          <MessageList messages={messages} isLoading={isLoading} onWidgetSubmit={handleWidgetSubmit} />
          <ChatInput
            onSendMessage={handleSendMessage}
            onUploadImage={handleUploadImage}
            onUploadAudio={handleUploadAudio}
            isLoading={isLoading}
          />
        </div>

        {/* Right pane: Trip detail */}
        <TripDetailPanel tripId={activeTripId} tripContext={tripContext} refreshKey={tripRefreshKey} />
      </div>
    </div>
  );
}
