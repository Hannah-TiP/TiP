/**
 * SMA-896: a file name whose extension matches the recorded container. The
 * backend sniffs the bytes, so this is only a hint for logs/proxies.
 */
export function voiceFileName(mimeType: string): string {
  const type = mimeType.split(';')[0].trim().toLowerCase();
  if (type === 'audio/mp4' || type === 'audio/x-m4a' || type === 'audio/aac') return 'voice.m4a';
  if (type === 'audio/ogg') return 'voice.ogg';
  if (type === 'audio/mpeg') return 'voice.mp3';
  if (type === 'audio/wav' || type === 'audio/x-wav') return 'voice.wav';
  return 'voice.webm';
}
