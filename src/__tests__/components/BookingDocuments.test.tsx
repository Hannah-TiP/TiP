import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import enTranslations from '@/translations/en.json';
import BookingDocuments from '@/components/BookingDocuments';
import type { TripDocument } from '@/types/trip';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

const documents: TripDocument[] = [
  { file: 'https://s3.example.com/a.pdf', file_name: 'Flight ticket.pdf' },
  { file: 'https://s3.example.com/b.pdf', file_name: 'Hotel voucher.pdf' },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('BookingDocuments', () => {
  it('renders a View and Download button per document', () => {
    render(<BookingDocuments documents={documents} />);

    expect(screen.getByText('Flight ticket.pdf')).toBeTruthy();
    expect(screen.getByText('Hotel voucher.pdf')).toBeTruthy();
    expect(screen.getAllByText('View')).toHaveLength(2);
    expect(screen.getAllByText('Download')).toHaveLength(2);
  });

  it('renders nothing when there are no documents', () => {
    const { container } = render(<BookingDocuments documents={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('toggles the inline iframe on View and flips the label to Close', () => {
    render(<BookingDocuments documents={documents} />);

    expect(document.querySelector('iframe')).toBeNull();

    fireEvent.click(screen.getAllByText('View')[0]);

    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe('https://s3.example.com/a.pdf');
    expect(screen.getAllByText('Close')).toHaveLength(1);

    fireEvent.click(screen.getByText('Close'));
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('keeps per-document open state independent', () => {
    render(<BookingDocuments documents={documents} />);

    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    fireEvent.click(screen.getAllByText('View')[0]);

    // Opening the second must not close the first.
    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    expect(screen.queryAllByText('View')).toHaveLength(0);
    expect(screen.getAllByText('Close')).toHaveLength(2);
  });

  it('falls back to document_type then the numbered fallback for the filename', () => {
    render(
      <BookingDocuments
        documents={[
          { file: 'https://s3.example.com/c.pdf', document_type: 'Itinerary' },
          { file: 'https://s3.example.com/d.pdf' },
        ]}
      />,
    );
    expect(screen.getByText('Itinerary')).toBeTruthy();
    expect(screen.getByText('Document 2')).toBeTruthy();
  });

  it('downloads via fetch -> blob -> object URL anchor', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
    vi.stubGlobal('fetch', fetchMock);

    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<BookingDocuments documents={documents} />);

    const firstRow = screen.getByText('Flight ticket.pdf').parentElement as HTMLElement;
    fireEvent.click(within(firstRow).getByText('Download'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('https://s3.example.com/a.pdf'));
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    vi.unstubAllGlobals();
  });

  it('surfaces an inline error and saves no file when fetch rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<BookingDocuments documents={documents} />);

    const firstRow = screen.getByText('Flight ticket.pdf').parentElement as HTMLElement;
    fireEvent.click(within(firstRow).getByText('Download'));

    await waitFor(() =>
      expect(screen.getByText(enTranslations['trip_detail.document_download_error'])).toBeTruthy(),
    );
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('surfaces an inline error and saves no file on a non-OK HTTP response', async () => {
    const blobMock = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, blob: blobMock });
    vi.stubGlobal('fetch', fetchMock);

    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<BookingDocuments documents={documents} />);

    const firstRow = screen.getByText('Flight ticket.pdf').parentElement as HTMLElement;
    fireEvent.click(within(firstRow).getByText('Download'));

    await waitFor(() =>
      expect(screen.getByText(enTranslations['trip_detail.document_download_error'])).toBeTruthy(),
    );
    // The 403 error body must never be read into a blob and saved as the file.
    expect(blobMock).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
