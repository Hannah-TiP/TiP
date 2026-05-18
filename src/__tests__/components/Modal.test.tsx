import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Modal from '@/components/Modal';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Hidden content</p>
      </Modal>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders children when open', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <p>Visible content</p>
      </Modal>,
    );
    expect(screen.getByText('Visible content')).toBeDefined();
  });

  it('calls onClose when ESC key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on ESC when closed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={false} onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when dialog content is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores on close', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = render(
      <Modal isOpen onClose={() => {}}>
        <p>Body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('auto');
  });

  it('focuses the first focusable element on open', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <button data-testid="first-button">First</button>
        <button data-testid="second-button">Second</button>
      </Modal>,
    );
    // The first focusable element inside the dialog is the Close (X) button
    // injected by the Modal itself.
    expect(document.activeElement).toBe(screen.getByTestId('modal-close'));
  });

  it('traps Tab from last focusable back to first', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <button data-testid="action-button">Action</button>
      </Modal>,
    );
    const closeBtn = screen.getByTestId('modal-close');
    const actionBtn = screen.getByTestId('action-button');

    actionBtn.focus();
    expect(document.activeElement).toBe(actionBtn);

    // Tab from the last focusable should wrap back to the first (close button).
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);
  });

  it('traps Shift+Tab from first focusable to last', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <button data-testid="action-button">Action</button>
      </Modal>,
    );
    const closeBtn = screen.getByTestId('modal-close');
    const actionBtn = screen.getByTestId('action-button');

    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(actionBtn);
  });
});
