"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from "@/components/TopBar";
import MessageList from '@/components/ai-chat/MessageList';
import ChatInput from '@/components/ai-chat/ChatInput';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import type {
  AIMessage,
  TripContext,
  ChatHistoryResponse,
  CreateSessionResponse,
  SendMessageResponse,
  AnalyzeImageResponse,
  TranscribeAudioResponse
} from '@/types/ai-chat';

// Helper function to check if API response is successful
function isSuccessResponse(response: { success?: boolean; code?: number }): boolean {
  return response.success === true || response.code === 200;
}

export default function ConciergePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripContext, setTripContext] = useState<TripContext | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/concierge');
    }
  }, [isAuthenticated, authLoading, router]);

  // Initialize chat session
  useEffect(() => {
    if (!isAuthenticated) return;

    const initSession = async () => {
      console.log('[Concierge] Initializing chat session...');
      try {
        // Check for existing session in localStorage
        const storedSessionId = localStorage.getItem('concierge_session_id');
        console.log('[Concierge] Stored session ID:', storedSessionId);

        if (storedSessionId) {
          // Try to restore existing session
          console.log('[Concierge] Restoring existing session...');
          setSessionId(storedSessionId);
          // Fetch history
          try {
            const historyResponse = await apiClient.getChatHistory(storedSessionId, 1, 50) as ChatHistoryResponse;
            console.log('[Concierge] History response:', historyResponse);

            // Backend returns either {success: true, data: {...}} or {code: 200, data: {...}}
            const isSuccess = isSuccessResponse(historyResponse);
            const historyData = historyResponse.data;

            if (isSuccess && historyData && historyData.messages && historyData.messages.length > 0) {
              // Backend returns messages in reverse chronological order (newest first)
              // Reverse to display chronologically (oldest first)
              const chronologicalMessages = [...historyData.messages].reverse();
              setMessages(chronologicalMessages);
              console.log('[Concierge] Loaded', chronologicalMessages.length, 'messages from history');
              // Extract trip context from latest message (now at the end after reversing)
              const latestMessage = chronologicalMessages[chronologicalMessages.length - 1];
              if (latestMessage.message_metadata?.trip_context) {
                setTripContext(latestMessage.message_metadata.trip_context);
              }
              return;
            }
          } catch (err) {
            console.error('[Concierge] Failed to restore session:', err);
            localStorage.removeItem('concierge_session_id');
          }
        }

        // Create new session
        console.log('[Concierge] Creating new session...');
        const response = await apiClient.createChatSession('en') as CreateSessionResponse;
        console.log('[Concierge] Create session response:', response);

        // Backend returns either {success: true, data: {...}} or {code: 200, data: {...}}
        const isSuccess = isSuccessResponse(response);
        const responseData = response.data;

        if (isSuccess && responseData) {
          setSessionId(responseData.session_id);
          localStorage.setItem('concierge_session_id', responseData.session_id);
          console.log('[Concierge] Session created:', responseData.session_id);

          // Convert initial greeting to AIMessage format
          if (responseData.chat_history && responseData.chat_history.length > 0) {
            const initialMessages: AIMessage[] = responseData.chat_history.map((msg, index) => ({
              id: index,
              session_id: responseData.session_id,
              role: msg.role,
              content: msg.content,
              message_type: 'text',
              created_at: new Date().toISOString(),
            }));
            console.log('[Concierge] Initial messages:', initialMessages);
            setMessages(initialMessages);
          }
        }
      } catch (err) {
        console.error('[Concierge] Failed to initialize chat:', err);
        setError('Failed to initialize chat session. Please refresh the page.');
      }
    };

    initSession();
  }, [isAuthenticated]);

  const handleSendMessage = async (content: string) => {
    console.log('[Concierge] handleSendMessage called with:', content);
    console.log('[Concierge] Current sessionId:', sessionId);
    console.log('[Concierge] Current messages count:', messages.length);

    if (!content.trim() || !sessionId) {
      console.warn('[Concierge] Cannot send message - missing content or sessionId');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message to UI immediately (optimistic update)
    const userMessage: AIMessage = {
      id: messages.length,
      session_id: sessionId,
      role: 'user',
      content,
      message_type: 'text',
      created_at: new Date().toISOString(),
    };
    console.log('[Concierge] Adding user message to UI:', userMessage);
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('[Concierge] New messages array length:', newMessages.length);
      return newMessages;
    });

    try {
      console.log('[Concierge] Calling apiClient.sendMessage...');
      const response = await apiClient.sendMessage(sessionId, content, 'text') as SendMessageResponse;
      console.log('[Concierge] Send message response:', response);

      // Backend returns either {success: true, data: {...}} or {code: 200, data: {...}}
      const isSuccess = isSuccessResponse(response);
      const responseData = response.data;

      if (isSuccess && responseData) {
        // Add assistant response to UI
        const assistantMessage: AIMessage = {
          id: messages.length + 1,
          session_id: sessionId,
          role: 'assistant',
          content: responseData.response,
          message_type: 'text',
          message_metadata: {
            intent: responseData.intent,
            trips: responseData.trips,
            has_trips: responseData.has_trips,
            collection_status: responseData.collection_status,
            next_field: responseData.next_field,
            trip_context: responseData.trip_context,
            trip_created: responseData.trip_created,
            trip_id: responseData.trip_id,
            trip: responseData.trip,
          },
          created_at: new Date().toISOString(),
        };
        console.log('[Concierge] Adding assistant message to UI:', assistantMessage);
        setMessages(prev => [...prev, assistantMessage]);

        // Update trip context if available
        if (responseData.trip_context) {
          console.log('[Concierge] Updating trip context:', responseData.trip_context);
          setTripContext(responseData.trip_context);
        }
      }
    } catch (err) {
      console.error('[Concierge] Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      // Remove optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    console.log('[Concierge] Starting image upload - 3 step flow');

    try {
      // Step 1: Get S3 upload credentials
      console.log('[Concierge] Step 1: Getting S3 credentials...');
      const ext = file.name.split('.').pop() || 'jpg';
      const credentialsResponse = await apiClient.getS3UploadCredentials(
        sessionId,
        'image',
        ext
      );

      console.log('[Concierge] Credentials response:', credentialsResponse);

      // Handle both response formats
      const credentialsData = credentialsResponse.data || credentialsResponse;
      const uploadUrl = credentialsData.upload_url;
      const formData = credentialsData.form_data;
      const mediaUrl = credentialsData.public_url; // Backend returns 'public_url' not 'media_url'

      if (!uploadUrl || !formData || !mediaUrl) {
        console.error('[Concierge] Missing required fields in credentials:', {
          uploadUrl,
          formData,
          mediaUrl,
          fullResponse: credentialsData
        });
        throw new Error('Invalid credentials response');
      }

      // Step 2: Upload directly to S3
      console.log('[Concierge] Step 2: Uploading to S3...');
      await apiClient.uploadToS3(uploadUrl, formData, file);
      console.log('[Concierge] S3 upload successful, media URL:', mediaUrl);

      // Add user image message immediately with S3 URL
      const userImageMessage: AIMessage = {
        id: messages.length,
        session_id: sessionId,
        role: 'user',
        content: '',
        message_type: 'image',
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userImageMessage]);

      // Step 3: Send S3 URL to backend for AI analysis
      console.log('[Concierge] Step 3: Requesting image analysis...');
      const analysisResponse = await apiClient.analyzeImageUrl(
        sessionId,
        mediaUrl,
        undefined, // width
        undefined, // height
        file.name
      );

      console.log('[Concierge] Analysis response:', analysisResponse);

      // Handle both response formats
      const typedAnalysisResponse = analysisResponse as AnalyzeImageResponse;
      const isSuccess = isSuccessResponse(typedAnalysisResponse);
      const responseData = typedAnalysisResponse.data;

      if (isSuccess && responseData) {
        // Parse analysis_result if it's a JSON string
        let parsedAnalysisResult: { landmark?: string; location?: string; description?: string } | undefined;
        if (responseData.analysis_result) {
          try {
            parsedAnalysisResult = typeof responseData.analysis_result === 'string'
              ? JSON.parse(responseData.analysis_result)
              : responseData.analysis_result;
          } catch (e) {
            console.error('[Concierge] Failed to parse analysis_result:', e);
          }
        }

        // Add assistant analysis response
        const assistantMessage: AIMessage = {
          id: messages.length + 1,
          session_id: sessionId,
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

        // Update trip context if available
        if (responseData.message_metadata?.trip_context) {
          setTripContext(responseData.message_metadata.trip_context);
        }
      }

      console.log('[Concierge] Image upload flow complete');
    } catch (err) {
      console.error('[Concierge] Failed to upload image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAudio = async (file: File) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    console.log('[Concierge] Starting audio upload - 3 step flow');

    try {
      // Step 1: Get S3 upload credentials
      console.log('[Concierge] Step 1: Getting S3 credentials...');
      const ext = file.name.split('.').pop() || 'm4a';
      const credentialsResponse = await apiClient.getS3UploadCredentials(
        sessionId,
        'audio',
        ext
      );

      console.log('[Concierge] Credentials response:', credentialsResponse);

      // Handle both response formats
      const credentialsData = credentialsResponse.data || credentialsResponse;
      const uploadUrl = credentialsData.upload_url;
      const formData = credentialsData.form_data;
      const mediaUrl = credentialsData.public_url; // Backend returns 'public_url' not 'media_url'

      if (!uploadUrl || !formData || !mediaUrl) {
        console.error('[Concierge] Missing required fields in credentials:', {
          uploadUrl,
          formData,
          mediaUrl,
          fullResponse: credentialsData
        });
        throw new Error('Invalid credentials response');
      }

      // Step 2: Upload directly to S3
      console.log('[Concierge] Step 2: Uploading to S3...');
      await apiClient.uploadToS3(uploadUrl, formData, file);
      console.log('[Concierge] S3 upload successful, media URL:', mediaUrl);

      // Add user audio message immediately with S3 URL (transcription will come from backend)
      const userAudioMessage: AIMessage = {
        id: messages.length,
        session_id: sessionId,
        role: 'user',
        content: '', // Will be updated with transcription
        message_type: 'audio',
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userAudioMessage]);

      // Step 3: Send S3 URL to backend for transcription and AI processing
      console.log('[Concierge] Step 3: Requesting audio transcription...');
      const transcriptionResponse = await apiClient.transcribeAudioUrl(
        sessionId,
        mediaUrl,
        undefined, // duration
        file.name
      );

      console.log('[Concierge] Transcription response:', transcriptionResponse);

      // Handle both response formats
      const typedTranscriptionResponse = transcriptionResponse as TranscribeAudioResponse;
      const isSuccess = isSuccessResponse(typedTranscriptionResponse);
      const responseData = typedTranscriptionResponse.data;

      if (isSuccess && responseData) {
        // Update user audio message with transcription
        setMessages(prev => {
          const updatedMessages = [...prev];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage.message_type === 'audio') {
            lastMessage.content = responseData.transcription;
            lastMessage.message_metadata = {
              transcription: responseData.transcription,
            };
          }
          return updatedMessages;
        });

        // Add assistant response
        const assistantMessage: AIMessage = {
          id: messages.length + 1,
          session_id: sessionId,
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

        // Update trip context if available
        if (responseData.message_metadata?.trip_context) {
          setTripContext(responseData.message_metadata.trip_context);
        }
      }

      console.log('[Concierge] Audio upload flow complete');
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

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <TopBar activeLink="AI Chat" />

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-[60px] py-3">
          <div className="flex items-center justify-between">
            <p className="font-inter text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900"
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
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Side */}
        <div className="flex-1 flex flex-col border-r border-gray-100">
          <MessageList messages={messages} isLoading={isLoading} />
          <ChatInput
            onSendMessage={handleSendMessage}
            onUploadImage={handleUploadImage}
            onUploadAudio={handleUploadAudio}
            isLoading={isLoading}
          />
        </div>

        {/* Itinerary Sidebar */}
        <div className="w-[420px] flex flex-col bg-[#FAFAF8] overflow-y-auto">
          <div className="px-8 py-8 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cormorant text-2xl font-semibold text-[#1E3D2F]">Your Itinerary</h2>
            </div>

            {tripContext ? (
              <div className="space-y-3 mb-8">
                {tripContext.destination && (
                  <div className="flex justify-between font-inter text-sm">
                    <span className="text-gray-500">Destination</span>
                    <span className="text-[#1E3D2F] font-medium">{tripContext.destination}</span>
                  </div>
                )}
                {tripContext.start_date && tripContext.end_date && (
                  <div className="flex justify-between font-inter text-sm">
                    <span className="text-gray-500">Dates</span>
                    <span className="text-[#1E3D2F] font-medium">
                      {new Date(tripContext.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                      {new Date(tripContext.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {tripContext.adults && (
                  <div className="flex justify-between font-inter text-sm">
                    <span className="text-gray-500">Travelers</span>
                    <span className="text-[#1E3D2F] font-medium">
                      {tripContext.adults} {tripContext.adults === 1 ? 'Adult' : 'Adults'}
                      {tripContext.kids ? `, ${tripContext.kids} ${tripContext.kids === 1 ? 'Kid' : 'Kids'}` : ''}
                    </span>
                  </div>
                )}
                {tripContext.purpose && (
                  <div className="flex justify-between font-inter text-sm">
                    <span className="text-gray-500">Purpose</span>
                    <span className="text-[#1E3D2F] font-medium">{tripContext.purpose}</span>
                  </div>
                )}
                {tripContext.budget && (
                  <div className="flex justify-between font-inter text-sm">
                    <span className="text-gray-500">Budget</span>
                    <span className="text-[#1E3D2F] font-medium">${tripContext.budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="font-inter text-sm text-gray-400">
                  Start planning your trip by chatting with our AI concierge!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
