import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveS3Url } from '@/types/common';

describe('resolveS3Url', () => {
  const originalEndpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_S3_ENDPOINT = 'https://s3.example.com';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_S3_ENDPOINT = originalEndpoint;
  });

  it('passes through https URLs unchanged', () => {
    expect(resolveS3Url('https://cdn.example.com/doc.pdf')).toBe('https://cdn.example.com/doc.pdf');
  });

  it('passes through http URLs unchanged', () => {
    expect(resolveS3Url('http://cdn.example.com/doc.pdf')).toBe('http://cdn.example.com/doc.pdf');
  });

  it('prepends the S3 endpoint to a bare key', () => {
    expect(resolveS3Url('documents/ticket.pdf')).toBe(
      'https://s3.example.com/documents/ticket.pdf',
    );
  });

  it('strips a leading slash before prepending the endpoint', () => {
    expect(resolveS3Url('/documents/ticket.pdf')).toBe(
      'https://s3.example.com/documents/ticket.pdf',
    );
  });

  it('returns empty string for missing key', () => {
    expect(resolveS3Url(undefined)).toBe('');
    expect(resolveS3Url(null)).toBe('');
    expect(resolveS3Url('')).toBe('');
  });

  it('returns empty string when the endpoint is missing (no placeholder fallback)', () => {
    delete process.env.NEXT_PUBLIC_S3_ENDPOINT;
    expect(resolveS3Url('documents/ticket.pdf')).toBe('');
  });
});
