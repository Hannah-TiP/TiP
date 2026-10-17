/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import MessageBubble from '@/components/ai-chat/MessageBubble';
import type { AIChatMessage, ChatAttachment } from '@/types/ai-chat';

const langState = vi.hoisted(() => ({ lang: 'en' as 'en' | 'kr' }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => {
    const catalog = (langState.lang === 'kr' ? kr : en) as Record<string, string>;
    return { lang: langState.lang, setLang: () => {}, t: (key: string) => catalog[key] ?? key };
  },
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, loading, className }: ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} loading={loading} className={className} />
  ),
}));

const S3 = 'https://tip-s3-bucket.s3.us-west-1.amazonaws.com';

beforeAll(() => {
  process.env.NEXT_PUBLIC_S3_ENDPOINT = S3;
});

afterEach(() => {
  cleanup();
  langState.lang = 'en';
});

const IMAGE: ChatAttachment = {
  file: 'chat/attachments/abc123.jpg',
  file_name: 'villa-view.jpg',
  content_type: 'image/jpeg',
  size_bytes: 482_000,
};

const PDF: ChatAttachment = {
  file: '/chat/attachments/def456.pdf',
  file_name: 'Itinerary.pdf',
  content_type: 'application/pdf',
  size_bytes: Math.round(1.2 * 1024 * 1024),
};

function makeAttachmentMessage(overrides: Partial<AIChatMessage> = {}): AIChatMessage {
  return {
    id: 10,
    user_id: 1,
    trip_id: 1,
    role: 'human_assistant',
    message_type: 'attachment',
    content: null,
    attachment: IMAGE,
    sent_at: '2026-05-01T10:00:00Z',
    ...overrides,
  };
}

describe('MessageBubble attachment messages', () => {
  it('renders an image attachment as a thumbnail linking to the full file in a new tab', () => {
    render(<MessageBubble message={makeAttachmentMessage()} isUser={false} />);

    const link = screen.getByTestId('message-attachment-image');
    expect(link.getAttribute('href')).toBe(`${S3}/chat/attachments/abc123.jpg`);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('aria-label')).toBe('Open image villa-view.jpg in a new tab');

    const img = screen.getByRole('img', { name: 'villa-view.jpg' });
    expect(img.getAttribute('src')).toBe(`${S3}/chat/attachments/abc123.jpg`);
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(screen.queryByTestId('message-attachment-file')).toBeNull();
  });

  it('renders a PDF attachment as a file chip with name, size and a new-tab link', () => {
    render(<MessageBubble message={makeAttachmentMessage({ attachment: PDF })} isUser={false} />);

    const chip = screen.getByTestId('message-attachment-file');
    expect(chip.getAttribute('href')).toBe(`${S3}/chat/attachments/def456.pdf`);
    expect(chip.getAttribute('target')).toBe('_blank');
    expect(chip.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByText('Itinerary.pdf')).toBeDefined();
    expect(screen.getByTestId('attachment-meta').textContent).toBe('PDF · 1.2 MB');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders the caption under the attachment with concierge text styling', () => {
    render(
      <MessageBubble
        message={makeAttachmentMessage({ content: 'Here is the **view** from your villa' })}
        isUser={false}
      />,
    );

    const caption = screen.getByTestId('attachment-caption');
    expect(caption.textContent).toBe('Here is the view from your villa');
    expect(caption.querySelector('strong')?.textContent).toBe('view');
    expect(caption.querySelector('p')?.className).toContain('text-gray-800');
    // Attachment comes first, caption after.
    const attachment = screen.getByTestId('message-attachment-image');
    expect(
      attachment.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders no empty text block for a caption-less attachment', () => {
    const { container } = render(
      <MessageBubble message={makeAttachmentMessage({ content: '' })} isUser={false} />,
    );

    expect(screen.queryByTestId('attachment-caption')).toBeNull();
    expect(container.querySelector('.bg-gray-50.px-5')).toBeNull();
    expect(container.querySelector('p')).toBeNull();
  });

  it('keeps the concierge team badge for human_assistant attachments', () => {
    render(<MessageBubble message={makeAttachmentMessage()} isUser={false} />);

    expect(screen.getByTestId('message-human-concierge')).toBeDefined();
    expect(screen.getByTestId('concierge-team-badge').textContent).toBe('Concierge Team');
  });

  it('renders Korean labels when the language is kr', () => {
    langState.lang = 'kr';
    render(<MessageBubble message={makeAttachmentMessage({ attachment: PDF })} isUser={false} />);

    expect(screen.getByTestId('message-attachment-file').getAttribute('aria-label')).toBe(
      '새 탭에서 Itinerary.pdf 열기',
    );
    expect(screen.getByTestId('attachment-meta').textContent).toBe('PDF 문서 · 1.2 MB');
  });

  it('renders the Korean image aria-label when the language is kr', () => {
    langState.lang = 'kr';
    render(<MessageBubble message={makeAttachmentMessage()} isUser={false} />);

    expect(screen.getByTestId('message-attachment-image').getAttribute('aria-label')).toBe(
      '새 탭에서 이미지 villa-view.jpg 열기',
    );
  });

  it('renders only the caption when the attachment payload is missing', () => {
    render(
      <MessageBubble
        message={makeAttachmentMessage({ attachment: null, content: 'See attached' })}
        isUser={false}
      />,
    );

    expect(screen.queryByTestId('message-attachment-image')).toBeNull();
    expect(screen.queryByTestId('message-attachment-file')).toBeNull();
    expect(screen.getByTestId('attachment-caption').textContent).toBe('See attached');
  });

  it('does not crash on an unknown message type', () => {
    const msg = makeAttachmentMessage({
      message_type: 'future_type' as AIChatMessage['message_type'],
      content: 'x',
    });
    render(<MessageBubble message={msg} isUser={false} />);

    expect(screen.getByTestId('message-human-concierge')).toBeDefined();
    expect(screen.queryByTestId('message-attachment-image')).toBeNull();
  });
});
