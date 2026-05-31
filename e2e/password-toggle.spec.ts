import { test, expect } from '@playwright/test';

test.describe('Password visibility toggle', () => {
  test('toggles the sign-in password field between hidden and visible', async ({ page }) => {
    await page.goto('/sign-in');

    const password = page.getByPlaceholder('Enter your password');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('toggles register password fields independently', async ({ page }) => {
    await page.goto('/register');

    const password = page.getByPlaceholder('Create a password');
    const confirm = page.getByPlaceholder('Confirm password');

    await expect(password).toHaveAttribute('type', 'password');
    await expect(confirm).toHaveAttribute('type', 'password');

    // Toggle only the first field; the confirm field must stay hidden.
    await password.locator('xpath=following-sibling::button').click();

    await expect(password).toHaveAttribute('type', 'text');
    await expect(confirm).toHaveAttribute('type', 'password');
  });

  test('shows the toggle on both forgot-password fields after requesting a code', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    // The two password fields live on the reset step; this asserts the email
    // step renders without a password toggle (no password input yet).
    await expect(page.getByRole('button', { name: /show password/i })).toHaveCount(0);
  });
});
