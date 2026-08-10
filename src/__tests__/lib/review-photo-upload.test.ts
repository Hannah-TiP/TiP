import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReviewPhotoUploadCredentials } from '@/types/review';

const getReviewPhotoUploadCredentials = vi.fn();
const finalizeReviewPhoto = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getReviewPhotoUploadCredentials: (...args: unknown[]) =>
      getReviewPhotoUploadCredentials(...args),
    finalizeReviewPhoto: (...args: unknown[]) => finalizeReviewPhoto(...args),
  },
}));

const {
  MAX_REVIEW_PHOTOS,
  MAX_REVIEW_PHOTO_BYTES,
  isHeicFile,
  validateReviewPhotoFile,
  postReviewPhotoToS3,
  uploadReviewPhoto,
} = await import('@/lib/review-photo-upload');

function fakeFile(name: string, type: string, size = 1000): File {
  return { name, type, size } as File;
}

describe('validateReviewPhotoFile', () => {
  it('accepts JPEG and PNG under the limits', () => {
    expect(validateReviewPhotoFile(fakeFile('a.jpg', 'image/jpeg'), 0)).toBeNull();
    expect(validateReviewPhotoFile(fakeFile('b.png', 'image/png'), 5)).toBeNull();
  });

  it('rejects HEIC by extension or mime type BEFORE the generic type check', () => {
    expect(validateReviewPhotoFile(fakeFile('IMG_1.HEIC', ''), 0)).toBe('heic');
    expect(validateReviewPhotoFile(fakeFile('a.heif', ''), 0)).toBe('heic');
    expect(validateReviewPhotoFile(fakeFile('a.bin', 'image/heic'), 0)).toBe('heic');
    expect(isHeicFile(fakeFile('a.bin', 'image/heif'))).toBe(true);
  });

  it('rejects unsupported types', () => {
    expect(validateReviewPhotoFile(fakeFile('a.gif', 'image/gif'), 0)).toBe('type');
    expect(validateReviewPhotoFile(fakeFile('a.pdf', 'application/pdf'), 0)).toBe('type');
  });

  it('rejects files over 10 MB (boundary: exactly 10 MB is allowed)', () => {
    expect(
      validateReviewPhotoFile(fakeFile('a.jpg', 'image/jpeg', MAX_REVIEW_PHOTO_BYTES), 0),
    ).toBeNull();
    expect(
      validateReviewPhotoFile(fakeFile('a.jpg', 'image/jpeg', MAX_REVIEW_PHOTO_BYTES + 1), 0),
    ).toBe('size');
  });

  it('rejects the 21st photo', () => {
    expect(validateReviewPhotoFile(fakeFile('a.jpg', 'image/jpeg'), MAX_REVIEW_PHOTOS)).toBe(
      'limit',
    );
    expect(
      validateReviewPhotoFile(fakeFile('a.jpg', 'image/jpeg'), MAX_REVIEW_PHOTOS - 1),
    ).toBeNull();
  });
});

interface FakeXhrInstance {
  method: string | null;
  url: string | null;
  body: FormData | null;
  status: number;
  upload: { onprogress: ((e: ProgressEvent) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  open: (method: string, url: string) => void;
  send: (body: FormData) => void;
}

describe('postReviewPhotoToS3', () => {
  let instances: FakeXhrInstance[];
  let autoStatus: number | null;

  class FakeXhr {
    method: string | null = null;
    url: string | null = null;
    body: FormData | null = null;
    status = 0;
    upload: { onprogress: ((e: ProgressEvent) => void) | null } = { onprogress: null };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;

    constructor() {
      instances.push(this as unknown as FakeXhrInstance);
    }

    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }

    send(body: FormData) {
      this.body = body;
      if (autoStatus !== null) {
        this.status = autoStatus;
        queueMicrotask(() => this.onload?.());
      }
    }
  }

  const credentials: ReviewPhotoUploadCredentials = {
    upload_url: 'https://bucket.s3.us-west-1.amazonaws.com/',
    form_data: {
      key: 'reviews/uploads/1/x.jpg',
      'Content-Type': 'image/jpeg',
      policy: 'p',
      'x-amz-signature': 'sig',
    },
    upload_key: 'reviews/uploads/1/x.jpg',
    bucket: 'bucket',
    region: 'us-west-1',
    restrictions: {
      max_file_size_bytes: 10485760,
      allowed_content_types: ['image/jpeg', 'image/png', 'image/heic'],
      expiry_minutes: 15,
    },
  };

  beforeEach(() => {
    instances = [];
    autoStatus = 204;
    vi.stubGlobal('XMLHttpRequest', FakeXhr as unknown as typeof XMLHttpRequest);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the policy fields verbatim with the file LAST', async () => {
    const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });
    await postReviewPhotoToS3(credentials, file);

    const xhr = instances[0];
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe(credentials.upload_url);
    const entries = Array.from(xhr.body!.entries());
    // Fields exactly as the backend supplied them — no injected Content-Type
    // duplicate — and the file is the final entry.
    expect(entries.map(([k]) => k)).toEqual([
      'key',
      'Content-Type',
      'policy',
      'x-amz-signature',
      'file',
    ]);
    expect(xhr.body!.get('Content-Type')).toBe('image/jpeg');
  });

  it('reports upload progress fractions', async () => {
    autoStatus = null;
    const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });
    const onProgress = vi.fn();
    const promise = postReviewPhotoToS3(credentials, file, onProgress);

    const xhr = instances[0];
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 } as ProgressEvent);
    xhr.status = 204;
    xhr.onload?.();
    await promise;

    expect(onProgress).toHaveBeenCalledWith(0.5);
  });

  it('rejects on a non-2xx S3 response', async () => {
    autoStatus = 403;
    const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });
    await expect(postReviewPhotoToS3(credentials, file)).rejects.toThrow(/403/);
  });
});

describe('uploadReviewPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    class InstantOkXhr {
      status = 204;
      upload: { onprogress: null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      open() {}
      send() {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('XMLHttpRequest', InstantOkXhr as unknown as typeof XMLHttpRequest);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests credentials, uploads, then finalizes with the upload_key', async () => {
    const credentials = {
      upload_url: 'https://s3/',
      form_data: {},
      upload_key: 'reviews/uploads/9/k.jpg',
    };
    const image = { original: 'reviews/media/9/k.jpg', w128: 'reviews/media/9/k_w128.jpg' };
    getReviewPhotoUploadCredentials.mockResolvedValue(credentials);
    finalizeReviewPhoto.mockResolvedValue(image);

    const result = await uploadReviewPhoto({
      file: new File(['x'], 'IMG.JPG', { type: 'image/JPEG' }),
      tripId: 3,
      entityType: 'hotel',
      entityId: 10,
      language: 'kr',
    });

    expect(getReviewPhotoUploadCredentials).toHaveBeenCalledWith(
      {
        trip_id: 3,
        entity_type: 'hotel',
        entity_id: 10,
        // MIME type is normalized to lowercase for the exact-match S3 policy.
        content_type: 'image/jpeg',
      },
      'kr',
    );
    expect(finalizeReviewPhoto).toHaveBeenCalledWith('reviews/uploads/9/k.jpg', 'kr');
    expect(result).toBe(image);
  });

  it('does not finalize when the S3 upload fails', async () => {
    class FailXhr {
      status = 0;
      upload: { onprogress: null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      open() {}
      send() {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal('XMLHttpRequest', FailXhr as unknown as typeof XMLHttpRequest);
    getReviewPhotoUploadCredentials.mockResolvedValue({
      upload_url: 'https://s3/',
      form_data: {},
      upload_key: 'k',
    });

    await expect(
      uploadReviewPhoto({
        file: new File(['x'], 'x.jpg', { type: 'image/jpeg' }),
        tripId: 3,
        entityType: 'hotel',
        entityId: 10,
      }),
    ).rejects.toThrow();
    expect(finalizeReviewPhoto).not.toHaveBeenCalled();
  });
});
