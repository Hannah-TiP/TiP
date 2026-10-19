import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import en from '@/translations/en.json';
import ChatInput from '@/components/ai-chat/ChatInput';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => {
    const catalog = en as Record<string, string>;
    return { lang: 'en', setLang: () => {}, t: (key: string) => catalog[key] ?? key };
  },
}));

beforeAll(() => {
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
});

function pick(file: File) {
  fireEvent.change(screen.getByTestId('attachment-input'), { target: { files: [file] } });
}

function sendButton() {
  return screen.getByRole('button', { name: en['chat.send'] }) as HTMLButtonElement;
}

const jpg = () => new File(['x'], 'villa.jpg', { type: 'image/jpeg' });
const pdf = () => new File(['x'], 'Passports.pdf', { type: 'application/pdf' });

describe('ChatInput attachments', () => {
  it('hides the attach button when no attachment handler is given', () => {
    render(<ChatInput onSendMessage={vi.fn()} isLoading={false} />);
    expect(screen.queryByRole('button', { name: en['chat.attach_file'] })).toBeNull();
  });

  it('accepts images, HEIC by extension and PDF in the picker', () => {
    render(<ChatInput onSendMessage={vi.fn()} onSendAttachment={vi.fn()} isLoading={false} />);
    expect(screen.getByTestId('attachment-input').getAttribute('accept')).toBe(
      'image/*,.heic,.heif,application/pdf',
    );
  });

  it('shows an image chip with a thumbnail and enables send with no text', () => {
    render(<ChatInput onSendMessage={vi.fn()} onSendAttachment={vi.fn()} isLoading={false} />);
    expect(sendButton().disabled).toBe(true);

    pick(jpg());

    expect(screen.getByTestId('attachment-chip').textContent).toContain('villa.jpg');
    expect(screen.getByTestId('attachment-chip-thumbnail').getAttribute('src')).toBe(
      'blob:preview',
    );
    expect(sendButton().disabled).toBe(false);
  });

  it('shows a file icon + name for a PDF', () => {
    render(<ChatInput onSendMessage={vi.fn()} onSendAttachment={vi.fn()} isLoading={false} />);
    pick(pdf());
    expect(screen.getByTestId('attachment-chip-file-icon')).toBeDefined();
    expect(screen.queryByTestId('attachment-chip-thumbnail')).toBeNull();
    expect(screen.getByText('Passports.pdf')).toBeDefined();
  });

  it('removes the chip with ✕', () => {
    render(<ChatInput onSendMessage={vi.fn()} onSendAttachment={vi.fn()} isLoading={false} />);
    pick(pdf());
    fireEvent.click(screen.getByRole('button', { name: en['chat.attachment_remove'] }));
    expect(screen.queryByTestId('attachment-chip')).toBeNull();
    expect(sendButton().disabled).toBe(true);
  });

  it('rejects an unsupported type and an oversized file with i18n errors', () => {
    render(<ChatInput onSendMessage={vi.fn()} onSendAttachment={vi.fn()} isLoading={false} />);

    pick(new File(['x'], 'a.gif', { type: 'image/gif' }));
    expect(screen.getByRole('alert').textContent).toBe(en['chat.attachment_type_error']);
    expect(screen.queryByTestId('attachment-chip')).toBeNull();

    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 20 * 1024 * 1024 + 1 });
    pick(big);
    expect(screen.getByRole('alert').textContent).toBe(en['chat.attachment_size_error']);
  });

  it('sends the file with the text as caption, shows uploading, then clears', async () => {
    let resolve: () => void = () => {};
    const onSendAttachment = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const onSendMessage = vi.fn();
    render(
      <ChatInput
        onSendMessage={onSendMessage}
        onSendAttachment={onSendAttachment}
        isLoading={false}
      />,
    );
    pick(jpg());
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Our view  ' } });

    fireEvent.click(sendButton());

    expect(onSendAttachment).toHaveBeenCalledWith(expect.any(File), 'Our view');
    expect(onSendMessage).not.toHaveBeenCalled();
    expect(screen.getByTestId('attachment-uploading').textContent).toBe(
      en['chat.attachment_uploading'],
    );
    expect(
      (screen.getByRole('button', { name: en['chat.attach_file'] }) as HTMLButtonElement).disabled,
    ).toBe(true);

    await act(async () => resolve());

    expect(screen.queryByTestId('attachment-chip')).toBeNull();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('keeps the file and text and shows an error when the send fails', async () => {
    const onSendAttachment = vi.fn(() => Promise.reject(new Error('boom')));
    render(
      <ChatInput onSendMessage={vi.fn()} onSendAttachment={onSendAttachment} isLoading={false} />,
    );
    pick(pdf());
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Passports' } });

    await act(async () => {
      fireEvent.click(sendButton());
    });

    expect(screen.getByRole('alert').textContent).toBe(en['chat.attachment_upload_error']);
    expect(screen.getByTestId('attachment-chip')).toBeDefined();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Passports');
    expect(sendButton().disabled).toBe(false);
  });

  it('still sends plain text through onSendMessage', () => {
    const onSendMessage = vi.fn();
    const onSendAttachment = vi.fn();
    render(
      <ChatInput
        onSendMessage={onSendMessage}
        onSendAttachment={onSendAttachment}
        isLoading={false}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    fireEvent.click(sendButton());
    expect(onSendMessage).toHaveBeenCalledWith('hello');
    expect(onSendAttachment).not.toHaveBeenCalled();
  });
});
