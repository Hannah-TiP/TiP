'use client';

import type { TripWithVersion } from '@/lib/trip-utils';
import type { AIChatSessionMetadata } from '@/types/ai-chat';
import type { Trip } from '@/types/trip';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ConciergeSession {
  session: AIChatSessionMetadata;
  // The trip joined onto the session by the list endpoint — drives the
  // sidebar status badge for every entry, not just the active one.
  trip: Trip;
  // Lazy-hydrated for the active session only — gives the right panel
  // the full trip + current version (with title, dates, plan, etc.).
  tripDetail: TripWithVersion | null;
}

interface ConversationSidebarProps {
  sessions: ConciergeSession[];
  activeSessionId: number | null;
  onSelectSession: (sessionId: number) => void;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getSessionLabel(s: ConciergeSession): string | null {
  const title = s.tripDetail?.currentVersion?.title?.trim();
  if (title) return title;
  return null; // will use t('chat.new_trip') in the component
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-200 text-gray-600';
    case 'waiting-for-proposal':
      return 'bg-amber-100 text-amber-700';
    case 'in-progress':
      return 'bg-blue-100 text-blue-700';
    case 'paid':
    case 'ready-to-travel':
      return 'bg-green-100 text-green-700';
    case 'traveling-now':
      return 'bg-purple-100 text-purple-700';
    case 'travel-completed':
      return 'bg-gray-100 text-gray-500';
    case 'canceled':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-gray-200 text-gray-600';
  }
}

function getStatusLabel(status: string): string {
  return status
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ConversationSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
}: ConversationSidebarProps) {
  const { t } = useLanguage();
  return (
    <div
      className="flex flex-col bg-[#FAFAF8] border-r border-gray-100 transition-all duration-300 overflow-hidden"
      style={{ width: isCollapsed ? 0 : 280, minWidth: isCollapsed ? 0 : 280 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h2 className="font-cormorant text-lg font-semibold text-[#1E3D2F]">
          {t('chat.trips_title')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="text-[#C4956A] hover:text-[#a87d59] transition-colors"
            title={t('chat.new_chat')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={t('chat.collapse_sidebar')}
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.map((s) => {
          const isActive = s.session.id === activeSessionId;
          // The backend bundles trip with each session, so every entry
          // has its current trip status — no more "Draft" fallback for
          // inactive sidebar rows.
          const tripStatus = s.trip.status;
          const startDate = s.tripDetail?.currentVersion?.start_date ?? null;
          const endDate = s.tripDetail?.currentVersion?.end_date ?? null;
          return (
            <button
              key={s.session.id}
              onClick={() => onSelectSession(s.session.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                isActive
                  ? 'bg-[#1E3D2F]/5 border-l-2 border-l-[#C4956A]'
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-inter text-sm font-medium text-[#1E3D2F] truncate">
                  {getSessionLabel(s) || t('chat.new_trip')}
                </span>
                <span className="font-inter text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                  {formatTime(s.session.last_message_at ?? null)}
                </span>
              </div>
              {formatDateRange(startDate, endDate) && (
                <p className="font-inter text-[11px] text-gray-400 mt-0.5 truncate">
                  {formatDateRange(startDate, endDate)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-inter ${getStatusColor(tripStatus)}`}
                >
                  {getStatusLabel(tripStatus)}
                </span>
              </div>
            </button>
          );
        })}

        {sessions.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="font-inter text-xs text-gray-400">{t('chat.no_conversations')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
