import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PasswordInput from '@/components/PasswordInput';

afterEach(cleanup);

function getInput() {
  return screen.getByPlaceholderText('Password') as HTMLInputElement;
}

describe('PasswordInput', () => {
  it('renders a masked input with a toggle button by default', () => {
    render(<PasswordInput placeholder="Password" />);

    expect(getInput().type).toBe('password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeTruthy();
  });

  it('toggles between password and text on button click', () => {
    render(<PasswordInput placeholder="Password" />);

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(getInput().type).toBe('text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(getInput().type).toBe('password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeTruthy();
  });

  it('keeps each field independent — two inputs toggle separately', () => {
    render(
      <>
        <PasswordInput placeholder="Password" />
        <PasswordInput placeholder="Confirm password" />
      </>,
    );

    const password = screen.getByPlaceholderText('Password') as HTMLInputElement;
    const confirm = screen.getByPlaceholderText('Confirm password') as HTMLInputElement;

    const passwordToggle = password.parentElement!.querySelector('button')!;
    fireEvent.click(passwordToggle);

    expect(password.type).toBe('text');
    expect(confirm.type).toBe('password');
  });

  it('uses the toggle button to avoid submitting an enclosing form', () => {
    render(<PasswordInput placeholder="Password" />);
    expect(screen.getByRole('button', { name: 'Show password' }).getAttribute('type')).toBe(
      'button',
    );
  });

  it('disables and untabs the toggle when the input is disabled', () => {
    render(<PasswordInput placeholder="Password" disabled />);

    const input = getInput();
    const toggle = screen.getByRole('button', { name: 'Show password' }) as HTMLButtonElement;

    expect(input.disabled).toBe(true);
    expect(toggle.disabled).toBe(true);
    expect(toggle.getAttribute('tabindex')).toBe('-1');

    fireEvent.click(toggle);
    expect(input.type).toBe('password');
  });

  it('appends pr-10 to make room for the icon while keeping the passed className', () => {
    render(<PasswordInput placeholder="Password" className="w-full rounded-lg border" />);

    const cls = getInput().className;
    expect(cls).toContain('w-full');
    expect(cls).toContain('rounded-lg');
    expect(cls).toContain('border');
    expect(cls).toContain('pr-10');
  });

  it('forwards arbitrary input props and the onChange handler', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        placeholder="Password"
        value=""
        onChange={onChange}
        required
        name="password"
        autoComplete="current-password"
        minLength={8}
      />,
    );

    const input = getInput();
    expect(input.required).toBe(true);
    expect(input.name).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
    expect(input.minLength).toBe(8);

    fireEvent.change(input, { target: { value: 'secret123' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
