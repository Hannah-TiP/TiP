import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatAttachment, ChatAttachmentUploadCredentials } from '@/types/ai-chat';

const getChatAttachmentUploadCredentials = vi.fn();
const finalizeChatAttachment = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getChatAttachmentUploadCredentials: (...args: unknown[]) =>
      getChatAttachmentUploadCredentials(...args),
    finalizeChatAttachment: (...args: unknown[]) => finalizeChatAttachment(...args),
  },
}));

const {
  MAX_CHAT_ATTACHMENT_BYTES,
  chatAttachmentContentType,
  isImageFile,
  validateChatAttachmentFile,
  uploadChatAttachment,
} = await import('@/lib/chat-attachment-upload');

function fakeFile(name: string, type: string, size = 1000): File {
  return { name, type, size } as File;
}

describe('validateChatAttachmentFile', () => {
  it('accepts JPEG, PNG, WebP, HEIC and PDF', () => {
    expect(validateChatAttachmentFile(fakeFile('a.jpg', 'image/jpeg'))).toBeNull();
    expect(validateChatAttachmentFile(fakeFile('a.png', 'image/png'))).toBeNull();
    expect(validateChatAttachmentFile(fakeFile('a.webp', 'image/webp'))).toBeNull();
    expect(validateChatAttachmentFile(fakeFile('a.heic', 'image/heic'))).toBeNull();
    expect(validateChatAttachmentFile(fakeFile('a.pdf', 'application/pdf'))).toBeNull();
  });

  it('accepts HEIC/HEIF by extension when the browser reports no type', () => {
    expect(validateChatAttachmentFile(fakeFile('IMG_1.HEIC', ''))).toBeNull();
    expect(validateChatAttachmentFile(fakeFile('a.heif', ''))).toBeNull();
    expect(chatAttachmentContentType(fakeFile('IMG_1.HEIC', ''))).toBe('image/heic');
    expect(chatAttachmentContentType(fakeFile('a.PDF', ''))).toBe('application/pdf');
    expect(isImageFile(fakeFile('IMG_1.HEIC', ''))).toBe(true);
    expect(isImageFile(fakeFile('a.pdf', 'application/pdf'))).toBe(false);
  });

  it('rejects unsupported types', () => {
    expect(validateChatAttachmentFile(fakeFile('a.gif', 'image/gif'))).toBe('type');
    expect(validateChatAttachmentFile(fakeFile('a.docx', 'application/msword'))).toBe('type');
    expect(validateChatAttachmentFile(fakeFile('noext', ''))).toBe('type');
  });

  it('rejects files over 20 MB (exactly 20 MB is allowed)', () => {
    expect(
      validateChatAttachmentFile(fakeFile('a.pdf', 'application/pdf', MAX_CHAT_ATTACHMENT_BYTES)),
    ).toBeNull();
    expect(
      validateChatAttachmentFile(
        fakeFile('a.pdf', 'application/pdf', MAX_CHAT_ATTACHMENT_BYTES + 1),
      ),
    ).toBe('size');
  });
});

describe('uploadChatAttachment', () => {
  const credentials: ChatAttachmentUploadCredentials = {
    upload_url: 'https://bucket.s3.us-west-1.amazonaws.com/',
    form_data: { key: 'chat/uploads/7/x.heic', 'Content-Type': 'image/heic', policy: 'p' },
    upload_key: 'chat/uploads/7/x.heic',
    bucket: 'bucket',
    region: 'us-west-1',
    restrictions: {
      max_file_size_bytes: MAX_CHAT_ATTACHMENT_BYTES,
      allowed_content_types: ['image/jpeg', 'application/pdf'],
      expiry_minutes: 15,
    },
  };
  const finalized: ChatAttachment = {
    file: 'chat/attachments/7/x.jpg',
    file_name: 'IMG_1.HEIC',
    content_type: 'image/jpeg',
    size_bytes: 1234,
  };
  let s3Status: number;
  let sentBodies: FormData[];
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    s3Status = 204;
    sentBodies = [];
    mockFetch.mockImplementation((_url: string, init: RequestInit) => {
      sentBodies.push(init.body as FormData);
      return Promise.resolve({ ok: s3Status < 300, status: s3Status });
    });
    vi.stubGlobal('fetch', mockFetch);
    getChatAttachmentUploadCredentials.mockResolvedValue(credentials);
    finalizeChatAttachment.mockResolvedValue(finalized);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('presigns → POSTs to S3 → finalizes, resolving the ChatAttachment', async () => {
    const file = new File(['x'], 'IMG_1.HEIC', { type: '' });
    const result = await uploadChatAttachment({ file, tripId: 7, language: 'kr' });

    expect(getChatAttachmentUploadCredentials).toHaveBeenCalledWith(
      7,
      { content_type: 'image/heic' },
      'kr',
    );
    expect(mockFetch).toHaveBeenCalledWith(
      credentials.upload_url,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(sentBodies).toHaveLength(1);
    // Policy fields verbatim (no injected Content-Type duplicate), file LAST.
    expect(Array.from(sentBodies[0].keys())).toEqual(['key', 'Content-Type', 'policy', 'file']);
    expect(finalizeChatAttachment).toHaveBeenCalledWith(
      7,
      { s3_key: 'chat/uploads/7/x.heic', file_name: 'IMG_1.HEIC' },
      'kr',
    );
    expect(result).toEqual(finalized);
  });

  it('does not finalize when the S3 POST fails', async () => {
    s3Status = 403;
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    await expect(uploadChatAttachment({ file, tripId: 7 })).rejects.toThrow(/403/);
    expect(finalizeChatAttachment).not.toHaveBeenCalled();
  });

  it('propagates a presign rejection', async () => {
    getChatAttachmentUploadCredentials.mockRejectedValue(new Error('Not your trip'));
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    await expect(uploadChatAttachment({ file, tripId: 7 })).rejects.toThrow('Not your trip');
    expect(sentBodies).toHaveLength(0);
  });
});
