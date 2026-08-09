import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Image } from '@/types/common';
import { ReviewPhotoFinalizeError } from '@/types/review';

const uploadReviewPhoto = vi.fn();

vi.mock('@/lib/review-photo-upload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/review-photo-upload')>();
  return {
    ...actual,
    uploadReviewPhoto: (...args: unknown[]) => uploadReviewPhoto(...args),
  };
});

const ReviewPhotoSection = (await import('@/components/reviews/ReviewPhotoSection')).default;

function makeFile(name: string, type: string, size = 1000): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function renderSection(
  props: Partial<React.ComponentProps<typeof ReviewPhotoSection>> = {},
): ReturnType<typeof render> {
  return render(
    <ReviewPhotoSection
      tripId={3}
      entityType="hotel"
      entityId={10}
      photos={[]}
      onAddPhoto={vi.fn()}
      onRemovePhoto={vi.fn()}
      disabled={false}
      {...props}
    />,
  );
}

function selectFiles(files: File[]) {
  fireEvent.change(screen.getByTestId('review-photo-input'), { target: { files } });
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  // Reset queued once-implementations too — a leftover mockResolvedValueOnce
  // from a previous test would leak into the next one.
  uploadReviewPhoto.mockReset();
  vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT', 'https://bucket.s3.amazonaws.com');
});

describe('ReviewPhotoSection', () => {
  it('uploads a valid file and reports the finalized image via onAddPhoto', async () => {
    const image: Image = { original: 'reviews/media/1/a.jpg' };
    uploadReviewPhoto.mockResolvedValue(image);
    const onAddPhoto = vi.fn();
    renderSection({ onAddPhoto });

    selectFiles([makeFile('a.jpg', 'image/jpeg')]);

    await waitFor(() => expect(onAddPhoto).toHaveBeenCalledWith(image));
    expect(uploadReviewPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ tripId: 3, entityType: 'hotel', entityId: 10 }),
    );
    // Pending tile is gone once finalized.
    expect(screen.queryByTestId('review-photo-uploading')).toBeNull();
    expect(screen.queryByTestId('review-photo-error')).toBeNull();
  });

  it('shows an error tile with Retry on upload failure, and retry re-uploads', async () => {
    uploadReviewPhoto.mockRejectedValueOnce(new Error('boom'));
    const image: Image = { original: 'reviews/media/1/b.jpg' };
    uploadReviewPhoto.mockResolvedValueOnce(image);
    const onAddPhoto = vi.fn();
    renderSection({ onAddPhoto });

    selectFiles([makeFile('b.jpg', 'image/jpeg')]);

    const errorTile = await screen.findByTestId('review-photo-error');
    expect(errorTile.textContent).toContain('b.jpg');
    expect(screen.getByText(/Photo upload failed\./)).toBeTruthy();

    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(onAddPhoto).toHaveBeenCalledWith(image));
    expect(uploadReviewPhoto).toHaveBeenCalledTimes(2);
  });

  it('shows the server convert-to-JPEG message on a 4005 finalize failure', async () => {
    uploadReviewPhoto.mockRejectedValue(
      new ReviewPhotoFinalizeError('Please convert your HEIC photo to JPEG.', 4005),
    );
    renderSection();

    selectFiles([makeFile('sneaky.jpg', 'image/jpeg')]);

    await screen.findByTestId('review-photo-error');
    expect(screen.getByText(/convert your HEIC photo to JPEG/)).toBeTruthy();
  });

  it('rejects HEIC files client-side BEFORE uploading', async () => {
    renderSection();

    selectFiles([makeFile('IMG_1.heic', 'image/heic')]);

    await screen.findByTestId('review-photo-error');
    expect(uploadReviewPhoto).not.toHaveBeenCalled();
    expect(screen.getByText(/convert to JPEG/)).toBeTruthy();
  });

  it('rejects wrong types and oversized files client-side', async () => {
    renderSection();

    selectFiles([
      makeFile('a.gif', 'image/gif'),
      makeFile('big.jpg', 'image/jpeg', 10 * 1024 * 1024 + 1),
    ]);

    await waitFor(() => expect(screen.getAllByTestId('review-photo-error')).toHaveLength(2));
    expect(uploadReviewPhoto).not.toHaveBeenCalled();
    expect(screen.getByText(/Only JPEG or PNG/)).toBeTruthy();
    expect(screen.getByText(/10 MB or smaller/)).toBeTruthy();
    // Validation rejects are removable but not retryable.
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('enforces the 20-photo cap and disables Add photos at capacity', async () => {
    const photos: Image[] = Array.from({ length: 20 }, (_, i) => ({
      original: `reviews/media/1/p${i}.jpg`,
    }));
    renderSection({ photos });

    expect((screen.getByText('Add photos') as HTMLButtonElement).disabled).toBe(true);

    selectFiles([makeFile('extra.jpg', 'image/jpeg')]);
    await screen.findByTestId('review-photo-error');
    expect(screen.getByText(/up to 20 photos/)).toBeTruthy();
    expect(uploadReviewPhoto).not.toHaveBeenCalled();
  });

  it('renders finalized thumbnails with a remove control', () => {
    const onRemovePhoto = vi.fn();
    renderSection({
      photos: [{ original: 'reviews/media/1/a.jpg', w128: 'reviews/media/1/a_w128.jpg' }],
      onRemovePhoto,
    });

    expect(screen.getAllByTestId('review-photo-thumb')).toHaveLength(1);
    fireEvent.click(screen.getByLabelText('Remove'));
    expect(onRemovePhoto).toHaveBeenCalledWith('reviews/media/1/a.jpg');
  });

  it('hides the remove control when disabled (skipped item)', () => {
    renderSection({
      photos: [{ original: 'reviews/media/1/a.jpg' }],
      disabled: true,
    });

    expect(screen.queryByLabelText('Remove')).toBeNull();
    expect((screen.getByText('Add photos') as HTMLButtonElement).disabled).toBe(true);
  });
});
