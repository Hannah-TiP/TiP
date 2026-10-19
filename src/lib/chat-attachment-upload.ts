import { apiClient } from '@/lib/api-client';
import type { ChatAttachment, ChatAttachmentUploadCredentials } from '@/types/ai-chat';

/** Client-side mirror of the server limit (SMA-647) — server remains the enforcement. */
export const MAX_CHAT_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/** Types the customer may attach. HEIC/HEIF is converted server-side at
 * finalize and comes back as `image/jpeg`. */
export const UPLOADABLE_CHAT_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

/** File-picker `accept` list. `.heic/.heif` are listed by extension because
 * several browsers don't map them to `image/*`. */
export const CHAT_ATTACHMENT_ACCEPT = 'image/*,.heic,.heif,application/pdf';

export type ChatAttachmentValidationError = 'type' | 'size';

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
};

/**
 * The content type to presign for. Browsers (iOS Safari for HEIC in
 * particular) can report an empty `file.type`; fall back to the extension so
 * the presigned POST policy — which pins the exact Content-Type — still
 * matches what S3 receives.
 */
export function chatAttachmentContentType(file: Pick<File, 'name' | 'type'>): string {
  const type = file.type.toLowerCase();
  if (type) return type;
  const extension = file.name.toLowerCase().split('.').pop() ?? '';
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? '';
}

/** Whether the picked file previews as an image (thumbnail) rather than a file chip. */
export function isImageFile(file: Pick<File, 'name' | 'type'>): boolean {
  return chatAttachmentContentType(file).startsWith('image/');
}

/** Pre-upload validation mirroring the server limits; `null` when uploadable. */
export function validateChatAttachmentFile(
  file: Pick<File, 'name' | 'type' | 'size'>,
): ChatAttachmentValidationError | null {
  if (!UPLOADABLE_CHAT_ATTACHMENT_TYPES.includes(chatAttachmentContentType(file))) return 'type';
  if (file.size > MAX_CHAT_ATTACHMENT_BYTES) return 'size';
  return null;
}

/**
 * POST the file directly to S3 via the presigned POST. The policy fields are
 * appended VERBATIM (they already pin the exact Content-Type) and the file
 * goes LAST — S3 ignores fields after it. Plain fetch (no progress) keeps the
 * concierge bundle small; the chip shows an indeterminate "uploading" state.
 */
export async function postChatAttachmentToS3(
  credentials: Pick<ChatAttachmentUploadCredentials, 'upload_url' | 'form_data'>,
  file: File,
): Promise<void> {
  const form = new FormData();
  Object.entries(credentials.form_data).forEach(([key, value]) => form.append(key, value));
  form.append('file', file);
  const response = await fetch(credentials.upload_url, { method: 'POST', body: form });
  if (!response.ok) throw new Error(`S3 upload failed with status ${response.status}`);
}

export interface UploadChatAttachmentParams {
  file: File;
  tripId: number;
  language?: string;
}

/**
 * Full upload pipeline for one chat attachment: credentials → direct S3 POST
 * → finalize. Resolves the finalized `ChatAttachment` to send with the
 * message. Throws on any step (the proxy keeps the v2 `message`).
 */
export async function uploadChatAttachment({
  file,
  tripId,
  language,
}: UploadChatAttachmentParams): Promise<ChatAttachment> {
  const credentials = await apiClient.getChatAttachmentUploadCredentials(
    tripId,
    { content_type: chatAttachmentContentType(file) },
    language,
  );
  await postChatAttachmentToS3(credentials, file);
  return apiClient.finalizeChatAttachment(
    tripId,
    { s3_key: credentials.upload_key, file_name: file.name },
    language,
  );
}
